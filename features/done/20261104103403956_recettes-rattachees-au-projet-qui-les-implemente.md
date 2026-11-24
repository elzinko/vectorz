---
id: "20261104103403956"
title: Mission control montre, pour chaque projet, les recettes du catalogue qu'il implémente
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [recettes, theme:mission-control]
status: shipped
pr: "local (2d450eb2)"
evidence: before-after
created: 2026-11-04
---

# 20261104103403956 — Les recettes du catalogue rattachées au projet qui les implémente

**En clair.** La vue Recettes montre « Dans ce projet : 0 » pour vectorz, samplerz et muti. Pourtant
le catalogue dit où chaque recette est implémentée : son champ `source` pointe vers muti (6 recettes),
samplerz (1) ou vectorz (3). La méthode publiera, pour le projet demandé, les recettes du catalogue dont
l'implémentation de référence vit dans ce projet ; la vue les affichera sous « Dans ce projet ».

## Contexte / Problème

Constaté le 2026-11-04 après la livraison de la vue Recettes : aucun projet ne déclare de `RECIPE.md`,
donc la partie projet est vide partout. Le PO demande « les recettes et leurs implémentations indiquées
pour chaque projet ». L'information existe dans le catalogue (`source`), mais personne ne la rattache
au projet. ADR-086 : c'est à la méthode de faire ce rattachement, pas à la page.

## Proposition

- `ezk recipes --json --root <projet>` publie, pour chaque recette du catalogue, un booléen `ici` :
  vrai quand sa `source` (`~/…`, absolue, ou relative à la méthode) se trouve dans le projet visé.
  Une recette déclarée par le projet porte `ici: true`.
- La vue Recettes liste sous « Dans ce projet » les recettes déclarées et celles du catalogue
  implémentées ici, avec le chemin de leur implémentation.

Deux surfaces : la commande et l'écran (le daemon passe le champ tel quel).

## Critères d'acceptation

- [x] `ezk recipes --json --root <muti>` marque `ici: true` les recettes du catalogue dont la source est dans muti, et elles seules.
- [x] Une source relative se lit depuis la racine de la méthode ; une source `~/…` depuis le dossier personnel.
- [x] La vue Recettes de muti liste ces recettes sous « Dans ce projet », avec le chemin de leur implémentation.
- [x] Une méthode plus ancienne, sans le champ, garde l'affichage d'avant.
- [x] Les tests de la méthode, du daemon et de la vue couvrent ces cas.

## Comment vérifier

```bash
ezk recipes --json --root ~/git/bacasable/muti | jq '[.catalogue[] | select(.ici)] | length'   # 6
pnpm --dir products/mega-city vitest run src/core/__tests__/recipe-discovery.test.ts
```

Puis ouvrir mission control, vue Recettes, projet muti.

Avant / après, vue Recettes de muti (2026-11-04) :

- avant : « Dans ce projet 0 » — ![avant](../../docs/pr-evidence/20261104103403956/recettes-muti-avant.jpg)
- après : « Dans ce projet 6 », chaque recette avec son implémentation dans `~/git/bacasable/muti`, et la marque « utilisée ici » au catalogue — ![après](../../docs/pr-evidence/20261104103403956/recettes-muti-apres.jpg)

## Notes / décisions

- Suite de [Mission control montre les recettes de chaque projet](20261104090518109_mission-control-montre-les-recettes.md), demandée par le PO le 2026-11-04 (« leurs implémentations indiquées pour chaque projet »).
