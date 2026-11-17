# Le contrat de `ezk graph check --json`

## En clair

`ezk graph check --json` sort le graphe de la méthode : ses briques, les liens entre elles, les liens
cassés et les briques que rien ne cite. Les commandes `ezk` et les recettes sont des briques comme les autres. La carte
de la méthode de mission control lit cette sortie telle quelle, sans deviner une brique depuis ses liens.

**Si tu arrives frais.** Une brique est une règle, un agent, une compétence (skill), un paquet (bundle),
un profil, un outil (un script), une commande `ezk` ou une recette (`recipes/<nom>.md`). Un lien se lit « source verbe cible » : une
commande *lance* un outil, une compétence *utilise* une commande. Le jeu de verbes est fermé : l'
[ADR-0089](../../docs/adr/0089-les-commandes-ezk-entrent-dans-le-graphe.md) en fixe six ; l'[ADR-0090](../../docs/adr/0090-les-recettes-entrent-dans-le-graphe.md) ajoute la sorte `recipe` sans verbe neuf (une recette *compose* une recette ou une règle).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie sur un tout petit graphe écrit à la main. Il ne change pas quand la
  méthode gagne une brique.

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

Le test `src/__tests__/graph-check-contract.test.ts` valide la sortie réelle contre le schéma, et
échoue si l'exemple n'est plus à jour.

## Les champs

- `schema_version` : `1`. Il monte quand un champ disparaît, change de nom ou de sens. Un champ ajouté le
  laisse tel quel.
- `nodes[]` : `kind`, `id`, et `fichier` (relatif à `products/mega-city`) quand la brique a un fichier.
  Le nombre de briques par sorte égale `nodeCount`. Une commande a pour `fichier` le manifeste
  `ezk-manifest.yml`. Une recette a pour `fichier` `recipes/<nom>.md`, relatif à la racine du dépôt.
- `nodeCount`, `edgeCount`, `edges`, `broken`, `orphans`, `pathRefs` : comme avant.

Les orphelins sont une information. Une commande qu'aucune compétence ne cite s'y trouve sans faire
échouer la commande : on la tape à la main. Une recette sans aucun lien y figure aussi.
