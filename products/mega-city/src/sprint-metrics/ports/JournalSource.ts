/** Port (DIP) : lecture des frontières de sprint et des blocages depuis le journal de supervision. */

export interface SprintCheckpointEvent {
  ts: string;
  slug: string;
}

export interface BlockedEscalationEvent {
  ts: string;
  detail?: string;
}

export interface JournalSource {
  /** Tous les gates `sprint-<slug>-checkpoint`, toutes runs confondues. */
  listSprintCheckpoints(projectRoot: string): SprintCheckpointEvent[];
  /** Événements `escalate{type:"blocked"}`, toutes runs confondues. */
  listBlockedEscalations(projectRoot: string): BlockedEscalationEvent[];
  /** `ts` du plus ancien `run.started` — repli quand un sprint n'a pas de checkpoint antérieur. */
  earliestRunStartedTs(projectRoot: string): string | undefined;
}
