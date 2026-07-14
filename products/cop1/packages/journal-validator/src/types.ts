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

/** Enveloppe v0.1 minimale, telle que lue depuis une ligne JSONL valide. */
export interface Envelope {
  event_id: string;
  run_id: string;
  seq: number;
  ts: string;
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

/** Read-model d'affichage d'un run (mode moniteur) — jamais de champ "phase". */
export interface RunProjection {
  runId: string;
  state: RunState;
  lastEventTs?: string;
  lastEventSeq?: number;
  gates: GateProjection[];
  violations: Violation[];
  notices: Notice[];
  /** D9 : jamais auto-déclaré — 'absent' tant qu'aucune mesure runtime n'existe. */
  tokens: { provenance: 'measured' | 'absent' };
}
