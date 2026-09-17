/**
 * runs-data — la vue « Historique des runs » compilée depuis les récits `docs/sessions/`.
 * PUR (ADR-0003) : ne lit rien sur disque, prend les récits déjà chargés par `loaders/runs.ts`.
 *
 * Fiche 20260826072532452 : une porte d'entrée unique pour relire, par run/session (nocturne ou
 * diurne), ce qui a été fait — ses PR, ses fiches, un lien vers le récit complet. Zéro saisie à la
 * main : tout dérive des récits (`/ezk-archive` les fige). Pendant « frise » (le diagramme du process)
 * et extraction fine des actions restent une tranche ultérieure — ici, la liste et le détail léger.
 */
import type { RunReport } from '../loaders/runs.js';

export interface RunsData {
  /** Récits, du plus récent au plus ancien (ordre fixé par le loader). */
  runs: RunReport[];
  /** Compteurs pour l'encart d'en-tête. */
  counts: { total: number; withPr: number; prs: number; fiches: number };
}

/** Compile la vue. Déterministe : dépend uniquement de `runs` (déjà trié). */
export function buildRunsData(runs: RunReport[]): RunsData {
  const uniqPrs = new Set<string>();
  const uniqFiches = new Set<string>();
  for (const r of runs) {
    for (const p of r.prs) uniqPrs.add(p);
    for (const f of r.fiches) uniqFiches.add(f);
  }
  return {
    runs,
    counts: {
      total: runs.length,
      withPr: runs.filter((r) => r.prs.length > 0).length,
      prs: uniqPrs.size,
      fiches: uniqFiches.size,
    },
  };
}

// --- Bord pour la vue `diagrams/runs/runs.html` (même patron de marqueurs que avancement-data). ---

export const RUNS_DATA_BEGIN = '/*ezk-runs-data:begin*/';
export const RUNS_DATA_END = '/*ezk-runs-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans runs.html. */
export function buildRunsDataBlock(runs: RunReport[]): string {
  // `<` échappé en < : protège la SOURCE (un titre de récit contenant `</script>` ne peut
  // pas fermer la balise <script> porteuse). Le RENDU est protégé séparément (runs.html pose les
  // données via textContent, jamais innerHTML). Deux protections distinctes — cf. avancement-data.
  const json = JSON.stringify(buildRunsData(runs), null, 1).replace(/</g, '\\u003c');
  return `${RUNS_DATA_BEGIN}\nwindow.EZK_RUNS = ${json};\n${RUNS_DATA_END}`;
}

/**
 * Pose `block` dans `text` entre les marqueurs. Les marqueurs DOIVENT déjà exister dans le HTML
 * (posés une fois par l'auteur de la carte) — absents ⇒ erreur franche (même règle que le board).
 */
export function upsertRunsDataBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(RUNS_DATA_BEGIN);
  const endIdx = text.indexOf(RUNS_DATA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(`marqueurs ${RUNS_DATA_BEGIN} … ${RUNS_DATA_END} introuvables dans runs.html`);
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + RUNS_DATA_END.length);
}
