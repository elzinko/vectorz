/**
 * Domaine « métriques de sprint » (fiche 20260826082120062) — types PURS,
 * zéro I/O. Le rapport JSON est la source de vérité ; le markdown en est un
 * rendu (`render.ts`).
 */

export const SPRINT_REPORT_SCHEMA = 'sprint-report@0.1';

/** Granularité RÉELLE des tokens rapportés — jamais silencieusement fausse. */
export type TokensGrain = 'sprint' | 'session';

export interface SprintWindow {
  startTs: string;
  endTs: string;
  durationMs: number;
}

export interface TokensSummary {
  grain: TokensGrain;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Présent seulement en repli grain session : explique pourquoi. */
  note?: string;
}

export interface ShippedFeaturesSummary {
  count: number;
  ids: string[];
}

export interface BlockageEventSummary {
  ts: string;
  detail?: string;
}

export interface BlockagesSummary {
  count: number;
  events: BlockageEventSummary[];
}

/**
 * `prSansRetouche` (cf. tools/outcomes/metrics.ts) ne renvoie jamais `false` :
 * une retouche humaine n'est pas confirmable faute de signal d'auteur fiable.
 * D'où deux compartiments seulement : sans-retouche confirmée, ou indéterminé.
 */
export interface PrRetouchesSummary {
  total: number;
  sansRetouche: number;
  indetermine: number;
}

export interface StepsSummary {
  ventilated: boolean;
  note: string;
}

export interface SprintReport {
  schema: typeof SPRINT_REPORT_SCHEMA;
  sprint: { slug: string; product?: string };
  generatedAt: string;
  window: { startTs: string; endTs: string };
  duration: { ms: number; grain: 'sprint' };
  tokens: TokensSummary;
  kpi: {
    shippedFeatures: ShippedFeaturesSummary;
    blockages: BlockagesSummary;
    prRetouches: PrRetouchesSummary;
  };
  steps: StepsSummary;
}
