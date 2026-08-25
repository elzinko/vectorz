/**
 * avancement-data — le BOARD d'avancement, compilé depuis les fiches. PUR (ADR-0003).
 *
 * Fiche 20260823124042842, lot 0 : montrer OÙ EN EST le travail (fiches × statut ×
 * priorité × épic), depuis le front-matter EXISTANT — zéro objet nouveau, zéro saisie
 * à la main. C'est le pendant « flux » de la carte « structure ». Le bord I/O (bin)
 * charge les fiches ; ici on ne fait que trier/compter/grouper.
 */
import type { Fiche } from '../loaders/fiches.js';

/** L'ordre de statut du flux (idea = hors flux, à part). */
export const STATUTS: readonly string[] = [
  'todo',
  'in-progress',
  'blocked',
  'idea',
  'shipped',
];
const PRIOS: readonly string[] = ['P0', 'P1', 'P2', 'P3'];

export interface BoardFiche {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  ready: boolean;
  epic: string;
  product: string;
  pr: string;
  file: string; // chemin relatif à la racine du repo — la vue en fait un lien cliquable
}

export interface BoardEpic {
  id: string;
  title: string;
  status: string;
  children: string[]; // ids des fiches actives portant epic == cet id
}

export interface AvancementData {
  /** Compteurs par statut sur TOUTES les fiches (actives + livrées). */
  counts: Record<string, number>;
  /** Nombre de fiches TIRABLES (todo + ready, hors épic). */
  tirables: number;
  /** Fiches ACTIVES (hors `done/`, hors épic), triées priorité puis id. */
  actives: BoardFiche[];
  /** Épics avec leurs enfants actifs. */
  epics: BoardEpic[];
  /** Valeurs distinctes pour les filtres de la vue (statuts, priorités, produits, épics). */
  filtres: { statuts: string[]; priorites: string[]; produits: string[] };
}

const toBoard = (f: Fiche): BoardFiche => ({
  id: f.id,
  title: f.title,
  type: f.type,
  priority: f.priority,
  status: f.status,
  ready: f.ready,
  epic: f.epic,
  product: f.product,
  pr: f.pr,
  file: f.file,
});

/** Rang de tri d'une priorité (P0 avant P3 ; sans prio = après). */
const prioRank = (p: string): number => {
  const i = PRIOS.indexOf(p);
  return i === -1 ? PRIOS.length : i;
};

/** Compile le board. Tout est trié → sortie stable (F4). */
export function buildAvancementData(fiches: Fiche[]): AvancementData {
  const counts: Record<string, number> = {};
  for (const f of fiches) counts[f.status] = (counts[f.status] ?? 0) + 1;

  // Actives = non livrées, non épic. Triées priorité puis id.
  const actives = fiches
    .filter((f) => !f.done && f.type !== 'epic')
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || (a.id < b.id ? -1 : 1))
    .map(toBoard);

  const tirables = actives.filter((f) => f.status === 'todo' && f.ready).length;

  // Épics (actifs) et leurs enfants actifs.
  const activeChildrenByEpic = new Map<string, string[]>();
  for (const f of fiches) {
    if (f.done || f.type === 'epic' || !f.epic) continue;
    const list = activeChildrenByEpic.get(f.epic) ?? [];
    list.push(f.id);
    activeChildrenByEpic.set(f.epic, list);
  }
  const epics: BoardEpic[] = fiches
    .filter((f) => !f.done && f.type === 'epic')
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      children: (activeChildrenByEpic.get(e.id) ?? []).sort(),
    }));

  const uniq = (xs: string[]): string[] => [...new Set(xs.filter(Boolean))].sort();
  return {
    counts,
    tirables,
    actives,
    epics,
    filtres: {
      statuts: uniq(actives.map((f) => f.status)),
      priorites: uniq(actives.map((f) => f.priority)),
      produits: uniq(actives.map((f) => f.product)),
    },
  };
}

// --- Bord pour la vue `diagrams/avancement/board.html` (même patron que map-data.ts) ---

export const AVANCEMENT_DATA_BEGIN = '/*ezk-avancement-data:begin*/';
export const AVANCEMENT_DATA_END = '/*ezk-avancement-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans board.html. */
export function buildAvancementDataBlock(fiches: Fiche[]): string {
  // `<` échappé en < : un titre contenant `</script>` ne peut pas fermer la balise.
  const json = JSON.stringify(buildAvancementData(fiches), null, 1).replace(/</g, '\\u003c');
  return `${AVANCEMENT_DATA_BEGIN}\nwindow.EZK_AVANCEMENT = ${json};\n${AVANCEMENT_DATA_END}`;
}

/**
 * Pose `block` dans `text` entre les marqueurs. Les marqueurs DOIVENT déjà exister dans le
 * HTML (posés une fois par l'auteur de la carte) : on n'appende jamais une section en fin de
 * page HTML. Absents ⇒ erreur franche (même règle que `upsertMapDataBlock`).
 */
export function upsertAvancementDataBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(AVANCEMENT_DATA_BEGIN);
  const endIdx = text.indexOf(AVANCEMENT_DATA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(
      `marqueurs ${AVANCEMENT_DATA_BEGIN} … ${AVANCEMENT_DATA_END} introuvables dans board.html`,
    );
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + AVANCEMENT_DATA_END.length);
}
