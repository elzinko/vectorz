---
id: "20260830194601233"
title: "ship transactionnel — réparer les liens + régénérer les vues, refuser de pousser si rouge"
type: refactor
priority: P1
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-30
---

## En clair

Marquer une fiche livrée (`ship`) la déplace en `features/done/` par un `git mv` nu — et **ne
finit pas le travail** : les liens relatifs `../` de la fiche (et ceux qui la pointent) cassent,
et les vues générées (board, écart-plan) deviennent périmées. Comme le `ship` pousse **direct
sur `main`** (pas de PR, pas de gate), personne ne voit les liens cassés. On veut que le `ship`
soit une **transaction qui préserve les invariants du repo**.

## Symptôme (rétro 2026-08-30 — RÉCURRENT, vécu à chaque sprint de la session)

- **Liens** : shipper les fiches bundles (#190) puis recette (#192) a laissé **17 liens cassés
  sur `main`**, non détectés car `test-links-repo` (la gate) ne tourne pas sur un ship.
- **Vues** : après chaque tampon `ready`/`ship`, `avancement-board.test.ts` /
  `plan-delta-board.test.ts` rougissent tant qu'on n'a pas lancé `avancement:regen` +
  `plan-delta:regen` à la main.

## Proposition

Le `ship` (et le tampon `ready` qui touche le front-matter) devient une transaction unique :
1. réécrire les liens `../` de la fiche déplacée (un cran de profondeur en plus) **et** les
   liens entrants qui la pointent (→ `done/`) ;
2. régénérer **toutes** les vues dérivées (`regen-backlog`, `avancement:regen`,
   `plan-delta:regen`, `map:data` si le catalogue change) et les stager dans le même commit ;
3. lancer `test-links-repo` + les tests de fidélité ; **refuser de committer/pousser** (exit
   ≠ 0) si un lien casse ou une vue reste périmée.

Règle d'archi : **le chemin d'écriture possède ses invariants** (liens résolus, vues à jour),
jamais la vigilance humaine.

## Critères d'acceptation

- [ ] Un `ship` n'augmente **jamais** le compte de liens cassés (`test-links-repo` delta = 0),
      mesuré sur 3 sprints consécutifs (aujourd'hui : 17 en un ship).
- [ ] Après un `ship`, `git status` montre **0 diff résiduel** sur les vues générées et **0
      test de fidélité rouge** en local, sans regen manuel.
- [ ] Le `ship` **refuse de pousser** si un lien casse ou une vue reste périmée.

## Comment vérifier

```bash
# shipper une fiche riche en liens ../ → test-links-repo reste vert, board fidélité vert, 0 étape manuelle
```

## Notes

- Rétro 2026-08-30 (consensus archi/dev/pm — les deux P0 récurrents de la session). Symptômes
  1 et 2 : même racine (« le ship ne finit pas son travail ») → un seul durcissement.
- Piège déjà noté en mémoire projet (« un ship casse les liens ../ »).
- Frontière ADR-0001 : le rangement reste déterministe (script), le LLM ne range pas.
