# ADR 0090 — Les recettes entrent dans le graphe : un 8ᵉ type de nœud, aucun verbe neuf

**Statut :** Accepté
**Date :** 2026-11-17
**Deciders :** PO, par délégation pour le run autonome du 2026-11-17
**Fiche :** [`20261117140305053`](../../../../features/20261117140305053_recettes-dans-le-graphe-et-sur-la-carte.md)
**Amende :** [ADR-0089](0089-les-commandes-ezk-entrent-dans-le-graphe.md) — les sortes passent à huit ; les verbes restent à six.

## En clair

La carte de la méthode ne montrait pas les recettes (les modes d'emploi de `recipes/`). On les ajoute
comme briques, avec un 8ᵉ type de nœud, `recipe`. Ce que dit leur champ `composes:` devient des liens
`compose`, vers une autre recette ou une règle. Aucun verbe neuf. Une recette sans aucun lien figure
dans les orphelins, sans faire échouer la commande.

## Décision

**1. Une recette, c'est quoi.** Un fichier `recipes/<nom>.md` à la racine du dépôt. Son id est le nom du
fichier sans `.md` (c'est ce que les `composes:` écrivent), son fichier est `recipes/<nom>.md`.
`RECIPES.md` (le livre) et `RECIPE_TEMPLATE.md` n'en sont pas, ni les dossiers de `recipes/` : même
filtre que `ezk recipes`.

**2. Les liens.** Deux nouveaux types de lien, un seul verbe, `compose` (déjà là) :

- `recipe-composes` : recette → recette ;
- `recipe-rule` : recette → règle.

Un id de `composes:` qui est une recette part en `recipe-composes`, un id de règle en `recipe-rule`. Un id
inconnu des deux reste un `recipe-composes` : il est **cassé** et fait échouer la commande, exactement
comme un `composes` de skill. Aucun lien cassé de plus qu'avant, puisque les recettes en portaient zéro,
et que toutes leurs cibles existent aujourd'hui.

**3. Orphelin.** Une recette est orpheline quand elle n'a aucun lien : rien ne la compose et elle ne
compose rien. Information, jamais une erreur.

**4. Le contrat.** `ezk graph check --json` garde `schema_version: 1` : ajouter une sorte est additif
(`nodes[].kind`, `nodeCount.recipe`). Schéma et exemple sont régénérés (`pnpm board:contract --write`).
Pour une recette, `fichier` est relatif à la racine du dépôt (`recipes/<nom>.md`), les recettes vivant hors
de `products/mega-city`.

**5. Où ça vit.** `core/recipe-graph.ts` (pur) lit le `composes:` ; `loaders/recipes.ts` lit le dossier.
Le catalogue porte un champ **optionnel** `recipes`, rempli par le seul `graphCheckData` : les autres
lecteurs du catalogue ne changent pas.

## Conséquences

- La carte (mission control) affiche une 8ᵉ famille, « Recettes ».
- Réversible : retirer `recipe`, `recipe-composes` et `recipe-rule` remet le graphe à sept sortes ; le test
  `graph-vocabulary` dit quoi retirer.

## Alternative écartée

- **Un verbe `capitalise` ou `repose-sur` pour recette → règle.** `compose` dit déjà « est fait de ».
