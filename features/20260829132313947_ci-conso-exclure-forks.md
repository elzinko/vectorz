---
id: "20260829132313947"
title: "ezk-ci conso — exclure les forks (repos clonés) de la conso"
type: feature
priority: P3
product: mega-city
version:
epic:
depends: []
labels: [ezk-ci, ci, dx]
status: idea
ready:
pr:
created: 2026-08-29
---

## En clair

La conso ([`ci:conso`](../products/mega-city/bin/ci-conso.ts), fiche
[20260828150801613](done/20260828150801613_ezk-ci-conso-script-endpoint.md)) liste **tous**
les repos, forks compris. Or on ne travaille pas sur les forks, et ils sont **publics donc
gratuits** — ils encombrent la vue sans peser sur le quota. Cette fiche propose de **les
masquer** (ou de les mettre à part) pour une conso lisible d'un coup d'œil.

## Si tu arrives frais

- **Fork** = repo cloné depuis un autre compte (`gh repo list --fork`). ~20 chez elzinko, tous publics.
- **Quota Actions** = 2000 min/mois, ne compte QUE les repos **privés** (public = gratuit/illimité).

## Contexte

`ci:conso` sort une table par repo. Sur ce compte, la moitié des lignes sont des forks
publics (`p5.js`, `BMAD-METHOD`, `ableton-js`…) : du bruit pour lire « où partent mes
minutes », puisqu'ils ne consomment aucun quota.

## Proposition

- Un flag **`--no-forks`** (ou masquage par défaut + `--all`) : la CLI interroge
  `gh api /repos/<o>/<r> --jq .isFork` (déjà un appel visibilité par repo — mutualiser) et
  **écarte** les forks de la table, ou les **regroupe** sous une ligne « N forks (gratuits) ».
- Garder l'info sans la perdre : un total « forks masqués : N » en pied.

## Comment vérifier

```bash
pnpm --dir products/mega-city ci:conso 2026-08 --no-forks
```

Attendu : la table ne montre plus les forks publics ; un pied indique combien ont été masqués.

## Notes

- Suivi de [20260828150801613](done/20260828150801613_ezk-ci-conso-script-endpoint.md) (conso livrée) — décidé le 2026-08-29.
- **Declutter, pas économie** : les forks sont publics → déjà gratuits ; ça n'change pas le quota.
- Mutualiser avec l'appel visibilité existant (`/repos/<o>/<r>` rend `visibility` ET `fork`) — 0 appel en plus.
- Priorité **P3 par défaut** (confort de lecture) — à ajuster au grooming.
