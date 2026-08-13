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
 *
 * LIMITE CONNUE (reclassification hors fenêtre, Codex #P1) : l'émission ne porte
 * que sur les **N dernières** PRs. Si une PR sort de cette fenêtre AVANT que son
 * correctif ne soit mesuré, aucun nouvel event `reprise_post_merge: true` n'est
 * émis pour elle (le ledger conserve son `false`). C'est inhérent à une baseline
 * « snapshot des N derniers » : le suivi persistant d'une obligation dans le temps
 * relève du **chien de garde calendaire**, déporté dans la fiche gated ADR-030
 * (20260813131259846). Dans la fenêtre, la reclassification est bien persistée
 * (clé de dédup incluant les métriques, cf. `ledger.ts`).
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
    // Signal « reprise post-merge » (AC4) : une AUTRE PR de la baseline, plus
    // récente et dans la fenêtre, qui retouche les mêmes fichiers/fiche.
    // Ordre-INDÉPENDANT : le port RepoSource ne garantit aucun tri (le stub et
    // `gh pr list` ordonnent à l'inverse) — on compare à toutes les autres et
    // reprisePostMerge filtre déjà la direction (deltaDays >= 0).
    const requalified = prs.some(
      (other, j) =>
        j !== index &&
        reprisePostMerge(
          { files: pr.files, ficheId: pr.ficheId, mergedAt: pr.mergedAt },
          { files: other.files, ficheId: other.ficheId, mergedAt: other.mergedAt },
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
