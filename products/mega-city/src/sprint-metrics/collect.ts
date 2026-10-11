import { computeSprintWindow } from './domain/duration.js';
import { summarizeBlockages, summarizePrRetouches, summarizeShippedFeatures } from './domain/kpi.js';
import { parseSprintLot } from './domain/lot.js';
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
  /** Contenu de `SPRINT.md` : son `## Lot` donne le périmètre « ce sprint » (ADR-0068). Absent → lot vide. */
  sprintMd?: string;
  /**
   * Dégradation : sans gate `sprint-<slug>-checkpoint`, dater le sprint est impossible. Par défaut on
   * JETTE (contrat testé). `allowUndated` rend plutôt un rapport NON DATÉ (lot seulement, durée/tokens à
   * zéro avec mention) — ce que `close` veut pour committer un compte rendu même hors supervision (ADR-0068).
   */
  allowUndated?: boolean;
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
  const generatedAt = (input.now ?? (() => new Date().toISOString()))();

  // Périmètre « ce sprint » : le lot scellé de SPRINT.md (ADR-0068), jamais les incréments de session.
  const lot = { entries: input.sprintMd ? parseSprintLot(input.sprintMd) : [] };

  const checkpoints = ports.journal.listSprintCheckpoints(input.projectRoot);
  const fallbackStart = ports.journal.earliestRunStartedTs(input.projectRoot);
  const window = computeSprintWindow(checkpoints, input.slug, fallbackStart);
  if (window === null) {
    if (!input.allowUndated) {
      throw new Error(
        `sprint-metrics: aucun gate "sprint-${input.slug}-checkpoint" trouvé sous ` +
          `${input.projectRoot}/.supervision/runs — impossible de dater le sprint "${input.slug}".`,
      );
    }
    // Non daté : on NE SCANNE PAS l'historique (git merges, transcripts, fiches) — tout serait à zéro
    // sur une fenêtre vide, et le scan est coûteux sur un vrai dépôt. Lot seulement, KPIs à zéro,
    // mention honnête (jamais un faux chiffre). C'est le mode de `close` (ADR-0068, dégradation connue).
    return buildSprintReport({
      slug: input.slug,
      product: input.product,
      window: { startTs: generatedAt, endTs: generatedAt, durationMs: 0 },
      tokens: { grain: 'session', inputTokens: 0, outputTokens: 0, totalTokens: 0, note: 'fenêtre de supervision absente — durée et tokens non datés (lot seulement)' },
      shippedFeatures: { count: 0, ids: [] },
      blockages: { count: 0, events: [] },
      prRetouches: { total: 0, sansRetouche: 0, indetermine: 0 },
      lot,
      generatedAt,
    });
  }

  const tokens = attributeTokens(ports.transcript.listUsageEvents(input.projectRoot, input.transcriptOptions), window);
  const blockages = summarizeBlockages(ports.journal.listBlockedEscalations(input.projectRoot), window);
  const shippedFeatures = summarizeShippedFeatures(ports.repo.listShippedFiches(input.repoRoot), window);
  const prRetouches = summarizePrRetouches(ports.repo.listMergedPrs(input.repoRoot), window);

  return buildSprintReport({
    slug: input.slug,
    product: input.product,
    window,
    tokens,
    shippedFeatures,
    blockages,
    prRetouches,
    lot,
    generatedAt,
  });
}
