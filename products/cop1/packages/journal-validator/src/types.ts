export interface Violation {
  code: string;
  message: string;
  seq?: number;
  line?: number;
}

export interface Notice {
  code: string;
  message: string;
  seq?: number;
  line?: number;
}

export type RunState =
  | 'launched'
  | 'running'
  | 'at_gate'
  | 'finished'
  | 'finished_at_gate'
  | 'aborted';

export interface ValidationResult {
  violations: Violation[];
  notices: Notice[];
  state: RunState;
  summary: string;
  /** 0 si conforme (aucune violation), 1 sinon — utilisable comme code retour CLI. */
  code: 0 | 1;
}

/** Enveloppe minimale, telle que lue depuis une ligne JSONL valide. */
export interface Envelope {
  event_id: string;
  run_id: string;
  /** Identité de la session émettrice (le « qui », contrat @0.2) — absente sur un journal @0.1. */
  session_id?: string;
  seq: number;
  ts: string;
  contract: string;
  type: string;
  payload: Record<string, unknown>;
}

/** Une enveloppe accompagnée de son numéro de ligne physique dans le fichier. */
export interface EnvelopeEntry {
  envelope: Envelope;
  lineNumber: number;
}

/**
 * Origine d'une reprise de gate (`gate.resumed`) : `command` quand le payload
 * porte un `command_ref` (clairance par commande), `self_reported` sinon
 * (reprise auto-déclarée en session). Jamais un mapping gate_id → phase.
 */
export type ResumeOrigin = 'command' | 'self_reported';

/** Read-model d'un gate rencontré dans le run (voir `RunProjection.gates`). */
export interface GateProjection {
  gateEventId: string;
  gateId?: string;
  outcome?: string;
  reportRef?: string;
  resumedAt?: string;
  resumeOrigin?: ResumeOrigin;
}

/** Résultat de la transition d'état pure, partagé par `validateRun` et `projectRun`. */
export interface ReduceStateResult {
  state: RunState;
  gates: GateProjection[];
  lastEventTs?: string;
  lastEventSeq?: number;
}

/**
 * Méthode déclarée par le `run.started` (fiche 0061). Optionnelle et tolérante :
 * un journal semi-hostile peut l'omettre ou la mal-former — dans ce cas elle
 * reste `undefined`, jamais une valeur inventée (même doctrine que `tokens`).
 */
export interface MethodRef {
  name: string;
  version?: string;
}

/**
 * Paramètres RETENUS d'un run, déclarés par `run.started.payload.params`
 * (fiche 20260906142654370). Tous optionnels : un journal qui n'en porte pas
 * (émetteur ancien) les laisse `undefined`, affichés comme absents, jamais inventés.
 */
export interface RunParams {
  /** `--mode` : `auto` | `manuel`. */
  mode?: string;
  /** `--review` : le PO tamponne `ready` lui-même. */
  review?: boolean;
  /** `--max-sprints` : borne de la boucle. */
  maxSprints?: number;
  /** `--tokens` : `lean` | `cap` | `full`. */
  tokens?: string;
}

/** Issue terminalisée d'un run (fiche 0022) — dérivée de `run.finished.payload.status`. */
export type RunIssue = 'success' | 'failure' | 'abandoned';

/** Mesure tokens (D9) — `total`/`usd` uniquement si une source fiable les fournit. */
export interface TokenMeasure {
  provenance: 'measured' | 'absent';
  total?: number;
  /** Estimation proportionnelle au plafond session si configuré côté siège (fiche 0022). */
  usd?: number;
}

/** Read-model d'affichage d'un run (mode moniteur) — jamais de champ "phase". */
export interface RunProjection {
  runId: string;
  state: RunState;
  lastEventTs?: string;
  lastEventSeq?: number;
  /** Horodatage `run.started` (fiche 0022). */
  startedAt?: string;
  /** Horodatage du premier `run.finished` terminal (fiche 0022). */
  endedAt?: string;
  /** Issue depuis `run.finished` quand le run est terminal (fiche 0022). */
  issue?: RunIssue;
  /** Dernière note `heartbeat.payload.note` — agent/activité courante (fiche 0022). */
  currentNote?: string;
  gates: GateProjection[];
  violations: Violation[];
  notices: Notice[];
  /** D9 : jamais auto-déclaré — 'absent' tant qu'aucune mesure runtime n'existe. */
  tokens: TokenMeasure;
  /**
   * Méthode + siège déclarés par `run.started` (fiche 0061). `undefined` si le
   * journal ne les porte pas (ou les porte mal-formés) : l'absence est affichée
   * comme absence, jamais comme une valeur par défaut.
   */
  method?: MethodRef;
  seat?: string;
  /**
   * Paramètres retenus du run (fiche 20260906142654370), depuis
   * `run.started.payload.params`. `undefined` si le journal ne les porte pas.
   */
  params?: RunParams;
  /**
   * Provenance d'abandon depuis `run.finished` (ADR-035) — `seat` | `method` | absent.
   * Présent uniquement si le run est `finished` avec `status: abandoned`.
   */
  abandonedBy?: 'seat' | 'method';
}

/**
 * Un évènement d'un chantier, étiqueté par la session qui l'a émis (read-model
 * multi-journaux, ADR-079 §D8). `sessionId` absent = journal @0.1 (émetteur ancien).
 */
export interface ChantierEvent {
  sessionId?: string;
  runId: string;
  type: string;
  ts: string;
  seq: number;
  payload: Record<string, unknown>;
}

/** Une session (un ouvrier) vue dans un chantier : ses runs, son état, son libellé. */
export interface SessionProjection {
  sessionId: string;
  /** Libellé lisible de la session (branche), depuis `session.started` si présent — sinon absent. */
  branch?: string;
  /** La session pilotée par une autre (hiérarchie D8), depuis `run.started.payload.piloted_by` — sinon absent. */
  pilotedBy?: string;
  /** Dossiers de run (clé de stockage) qui composent la session — jamais le `run_id` comme clé de fusion. */
  runDirs: string[];
  /** État agrégé de la session (le plus avancé de ses runs). */
  state: RunState;
  eventCount: number;
}

/** Cycle de vie d'un chantier réparti sur N journaux (ADR-079 §D8). */
export type ChantierLifecycle = 'running' | 'at_gate' | 'finished' | 'orphan';

/**
 * Read-model d'un chantier : des journaux réunis par leur clé de chantier, QUALIFIÉE
 * par la racine de projet (deux racines différentes ne fusionnent jamais, même clé).
 */
export interface ChantierProjection {
  /** Clé de chantier partagée (payload `run.started.chantier`, posée par l'émetteur T3). */
  key: string;
  /** Racine de projet qui qualifie la clé. */
  projectRoot: string;
  sessions: SessionProjection[];
  /** Fil fusionné, ordonné par une règle tolérante, chaque évènement étiqueté par sa session. */
  events: ChantierEvent[];
  lifecycle: ChantierLifecycle;
}
