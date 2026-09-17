/**
 * pilotage-data — la page « Pilotage » : le suivi de HAUT NIVEAU, à côté du board (qui, lui,
 * montre le stock de fiches). PUR (ADR-0003). Ne calcule rien de neuf : il COMPOSE l'existant —
 * le cumul par milestone (`avancement-data`) et le décompte des runs (`runs-data`). Décision PO
 * 2026-09-17 : sortir le pilotage (milestones, runs, sessions…) du board vers sa propre vue.
 */
import type { Fiche } from '../loaders/fiches.js';
import type { RunReport } from '../loaders/runs.js';
import { type BoardMilestone, buildAvancementData } from './avancement-data.js';
import { buildRunsData } from './runs-data.js';

export interface PilotageData {
  /** Cumul d'avancement par milestone (repris tel quel d'avancement-data). */
  milestones: BoardMilestone[];
  /** Résumé de l'historique des runs (le détail vit dans la carte `runs`). */
  runs: { total: number; withPr: number; prs: number };
}

/** Compile la page. Déterministe : COMPOSITION des deux cœurs, zéro logique nouvelle. */
export function buildPilotageData(fiches: Fiche[], runs: RunReport[]): PilotageData {
  const { milestones } = buildAvancementData(fiches);
  const { counts } = buildRunsData(runs);
  return { milestones, runs: { total: counts.total, withPr: counts.withPr, prs: counts.prs } };
}

// --- Bord pour la vue `diagrams/pilotage/pilotage.html` (même patron de marqueurs que le board). ---

export const PILOTAGE_DATA_BEGIN = '/*ezk-pilotage-data:begin*/';
export const PILOTAGE_DATA_END = '/*ezk-pilotage-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans pilotage.html. */
export function buildPilotageDataBlock(fiches: Fiche[], runs: RunReport[]): string {
  // `<` échappé (protège la SOURCE : un titre contenant `</script>` ne ferme pas la balise porteuse ;
  // le RENDU est protégé séparément via textContent). Deux protections distinctes — cf. avancement-data.
  const json = JSON.stringify(buildPilotageData(fiches, runs), null, 1).replace(/</g, '\\u003c');
  return `${PILOTAGE_DATA_BEGIN}\nwindow.EZK_PILOTAGE = ${json};\n${PILOTAGE_DATA_END}`;
}

/** Pose `block` entre les marqueurs (qui DOIVENT exister) — absents ⇒ erreur franche, comme le board. */
export function upsertPilotageDataBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(PILOTAGE_DATA_BEGIN);
  const endIdx = text.indexOf(PILOTAGE_DATA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(
      `marqueurs ${PILOTAGE_DATA_BEGIN} … ${PILOTAGE_DATA_END} introuvables dans pilotage.html`,
    );
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + PILOTAGE_DATA_END.length);
}
