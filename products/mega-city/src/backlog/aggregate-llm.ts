import { TERMINAUX } from '../core/fiche-schema.js';
import type { Fiche } from '../loaders/fiches.js';
import type { AggregateCluster } from './aggregate.js';

/**
 * aggregate-llm — le moteur `llm` de `ezk-backlog aggregate`, en mode « propose »
 * (fiche 20260910231201744, ADR-0051).
 *
 * En clair : le jugement par le sens reste celui de l'AGENT. Le code n'appelle JAMAIS un LLM
 * (ADR-0001 : le LLM propose, le PO tranche, un script applique). Ce module garde le CONTRAT :
 *   1. `renderDossier`      — ce que l'agent doit juger, et le format de sa réponse ;
 *   2. `validateProposals`  — sa réponse (un fichier JSON) est VÉRIFIÉE avant d'être rendue : un id
 *                             inventé est refusé, jamais deviné ; aucun rejet n'est silencieux ;
 *   3. `crossCheck`         — le croisement avec le moteur `script` (confirmé / non retenu / par le sens) ;
 *   4. `applyCommand`       — le geste d'application, NOMMÉ sans être exécuté.
 *
 * PUR (ADR-0003) : zéro I/O. Les fiches et le texte du fichier sont injectés par le bord (bin).
 */

/** Ce que ce module lit d'une fiche : étroit à dessein (ISP), `Fiche` y est assignable. */
export type StockFiche = Pick<Fiche, 'id' | 'title' | 'priority' | 'status' | 'labels' | 'done'>;

export interface LlmMerge {
  kind: 'merge';
  /** La résultante : elle reste active et reçoit `merged_from`. Doit déjà exister. */
  into: string;
  /** Les sources : elles passent `merged` et partent dans `done/`. */
  sources: string[];
  why: string;
}

export interface LlmSplit {
  kind: 'split';
  /** La source : elle passe `split` et part dans `done/`. */
  source: string;
  /** Les enfants : ils restent actifs et reçoivent `split_from`. Doivent déjà exister. */
  into: string[];
  why: string;
}

export type LlmProposal = LlmMerge | LlmSplit;
/** Une proposition acceptée garde son rang dans le fichier : un seul numérotage pour tout le rapport. */
export type NumberedProposal = LlmProposal & { index: number };

export interface LlmRejection {
  /** Rang (à partir de 1) de la proposition dans le fichier. */
  index: number;
  reason: string;
}

export interface LlmValidation {
  accepted: NumberedProposal[];
  rejected: LlmRejection[];
}

/** Le fichier de propositions n'est pas du JSON, ou pas un tableau : erreur franche, pas de repli. */
export class ProposalsFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalsFileError';
  }
}

export function parseProposals(raw: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    throw new ProposalsFileError(`fichier de propositions illisible (JSON invalide) : ${why}`);
  }
  if (!Array.isArray(data)) {
    throw new ProposalsFileError(
      'fichier de propositions illisible : un tableau JSON est attendu ([ {…}, {…} ])',
    );
  }
  return data;
}

/** Active = encore dans le stock : ni livrée, ni rangée dans `done/`, ni close sans livraison. */
const isActive = (f: StockFiche): boolean =>
  !f.done && f.status !== 'shipped' && !TERMINAUX.includes(f.status);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string' && x !== '');

/** Ids que la proposition DÉPLACE vers `done/` (source d'une fusion, source d'un découpage). */
const movedIds = (p: LlmProposal): string[] => (p.kind === 'merge' ? p.sources : [p.source]);
const allIds = (p: LlmProposal): string[] =>
  p.kind === 'merge' ? [p.into, ...p.sources] : [p.source, ...p.into];

/** Forme et cohérence INTERNE d'une proposition. Rend la proposition normalisée, ou la raison du rejet. */
function readProposal(item: unknown): LlmProposal | string {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return 'proposition illisible : un objet est attendu';
  }
  const o = item as Record<string, unknown>;
  if (o.kind !== 'merge' && o.kind !== 'split') {
    return `kind « ${String(o.kind)} » inconnu (attendu : merge ou split)`;
  }
  if (typeof o.why !== 'string' || o.why.trim() === '') {
    return "why vide : une proposition sans raison n'est pas jugeable";
  }
  const why = o.why.trim();
  const notStrings = 'les ids doivent être des chaînes non vides (un nombre perd ses chiffres)';

  if (o.kind === 'merge') {
    if (typeof o.into !== 'string' || o.into === '' || !isStringArray(o.sources)) return notStrings;
    if (o.sources.length === 0) return 'fusion sans source : il faut au moins une fiche à fusionner';
    if (new Set(o.sources).size !== o.sources.length) return 'une source est donnée deux fois';
    if (o.sources.includes(o.into)) return 'la résultante ne peut pas être aussi une source';
    return { kind: 'merge', into: o.into, sources: o.sources, why };
  }
  if (typeof o.source !== 'string' || o.source === '' || !isStringArray(o.into)) return notStrings;
  if (o.into.length < 2) return 'un découpage demande au moins 2 enfants';
  if (new Set(o.into).size !== o.into.length) return 'un enfant est donné deux fois';
  if (o.into.includes(o.source)) return 'un enfant ne peut pas être la source elle-même';
  return { kind: 'split', source: o.source, into: o.into, why };
}

/**
 * Valide chaque proposition contre le stock. Une proposition est rejetée si sa forme est mauvaise, si
 * un id est inventé (absent du stock) ou n'est plus actif, ou si elle touche une fiche qu'une
 * proposition PLUS HAUT dans le fichier a déjà engagée (la première gagne) : une fiche déplacée ne sert
 * qu'une fois, et une résultante déjà fusionnée ailleurs ne peut plus être déplacée.
 */
export function validateProposals(stock: readonly StockFiche[], items: readonly unknown[]): LlmValidation {
  const byId = new Map(stock.map((f) => [f.id, f] as const));
  const accepted: NumberedProposal[] = [];
  const rejected: LlmRejection[] = [];
  const movedBy = new Map<string, number>(); // id déplacé → rang de la proposition acceptée
  const usedBy = new Map<string, number>(); // id engagé à un titre quelconque → rang

  items.forEach((item, i) => {
    const index = i + 1;
    const read = readProposal(item);
    if (typeof read === 'string') {
      rejected.push({ index, reason: read });
      return;
    }
    const idProblems: string[] = [];
    for (const id of new Set(allIds(read))) {
      const fiche = byId.get(id);
      if (!fiche) idProblems.push(`id ${id} inconnu du stock (inventé ?)`);
      else if (!isActive(fiche)) idProblems.push(`id ${id} déjà livrée ou close`);
    }
    if (idProblems.length > 0) {
      rejected.push({ index, reason: idProblems.join(' ; ') });
      return;
    }
    const clash =
      movedIds(read).find((id) => usedBy.has(id)) ?? allIds(read).find((id) => movedBy.has(id));
    if (clash !== undefined) {
      const by = movedBy.get(clash) ?? usedBy.get(clash);
      rejected.push({ index, reason: `fiche ${clash} déjà engagée par la proposition n°${by}` });
      return;
    }
    for (const id of movedIds(read)) movedBy.set(id, index);
    for (const id of allIds(read)) if (!usedBy.has(id)) usedBy.set(id, index);
    accepted.push({ ...read, index });
  });
  return { accepted, rejected };
}

// ─── Croisement avec le moteur script ────────────────────────────────────────────────────────

export interface CrossCheck {
  /** Clusters du script que le llm a retenus, avec le rang des propositions qui les couvrent. */
  confirmed: Array<{ cluster: AggregateCluster; proposals: number[] }>;
  /** Clusters du script que le llm n'a PAS retenus : des faux positifs possibles. */
  notRetained: AggregateCluster[];
  /** Propositions qu'aucun cluster ne couvre : trouvées par le sens seulement (ce que les tags ratent). */
  senseOnly: number[];
}

/**
 * Une fusion est couverte par un cluster qui contient au moins 2 de ses fiches. Un découpage n'est
 * jamais couvert : le script ne propose que des recoupements, jamais des découpages.
 */
export function crossCheck(
  clusters: readonly AggregateCluster[],
  accepted: readonly NumberedProposal[],
): CrossCheck {
  const supports = (c: AggregateCluster, p: NumberedProposal): boolean =>
    p.kind === 'merge' && allIds(p).filter((id) => c.ficheIds.includes(id)).length >= 2;
  const confirmed: CrossCheck['confirmed'] = [];
  const notRetained: AggregateCluster[] = [];
  for (const cluster of clusters) {
    const proposals = accepted.filter((p) => supports(cluster, p)).map((p) => p.index);
    if (proposals.length > 0) confirmed.push({ cluster, proposals });
    else notRetained.push(cluster);
  }
  const senseOnly = accepted
    .filter((p) => !clusters.some((c) => supports(c, p)))
    .map((p) => p.index);
  return { confirmed, notRetained, senseOnly };
}

// ─── Le geste et le dossier ──────────────────────────────────────────────────────────────────

/** Le geste d'application, prêt à copier. Jamais exécuté par `aggregate`. */
export function applyCommand(p: LlmProposal): string {
  const base = 'pnpm --dir products/mega-city backlog:apply';
  return p.kind === 'merge'
    ? `${base} merge --into ${p.into} ${p.sources.join(' ')}`
    : `${base} split ${p.source} --into ${p.into.join(',')}`;
}

const TITLE_MAX = 100;

/** Le dossier à juger : les fiches actives du scope, et le format exact de la réponse attendue. */
export function renderDossier(stock: readonly StockFiche[], scope: string): string[] {
  const active = stock.filter(isActive);
  const rows = active.map((f) => {
    const title = f.title.length > TITLE_MAX ? `${f.title.slice(0, TITLE_MAX - 1)}…` : f.title;
    const labels = f.labels.length > 0 ? `  [${f.labels.join(', ')}]` : '';
    return `  ${f.id}  ${f.priority || '--'}  ${title}${labels}`;
  });
  return [
    `En clair : voici ${active.length} fiche(s) active(s) du stock « ${scope} », à juger par le sens. Propose des fusions et des découpages ; le script vérifie, le PO tranche.`,
    '',
    'Dossier :',
    ...rows,
    '',
    'Réponse attendue : un fichier JSON, un tableau de propositions.',
    '  [',
    '    { "kind": "merge", "into": "<id résultante>", "sources": ["<id>", "<id>"], "why": "<raison en une phrase>" },',
    '    { "kind": "split", "source": "<id>", "into": ["<id enfant>", "<id enfant>"], "why": "<raison en une phrase>" }',
    '  ]',
    "Règles : les ids sont des chaînes (jamais des nombres), pris dans la liste ci-dessus. La résultante d'une fusion et les enfants d'un découpage doivent déjà exister (`add` d'abord). Une fiche déplacée ne sert qu'une fois.",
    'Ensuite : pnpm --dir products/mega-city backlog:aggregate --mode llm --proposals <fichier>',
  ];
}
