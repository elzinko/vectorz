/**
 * fiche-file-name — ce qu'est un nom de fichier de fiche, pour `backlog check` et `backlog ship`
 * (fiche 20261027194016734).
 *
 * En clair : des chiffres (l'id : 3 chiffres chez un hôte migré comme livestreamz, 4 pour l'historique,
 * 17 pour l'horodaté), puis `-` ou `_`, puis le slug, et `.md`. `check` et `ship` lisent la même règle :
 * une fiche que l'un accepte, l'autre l'accepte aussi. Le loader des vues garde sa règle propre, plus
 * stricte (4 chiffres et plus) : l'élargir changerait les vues de tous les projets.
 */
export const FICHE_FILE_NAME = /^\d+[-_].+\.md$/;

export function isFicheFileName(name: string): boolean {
  return FICHE_FILE_NAME.test(name);
}
