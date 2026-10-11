---
id: "20261010235330118"
title: ezk run report accepte une livraison locale (local <sha>) quand GitHub est coupé
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [ezk-product-build, outillage]
status: merged
pr: "merged — fusionnée dans 20261011113632532"
evidence: none
created: 2026-10-10
merged_into: "20261011113632532"
---

# 20261010235330118 — Le bilan de run accepte une livraison locale

**En clair.** Il existe un outil pour écrire le tableau-bilan de fin de run (une ligne par
fiche). Il a été fait en supposant que **toute** livraison passe par GitHub, avec un numéro de
pull request (genre `#277`). Ce projet travaille **sans** GitHub, tout en local : les livraisons
ont un code de commit (`local (c44c236f)`), pas un numéro de PR. L'outil refuse ces codes → il
n'a pas pu faire le bilan, je l'ai écrit à la main. On veut qu'il accepte une livraison locale.

**Si tu arrives frais.** À la fin d'un run `ezk-product-build`, `ezk run report` imprime le
bilan : pour chaque fiche, son état (livrée, en cours…), sa livraison, sa gate, sa revue. Quand
un projet a `github: false`, il n'y a pas de pull request : une fiche livrée est marquée
`local (<sha>)`, le code du commit qui l'a fait atterrir.

## Contexte / Problème

- **Symptôme daté (2026-10-10).** À la clôture du run, `ezk run report` a refusé les 3 lignes :
  il exige un numéro de PR (`#<numéro>`) pour une fiche livrée, **même avec `--no-github`**, et
  rejette `local (<sha>)` comme `-`. J'ai dû écrire le bilan à la main.
- **Miroir d'un trou connu.** Côté corps de PR, c'est l'inverse qui manque (l'extracteur local
  ne couvre que le sans-GitHub). Ici, l'extracteur de bilan ne couvre que **avec** GitHub.
- **Pourquoi ça compte.** Sans bilan automatique, la dernière restitution d'un run local est
  faite à la main — donc fragile et non uniforme.

## Proposition

1. En mode `--no-github` (ou projet `github: false`), `ezk run report` **accepte** une livraison
   `local (<sha>)` (ou `-`) dans le champ PR, au lieu d'exiger `#<numéro>`.
2. Le reste du bilan (états, gate, revue, HEAD vs base, jetons) est rendu tel quel, sans
   comparaison GitHub.

## Critères d'acceptation

- [ ] Avec `--no-github`, une ligne de fiche livrée portant `local (<sha>)` dans le champ PR est
      **acceptée** et rendue.
- [ ] Le mode GitHub (avec `#<numéro>`) continue de marcher comme avant.
- [ ] Un test couvre une livraison locale acceptée en `--no-github`.

## Comment vérifier

```bash
ezk run report --no-github --fiche "<id>|mergée|local (<sha>)|verte|GO|tests|-"
# → ligne acceptée, bilan rendu (aujourd'hui : refusée)
```

## Glossaire

- `ezk run report` — l'outil qui imprime le bilan de fin de run (une ligne par fiche).
- `--no-github` / `github: false` — le mode où le projet ne passe pas par GitHub ; livraisons en
  squash local, marquées `local (<sha>)`.

## Notes / décisions

- Née de la rétro du 2026-10-10 (grain n°4), capture
  [docs/captures/2026-10-10-retro-run-regles-composables.md](../../docs/captures/2026-10-10-retro-run-regles-composables.md).
- Implémentation de référence : `products/mega-city/bin/run-report.ts` (validation du champ PR).
