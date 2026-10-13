/** Port (DIP) : lecture des frontières de sprint et des blocages depuis le journal de supervision. */

export interface SprintCheckpointEvent {
  ts: string;
  slug: string;
  /** Le run du journal qui porte ce checkpoint (fiche 20261002230039863) : on apparie le sprint au
   * run courant par CET id, pas par l'égalité des slugs (fragile). */
  runId: string;
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
  /** L'id du run le plus récent (toutes runs confondues) — le run « courant », celui qu'on vient de
   * clore. Sert à apparier le sprint à SON run, pas à un vieux checkpoint d'un autre run. */
  latestRunId(projectRoot: string): string | undefined;
}
