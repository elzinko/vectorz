/**
 * avancement-data — le BOARD d'avancement, compilé depuis les fiches. PUR (ADR-0003).
 *
 * Fiche 20260823124042842, lot 0 : montrer OÙ EN EST le travail (fiches × statut ×
 * priorité × épic), depuis le front-matter EXISTANT — zéro objet nouveau, zéro saisie
 * à la main. C'est le pendant « flux » de la carte « structure ». Le bord I/O (bin)
 * charge les fiches ; ici on ne fait que trier/compter/grouper.
 */
import type { Fiche } from '../loaders/fiches.js';

/**
 * L'ordre de statut du flux : `idea` (pas encore prête) → `ready` (groomée, tirable) →
 * `shipped` (livrée). `in-progress` / `blocked` sont des signaux orthogonaux (posés à la
 * main). Le statut `todo` a été RETIRÉ le 2026-09-04 (panel adverse, capture
 * `docs/captures/2026-09-04-panel-adverse-objet-sprint.md`) : une fiche non prête est une
 * `idea`, une fiche prête est `ready` — plus d'état ambigu au milieu. « doing » (en cours)
 * reste DÉRIVÉ de la branche `feat/<id>`, jamais un statut committé.
 */
export const STATUTS: readonly string[] = [
  'idea',
  'ready',
  'in-progress',
  'blocked',
  'shipped',
];
/** Source unique — réutilisée par le validateur de conformité (fiche 652/281, ADR-0040 D2). */
export const PRIOS: readonly string[] = ['P0', 'P1', 'P2', 'P3'];

/**
 * `type` de fiche — jusqu'ici documenté seulement en commentaire, dupliqué à 5 endroits
 * (fiches.ts, plan-head.ts, ezk-backlog/init.sh, SKILL.md, feature-template.md).
 * Centralisé ici (aux côtés de STATUTS/PRIOS) pour devenir la source unique — fiche 652/281.
 */
export const TYPES: readonly string[] = ['feature', 'bug', 'refactor', 'chore', 'epic'];

/**
 * `evidence` — champ OPTIONNEL de fiche (fiche 20260902224608715, ADR-0045) : la preuve
 * avant/après en PR est exigée (`before-after`), décidée par le diff (`auto`, défaut
 * si absent) ou motivée absente (`none # raison`).
 */
export const EVIDENCE: readonly string[] = ['before-after', 'auto', 'none'];

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
  labels: string[];
  file: string; // chemin relatif à la racine du repo — la vue en fait un lien cliquable
}

export interface BoardEpic {
  id: string;
  title: string;
  /** Statut CALCULÉ depuis les enfants (jamais saisi) — fiche 20260825123700998 (D4). */
  status: string;
  children: string[]; // ids des fiches actives portant epic == cet id
  /** Cumul par statut sur TOUS les enfants (actifs + livrés) : « shipped: 1, todo: 2… ». */
  childCounts: Record<string, number>;
}

export interface AvancementData {
  /** Compteurs par statut sur TOUTES les fiches (actives + livrées). */
  counts: Record<string, number>;
  /** Nombre de fiches TIRABLES (status `ready`, hors épic). */
  tirables: number;
  /** Fiches ACTIVES (hors `done/`, hors épic), triées priorité puis id. */
  actives: BoardFiche[];
  /** Épics avec leurs enfants actifs. */
  epics: BoardEpic[];
  /** Valeurs distinctes pour les filtres de la vue (statuts, priorités, produits, épics). */
  filtres: { statuts: string[]; priorites: string[]; produits: string[]; labels: string[] };
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
  labels: f.labels,
  file: f.file,
});

/** Rang de tri d'une priorité (P0 avant P3 ; sans prio = après). */
const prioRank = (p: string): number => {
  const i = PRIOS.indexOf(p);
  return i === -1 ? PRIOS.length : i;
};

/**
 * Statut d'un épic, CALCULÉ depuis ses enfants (D4, fiche 20260825123700998 ; ADR-0017 A15) :
 * tous les enfants livrés (`done/`) → `shipped` ; au moins un livré OU engagé
 * (ready/in-progress/blocked) → `in-progress` ; que des `idea` → `idea` ; aucun enfant → le
 * statut saisi (fallback). Le « tout livré » s'appuie sur `done/` (le dossier), pas sur la
 * chaîne 'shipped' — robuste à un statut de provenance `merged`/`split`. Jamais saisi (ADR-0001).
 */
function deriveEpicStatus(
  childCounts: Record<string, number>,
  doneCount: number,
  fallback: string,
): string {
  const total = Object.values(childCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return fallback;
  if (doneCount === total) return 'shipped';
  const engaged =
    (childCounts.ready ?? 0) + (childCounts['in-progress'] ?? 0) + (childCounts.blocked ?? 0);
  return doneCount > 0 || engaged > 0 ? 'in-progress' : 'idea';
}

/** Compile le board. Tout est trié → sortie stable (F4). */
export function buildAvancementData(fiches: Fiche[]): AvancementData {
  const counts: Record<string, number> = {};
  for (const f of fiches) counts[f.status] = (counts[f.status] ?? 0) + 1;

  // Actives = non livrées, non épic. Triées priorité puis id.
  const actives = fiches
    .filter((f) => !f.done && f.type !== 'epic')
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || (a.id < b.id ? -1 : 1))
    .map(toBoard);

  const tirables = actives.filter((f) => f.status === 'ready').length;

  // Enfants par épic : compteurs par statut sur TOUS les enfants (actifs + livrés, D4),
  // et liste des enfants ACTIFS pour l'affichage détaillé.
  const activeChildrenByEpic = new Map<string, string[]>();
  const childCountsByEpic = new Map<string, Record<string, number>>();
  const doneCountByEpic = new Map<string, number>();
  for (const f of fiches) {
    if (f.type === 'epic' || !f.epic) continue;
    const rec = childCountsByEpic.get(f.epic) ?? {};
    rec[f.status] = (rec[f.status] ?? 0) + 1;
    childCountsByEpic.set(f.epic, rec);
    if (f.done) {
      doneCountByEpic.set(f.epic, (doneCountByEpic.get(f.epic) ?? 0) + 1);
    } else {
      const list = activeChildrenByEpic.get(f.epic) ?? [];
      list.push(f.id);
      activeChildrenByEpic.set(f.epic, list);
    }
  }
  const epics: BoardEpic[] = fiches
    .filter((f) => !f.done && f.type === 'epic')
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((e) => {
      const childCounts = childCountsByEpic.get(e.id) ?? {};
      return {
        id: e.id,
        title: e.title,
        status: deriveEpicStatus(childCounts, doneCountByEpic.get(e.id) ?? 0, e.status),
        children: (activeChildrenByEpic.get(e.id) ?? []).sort(),
        childCounts,
      };
    });

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
      labels: uniq(actives.reduce<string[]>((acc, f) => acc.concat(f.labels), [])),
    },
  };
}

// --- Bord pour la vue `diagrams/avancement/board.html` (même patron que map-data.ts) ---

export const AVANCEMENT_DATA_BEGIN = '/*ezk-avancement-data:begin*/';
export const AVANCEMENT_DATA_END = '/*ezk-avancement-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans board.html. */
export function buildAvancementDataBlock(fiches: Fiche[]): string {
  // `<` échappé en < : protège la SOURCE (un titre
  // contenant `</script>` ne peut pas fermer la balise <script> qui porte le bloc). Le
  // RENDU est protégé séparément — board.html pose les données via textContent, jamais
  // innerHTML (revue P0). Les deux protections sont nécessaires et distinctes.
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
