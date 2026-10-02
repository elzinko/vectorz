/**
 * Le **lot** d'un sprint (le « sprint backlog ») : N fiches prêtes, choisies dans l'ordre du plan
 * (fiche 20260930194219046, ADR-0054 décisions 7 et 8). `plan:head` tire UNE fiche ; ce module en
 * tire N, avec les mêmes règles : prêtes seulement, tête bloquée signalée, aucun saut silencieux.
 *
 * Logique pure, sans I/O : la coquille `bin/plan-lot.ts` lit le PLAN et les fiches (par le loader),
 * puis imprime la sortie de `formatLot`. Le lot n'est figé nulle part ici : `sprint.sh start --lot`
 * l'écrit dans `SPRINT.md` (fiche 20260930123438875). L'incrément du sprint = les fiches du lot
 * passées `shipped` ; aucun objet « sprint » n'est créé.
 */
import type { PlanCard } from './plan-head.js';

export interface LotCard extends PlanCard {
  title: string;
  /** `P0 | P1 | P2 | P3`, ou `''` pour une fiche sans priorité. */
  priority: string;
  /** Raison du drapeau `blocked:` (fiche 652), `''` si absent. */
  blocked: string;
  /** La fiche vit dans `features/done/`. */
  done: boolean;
  /** Chemin du fichier de la fiche, relatif au dossier d'où l'on lance la commande : l'id devient un lien. */
  path?: string;
}

/** Une fiche prête que le lot a passée, avec la raison. Elle est montrée, jamais tue. */
export interface LotSkip {
  card: LotCard;
  reason: string;
}

export interface Lot {
  /** Taille demandée (N). */
  requested: number;
  /** Les fiches retenues, dans l'ordre (au plus N). */
  stories: LotCard[];
  /** Fiches `idea` rencontrées avant que le lot soit plein : à groomer, sinon le lot les saute. */
  blockedAhead: LotCard[];
  /** Fiches prêtes passées avant que le lot soit plein (drapeau `blocked:`, épic). */
  skipped: LotSkip[];
  /** Avec un PLAN : fiches prêtes absentes du plan. Signalées ; la séquence, c'est le PLAN. */
  outsidePlan: LotCard[];
  /** Ids du plan absents de `features/`. */
  unresolved: string[];
}

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const rank = (priority: string): number => PRIORITY_RANK[priority] ?? 4;

/** Ordre de repli sans PLAN : P0→P3 (une fiche sans priorité en dernier), puis id. */
export function byPriorityThenId(a: LotCard, b: LotCard): number {
  return rank(a.priority) - rank(b.priority) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** Une fiche entre dans un lot : prête, active, pas un épic, sans drapeau `blocked:`. */
function eligible(card: LotCard): boolean {
  return card.status === 'ready' && !card.done && card.type !== 'epic' && card.blocked === '';
}

/**
 * @param planIds ids dans l'ordre du PLAN (`parsePlanOrder`), ou `null` s'il n'y a pas de PLAN.md.
 * @param cards   toutes les fiches, actives et `done/`.
 * @param size    N, un entier ≥ 1.
 */
export function selectLot(planIds: string[] | null, cards: LotCard[], size: number): Lot {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`taille de lot invalide : ${size} (un entier ≥ 1 est attendu)`);
  }
  const index = new Map(cards.map((c) => [c.id, c]));
  const unresolved: string[] = [];
  let order: LotCard[];
  if (planIds) {
    // Tout le plan est résolu d'abord : un id introuvable est signalé même après un lot plein.
    order = [];
    for (const id of planIds) {
      const found = index.get(id);
      if (found) order.push(found);
      else unresolved.push(id);
    }
  } else {
    order = cards.filter((c) => !c.done).sort(byPriorityThenId);
  }

  const stories: LotCard[] = [];
  const blockedAhead: LotCard[] = [];
  const skipped: LotSkip[] = [];
  for (const c of order) {
    if (stories.length >= size) break;
    if (c.done) continue;
    if (eligible(c)) {
      stories.push(c);
    } else if (c.status === 'ready') {
      skipped.push({ card: c, reason: c.type === 'epic' ? 'épic : jamais tirable' : `drapeau blocked: ${c.blocked}` });
    } else if (c.status === 'idea' && c.type !== 'epic') {
      blockedAhead.push(c);
    }
    // in-progress | shipped | terminaux : ni candidates, ni tête bloquée (règle 0089, comme plan:head).
  }

  const planned = new Set(planIds ?? []);
  const outsidePlan = planIds ? cards.filter((c) => eligible(c) && !planned.has(c.id)).sort(byPriorityThenId) : [];
  return { requested: size, stories, blockedAhead, skipped, outsidePlan, unresolved };
}

export interface FormatOptions {
  /** L'ordre vient d'un PLAN.md (sinon : repli P0→P3 puis id). */
  planned: boolean;
  /** Chemin de `sprint.sh` tel qu'on le tape depuis la racine du projet. */
  sprintScript: string;
}

/** Une fiche se lit en lien cliquable vers son fichier (règle human-facing-lisibility) ; id brut sinon. */
const line = (c: LotCard): string =>
  `${c.path ? `[${c.id}](${c.path})` : c.id} (${c.product} · ${c.priority || 'sans prio'}) — ${c.title}`;

/** Met un argument entre apostrophes pour bash dès qu'il contient un espace ou un caractère du shell. */
export function shellQuote(arg: string): string {
  return /^[A-Za-z0-9_/.,:@%+=-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "'\\''")}'`;
}

/** La sortie de `plan:lot`, ligne à ligne. Chaque signal a sa ligne : rien n'est masqué. */
export function formatLot(lot: Lot, opts: FormatOptions): string[] {
  const source = opts.planned ? 'ordre du PLAN' : 'ordre P0→P3 puis id (pas de PLAN.md)';
  const asked = `${lot.requested} demandée(s)`;
  const out: string[] = [];
  if (lot.stories.length === 0) {
    out.push(`lot : aucune fiche prête (status: ready) sur ${asked} — ${source}`);
  } else {
    out.push(`lot : ${lot.stories.length} fiche(s) prête(s) sur ${asked} — ${source}`);
    lot.stories.forEach((c, i) => out.push(`  ${i + 1}. ${line(c)}`));
    if (lot.stories.length < lot.requested) {
      out.push(`⚠ lot incomplet : ${lot.stories.length} sur ${lot.requested} — groome la tête bloquée, ou ajoute des fiches au plan.`);
    }
  }
  if (lot.blockedAhead.length > 0) {
    out.push('tête bloquée (idea : à groomer pour entrer dans le lot) :');
    for (const c of lot.blockedAhead) out.push(`  · ${line(c)}`);
  }
  if (lot.skipped.length > 0) {
    out.push('écartées (prêtes, mais non tirables) :');
    for (const s of lot.skipped) out.push(`  · ${line(s.card)} — ${s.reason}`);
  }
  if (lot.outsidePlan.length > 0) {
    out.push('hors plan (prêtes, non retenues : la séquence vient du PLAN) :');
    for (const c of lot.outsidePlan) out.push(`  · ${line(c)}`);
  }
  if (lot.unresolved.length > 0) {
    out.push(`introuvables (dans le plan, absentes de features/) : ${lot.unresolved.join(', ')}`);
  }
  if (lot.stories.length === 0) {
    out.push('rien à ouvrir : groome d’abord la tête (/ezk-backlog groom <id>).');
  } else {
    out.push('ouvrir le sprint (depuis la racine du projet) :');
    out.push(`  bash ${shellQuote(opts.sprintScript)} start --lot ${lot.stories.map((c) => c.id).join(',')}`);
  }
  return out;
}
