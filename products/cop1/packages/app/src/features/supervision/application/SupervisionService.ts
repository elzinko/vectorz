import { projectRun } from '@cop1/journal-validator';
import type { EventBus } from '@cop1/shared-kernel';
import type { RunSnapshot } from '../domain/RunSnapshot.js';

const SUPERVISION_RUN_UPDATED = 'supervision.run.updated';

export interface SupervisionServiceOptions {
  eventBus: EventBus;
  /** Seuil de silence (ms) en état `running` avant `presumed_dead` (D8). */
  presumedDeadAfterMs: number;
}

/**
 * Maintient le read-model live des runs surveillés (fiche 0031 / ADR-028) :
 * `Map<runId, RunSnapshot>`, ré-émission `supervision.run.updated` sur le bus
 * du daemon (→ SSE `/events` existant), et le timer `presumed_dead` — armé
 * UNIQUEMENT quand `state === 'running'`, jamais en `at_gate` (D8 : le
 * silence au jalon est le comportement exigé). Timers `setTimeout`/`clearTimeout`
 * standard, compatibles `vi.useFakeTimers()` pour des tests déterministes.
 */
export class SupervisionService {
  private readonly eventBus: EventBus;
  private readonly presumedDeadAfterMs: number;
  private readonly snapshots = new Map<string, RunSnapshot>();
  private readonly deadTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(options: SupervisionServiceOptions) {
    this.eventBus = options.eventBus;
    this.presumedDeadAfterMs = options.presumedDeadAfterMs;
  }

  /** Re-projette le run depuis le disque, met à jour la map, émet sur le bus. */
  absorb(projectRoot: string, runDir: string): RunSnapshot {
    const projection = projectRun(runDir);
    const snapshot: RunSnapshot = {
      ...projection,
      projectRoot,
      runDir,
      liveness: 'alive',
      emissionClass: 'B',
    };

    this.snapshots.set(snapshot.runId, snapshot);

    if (snapshot.state === 'running') {
      this.armPresumedDeadTimer(snapshot);
    } else {
      this.clearPresumedDeadTimer(snapshot.runId);
    }

    this.eventBus.emit(SUPERVISION_RUN_UPDATED, snapshot);
    return snapshot;
  }

  getSnapshots(): RunSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  /** Arrête tous les timers `presumed_dead` en cours (arrêt propre du daemon). */
  stop(): void {
    for (const timer of this.deadTimers.values()) {
      clearTimeout(timer);
    }
    this.deadTimers.clear();
  }

  private armPresumedDeadTimer(snapshot: RunSnapshot): void {
    this.clearPresumedDeadTimer(snapshot.runId);

    const lastEventMs = snapshot.lastEventTs ? Date.parse(snapshot.lastEventTs) : Date.now();
    const elapsedMs = Date.now() - lastEventMs;
    const remainingMs = Math.max(0, this.presumedDeadAfterMs - elapsedMs);

    const timer = setTimeout(() => this.markPresumedDead(snapshot.runId), remainingMs);
    this.deadTimers.set(snapshot.runId, timer);
  }

  private clearPresumedDeadTimer(runId: string): void {
    const timer = this.deadTimers.get(runId);
    if (timer) {
      clearTimeout(timer);
      this.deadTimers.delete(runId);
    }
  }

  private markPresumedDead(runId: string): void {
    this.deadTimers.delete(runId);
    const current = this.snapshots.get(runId);
    // Le silence n'est un signal d'anomalie qu'en 'running' — un run devenu
    // 'at_gate'/terminal entre-temps a déjà purgé son timer (D8), mais on
    // regarde l'état courant par prudence en cas de course.
    if (!current || current.state !== 'running') return;

    const updated: RunSnapshot = { ...current, liveness: 'presumed_dead' };
    this.snapshots.set(runId, updated);
    this.eventBus.emit(SUPERVISION_RUN_UPDATED, updated);
  }
}
