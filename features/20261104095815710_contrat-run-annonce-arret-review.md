---
id: "20261104095815710"
title: Le contrat du run annonce l'arrêt de `--review`, et dit que la revue du code tourne toujours
type: bug
priority: P1
product: mega-city
milestone: qualite
version:
labels: [theme:autonomie]
status: ready
pr:
evidence: none # sortie de commande, pas d'écran
created: 2026-11-04
split_from: "20261104085959892"
---

# 20261104095815710 — Le contrat du run annonce l'arrêt de `--review`

**En clair.** Avec `--review`, un run autonome s'arrête après chaque grooming pour que le PO tamponne la
fiche. Son contrat, affiché au départ, annonce pourtant « 4 cas » d'arrêt seulement. Le PO a cru
lancer la revue du code et s'est étonné que le run lui rende la main. Le contrat dira cet arrêt, et
dira que la revue du code tourne toujours.

**Si tu arrives frais.** Le contrat du run est le bloc que `ezk run context` affiche au lancement de
`ezk-product-build` : ce que le run fera seul, et où il s'arrêtera.

## Contexte / Problème

Constaté le 2026-11-04 : `ezk run context --mode auto --tokens lean --delivery per-feature --review`
affiche « Je m'arrête sur 4 cas … », sans l'arrêt après chaque grooming que `--review` ajoute
(`products/mega-city/src/core/run-context.ts`, ligne 111). Rien ne dit non plus que la revue adverse du
code tourne quel que soit ce réglage. Symptôme vécu le 2026-10-30, détaillé dans la fiche mère.

## Proposition

- Avec `--review`, la ligne 2 du contrat compte 5 cas, le cinquième étant « après chaque grooming, pour
  que tu tamponnes la fiche prête ». Sans `--review`, elle reste à 4 cas.
- Une ligne de plus, toujours présente : « La revue adverse du code tourne toujours ; `--review` ne la
  règle pas. »

Une surface : la commande.

## Critères d'acceptation

- [x] Avec `--review`, le contrat liste l'arrêt après chaque grooming parmi ses cas d'arrêt.
- [x] Sans `--review`, le contrat garde ses 4 cas.
- [x] Le contrat dit, avec ou sans `--review`, que la revue adverse du code tourne toujours.
- [x] Les tests du contexte de run couvrent les deux cas.

## Comment vérifier

```bash
ezk run context --mode auto --tokens lean --delivery per-feature --no-fetch            # 4 cas
ezk run context --mode auto --tokens lean --delivery per-feature --no-fetch --review   # 5 cas
pnpm --dir products/mega-city vitest run src/core/__tests__/run-context.test.ts
```

## Notes / décisions

- Découpée de la fiche [`--review` se lit « revue du code »](done/20261104085959892_review-se-lit-revue-du-code.md)
  le 2026-11-04 : le contrat part tout de suite ; le renommage, qui demande un choix de nom, est la fiche
  sœur [Renommer `--review`](20261104095815808_renommer-review-nom-du-geste.md).
