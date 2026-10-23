---
id: "20261015213921062"
title: "Recâbler les surfaces qui lisent « in-progress » sur le signal déduit des branches"
type: bug
priority: P2
product: mega-city
labels: [methode, pilotage, dette]
milestone: carte
version:
status: ready
pr:
evidence: none # sortie CLI / vue texte, pas d'écran web
created: 2026-10-15
---

# 20261015213921062 — Recâbler les surfaces qui lisent « in-progress »

**En clair.** Depuis qu'« en cours » est un statut **calculé** (déduit des branches ouvertes, jamais
écrit dans la fiche), deux affichages lisent encore l'ancien champ écrit et montrent donc **toujours
0** : `ezk dor health` dit « en cours : 0 », et le portfolio dit « Rien en cours ». Le pilote lit zéro
là où il y a du travail. On recâble ces deux surfaces sur le signal déduit des branches — celui que la
vue web du process utilise déjà — et on retire le code mort.

**Si tu arrives frais.** ADR-0077 a rendu le statut `in-progress` **calculé** à partir des branches
`feat/<id>-…` ouvertes, et **jamais écrit** dans le front-matter d'une fiche. Les surfaces qui
comptaient l'ancien champ écrit lisent donc toujours vide.

## Contexte / Problème

Relevé par l'audit adverse du découpage (2026-10-15, lentille PO), et déjà noté en rétro le 2026-10-14
(« garder-calculé laisse des surfaces d'affichage à zéro »).

- `src/core/dor-manifest.ts:276` (`computeHealth`) compte `status === 'in-progress'` → toujours 0,
  imprimé par `ezk dor health` (« en cours : 0 »).
- `bin/portfolio.sh:80` filtre `status == "in-progress"` → `PORTFOLIO.md` dit toujours « Rien en cours ».
- La vérité « en cours » (déduite des branches) n'a été recâblée que dans la vue web `process`
  (`src/io/derived-views.ts` via `collectProcessIo`). Les deux surfaces texte ont été oubliées.
- Corollaire : `src/core/avancement-data.ts:152` compte `tirables = status === 'ready'`, donc une
  fiche en cours de dev (branche ouverte, statut resté `ready`) est comptée **tirable** → le board
  sur-compte le stock libre.

Ce sont des lectures d'un champ garanti mort : au sens de la règle `clean-code/no-dead-code`, c'est du
code mort trompeur.

## Proposition

- Brancher `dor health` et le portfolio sur le collecteur déduit-des-branches (`collectProcessIo` /
  `process-data`), celui qu'utilise déjà la vue web.
- Décider **surface par surface** (piste de la rétro) : afficher le calculé, ou retirer la surface si
  elle n'a plus de sens.
- Retirer le code qui lit `status: in-progress` écrit.
- Corriger le compte « tirables » pour qu'il n'inclue pas une fiche dont une branche est ouverte.

## Critères d'acceptation

- [ ] `ezk dor health` et `PORTFOLIO.md` affichent un « en cours » qui reflète les branches ouvertes,
      pas un 0 systématique.
- [ ] Plus aucune lecture de `status: in-progress` écrit ne subsiste (code mort retiré).
- [ ] Le compte « tirables » n'inclut pas une fiche dont une branche `feat/<id>-…` est ouverte.

## Comment vérifier

```bash
# Ouvrir une branche feat/<id>- sur une fiche ready, puis :
cd products/mega-city && pnpm ezk dor health   # attendu : « en cours : 1 », pas 0
rg -n "in-progress" src/core/dor-manifest.ts bin/portfolio.sh   # attendu : plus de lecture du champ écrit
pnpm test
```

## Notes / décisions

- Provenance : rapport d'audit du découpage, 2026-10-15 ; conséquence directe d'ADR-0077 (statut
  calculé non écrivable), livré en v0.16.
- Famille « composition + dette » de l'audit : la donnée juste existe déjà (vue web process), il ne
  manque que le recâblage des deux surfaces texte + le ménage.
