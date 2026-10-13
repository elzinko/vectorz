---
id: "20261013014039389"
title: "ezk run report rejette encore la livraison locale (régression de 20261010235330118)"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [dette, revue]
status: idea
pr:
evidence: none # outillage de bilan, pas d'écran
created: 2026-10-13
---

# 20261013014039389 — run report rejette encore la livraison locale

**En clair.** La fiche [« ezk run report accepte une livraison locale »](done/20261010235330118_run-report-accepte-livraison-locale.md)
est marquée **livrée** (`done/`), mais le code sur `main` **rejette toujours** `local (<sha>)` pour
une fiche « mergée » : `PR_FORM = /^#\d+$/` exige un `#<numéro>`. En flux local (github:false, le
défaut), le bilan de fin de run ne peut donc pas s'émettre — il faut l'écrire à la main. Un cas
« livré ≠ tourne ».

**Si tu arrives frais.** `ezk run report` imprime le bilan d'un run `ezk-product-build` (une ligne
par fiche). En flux local, une fiche livrée n'a pas de numéro de PR mais un code de commit
`local (<sha>)`.

## Contexte / Problème

Constaté au run autonome v0.11 (2026-10-13). `ezk run report --fiche "<id>|mergée|local (c2f51e2b)|…"`
est refusé : `src/core/run-report.ts:28` → `PR_FORM = /^#\d+$/`, et `:46` exige cette forme pour
`state === 'mergée'`. `-` est aussi refusé pour une mergée. Résultat : les 7 fiches livrées en local
de v0.11 n'ont pas pu passer par l'outil ; le bilan a été écrit à la main.

La fiche 20261010235330118 (done/) spécifie exactement l'inverse (« le bilan accepte `local (<sha>)` »).
Soit son code n'a jamais atterri sur ce `main`, soit il a régressé : à réconcilier.

## Proposition

- Étendre `PR_FORM` (ou la validation de `parseFicheArg`) pour accepter **`local (<sha>)`** comme
  référence de livraison d'une fiche « mergée », en plus de `#<numéro>`.
- Quand la référence est locale, **ne pas** tenter `fetchPrFacts` (pas de GitHub à interroger) :
  le bilan se rend sans comparaison GitHub, comme le reste du flux local.
- Un test couvre « fiche mergée en local (`local (<sha>)`) → ligne acceptée, bilan rendu ».

## Critères d'acceptation

- [ ] `ezk run report --fiche "<id>|mergée|local (<sha>)|…"` est accepté et rend le bilan.
- [ ] Aucune tentative d'appel GitHub pour une référence `local (<sha>)`.
- [ ] Un test couvre le cas local mergé.

## Comment vérifier

```bash
ezk run report --fiche "20260101000000001|mergée|local (abc1234)|verte|GO|locale verte|-"
# Attendu : accepté, bilan rendu (pas de refus « forme #<numéro> »).
```

## Notes

- Sortie du run autonome v0.11 (2026-10-13). Miroir du trou « corps de PR local » déjà noté dans
  20261010235330118. À réconcilier avec cette fiche shippée (feature absente du code).
