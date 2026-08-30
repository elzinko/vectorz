import { computeSprintWindow } from './domain/duration.js';
import { summarizeBlockages, summarizePrRetouches, summarizeShippedFeatures } from './domain/kpi.js';
import { buildSprintReport } from './domain/report.js';
import { attributeTokens } from './domain/tokens.js';
import type { SprintReport } from './domain/types.js';
import type { JournalSource } from './ports/JournalSource.js';
import type { RepoSource } from './ports/RepoSource.js';
import type { TranscriptSource, TranscriptSourceOptions } from './ports/TranscriptSource.js';

export interface CollectSprintReportInput {
  /** Racine produit portant `.supervision/` et les transcripts (ex. `products/mega-city`). */
  projectRoot: string;
  /** Racine git portant `features/done/` et les PR (ex. racine du repo vectorz). */
  repoRoot: string;
  slug: string;
  product?: string;
  /** Horloge injectable — déterminisme des tests. */
  now?: () => string;
  /** Override de résolution des transcripts (tests / `--transcript`). */
  transcriptOptions?: TranscriptSourceOptions;
}

export interface SprintMetricsPorts {
  journal: JournalSource;
  transcript: TranscriptSource;
  repo: RepoSource;
}

/**
 * Composant DÉTERMINISTE (fiche 20260826082120062) : rejouer la collecte sur
 * les mêmes fixtures produit les mêmes chiffres. Orchestre les 3 ports à
 * travers le domaine pur — zéro logique métier ici.
 */
export function collectSprintReport(input: CollectSprintReportInput, ports: SprintMetricsPorts): SprintReport {
  const checkpoints = ports.journal.listSprintCheckpoints(input.projectRoot);
  const fallbackStart = ports.journal.earliestRunStartedTs(input.projectRoot);
  const window = computeSprintWindow(checkpoints, input.slug, fallbackStart);
  if (window === null) {
    throw new Error(
      `sprint-metrics: aucun gate "sprint-${input.slug}-checkpoint" trouvé sous ` +
        `${input.projectRoot}/.supervision/runs — impossible de dater le sprint "${input.slug}".`,
    );
  }

  const usageEvents = ports.transcript.listUsageEvents(input.projectRoot, input.transcriptOptions);
  const tokens = attributeTokens(usageEvents, window);

  const blockedEscalations = ports.journal.listBlockedEscalations(input.projectRoot);
  const blockages = summarizeBlockages(blockedEscalations, window);

  const fiches = ports.repo.listShippedFiches(input.repoRoot);
  const shippedFeatures = summarizeShippedFeatures(fiches, window);

  const prs = ports.repo.listMergedPrs(input.repoRoot);
  const prRetouches = summarizePrRetouches(prs, window);

  const generatedAt = (input.now ?? (() => new Date().toISOString()))();

  return buildSprintReport({
    slug: input.slug,
    product: input.product,
    window,
    tokens,
    shippedFeatures,
    blockages,
    prRetouches,
    generatedAt,
  });
}
