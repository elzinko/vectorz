/**
 * Domaine « métriques de sprint » (fiche 20260826082120062) — types PURS,
 * zéro I/O. Le rapport JSON est la source de vérité ; le markdown en est un
 * rendu (`render.ts`).
 */

export const SPRINT_REPORT_SCHEMA = 'sprint-report@0.1';

/** Granularité RÉELLE des tokens rapportés — jamais silencieusement fausse. */
export type TokensGrain = 'sprint' | 'session';

/**
 * Mode de revue du run (fiche 20261017110956989) : `local` = revue `ezk-reviewer` + squash local,
 * aucune PR ; `pr-codex` = PR ouverte (+ revue Codex). Déduit de la config (`pr`), au rapport, jamais
 * saisi. Un run tient UN seul mode ; un run mixte serait marqué à part (différé au grooming).
 */
export type ReviewMode = 'local' | 'pr-codex';

export interface SprintWindow {
  startTs: string;
  endTs: string;
  durationMs: number;
}

export interface TokensSummary {
  grain: TokensGrain;
  inputTokens: number;
  outputTokens: number;
  /** Lecture de cache : facturée bien moins cher qu'une entrée neuve → rapportée À PART, non pondérée. */
  cacheRead: number;
  /** Création de cache : idem, à part, sans prix figé (fiche 20261017110956989). */
  cacheCreation: number;
  /** Total brut = entrée + sortie + cache (lecture + création) : conserve le total d'avant (où le cache était fondu dans l'entrée). */
  totalTokens: number;
  /** Mode de revue du run (`local` | `pr-codex`), déduit de la config au rapport. Absent si inconnu. */
  mode?: ReviewMode;
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

/** Résultat d'une story du lot scellé : livrée `[x]`, reportée `[~]`, ou restée ouverte `[ ]` (abandon). */
export type LotResult = 'shipped' | 'reported' | 'open';

export interface LotEntrySummary {
  id: string;
  result: LotResult;
  /** Titre de la story tel qu'écrit dans `## Lot` (sans le suffixe `(PR #N)` / `(reportée : …)`). */
  title?: string;
}

/**
 * Le LOT SCELLÉ du sprint (ADR-0068) : le périmètre « ce sprint » vient de la section `## Lot` de
 * `SPRINT.md`, jamais de `## Incréments scellés de la session` (zone accumulée, polluée par héritage).
 */
export interface LotSummary {
  entries: LotEntrySummary[];
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
  /** Le lot scellé de CE sprint (périmètre « ce sprint », ADR-0068) — vide si `SPRINT.md` absent. */
  lot: LotSummary;
  steps: StepsSummary;
}
