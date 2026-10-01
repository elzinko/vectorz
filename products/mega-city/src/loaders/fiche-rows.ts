/**
 * fiche-rows — les onze champs de front-matter que les vues bash (`portfolio.sh`) lisaient par
 * `awk`, produits par les primitives du loader (`frontMatter` + `readField`). Règle
 * `development/fiche-read-via-loader` : UNE lecture testée du front-matter, plusieurs
 * consommateurs — le bash appelle ce module au lieu de re-parser.
 *
 * Valeurs BRUTES (pas de défauts `feature` / `idea` / `—` comme `loadFiches`) : un champ absent
 * reste vide, car les vues bash décident d'afficher une colonne (Version, Produit…) sur « au moins
 * une valeur non vide ».
 */
import { frontMatter, readField } from './fiches.js';

/** Séparateur de champs (US, \x1f) — ne se trouve dans aucun titre. */
export const FIELD_SEP = '\x1f';

/** Ordre fixe, celui des anciens `extract()` awk. */
export const ROW_FIELDS = [
  'id',
  'title',
  'type',
  'priority',
  'status',
  'pr',
  'created',
  'version',
  'epic',
  'product',
  'milestone',
] as const;

/** Les onze valeurs d'une fiche, dans l'ordre de `ROW_FIELDS`. `defaultProduct` remplace un `product:` vide. */
export function ficheRowFields(text: string, defaultProduct = ''): string[] {
  const fm = frontMatter(text);
  return ROW_FIELDS.map((field) => {
    const value = readField(fm, field);
    return field === 'product' && value === '' ? defaultProduct : value;
  });
}

/** Une ligne prête pour `read -r` côté bash : champs séparés par `FIELD_SEP`, sur UNE ligne. */
export function formatRow(text: string, defaultProduct = ''): string {
  return ficheRowFields(text, defaultProduct)
    .map((value) => value.replace(/[\r\n\x1f]+/g, ' '))
    .join(FIELD_SEP);
}
