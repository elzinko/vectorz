---
id: "20261104090517494"
title: La vue Fiches de mission control montre les fiches parkées comme des idées
type: bug
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-04
---

# 20261104090517494 — La vue Fiches montre les fiches parkées comme des idées

**En clair.** La vue Fiches de mission control annonce 103 idées pour vectorz. Il n'y en a que
18 : les 85 autres sont parkées, c'est-à-dire sorties du travail en attendant le PO. Mission control
les mélange aux idées, alors que la méthode publie bien leur état. La correction ajoute un état
« Parkée », rangé à part et caché par défaut.

**Si tu arrives frais.** Une fiche « parkée » porte `milestone: parked` : elle reste au backlog mais
n'entre dans aucun sprint tant que le PO ne la réveille pas.

## Contexte / Problème

Constaté le 2026-11-04 sur l'instance de mission control de vectorz :

- Vue Fiches : « Idées 103 ».
- Vue Process et Vue d'ensemble : « idées 18 », « parkées 85 ».

Deux écrans du même produit se contredisent. La cause : `ezk backlog show --json` publie
`milestone: "parked"` pour chaque fiche, mais le traducteur du daemon
(`products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts`, fonction `ficheStatus`)
ne lit pas ce champ. Toute fiche non prête devient « idea ».

## Proposition

- Le traducteur donne l'état `parked` à une fiche active dont la milestone est `parked`.
- La vue Fiches range ces fiches dans une colonne « Parkées », à droite des idées, cachée par
  défaut derrière une case « montrer les parkées ».
- Les compteurs de la vue Fiches suivent les mêmes chiffres que la Vue d'ensemble.

Deux surfaces : le serveur (traducteur) et l'écran (vue Fiches).

## Critères d'acceptation

- [ ] Une fiche active avec `milestone: parked` arrive dans la page avec l'état `parked`, jamais
      `idea` ; une fiche prête ou livrée garde son état.
- [ ] Par défaut, la vue Fiches n'affiche pas les parkées, et son compte d'idées égale celui de la
      Vue d'ensemble.
- [ ] Une case « montrer les parkées » fait apparaître une colonne « Parkées » avec leur nombre.
- [ ] En mode liste, une fiche parkée porte l'étiquette « parkée ».
- [ ] Les tests du traducteur et de la vue couvrent ces cas.

## Comment vérifier

```bash
pnpm vitest run products/cop1/packages/app/src/features/board
pnpm --dir products/cop1/packages/web exec vitest run src/board
```

Puis ouvrir mission control, vue Fiches de vectorz : le compte d'idées égale celui de la Vue
d'ensemble, et la case montre la colonne « Parkées ».

## Notes / décisions

- Lot « mission control lisible » du run du 2026-11-04 : le PO veut des fiches « dans les bons
  états ».
- Preuve avant/après : capture de la vue Fiches.
