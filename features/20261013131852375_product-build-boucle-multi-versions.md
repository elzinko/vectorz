---
id: "20261013131852375"
title: "ezk-product-build enchaîne plusieurs versions, rétro + clôture à chaque frontière"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.15.0
labels: [methode, ezk-product-build]
status: ready
blocked:
pr:
evidence: none # pilote de run, pas d'écran
split_from: "20261011103839682"
created: 2026-10-13
---

# 20261013131852375 — ezk-product-build enchaîne plusieurs versions

**En clair.** Aujourd'hui, `ezk-product-build` ne connaît qu'**une** itération. Pour dérouler
plusieurs versions d'affilée, l'humain orchestre à la main le passage de l'une à l'autre. On veut un
`run --versions all` qui enchaîne les versions prêtes du plan, avec une **rétro** et une **clôture** à
chaque frontière de version — sans qu'un humain tienne la barre entre deux versions.

**Si tu arrives frais.** `ezk-product-build` est le pilote « construis-moi ce produit » : il enchaîne
les sprints d'une itération (un `run`), avec rétro en fin de run. C'est le **POC** du run
multi-versions ; l'auto-tag et le park-hors-version sont des fiches sœurs.

## Contexte / Problème

Demande PO du 2026-10-11 (« va jusqu'au bout de toutes les versions 0.8 → 0.10 »). Le skill fait
presque tout via ses réglages (`--mode auto`, `--retro`, auto-groom, saut des `blocked:`). Mais il
fait **une** itération : la rétro est en fin de run ou tous les N sprints, **pas par version**.
Enchaîner v0.8 → v0.9 → v0.10 avec une frontière nette à chaque version est orchestré par l'humain
aujourd'hui.

## Proposition

Un drapeau **`--versions <liste|all>`** (ou `--until <vX.Y.Z>`) : la boucle enchaîne les versions dans
l'ordre du plan, chacune avec sa frontière = rétro (selon `--retro`) + clôture de version. C'est le
POC ; il **ne tague pas** tout seul (fiche sœur) et **ne parke pas** hors version (fiche sœur).

## Critères d'acceptation

- [ ] `ezk-product-build run --versions all` enchaîne les versions prêtes du plan, dans l'ordre.
- [ ] À chaque frontière de version : une rétro (selon `--retro`) puis une clôture de version.
- [ ] Sans `--versions`, le comportement reste celui d'une itération unique (non-régression).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# dérouler un run --versions all sur un plan jouet : constater rétro + clôture à chaque frontière
```

## Notes / décisions

- Découpée de la fiche `20261011103839682` le 2026-10-13 (le **POC** : boucle + rétro/clôture par
  version). Les deux autres manques sont les fiches sœurs, même version v0.15.0 :
  [auto-tag/close local en opt-in](20261013131852581_auto-tag-close-local-opt-in.md) et
  [l'auto-groom sort une fiche hors version](20261013131852779_auto-groom-sort-fiche-hors-version.md).
- Garde-fou ADR-0001 tenu : le skill **décide** (quand clore), `ezk backlog version` **exécute** le git.
- Née de la rétro légère de v0.8.0 (run auto du 2026-10-11).
