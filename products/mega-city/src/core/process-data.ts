/**
 * process-data — pose chaque fiche sur UNE étape du process (fiche 20261002115451315).
 *
 * Le board dit QUELLES fiches existent ; cette vue dit OÙ elles en sont. Elle ne crée aucun
 * objet « sprint » (verdict du panel du 2026-08-23) : l'étape se DÉDUIT de signaux déjà produits
 * ailleurs — le statut de la fiche, une branche `feat/<id>-…`, une PR ouverte, une session.
 *
 * PUR (ADR-0003) : aucune I/O ici (ni git, ni gh, ni disque). Le bord I/O
 * (`src/io/sessions-collect.ts`, appelé par `derived-views.ts`) collecte et INJECTE les entrées.
 * Testable sans vrai git. Le script range, l'IA juge (ADR-0001).
 */
import type { Fiche } from '../loaders/fiches.js';
import { TERMINAUX } from './fiche-schema.js';
import type { SessionRow } from './sessions-data.js';

/** Les cinq étapes, de la moins avancée à la plus avancée (ordre d'affichage, gauche → droite). */
export type ProcessStage = 'idee' | 'prete' | 'en-sprint' | 'en-revue' | 'livree';

/** Préfixes de branche « type sprint » (mêmes que sessions-data) : une branche de travail porte un id. */
const SPRINT_BRANCH = /^(?:feat|fix|chore|refactor|docs|test|perf)\/(\d{4,})[-_]/;

/**
 * Statuts terminaux NON livrés : hors vue. Dérivé de la source unique `TERMINAUX` (fiche-schema)
 * moins `shipped`, qu'on garde pour la colonne « Livrée ». Ajouter un statut terminal au schéma
 * l'écarte ici AUTOMATIQUEMENT — pas de liste recopiée qui dériverait (ADR-0040 D2).
 */
const HORS_VUE: readonly string[] = TERMINAUX.filter((s) => s !== 'shipped');

const STAGE_FLOW: readonly ProcessStage[] = ['idee', 'prete', 'en-sprint', 'en-revue', 'livree'];

const STAGE_LABEL: Record<ProcessStage, string> = {
  idee: 'Idée',
  prete: 'Prête',
  'en-sprint': 'En sprint',
  'en-revue': 'En revue',
  livree: 'Livrée',
};

const PRIOS: readonly string[] = ['P0', 'P1', 'P2', 'P3'];

export interface ProcessInputs {
  /** Les fiches du backlog (actives + `done/`), telles que `loadFiches` les rend. */
  fiches: Fiche[];
  /** Les sessions (worktree + branche), sortie du cockpit de sessions. Pour rattacher qui travaille quoi. */
  sessions: SessionRow[];
  /** TOUTES les branches locales (nom court), brutes. Signal « en sprint » même sans worktree. */
  branches: string[];
  /**
   * Les branches ABSORBÉES par `main` (les merger n'y changerait plus rien : squash déjà passé, ou
   * fusion en avance rapide). Une branche de story restée après le merge (copie locale, branche tenue
   * par un autre worktree) ne doit PAS rendre sa fiche « en cours » : on l'écarte ici
   * (fiche 20261013131852984, critère 4). Absente/vide = aucune exclusion (comportement d'avant).
   */
  absorbedBranches?: string[];
  /**
   * État des PR OUVERTES par branche — NULLABLE DE PREMIÈRE CLASSE. `null` = pas de `gh`/remote :
   * l'étape « en revue » est alors INDÉTERMINABLE. Une fiche avec une branche reste « en sprint »,
   * jamais rétrogradée en silence (critère de la fiche). Une map (même vide) = `gh` a répondu.
   */
  openPrByBranch: Record<string, string> | null;
}

export interface ProcessSession {
  path: string;
  branch: string;
}

export interface ProcessFiche {
  id: string;
  title: string;
  priority: string;
  status: string;
  product: string;
  /** Version cible (`v0.7.0`) ou '' — affichée en pastille, sert de filtre. */
  version: string;
  /** Jalon d'ordre (`rationalisation`…) ou '' — sert de filtre. */
  milestone: string;
  stage: ProcessStage;
  file: string; // chemin relatif au repo — la vue en fait un lien cliquable vers le détail
  /** La session (worktree + branche) qui travaille la fiche, `null` si aucune. */
  session: ProcessSession | null;
  /** Vrai quand « en revue » n'a pas pu être évalué faute de `gh`/remote (openPrByBranch null). */
  reviewIndetermine: boolean;
}

export interface ProcessStageGroup {
  stage: ProcessStage;
  label: string;
  /**
   * Toutes les fiches de l'étape (« Livrée » les porte TOUTES, plus récent d'abord). La vue limite
   * l'AFFICHAGE des livrées quand il n'y a pas de filtre, et signale la troncature (« 20 / N ») ;
   * sous filtre, elle les parcourt toutes, donc la recherche ne rate aucune livrée (revue P1).
   */
  fiches: ProcessFiche[];
}

export interface ProcessFiltres {
  /** Versions distinctes présentes dans la vue, triées (pour le menu déroulant). */
  versions: string[];
  milestones: string[];
  priorites: string[];
}

export interface ProcessData {
  stages: ProcessStageGroup[];
  /** Valeurs distinctes présentes, pour peupler les filtres de la vue. */
  filtres: ProcessFiltres;
  /** Vrai si l'étape « en revue » n'a pas pu être calculée (pas de `gh`/remote) — un bandeau le dira. */
  reviewIndetermine: boolean;
}

/** L'id de fiche porté par une branche `feat/<id>-…` (ou fix/chore/…), `null` si la branche n'en porte pas. */
export function ficheIdFromBranch(branch: string): string | null {
  const m = branch.match(SPRINT_BRANCH);
  return m ? m[1] : null;
}

const prioRank = (p: string): number => {
  const i = PRIOS.indexOf(p);
  return i === -1 ? PRIOS.length : i;
};

const isParked = (f: Fiche): boolean => f.status === 'idea' && f.milestone === 'parked';

/** Range par priorité (P0 d'abord), puis id — sortie stable. */
function byPrioThenId(a: ProcessFiche, b: ProcessFiche): number {
  return prioRank(a.priority) - prioRank(b.priority) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * L'étape d'une fiche active (non livrée), par l'ÉCHELLE : en revue → en sprint → prête → idée,
 * premier match gagnant. « Livrée » est traité à part (avant), sur le statut `shipped`.
 */
function activeStage(status: string, hasBranch: boolean, hasOpenPr: boolean): ProcessStage {
  if (hasOpenPr) return 'en-revue';
  if (hasBranch) return 'en-sprint';
  // `in-progress` = travail engagé : « en sprint », même si sa branche n'est plus détectée
  // (nettoyée, mergée, ou hors format `feat/<id>-`). Sans ce cran, une fiche in-progress sans
  // branche reculerait en « idée » — une rétrogradation silencieuse, que la fiche jure d'éviter.
  if (status === 'in-progress') return 'en-sprint';
  if (status === 'ready') return 'prete';
  return 'idee';
}

export function buildProcessData(input: ProcessInputs): ProcessData {
  const prKnown = input.openPrByBranch !== null;

  // Les ids qui portent une branche de travail NON LIVRÉE : branches locales + branches des sessions,
  // en écartant les branches absorbées par `main` (travail déjà squashé/fusionné — fiche 20261013131852984).
  // Une branche restée après le merge ne doit pas faire croire que la story est encore en cours.
  const absorbed = new Set(input.absorbedBranches ?? []);
  const branchIds = new Set<string>();
  for (const b of input.branches) {
    if (absorbed.has(b)) continue;
    const id = ficheIdFromBranch(b);
    if (id) branchIds.add(id);
  }
  for (const s of input.sessions) {
    if (absorbed.has(s.branch)) continue;
    const id = ficheIdFromBranch(s.branch);
    if (id) branchIds.add(id);
  }

  // Les ids qui ont une PR OUVERTE (seulement si `gh`/remote a répondu).
  const prIds = new Set<string>();
  if (input.openPrByBranch) {
    for (const branch of Object.keys(input.openPrByBranch)) {
      const id = ficheIdFromBranch(branch);
      if (id) prIds.add(id);
    }
  }

  // Première session trouvée par id (déterministe : les sessions arrivent déjà triées par le collecteur).
  const sessionByI: Map<string, ProcessSession> = new Map();
  for (const s of input.sessions) {
    const id = ficheIdFromBranch(s.branch);
    if (id && !sessionByI.has(id)) sessionByI.set(id, { path: s.path, branch: s.branch });
  }

  const shipped: ProcessFiche[] = [];
  const active: ProcessFiche[] = [];

  for (const f of input.fiches) {
    if (HORS_VUE.includes(f.status)) continue; // superseded/merged/split : hors vue
    if (isParked(f)) continue; // jalon fermé par le PO, hors flux (comme le board)

    const session = sessionByI.get(f.id) ?? null;
    const base = {
      id: f.id,
      title: f.title,
      priority: f.priority,
      status: f.status,
      product: f.product,
      version: f.version,
      milestone: f.milestone,
      file: f.file,
      session,
    };

    if (f.status === 'shipped') {
      shipped.push({ ...base, stage: 'livree', reviewIndetermine: false });
      continue;
    }

    const hasBranch = branchIds.has(f.id);
    const hasOpenPr = prKnown && prIds.has(f.id);
    const stage = activeStage(f.status, hasBranch, hasOpenPr);
    // « en revue » indéterminable : on ne sait pas si la fiche en sprint est en fait en revue
    // (pas de gh/remote). On la laisse « en sprint » et on le signale — jamais de silence.
    const reviewIndetermine = !prKnown && stage === 'en-sprint';
    active.push({ ...base, stage, reviewIndetermine });
  }

  // Toutes les livrées, plus récent d'abord (id décroissant ≈ plus récent). On NE tronque PAS la
  // DONNÉE : la page limite l'AFFICHAGE quand il n'y a pas de filtre. Tronquer ici ferait rater une
  // vieille livrée à la recherche/au filtre (« 0 résultat » à tort — revue P1).
  shipped.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));

  // Les étapes actives se trient par priorité puis id ; les livrées gardent l'ordre « plus récent
  // d'abord », qui a du sens pour une colonne d'historique.
  const byStage = (stage: ProcessStage): ProcessFiche[] =>
    stage === 'livree' ? shipped : active.filter((f) => f.stage === stage).slice().sort(byPrioThenId);

  const stages: ProcessStageGroup[] = STAGE_FLOW.map((stage) => ({
    stage,
    label: STAGE_LABEL[stage],
    fiches: byStage(stage),
  }));

  // Valeurs distinctes présentes dans la vue, pour peupler les filtres (menus déroulants).
  const uniq = (xs: string[]): string[] => [...new Set(xs.filter(Boolean))].sort();
  const shown = stages.flatMap((g) => g.fiches);
  const filtres: ProcessFiltres = {
    versions: uniq(shown.map((f) => f.version)),
    milestones: uniq(shown.map((f) => f.milestone)),
    priorites: uniq(shown.map((f) => f.priority)),
  };

  return { stages, filtres, reviewIndetermine: !prKnown };
}

// --- Bloc de données de la vue (fichier voisin `process.data.js`, non committé — ADR-0055) ---

export const PROCESS_DATA_BEGIN = '/*ezk-process-data:begin*/';
export const PROCESS_DATA_END = '/*ezk-process-data:end*/';

/** Le bloc complet (marqueurs + affectation JS), prêt à écrire dans `process.data.js`. */
export function buildProcessDataBlock(input: ProcessInputs): string {
  // `<` échappé : un titre contenant `</script>` ne peut pas fermer la balise qui porte le bloc.
  // Le RENDU est protégé séparément (process.html pose le texte par textContent, jamais innerHTML).
  const json = JSON.stringify(buildProcessData(input), null, 1).replace(/</g, '\\u003c');
  return `${PROCESS_DATA_BEGIN}\nwindow.EZK_PROCESS = ${json};\n${PROCESS_DATA_END}`;
}
