import { type ReviewCard, parseReviewPack } from './reviewPack.js';

/**
 * Charge les packs `REVIEW.md` du dépôt (fiche 0184, lot 1) — LECTURE SEULE, à la
 * construction (glob Vite `?raw`), sans appel réseau ni écriture. Le glob vise
 * `features/reviews/<id>/REVIEW.md` à la racine du monorepo (5 niveaux au-dessus de
 * `src/`). Aucune nouvelle collecte : on ne lit que des artefacts déjà committés.
 */
const modules = import.meta.glob('../../../../../features/reviews/**/REVIEW.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const reviewPacks: ReviewCard[] = Object.entries(modules)
  .map(([path, md]) => parseReviewPack(md, path))
  .sort((a, b) => a.fiche.localeCompare(b.fiche));
