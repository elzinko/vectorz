> 🗎 Rendu de la fiche [features/20261126170000114_ezk-recipes-add-ajoute-une-recette-au-projet.md](../20261126170000114_ezk-recipes-add-ajoute-une-recette-au-projet.md)

# 20261126170000114 — Une commande de la méthode ajoute une recette du catalogue au projet

**En clair.** La maquette de mission control montre un bouton « + Ajouter » sur chaque recette prête du
catalogue. Aucune commande de la méthode ne sait aujourd'hui ajouter une recette à un projet : `ezk recipes`
ne fait que lire. On ajoute ce geste. Après lui, `ezk recipes --json` marque la recette comme ajoutée.

**Si tu arrives frais.** Une recette est une façon de faire réutilisable, décrite dans un fichier Markdown.
La méthode en publie un catalogue (`recipes/*.md`). Un projet « a » une recette quand la méthode la voit chez lui.
Demande du PO du 2026-11-26, relayée par la session pilote : installer une recette depuis la page Recettes,
comme on installe un plugin Claude Code.

## Contexte / Problème

Aujourd'hui, une recette compte comme ajoutée (`ici: true`) dans deux cas, lus dans
`products/mega-city/src/core/recipe-discovery.ts` (fonction du contrat, lignes 120-135) :

- le projet porte un dossier avec un `RECIPE.md` : elle apparaît dans `projet[]`, toujours `ici: true` ;
- l'implémentation de référence d'une recette du catalogue (`source`) se trouve dans le dossier du projet.

Le bord `bin/ezk-recipes.ts` lit ces fichiers. Rien n'écrit un `RECIPE.md` dans un projet.

## Proposition

1. Un verbe `ezk recipes add <id> [--root <projet>]` écrit dans le projet la déclaration de la recette du
   catalogue : un dossier portant un `RECIPE.md` conforme au contrat des recettes (fiche 002), qui renvoie à
   la recette de la méthode. C'est le même endroit que celui que la découverte lit déjà.
2. Le verbe refuse une recette inconnue, une recette en brouillon, et une recette déjà ajoutée (message clair,
   code non nul), sans rien écrire.
3. Il ne committe rien : il écrit le fichier et le dit. Le commit reste au geste habituel.
4. Le verbe est déclaré dans `ezk-manifest.yml` et apparaît dans `ezk help`.

## Critères d'acceptation

- [x] Après `ezk recipes add <id>` sur un projet, `ezk recipes --json` publie cette recette comme ajoutée (`ici: true`).
- [x] Une recette inconnue, en brouillon ou déjà ajoutée est refusée sans écrire, avec un message et un code non nul.
- [x] Le fichier écrit passe le contrôle des recettes (`regen-recipes.sh` / contrat strict de la fiche 002).
- [x] Le verbe figure dans `ezk help` et dans le manifeste.
- [x] Un test de script rejoue l'ajout sur un projet de test, puis la lecture.

## Comment vérifier

```bash
ezk recipes add <id> --root <projet-de-test>
ezk recipes --json --root <projet-de-test>
```

## Hors périmètre

- Le bouton « + Ajouter » de mission control : fiche « Le bouton « + Ajouter » de la page Recettes montre la commande d'ajout ».
- Copier le code de l'implémentation de référence dans le projet : la déclaration suffit à la découverte.
- Retirer une recette d'un projet.
- 2026-11-28 — Revue adverse (ezk-reviewer) : GO. La recette s'écrit dans `.vectorz/recipes/<nom>/RECIPE.md` du projet. Un verbe mal tapé (« recipes ad ») est refusé, code 2, au lieu de lister en silence. Remarque laissée : la commande écrit dans le dossier courant sans vérifier que c'est un projet ; le chemin écrit est annoncé.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ mega-city 2576 tests · 50 suites bash · tsc |
| Revue adverse | ✅ GO (ezk-reviewer) |
| Before / after (UI) | N.A. — une commande, aucun écran modifié |
