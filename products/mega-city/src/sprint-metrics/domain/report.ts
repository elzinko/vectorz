import {
  SPRINT_REPORT_SCHEMA,
  type BlockagesSummary,
  type PrRetouchesSummary,
  type ShippedFeaturesSummary,
  type SprintReport,
  type SprintWindow,
  type TokensSummary,
} from './types.js';

export interface BuildSprintReportInput {
  slug: string;
  product?: string;
  window: SprintWindow;
  tokens: TokensSummary;
  shippedFeatures: ShippedFeaturesSummary;
  blockages: BlockagesSummary;
  prRetouches: PrRetouchesSummary;
  generatedAt: string;
}

/**
 * Assemble le rapport de sprint versionné (JSON = source de vérité). Le
 * journal de supervision ne pose qu'UN gate par sprint (pas un par étape) :
 * `steps.ventilated` reste donc toujours `false` dans ce MVP, avec la mention
 * explicite plutôt qu'une granularité silencieusement fausse.
 */
export function buildSprintReport(input: BuildSprintReportInput): SprintReport {
  return {
    schema: SPRINT_REPORT_SCHEMA,
    sprint: { slug: input.slug, product: input.product },
    generatedAt: input.generatedAt,
    window: { startTs: input.window.startTs, endTs: input.window.endTs },
    duration: { ms: input.window.durationMs, grain: 'sprint' },
    tokens: input.tokens,
    kpi: {
      shippedFeatures: input.shippedFeatures,
      blockages: input.blockages,
      prRetouches: input.prRetouches,
    },
    steps: {
      ventilated: false,
      note:
        'Un seul gate_reached par sprint dans le journal — pas de ventilation par étape ' +
        '(BDD/archi/TDD/gate/revue/PR) dans ce MVP : total du sprint seulement.',
    },
  };
}
