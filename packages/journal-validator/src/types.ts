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
