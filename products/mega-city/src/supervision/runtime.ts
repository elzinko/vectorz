/**
 * `runtime.ts` — `SupervisionRuntime`, la machine à états du kit émetteur v0.1
 * (fiche 0050, §7). PUR au sens « testable sans transport MCP » : `mcp-server.ts`
 * n'est qu'une couche mince qui appelle ces méthodes depuis les handlers d'outils.
 *
 * Choix structurant : AUCUN état n'est gardé en mémoire entre deux appels. Chaque
 * méthode relit l'état (run ouvert ? gate ouvert ?) depuis le disque via `loadState`.
 * Ça garantit par construction la rubrique G (redémarrage du serveur = juste une
 * nouvelle instance, rien à resynchroniser) et rend l'implémentation plus simple
 * qu'un double state-machine mémoire+disque à tenir cohérents.
 */
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeUpgradeOk } from './upgrade-ok.js';
import { Journal, readJournalEvents, type JournalEvent } from './journal.js';

const RUNS_DIR_SEGMENTS = ['.supervision', 'runs'] as const;

/**
 * `gate_id` n'est JAMAIS un paramètre de chemin dans l'API — mais il sert à nommer
 * le fichier de rapport (`report-<gate_id>-<seq>.md`). Allowlist stricte (B1, revue
 * NO-GO) : aucun séparateur de chemin, aucun `..`, rejeté avec une erreur de
 * validation explicite plutôt qu'une ENOENT/écriture hors projet en aval.
 */
const SAFE_GATE_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

function assertSafeGateId(gateId: string): string {
  const isSafe =
    typeof gateId === 'string' &&
    gateId.length > 0 &&
    SAFE_GATE_ID_PATTERN.test(gateId) &&
    !gateId.includes('..');
  if (!isSafe) {
    throw new Error(
      `gate_reached refusé : gate_id invalide (${JSON.stringify(gateId)}) — autorisé : lettres, chiffres, '.', '_', '-', sans séparateur de chemin ni '..'`,
    );
  }
  return gateId;
}

export interface RunStartArgs {
  method_name: string;
  method_version: string;
  seat?: string;
}

export interface GateReachedArgs {
  gate_id: string;
  outcome: 'ok' | 'attention' | 'failed';
  report_markdown?: string;
  upgrade_ok_veto?: boolean;
}

export interface GateResumedArgs {
  gate_event_id: string;
}

export interface EscalateArgs {
  type: 'blocked' | 'authority';
  detail: string;
}

export interface RunFinishedArgs {
  status: 'success' | 'failure' | 'abandoned';
  /** Provenance de l'abandon — obligatoire uniquement quand status === 'abandoned'.
   * Défaut 'method' (la méthode abandonne son propre run).
   * Écrit 'seat' par le chemin siège (bin/supervision-abandon via EmitterCliAbandonAdapter).
   * ADR-035 D1. */
  abandoned_by?: 'seat' | 'method';
}

export interface HeartbeatArgs {
  /** Note courte optionnelle (ex. étape en cours) — signe de vie entre deux jalons. */
  note?: string;
}

interface OpenGate {
  gate_id: string;
  gate_event_id: string;
}

interface OpenRunState {
  runId: string;
  runDir: string;
  openGate?: OpenGate;
}

/** Génère un run_id trié chronologiquement (préfixe timestamp) : sert à retrouver le run le plus récent sur disque. */
function generateRunId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${ts}-${randomUUID().slice(0, 8)}`;
}

/** Reconstruit le gate actuellement ouvert (s'il y en a un) en rejouant le journal du run. */
function deriveOpenGate(events: JournalEvent[]): OpenGate | undefined {
  let openGate: OpenGate | undefined;
  for (const event of events) {
    if (event.type === 'gate.reached') {
      openGate = { gate_id: event.payload.gate_id as string, gate_event_id: event.event_id };
    } else if (
      event.type === 'gate.resumed' &&
      openGate &&
      event.payload.gate_event_id === openGate.gate_event_id
    ) {
      openGate = undefined;
    }
  }
  return openGate;
}

/**
 * Retrouve le run actuellement ouvert (s'il y en a un) en scannant `.supervision/runs/`.
 * Un run est « ouvert » tant que son journal ne contient pas de `run.finished`.
 * Les run_id sont triés chronologiquement (préfixe timestamp) : on ne considère que
 * le plus récent, ce qui est cohérent avec l'invariant « un seul run ouvert à la fois ».
 */
function findOpenRun(projectRoot: string): OpenRunState | undefined {
  const runsDir = path.join(projectRoot, ...RUNS_DIR_SEGMENTS);
  if (!fs.existsSync(runsDir)) return undefined;
  const runIds = fs.readdirSync(runsDir).sort();
  for (let i = runIds.length - 1; i >= 0; i -= 1) {
    const runId = runIds[i];
    const runDir = path.join(runsDir, runId);
    const events = readJournalEvents(path.join(runDir, 'events.jsonl'));
    if (events.length === 0) continue;
    const finished = events.some((e) => e.type === 'run.finished');
    if (finished) return undefined; // le run le plus récent est clos ⇒ aucun run ouvert
    return { runId, runDir, openGate: deriveOpenGate(events) };
  }
  return undefined;
}

/**
 * Écrit le rapport markdown sous le dossier du run, avec confinement realpath
 * vérifié AVANT toute écriture (B1, revue NO-GO) : plus jamais de `writeFileSync`
 * sur un chemin non validé. `fileName` est dérivé d'un `gate_id` déjà assaini
 * (`assertSafeGateId`, sans séparateur ni `..`), donc ce contrôle est une défense
 * en profondeur — il n'existe aucun paramètre de chemin exposé à l'appelant — mais
 * il doit rester une garde active, pas un nettoyage a posteriori.
 */
function writeConfinedReport(
  projectRoot: string,
  runDir: string,
  fileName: string,
  content: string,
): string {
  // Le confinement est vérifié via les chemins RÉELS (symlinks résolus, ex. macOS
  // /var → /private/var), mais l'écriture et le `report_ref` retourné restent basés
  // sur `runDir`/`projectRoot` NON résolus — sinon `report_ref` deviendrait relatif
  // à un préfixe différent de celui que l'appelant connaît (`projectRoot`).
  const realRunDir = fs.realpathSync(runDir);
  const candidateRealPath = path.resolve(realRunDir, fileName);
  if (
    candidateRealPath !== path.join(realRunDir, fileName) ||
    !candidateRealPath.startsWith(realRunDir + path.sep)
  ) {
    throw new Error('gate_reached refusé : confinement du rapport violé (hors dossier du run)');
  }
  const filePath = path.join(runDir, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  return path.relative(projectRoot, filePath);
}

/**
 * Formate une durée en ms en chaîne lisible (ex. "2 h 15 min", "45 min", "8 s").
 * Pur : pas d'effet de bord.
 */
function formatAge(ms: number): string {
  const sec = Math.floor(Math.abs(ms) / 1000);
  const min = Math.floor(sec / 60);
  const h = Math.floor(min / 60);
  if (h > 0) return `${h} h ${min % 60} min`;
  if (min > 0) return `${min} min`;
  return `${sec} s`;
}

/**
 * Produit un texte actionnable décrivant le run bloquant à partir de ses événements.
 * Tolérant au journal semi-hostile (ADR-035 D7) : un `ts` illisible dégrade en
 * « date inconnue » sans jamais throw.
 */
export function describeOpenRun(events: JournalEvent[]): string {
  const started = events.find((e) => e.type === 'run.started');

  const method = (() => {
    const m = (started?.payload as Record<string, unknown> | undefined)?.method;
    const name = (m as Record<string, unknown> | undefined)?.name;
    const version = (m as Record<string, unknown> | undefined)?.version;
    return typeof name === 'string' && name.length > 0
      ? `${name}${typeof version === 'string' ? `@${version}` : ''}`
      : 'méthode inconnue';
  })();

  const runAge = (() => {
    try {
      const ts = started?.ts != null ? new Date(started.ts as string) : null;
      if (ts && !Number.isNaN(ts.getTime())) return formatAge(Date.now() - ts.getTime());
    } catch {
      /* dégrade */
    }
    return 'âge inconnu';
  })();

  const lastEvent = events.at(-1);
  const lastEventDesc = (() => {
    try {
      const ts = lastEvent?.ts != null ? new Date(lastEvent.ts as string) : null;
      if (ts && !Number.isNaN(ts.getTime())) {
        return `${ts.toISOString()} (il y a ${formatAge(Date.now() - ts.getTime())})`;
      }
    } catch {
      /* dégrade */
    }
    return 'date inconnue';
  })();

  const eventCount = events.length;

  return [
    `Méthode bloquante : ${method}`,
    `Âge du run : ${runAge}`,
    `Dernier événement : ${lastEventDesc} (${eventCount} événement(s) au total)`,
    `Marche à suivre : abandonne ce run au Moniteur (bouton "Abandonner ce run" sur la carte "Silence prolongé"), ou appelle run_finished {status:"abandoned"} si c'est un orphelin de ta propre session.`,
  ].join('\n');
}

export class SupervisionRuntime {
  /**
   * @param projectRoot Racine effective du projet supervisé.
   * @param expectedMethod Méthode attendue selon le registre (fiche 0082). Si fournie et
   *   différente du `method_name` passé à `runStart`, un champ `_method_mismatch` est
   *   ajouté au payload `run.started` (annotation d'audit, jamais un refus).
   */
  constructor(
    private readonly projectRoot: string,
    private readonly expectedMethod?: string,
  ) {}

  runStart(args: RunStartArgs): { run_id: string } {
    const state = findOpenRun(this.projectRoot);
    if (state) {
      const events = readJournalEvents(path.join(state.runDir, 'events.jsonl'));
      const description = describeOpenRun(events);
      throw new Error(`run_start refusé : un run est déjà ouvert (run_id=${state.runId})\n${description}`);
    }
    const runId = generateRunId();
    const runDir = path.join(this.projectRoot, ...RUNS_DIR_SEGMENTS, runId);
    const journal = new Journal(runDir, runId);

    const mismatch =
      this.expectedMethod !== undefined && args.method_name !== this.expectedMethod
        ? { declared: args.method_name, expected: this.expectedMethod }
        : undefined;

    journal.append('run.started', {
      method: { name: args.method_name, version: args.method_version },
      seat: args.seat ?? 'human',
      ...(mismatch !== undefined ? { _method_mismatch: mismatch } : {}),
    });
    return { run_id: runId };
  }

  gateReached(args: GateReachedArgs): { gate_event_id: string; message: string } {
    const state = this.requireOpenRun('gate_reached');
    if (state.openGate) {
      throw new Error(
        `gate_reached refusé : un gate est déjà ouvert (gate_id=${state.openGate.gate_id}), attendu gate_resumed`,
      );
    }
    assertSafeGateId(args.gate_id);
    const journal = new Journal(state.runDir, state.runId);
    const upgradeOk = computeUpgradeOk(this.projectRoot, args.upgrade_ok_veto === true);

    let reportRef: string | undefined;
    if (args.report_markdown !== undefined) {
      const seq = journal.peekNextSeq();
      const fileName = `report-${args.gate_id}-${seq}.md`;
      reportRef = writeConfinedReport(this.projectRoot, state.runDir, fileName, args.report_markdown);
    }

    const event = journal.append('gate.reached', {
      gate_id: args.gate_id,
      outcome: args.outcome,
      upgrade_ok: upgradeOk,
      ...(reportRef !== undefined ? { report_ref: reportRef } : {}),
    });

    return {
      gate_event_id: event.event_id,
      message: 'STOP — arrête-toi et attends la décision du siège avant de continuer.',
    };
  }

  gateResumed(args: GateResumedArgs): { event_id: string } {
    const state = this.requireOpenRun('gate_resumed');
    if (!state.openGate) {
      throw new Error('gate_resumed refusé : aucun gate ouvert sur ce run');
    }
    if (args.gate_event_id !== state.openGate.gate_event_id) {
      throw new Error(
        `gate_resumed refusé : gate_event_id (${args.gate_event_id}) ne correspond pas au gate ouvert (${state.openGate.gate_event_id})`,
      );
    }
    const journal = new Journal(state.runDir, state.runId);
    const event = journal.append('gate.resumed', { gate_event_id: args.gate_event_id });
    return { event_id: event.event_id };
  }

  escalate(args: EscalateArgs): { escalation_id: string } {
    const state = this.requireOpenRun('escalate');
    const journal = new Journal(state.runDir, state.runId);
    const escalationId = randomUUID();
    journal.append('escalation', { escalation_id: escalationId, type: args.type, detail: args.detail });
    return { escalation_id: escalationId };
  }

  /**
   * Signe de vie pendant un run ouvert **hors gate** (fiche 0103 / contrat v0.1).
   * Réarme le timer `presumed_dead` du Moniteur via un nouvel événement absorbé.
   * Refusé si un gate est ouvert : le silence au jalon est voulu (ADR-028 / validateur).
   */
  heartbeat(args: HeartbeatArgs = {}): { run_id: string; event_id: string } {
    const state = this.requireOpenRun('heartbeat');
    if (state.openGate) {
      throw new Error(
        `heartbeat refusé : un gate est ouvert (gate_id=${state.openGate.gate_id}) — le silence au jalon est voulu ; attends gate_resumed`,
      );
    }
    const journal = new Journal(state.runDir, state.runId);
    const note =
      typeof args.note === 'string' && args.note.trim().length > 0 ? args.note.trim() : undefined;
    const event = journal.append('heartbeat', note !== undefined ? { note } : {});
    return { run_id: state.runId, event_id: event.event_id };
  }

  runFinished(args: RunFinishedArgs): { run_id: string } {
    const state = this.requireOpenRun('run_finished');
    const journal = new Journal(state.runDir, state.runId);
    const payload: Record<string, unknown> = { status: args.status };
    if (args.status === 'abandoned') {
      payload.abandoned_by = args.abandoned_by ?? 'method';
    }
    journal.append('run.finished', payload);
    return { run_id: state.runId };
  }

  /**
   * Abandonne le run ouvert **uniquement si son `runId` correspond à `expectedRunId`**.
   * ADR-035 D5 — garde anti-clic-périmé : si un run neuf a été ouvert entre le snapshot
   * du Moniteur et le spawn, la commande refuse plutôt que de clôturer un run légitime.
   * Écrit toujours `abandoned_by: 'seat'` (c'est le siège qui commande).
   *
   * La sérialisation d'écriture (vs heartbeat / run_finished concurrents) est portée
   * par `Journal.append` (`.write.lock` per-run) — pas un verrou abandon-only.
   */
  abandonRun(expectedRunId: string): { run_id: string } {
    const state = findOpenRun(this.projectRoot);
    if (!state) {
      throw new Error(`abandon refusé : aucun run ouvert dans ${this.projectRoot}`);
    }
    if (state.runId !== expectedRunId) {
      throw new Error(
        `abandon refusé : le run ouvert (${state.runId}) ne correspond pas au run attendu (${expectedRunId}) — clic sur carte périmée ?`,
      );
    }
    const journal = new Journal(state.runDir, state.runId);
    journal.append('run.finished', { status: 'abandoned', abandoned_by: 'seat' });
    return { run_id: state.runId };
  }

  private requireOpenRun(toolName: string): OpenRunState {
    const state = findOpenRun(this.projectRoot);
    if (!state) {
      throw new Error(`${toolName} refusé : aucun run ouvert (appelle run_start d'abord)`);
    }
    return state;
  }
}
