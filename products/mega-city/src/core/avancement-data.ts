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
 * `shipped` (livrée). `in-progress` reste un signal orthogonal (dérivé de la branche
 * `feat/<id>`). Le statut `todo` a été RETIRÉ le 2026-09-04 (panel adverse, capture
 * `docs/captures/2026-09-04-panel-adverse-objet-sprint.md`) : une fiche non prête est une
 * `idea`, une fiche prête est `ready` — plus d'état ambigu au milieu. « doing » (en cours)
 * reste DÉRIVÉ de la branche `feat/<id>`, jamais un statut committé.
 *
 * `blocked` N'EST PLUS une colonne (sliver B, fiche 652) : c'est un DRAPEAU orthogonal
 * (champ `blocked:` en front-matter, une raison en texte) posé PAR-DESSUS n'importe quelle
 * colonne — une fiche peut être `ready` ET `blocked`. Voir `Fiche.blocked` / `BoardFiche.blocked`.
 *
 * `superseded`, `merged`, `split` = statuts TERMINAUX « clôturés sans livraison de forme
 * standard » : une fiche rendue caduque (`superseded`, pivot ou déjà livrée ailleurs), ou
 * absorbée par une autre fiche (`merged` — voir `merged_into:`) ou scindée en plusieurs
 * (`split` — voir `split_into:`). Ces trois statuts sortent du stock actif (la fiche part
 * dans `features/done/`) SANS compter comme livrée — les métriques de sprint ne comptent que
 * `shipped` (cf. `sprint-metrics/adapters/repoSource.ts`). Migration Skema 004 (`superseded`)
 * puis fiche 20260823121712652 (`merged`/`split`).
 */
export const STATUTS: readonly string[] = [
  'idea',
  'ready',
  'in-progress',
  'shipped',
  'superseded',
  'merged',
  'split',
];

/**
 * Statuts TERMINAUX « clôturés sans livraison standard » (cf. bloc ci-dessus) : `superseded`
 * (caduque/pivot), `merged`, `split`. Ils sortent du STOCK ACTIF même quand la fiche reste
 * physiquement dans `features/` — cas d'une fiche gardée là pour ne pas casser ses liens relatifs
 * (ex. `0051`, ~20 liens). `shipped` n'y figure pas : une livrée vit dans `done/`, déjà exclue par
 * le dossier. Sans ce filtre, une `superseded` gardée dans `features/` fuiterait au board actif
 * (revue Codex PR #240, exposé par le retrait de l'épic — A16).
 */
export const TERMINAUX: readonly string[] = ['superseded', 'merged', 'split'];

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
  ready: boolean;
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
  ready: f.ready,
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

/** Compile le board. Tout est trié → sortie stable (F4). */
export function buildAvancementData(fiches: Fiche[]): AvancementData {
  const counts: Record<string, number> = {};
  for (const f of fiches) counts[f.status] = (counts[f.status] ?? 0) + 1;

  // Actives = non livrées, non terminales (superseded/merged/split). Triées priorité puis id.
  const actives = fiches
    .filter((f) => !f.done && !TERMINAUX.includes(f.status))
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
