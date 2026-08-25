/**
 * plan-view-data — la vue « Plan » compilée depuis `features/PLAN.md` + les fiches. PUR
 * (ADR-0003). Fiche 20260825213807501 : montrer l'ORDRE DÉCIDÉ du travail (les sections de
 * PLAN.md) et la PROCHAINE FICHE TIRABLE, sans inventer d'objet « sprint ».
 *
 * C'est le pendant « séquence » du board « stock » (avancement-data.ts) : même patron, même
 * bord de marqueurs gérés. On COMPOSE trois briques existantes/sœurs — `parsePlanSections`
 * (couloirs + tous les ids), `parsePlanOrder` (ordre plat) et `crossBacklogHead` (tête
 * tirable) — plus la jointure aux fiches. Zéro objet nouveau, zéro saisie à la main.
 */
import { type PlanCard, crossBacklogHead } from '../backlog/plan-head.js';
import { parsePlanOrder } from '../backlog/plan-order.js';
import { type PlanMarker, parsePlanSections } from '../backlog/plan-sections.js';
import type { Fiche } from '../loaders/fiches.js';

/** Une carte du plan = un id du plan résolu (ou non) contre le backlog. */
export interface PlanCardView {
  id: string;
  title: string;
  status: string;
  priority: string;
  ready: boolean;
  epic: string;
  product: string;
  type: string;
  pr: string;
  file: string;
  /** L'id existe-t-il dans `features/` ? `false` ⇒ signalé (jamais avalé). */
  found: boolean;
}

/** Une ligne du plan : son intention + une carte par id cité. */
export interface PlanRow {
  text: string;
  marker: PlanMarker | null;
  struck: boolean;
  cards: PlanCardView[];
}

/** Un couloir = une section de PLAN.md portant au moins une entrée. */
export interface PlanLane {
  label: string;
  level: number;
  rows: PlanRow[];
}

export interface PlanViewData {
  /** Couloirs (sections non vides), dans l'ordre du document. */
  lanes: PlanLane[];
  /** 1re fiche `todo` + `ready` dans l'ordre du plan — ce que le prochain sprint tire. */
  head: PlanCardView | null;
  /** Fiches `todo` sans `ready:` qui PRÉCÈDENT la tête — à groomer (jamais sautées en silence). */
  blockedAhead: PlanCardView[];
  /** Ids cités par le plan mais ABSENTS de `features/` — signalés. */
  unresolved: string[];
  /** Compteurs pour un encart honnête (combien d'entrées, résolues, livrées, introuvables). */
  counts: { entries: number; cards: number; resolved: number; shipped: number; unresolved: number };
}

/** Jointure d'un id du plan à sa fiche (ou carte « introuvable » si absente). */
const toCardView = (id: string, index: Map<string, Fiche>): PlanCardView => {
  const f = index.get(id);
  if (!f) {
    return {
      id,
      title: '',
      status: '',
      priority: '',
      ready: false,
      epic: '',
      product: '',
      type: '',
      pr: '',
      file: '',
      found: false,
    };
  }
  return {
    id,
    title: f.title,
    status: f.status,
    priority: f.priority,
    ready: f.ready,
    epic: f.epic,
    product: f.product,
    type: f.type,
    pr: f.pr,
    file: f.file,
    found: true,
  };
};

/** Compile la vue Plan. Tout est dérivé de `planMd` + `fiches` → sortie stable. */
export function buildPlanViewData(planMd: string, fiches: Fiche[]): PlanViewData {
  const index = new Map<string, Fiche>(fiches.map((f) => [f.id, f]));

  // Couloirs : sections avec entrées ; une carte par id de chaque ligne (rien perdu).
  const lanes: PlanLane[] = parsePlanSections(planMd)
    .map((s) => ({
      label: s.label,
      level: s.level,
      rows: s.entries.map((e) => ({
        text: e.text,
        marker: e.marker,
        struck: e.struck,
        cards: e.ids.map((id) => toCardView(id, index)),
      })),
    }))
    .filter((lane) => lane.rows.length > 0);

  // Tête tirable + têtes bloquées : on RÉUTILISE crossBacklogHead sur l'ordre plat (0089).
  const planIndex = new Map<string, PlanCard>(
    fiches.map((f) => [f.id, { id: f.id, product: f.product, type: f.type, status: f.status, ready: f.ready }]),
  );
  const cross = crossBacklogHead(parsePlanOrder(planMd), planIndex);
  const head = cross.head ? toCardView(cross.head.id, index) : null;
  const blockedAhead = cross.blockedAhead.map((c) => toCardView(c.id, index));

  // Introuvables : issus du `found:false` de la jointure (couvre aussi les ids des paquets
  // multi-ids, pas seulement l'ordre plat de crossBacklogHead).
  const allCards = lanes.flatMap((l) => l.rows.flatMap((r) => r.cards));
  const unresolved = [...new Set(allCards.filter((c) => !c.found).map((c) => c.id))].sort();

  return {
    lanes,
    head,
    blockedAhead,
    unresolved,
    counts: {
      entries: lanes.reduce((n, l) => n + l.rows.length, 0),
      cards: allCards.length,
      resolved: allCards.filter((c) => c.found).length,
      shipped: allCards.filter((c) => c.found && c.status === 'shipped').length,
      unresolved: unresolved.length,
    },
  };
}

// --- Bord pour la vue `diagrams/avancement/board.html` (même patron que avancement-data.ts) ---

export const PLAN_DATA_BEGIN = '/*ezk-plan-data:begin*/';
export const PLAN_DATA_END = '/*ezk-plan-data:end*/';

/** Le bloc géré complet (marqueurs + affectation JS), prêt à poser dans board.html. */
export function buildPlanViewDataBlock(planMd: string, fiches: Fiche[]): string {
  // `<` échappé en < : un titre/texte de plan contenant `</script>` ne peut pas
  // fermer la balise <script> porteuse. Le RENDU est protégé séparément (board.html pose
  // les données via textContent, jamais innerHTML). Deux protections distinctes.
  const json = JSON.stringify(buildPlanViewData(planMd, fiches), null, 1).replace(/</g, '\\u003c');
  return `${PLAN_DATA_BEGIN}\nwindow.EZK_PLAN = ${json};\n${PLAN_DATA_END}`;
}

/**
 * Pose `block` dans `text` entre les marqueurs `ezk-plan-data:*` (disjoints de ceux
 * d'avancement). Les marqueurs DOIVENT déjà exister (posés une fois par l'auteur de la
 * carte) — absents ⇒ erreur franche (même règle que `upsertAvancementDataBlock`).
 */
export function upsertPlanViewDataBlock(text: string, block: string): string {
  const beginIdx = text.indexOf(PLAN_DATA_BEGIN);
  const endIdx = text.indexOf(PLAN_DATA_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error(
      `marqueurs ${PLAN_DATA_BEGIN} … ${PLAN_DATA_END} introuvables dans board.html`,
    );
  }
  return text.slice(0, beginIdx) + block + text.slice(endIdx + PLAN_DATA_END.length);
}
