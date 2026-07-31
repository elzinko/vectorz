import { basename } from 'node:path';
import { projectRun } from '@cop1/journal-validator';
import type { EventBus } from '@cop1/shared-kernel';
import type { RunSnapshot } from '../domain/RunSnapshot.js';

const SUPERVISION_RUN_UPDATED = 'supervision.run.updated';

export interface SupervisionServiceOptions {
  eventBus: EventBus;
  /** Seuil de silence (ms) en état `running` avant `presumed_dead` (D8). */
  presumedDeadAfterMs: number;
  /**
   * ADR-035 D3 — capacité d'abandon configurée côté siège.
   * Porté dans chaque snapshot (GET + SSE) pour que le bouton Moniteur survive
   * à la transition `alive → presumed_dead` via SSE.
   */
  abandonCapable?: boolean;
}

/**
 * Maintient le read-model live des runs surveillés (fiche 0031 / ADR-028) :
 * `Map<runDir, RunSnapshot>` (clé serveur stable — le `runId` auto-déclaré
 * dans le journal semi-hostile n'est qu'un champ d'affichage, jamais une clé,
 * pour éviter collisions/écrasements entre deux runs déclarant le même id),
 * ré-émission `supervision.run.updated` sur le bus
 * du daemon (→ SSE `/events` existant), et le timer `presumed_dead` — armé
 * UNIQUEMENT quand `state === 'running'`, jamais en `at_gate` (D8 : le
 * silence au jalon est le comportement exigé). Timers `setTimeout`/`clearTimeout`
 * standard, compatibles `vi.useFakeTimers()` pour des tests déterministes.
 */
export class SupervisionService {
  private readonly eventBus: EventBus;
  private readonly presumedDeadAfterMs: number;
  private readonly abandonCapable: boolean;
  private readonly snapshots = new Map<string, RunSnapshot>();
  private readonly deadTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(options: SupervisionServiceOptions) {
    this.eventBus = options.eventBus;
    this.presumedDeadAfterMs = options.presumedDeadAfterMs;
    this.abandonCapable = options.abandonCapable === true;
  }

  /** Re-projette le run depuis le disque, met à jour la map, émet sur le bus. */
  absorb(projectRoot: string, runDir: string): RunSnapshot {
    const snapshot = this.buildSnapshot(projectRoot, runDir);
    this.snapshots.set(runDir, snapshot);

    if (snapshot.state === 'running') {
      this.armPresumedDeadTimer(snapshot);
    } else {
      this.clearPresumedDeadTimer(runDir);
    }

    this.eventBus.emit(SUPERVISION_RUN_UPDATED, snapshot);
    return snapshot;
  }

  /**
   * Projette le run depuis le disque. Un journal semi-hostile peut avoir été
   * mal initialisé côté émetteur tiers (`events.jsonl` en réalité un
   * dossier ⇒ EISDIR, fichier gigantesque ⇒ ERR_STRING_TOO_LONG, etc.) :
   * jamais de throw non rattrapé jusqu'à l'appelant (le watcher) — un échec
   * de lecture devient une violation `watcher.read_error` visible sur le
   * snapshot plutôt qu'un crash du daemon.
   */
  private buildSnapshot(projectRoot: string, runDir: string): RunSnapshot {
    const lastAbsorbedAt = new Date().toISOString();
    try {
      const projection = projectRun(runDir);
      return {
        ...projection,
        projectRoot,
        runDir,
        liveness: 'alive',
        emissionClass: 'B',
        lastAbsorbedAt,
        abandonCapable: this.abandonCapable,
      };
    } catch (error) {
      return {
        runId: basename(runDir),
        state: 'launched',
        gates: [],
        violations: [
          {
            code: 'watcher.read_error',
            message: `Lecture du run impossible ("${runDir}") : ${errorMessage(error)}`,
          },
        ],
        notices: [],
        tokens: { provenance: 'absent' },
        projectRoot,
        runDir,
        liveness: 'alive',
        emissionClass: 'B',
        lastAbsorbedAt,
        abandonCapable: this.abandonCapable,
      };
    }
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
    this.clearPresumedDeadTimer(snapshot.runDir);

    // Ancré sur l'horloge locale d'absorption (`lastAbsorbedAt`), JAMAIS sur
    // le `ts` auto-déclaré du journal (semi-hostile) : un `ts` illisible
    // donnerait `setTimeout(NaN)` (presumed_dead immédiat, faux positif) et
    // un `ts` futur repousserait la détection indéfiniment.
    const timer = setTimeout(
      () => this.markPresumedDead(snapshot.runDir),
      this.presumedDeadAfterMs,
    );
    this.deadTimers.set(snapshot.runDir, timer);
  }

  private clearPresumedDeadTimer(runDir: string): void {
    const timer = this.deadTimers.get(runDir);
    if (timer) {
      clearTimeout(timer);
      this.deadTimers.delete(runDir);
    }
  }

  private markPresumedDead(runDir: string): void {
    this.deadTimers.delete(runDir);
    const current = this.snapshots.get(runDir);
    // Le silence n'est un signal d'anomalie qu'en 'running' — un run devenu
    // 'at_gate'/terminal entre-temps a déjà purgé son timer (D8), mais on
    // regarde l'état courant par prudence en cas de course.
    if (!current || current.state !== 'running') return;

    const updated: RunSnapshot = { ...current, liveness: 'presumed_dead' };
    this.snapshots.set(runDir, updated);
    this.eventBus.emit(SUPERVISION_RUN_UPDATED, updated);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
