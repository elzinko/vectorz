---
id: "20260829132313947"
title: "Masquer les forks dans le suivi de consommation CI"
type: feature
priority: P3
product: mega-city
version:
epic:
depends: []
labels: [dette]
status: shipped
pr: "#295"
created: 2026-08-29
---

## En clair

La conso ([`ci:conso`](../../products/mega-city/bin/ci-conso.ts), fiche
[20260828150801613](20260828150801613_ezk-ci-conso-script-endpoint.md)) liste **tous**
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

- **Liste d'exclusion manuelle `.conso-ignore`** (racine, un repo par ligne, `#` = commentaire) :
  écarte AUSSI des repos qui ne sont **pas** des forks (un repo qu'on ne veut simplement pas voir).
  `--no-forks` gère l'automatique (les forks), `.conso-ignore` l'exception manuelle — les deux se composent.

## Critères d'acceptation

- [x] `ci:conso --no-forks` écarte de la table les forks **publics sans coût** ; un pied dit combien
      (forks masqués, minutes). — `hideFreeForks` + pied « forks masqués : N » (`src/core/ci-conso.ts`).
- [x] Aucun appel en plus : le `fork` est lu dans la même réponse `/repos/<o>/<r>` que la visibilité.
- [x] **Rien qui consomme n'est masqué** : un fork privé, facturé ou de visibilité inconnue reste
      affiché. (Précision par rapport à la proposition : « fork » ne veut pas dire « gratuit ».)
- [x] Sans le flag, la sortie est **inchangée**. Une option inconnue (`--no-fork`) est refusée.
- [x] Tests : `src/__tests__/ci-conso.test.ts` (masquage, totaux, forks gardés, pur, rendu, arguments).
- [ ] `.conso-ignore` (liste manuelle) — **reste en Suite**.

## Comment vérifier

```bash
pnpm --dir products/mega-city ci:conso 2026-08 --no-forks
```

Attendu : la table ne montre plus les forks publics ; un pied indique combien ont été masqués.

Essai réel (2026-10-01, mois 2026-09) : la commande tourne, le pied affiche « forks masqués : 0 ».
Cause : **aucun fork public n'a consommé de minutes ce mois-ci** (voir « Suite »).

## Suite

- **Le constat de départ ne tient plus.** `gh repo list --fork` ne rend aujourd'hui que **2** forks,
  tous deux **privés**. Les dépôts qui encombraient la table (`p5.js`, `ableton-js`…) sont des
  **copies privées qui ne sont pas des forks** pour GitHub (`fork: false`) et qui **consomment du
  quota**. Le flag est juste et testé, mais il ne désencombre rien sur ce compte.
- Piste plus utile pour lire « où partent mes minutes » : un filtre **`--private-only`**
  (seuls les privés pèsent sur le quota Free). À décider par le PO avant de le construire.
- **`.conso-ignore`** (exclusion manuelle d'un repo, un par ligne, `#` = commentaire) : non fait,
  c'est la 2e moitié de la proposition.
- **Défaut** : `--no-forks` est opt-in. Le passer en défaut (avec `--all` pour tout voir) tient en
  une ligne dans `bin/ci-conso.ts` si le PO le veut.

## Notes

- Suivi de [20260828150801613](20260828150801613_ezk-ci-conso-script-endpoint.md) (conso livrée) — décidé le 2026-08-29.
- **Declutter, pas économie** : les forks sont publics → déjà gratuits ; ça n'change pas le quota.
- Mutualiser avec l'appel visibilité existant (`/repos/<o>/<r>` rend `visibility` ET `fork`) — 0 appel en plus.
- Priorité **P3 par défaut** (confort de lecture) — à ajuster au grooming.
