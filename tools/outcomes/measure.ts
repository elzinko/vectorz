/**
 * Fiche 0044 — orchestrateur CLI zéro-LLM : source → metrics → ledger + inventaire.
 *
 * PROVISOIRE tant qu'ADR-030 n'est pas ratifié : N (taille baseline) est un
 * seuil PO provisoire, tout comme le transport `.improvement/`.
 */
import { type Inventory, buildInventory } from './inventory.js';
import {
  type AppendResult,
  MEASURER_VERSION,
  type OutcomeMeasuredEvent,
  appendOutcomeEvents,
} from './ledger.js';
import { prSansRetouche, reprisePostMerge, tempsDeCycle } from './metrics.js';
import type { RepoSource } from './sources.js';

/** Taille de la baseline (N dernières PRs d'agents mergées). Seuil PO provisoire. */
export const DEFAULT_BASELINE_SIZE = 30;

export interface MeasureOptions {
  baselineSize?: number;
}

export interface MeasureResult {
  inventory: Inventory;
  events: OutcomeMeasuredEvent[];
  ledger: AppendResult;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * AC2 — construit un event `outcome.measured` par sujet de la baseline (les
 * N dernières PRs d'agents mergées + les fiches done/), zéro-LLM, déterministe.
 */
export function measure(
  source: RepoSource,
  rootDir: string,
  opts: MeasureOptions = {},
): MeasureResult {
  const baselineSize = opts.baselineSize ?? DEFAULT_BASELINE_SIZE;
  const inventory = buildInventory(source);
  const prs = source.listMergedAgentPrs(baselineSize);
  const fiches = source.listDoneFiches();

  const prEvents: OutcomeMeasuredEvent[] = prs.map((pr, index) => {
    // Signal « reprise post-merge » (AC4) : une PR plus récente de la même
    // baseline qui retouche les mêmes fichiers/fiche sous la fenêtre X.
    const requalified = prs
      .slice(index + 1)
      .some((later) =>
        reprisePostMerge(
          { files: pr.files, ficheId: pr.ficheId, mergedAt: pr.mergedAt },
          { files: later.files, ficheId: later.ficheId, mergedAt: later.mergedAt },
        ),
      );
    return {
      event: 'outcome.measured',
      ts: nowIso(),
      subject: { pr: pr.number },
      metrics: {
        pr_sans_retouche: prSansRetouche(pr.commits),
        reprise_post_merge: requalified,
      },
      measurer_version: MEASURER_VERSION,
    };
  });

  const ficheEvents: OutcomeMeasuredEvent[] = fiches.map((fiche) => ({
    event: 'outcome.measured',
    ts: nowIso(),
    subject: { fiche: fiche.id },
    metrics: {
      temps_de_cycle_jours: fiche.mergedAt ? tempsDeCycle(fiche.created, fiche.mergedAt) : null,
    },
    measurer_version: MEASURER_VERSION,
  }));

  const events = [...prEvents, ...ficheEvents];
  const ledger = appendOutcomeEvents(rootDir, events);
  return { inventory, events, ledger };
}
