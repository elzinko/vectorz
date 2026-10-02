/**
 * avancement-data — le BOARD d'avancement, compilé depuis les fiches. PUR (ADR-0003).
 *
 * Fiche 20260823124042842, lot 0 : montrer OÙ EN EST le travail (fiches × statut ×
 * priorité × épic), depuis le front-matter EXISTANT — zéro objet nouveau, zéro saisie
 * à la main. C'est le pendant « flux » de la carte « structure ». Le bord I/O (bin)
 * charge les fiches ; ici on ne fait que trier/compter/grouper.
 */
import type { Fiche } from '../loaders/fiches.js';
import { STATUTS, TERMINAUX } from './fiche-schema.js';

/**
 * STATUTS et TERMINAUX vivent dans `fiche-schema.ts` (LE schéma des fiches, fiche 20260823121712652) :
 * la liste des statuts n'existe plus qu'à un seul endroit. Réexportés ici pour les importeurs du board.
 */
export { STATUTS, TERMINAUX };

/** Source unique — réutilisée par le validateur de conformité (fiche 652/281, ADR-0040 D2). */
export const PRIOS: readonly string[] = ['P0', 'P1', 'P2', 'P3'];

/**
 * `type` de fiche — jusqu'ici documenté seulement en commentaire, dupliqué à 5 endroits
 * (fiches.ts, plan-head.ts, ezk-backlog/init.sh, SKILL.md, feature-template.md).
 * Centralisé ici (aux côtés de STATUTS/PRIOS) pour devenir la source unique — fiche 652/281.
 */
export const TYPES: readonly string[] = ['feature', 'bug', 'refactor', 'chore'];

/**
 * Ordre canonique des JALONS (`milestone`) — PLAN.md, ADR-0017 A16. Le milestone porte l'ORDRE et
 * le regroupement de blocs ; le thème (`labels:`) porte le sujet. Un milestone hors liste est trié
 * après, alphabétiquement. Remplace l'ancien conteneur « épic » (retiré A16).
 */
export const MILESTONE_ORDER: readonly string[] = [
  'fondation',
  'rationalisation',
  'env-test',
  'contrat',
  'ux',
  'articles',
  'parked',
];

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
  milestone: string;
  product: string;
  pr: string;
  labels: string[];
  /** Drapeau orthogonal (sliver B, fiche 652) : raison si `blocked:` est posé, '' sinon. */
  blocked: string;
  file: string; // chemin relatif à la racine du repo — la vue en fait un lien cliquable
}

export interface BoardMilestone {
  /** Nom du jalon (`fondation`, `rationalisation`, …). */
  milestone: string;
  /** Statut CALCULÉ depuis les fiches du jalon (jamais saisi) — ADR-0017 A16. */
  status: string;
  /** Fiches non-terminales du jalon (idea/ready/in-progress/shipped). */
  total: number;
  /** Combien sont livrées (rangées dans `done/`). */
  shipped: number;
  /** Cumul par statut : « idea: 2, shipped: 1… ». */
  counts: Record<string, number>;
  /** ids des fiches ACTIVES (non-`done/`) du jalon, pour l'affichage détaillé. */
  children: string[];
}

export interface AvancementData {
  /** Compteurs par statut sur TOUTES les fiches (actives + livrées). */
  counts: Record<string, number>;
  /** Nombre de fiches TIRABLES (status `ready`). */
  tirables: number;
  /** Fiches ACTIVES (hors `done/`, hors terminales), triées priorité puis id. */
  actives: BoardFiche[];
  /** Cumul d'avancement par milestone (jalon d'ordre, ADR-0017 A16). */
  milestones: BoardMilestone[];
  /** Valeurs distinctes pour les filtres de la vue. */
  filtres: {
    statuts: string[];
    priorites: string[];
    produits: string[];
    labels: string[];
    milestones: string[];
  };
}

const toBoard = (f: Fiche): BoardFiche => ({
  id: f.id,
  title: f.title,
  type: f.type,
  priority: f.priority,
  status: f.status,
  milestone: f.milestone,
  product: f.product,
  pr: f.pr,
  labels: f.labels,
  blocked: f.blocked,
  file: f.file,
});

/** Rang de tri d'une priorité (P0 avant P3 ; sans prio = après). */
const prioRank = (p: string): number => {
  const i = PRIOS.indexOf(p);
  return i === -1 ? PRIOS.length : i;
};

/**
 * Statut d'un MILESTONE, CALCULÉ depuis ses fiches (jamais saisi — ADR-0001, ADR-0017 A16) :
 * toutes livrées (`done/`) → `shipped` ; au moins une livrée OU engagée (ready/in-progress) →
 * `in-progress` ; que des `idea` → `idea`. Le « tout livré » s'appuie sur `done/` (le dossier),
 * robuste à un statut de provenance. Remplace `deriveEpicStatus` (épic retiré A16).
 */
function deriveMilestoneStatus(
  counts: Record<string, number>,
  shipped: number,
  total: number,
): string {
  if (total === 0) return 'idea';
  if (shipped === total) return 'shipped';
  const engaged = (counts.ready ?? 0) + (counts['in-progress'] ?? 0);
  return shipped > 0 || engaged > 0 ? 'in-progress' : 'idea';
}

/** Fiche « parkée » : `idea` + `milestone: parked` (jalon fermé par le PO, hors flux). */
const isParked = (f: Fiche): boolean => f.status === 'idea' && f.milestone === 'parked';

/** Compile le board. Tout est trié → sortie stable (F4). */
export function buildAvancementData(fiches: Fiche[]): AvancementData {
  const counts: Record<string, number> = {};
  for (const f of fiches) counts[f.status] = (counts[f.status] ?? 0) + 1;

  // Actives = non livrées, non terminales (superseded/merged/split), HORS parkées
  // (idea + `milestone: parked` = jalon fermé par le PO, hors flux — cohérent avec le bloc
  // « Parkées » de regen-backlog.sh et la section Idées de PORTFOLIO.md). Triées priorité puis id.
  const actives = fiches
    .filter((f) => !f.done && !TERMINAUX.includes(f.status) && !isParked(f))
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || (a.id < b.id ? -1 : 1))
    .map(toBoard);

  const tirables = actives.filter((f) => f.status === 'ready').length;

  // Cumul par MILESTONE (jalon d'ordre, ADR-0017 A16) : regroupe les fiches NON-TERMINALES par
  // milestone. « N fiches — k livrées » : total = fiches du jalon (idea/ready/in-progress/shipped),
  // shipped = celles rangées dans `done/`. Statuts terminaux et fiches sans milestone = hors cumul.
  const countsByMs = new Map<string, Record<string, number>>();
  const doneByMs = new Map<string, number>();
  const activeChildrenByMs = new Map<string, string[]>();
  for (const f of fiches) {
    if (!f.milestone || TERMINAUX.includes(f.status)) continue;
    const rec = countsByMs.get(f.milestone) ?? {};
    rec[f.status] = (rec[f.status] ?? 0) + 1;
    countsByMs.set(f.milestone, rec);
    if (f.done) {
      doneByMs.set(f.milestone, (doneByMs.get(f.milestone) ?? 0) + 1);
    } else {
      const list = activeChildrenByMs.get(f.milestone) ?? [];
      list.push(f.id);
      activeChildrenByMs.set(f.milestone, list);
    }
  }
  const msRank = (m: string): number => {
    const i = MILESTONE_ORDER.indexOf(m);
    return i === -1 ? MILESTONE_ORDER.length : i;
  };
  const milestones: BoardMilestone[] = [...countsByMs.keys()]
    .sort((a, b) => msRank(a) - msRank(b) || (a < b ? -1 : a > b ? 1 : 0))
    .map((m) => {
      const counts = countsByMs.get(m) ?? {};
      const total = Object.values(counts).reduce((n, k) => n + k, 0);
      const shipped = doneByMs.get(m) ?? 0;
      return {
        milestone: m,
        status: deriveMilestoneStatus(counts, shipped, total),
        total,
        shipped,
        counts,
        children: (activeChildrenByMs.get(m) ?? []).sort(),
      };
    });

  const uniq = (xs: string[]): string[] => [...new Set(xs.filter(Boolean))].sort();
  return {
    counts,
    tirables,
    actives,
    milestones,
    filtres: {
      statuts: uniq(actives.map((f) => f.status)),
      priorites: uniq(actives.map((f) => f.priority)),
      produits: uniq(actives.map((f) => f.product)),
      labels: uniq(actives.reduce<string[]>((acc, f) => acc.concat(f.labels), [])),
      milestones: uniq(actives.map((f) => f.milestone)),
    },
  };
}

// --- Bloc de données du board (fichier voisin `board.data.js`, non committé — ADR-0055) ---

export const AVANCEMENT_DATA_BEGIN = '/*ezk-avancement-data:begin*/';
export const AVANCEMENT_DATA_END = '/*ezk-avancement-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à écrire dans `board.data.js`. */
export function buildAvancementDataBlock(fiches: Fiche[]): string {
  // `<` échappé en < : protège la SOURCE (un titre
  // contenant `</script>` ne peut pas fermer la balise <script> qui porte le bloc). Le
  // RENDU est protégé séparément — board.html pose les données via textContent, jamais
  // innerHTML (revue P0). Les deux protections sont nécessaires et distinctes.
  const json = JSON.stringify(buildAvancementData(fiches), null, 1).replace(/</g, '\\u003c');
  return `${AVANCEMENT_DATA_BEGIN}\nwindow.EZK_AVANCEMENT = ${json};\n${AVANCEMENT_DATA_END}`;
}
