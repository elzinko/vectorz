/**
 * Port d'abandon d'un run orphelin — abstraction domaine (ADR-035 D2).
 * Zéro connaissance de mega-city, de spawn, de chemins réels.
 * L'adaptateur `EmitterCliAbandonAdapter` satisfait cette interface.
 */
export type AbandonOutcome =
  | { ok: true; runId: string }
  | { ok: false; reason: string };

export interface RunAbandonPort {
  /**
   * Demande l'abandon du run ouvert dans `projectRoot` si son `runId` correspond
   * à `expectedRunId` (garde D5 — anti-clic-périmé).
   */
  abandon(args: { projectRoot: string; expectedRunId: string }): Promise<AbandonOutcome>;
}
