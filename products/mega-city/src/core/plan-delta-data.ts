/**
 * plan-delta-data — l'écart entre le PLAN et le backlog réel (fiche 20260828165644386).
 * PUR (ADR-0003). Facette « ce qui a bougé » de l'onglet Plan : les N dernières fiches
 * créées, chacune badgée « dans le plan » / « hors plan », + un compteur des fiches
 * ACTIVES (hors idées) absentes du plan.
 *
 * « Dans le plan » = l'id apparaît N'IMPORTE OÙ dans PLAN.md — on scanne TOUT le document
 * (puces de section ET paquets multi-ids ET notes en prose, comme l'avertissement « ne pas
 * doublonner »), pas seulement les entrées de liste. Un id cité où que ce soit compte comme
 * « connu du plan » (revue Codex PR #185).
 *
 * « Les N dernières créées » : l'id EST la date de création (fiche 0180), donc trier par
 * id décroissant suffit — pas besoin de dater le plan (décision PO au grooming). Les ids
 * legacy 4 chiffres trient sous les horodatés 17 chiffres (ce sont les plus anciens) : le
 * top N est de fait composé des fiches récentes.
 *
 * Isolé de `plan-view-data` (bloc + marqueurs disjoints) pour NE PAS toucher la vue Plan
 * livrée. La coquille est `bin/regen-plan-delta.ts`.
 */
import type { Fiche } from '../loaders/fiches.js';

/** Fenêtre par défaut : les 15 dernières fiches créées (réglable). */
export const DEFAULT_DELTA_N = 15;

/** Statuts « actionnables » (dans le flux P0→P3) — les idées en sont hors. */
const ACTIONABLE = new Set(['ready', 'in-progress', 'blocked']);

/** Une fiche récente, badgée selon sa présence dans le plan. */
export interface DeltaCard {
  id: string;
  title: string;
  status: string;
  priority: string;
  /** L'id est-il cité quelque part dans `PLAN.md` ? */
  inPlan: boolean;
  file: string;
}

export interface PlanDelta {
  /** Les N dernières fiches actives (non livrées), de la plus récente à la plus ancienne. */
  recent: DeltaCard[];
  /** Fiches actives HORS IDÉES (todo / in-progress / blocked) absentes du plan. */
  offPlanCount: number;
  /** La fenêtre effectivement appliquée. */
  n: number;
}

// Extraction d'ids sur TOUT le document (fix revue Codex PR #185) : la promesse est « l'id
// cité n'importe où dans PLAN.md », notes en prose comprises. Trois protections contre les
// faux ids :
//   1. on neutralise d'abord les dates ISO (sinon l'année `2026` passe pour un id 4 chiffres) ;
//   2. les bornes `[0-9a-fA-F]` rejettent un run de 4 chiffres NOYÉ dans un token hexadécimal
//      — un SHA comme `a0017b` ne doit pas passer pour la fiche `0017` (revue Codex #185,
//      2ᵉ/3ᵉ passes : borner sur les chiffres seuls laissait passer les SHA à 4 chiffres) ;
//   3. `(?<![A-Za-z]-)` exclut les namespaces NON-fiche comme `ADR-0040` (≠ la fiche 0040).
// Le préfixe legacy `mc-`, lui, EST une fiche.
const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/g;
const ID_TOKEN_RE = /(?<![0-9a-fA-F])(?<![A-Za-z]-)(?:mc-)?(\d{17}|\d{4})(?![0-9a-fA-F])/g;

/** Tous les ids cités par `PLAN.md`, où qu'ils soient (puces, notes en prose, multi-ids). */
export function planIds(planMd: string): Set<string> {
  const ids = new Set<string>();
  const scrubbed = planMd.replace(ISO_DATE_RE, ' ');
  for (const m of scrubbed.matchAll(ID_TOKEN_RE)) ids.add(m[1]);
  return ids;
}

/** Compile l'écart plan ↔ backlog. Tout dérivé de `planMd` + `fiches` → sortie stable. */
export function buildPlanDelta(
  planMd: string,
  fiches: Fiche[],
  n: number = DEFAULT_DELTA_N,
): PlanDelta {
  const inPlan = planIds(planMd);

  // « Dernières créées » = fiches non livrées (actives), triées par id DÉCROISSANT
  // (l'id horodaté = la date de création, fiche 0180). Les idées comptent : une idée
  // récemment ajoutée est un arrivant qu'on veut voir.
  const active = fiches.filter((f) => !f.done && f.status !== 'shipped');
  const recent: DeltaCard[] = active
    .slice()
    .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
    .slice(0, n)
    .map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      priority: f.priority,
      inPlan: inPlan.has(f.id),
      file: f.file,
    }));

  // Compteur hors-plan : seulement les ACTIONNABLES (idées exclues, sinon les ~81 idées
  // noieraient le signal).
  const offPlanCount = active.filter(
    (f) => ACTIONABLE.has(f.status) && !inPlan.has(f.id),
  ).length;

  return { recent, offPlanCount, n };
}

// --- Bord pour l'onglet Plan de `diagrams/avancement/board.html` (marqueurs disjoints) ---

export const PLAN_DELTA_BEGIN = '/*ezk-plan-delta:begin*/';
export const PLAN_DELTA_END = '/*ezk-plan-delta:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans board.html. */
export function buildPlanDeltaBlock(
  planMd: string,
  fiches: Fiche[],
  n: number = DEFAULT_DELTA_N,
): string {
  // `<` échappé (un titre de fiche contenant `</script>` ne peut pas fermer la balise
  // porteuse) ; le RENDU reste protégé séparément par `textContent` côté board.html.
  const json = JSON.stringify(buildPlanDelta(planMd, fiches, n), null, 1).replace(/</g, '\\u003c');
  return `${PLAN_DELTA_BEGIN}\nwindow.EZK_PLAN_DELTA = ${json};\n${PLAN_DELTA_END}`;
}

/** Pose `block` entre les marqueurs `ezk-plan-delta:*` (qui DOIVENT déjà exister). */
export function upsertPlanDeltaBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(PLAN_DELTA_BEGIN);
  const endIdx = text.indexOf(PLAN_DELTA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(
      `marqueurs ${PLAN_DELTA_BEGIN} … ${PLAN_DELTA_END} introuvables dans board.html`,
    );
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + PLAN_DELTA_END.length);
}
