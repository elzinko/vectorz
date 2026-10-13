---
id: "20261011103839682"
title: ezk-product-build — un run multi-versions avec rétro + tag par version (3 manques)
type: feature
priority: P2
product: mega-city
milestone:
version: v0.15.0
labels: [methode, ezk-product-build]
status: split
pr: "split — scindée en 20261013131852375, 20261013131852581, 20261013131852779"
evidence: none
created: 2026-10-11
split_into: ["20261013131852375", "20261013131852581", "20261013131852779"]
---

# 20261011103839682 — ezk-product-build : run multi-versions, rétro + tag par version

**En clair.** Aujourd'hui, pour dérouler plusieurs versions d'affilée en autonomie, l'humain
doit orchestrer à la main le passage d'une version à l'autre : clore, taguer, lancer une rétro,
repartir. `ezk-product-build` ne connaît qu'**une** itération. On veut qu'il sache enchaîner
**plusieurs versions**, avec une rétro et un tag à **chaque frontière de version** — sans qu'un
humain tienne la barre entre les versions.

**Si tu arrives frais.** `ezk-product-build` est le pilote « construis-moi ce produit » : il
enchaîne les sprints d'**une** itération (un `run`), avec rétro en fin de run. « Clore une
version » = `ezk backlog version close <v> --tag` : poser l'étiquette git, geste **réservé au PO**
aujourd'hui.

## Contexte / Problème

Demande PO du 2026-10-11 : « va jusqu'au bout de toutes les versions (0.8 → 0.10), lance une rétro
entre chaque version, tague et merge en local tout seul ». Le skill fait presque tout **déjà** via
ses réglages (`--mode auto`, `--retro`, auto-groom, saut des fiches `blocked:`, RUN-REPORT qui
liste les sautées). Mais **trois** comportements demandés ne sont pas dans le skill — l'opérateur
les a tenus à la main ce run :

1. **Dérouler plusieurs versions d'affilée.** Le skill fait **une** itération ; la rétro est en
   fin de run ou tous les N sprints, **pas par version**. Enchaîner v0.8 → v0.9 → v0.10 avec une
   frontière nette à chaque version est orchestré par l'humain aujourd'hui.
2. **Taguer et clore une version tout seul.** `version close --tag` est **exprès** réservé au PO
   (le seul geste git que la méthode lui laisse). Un run autonome qui tague touche ce garde-fou.
3. **Sortir une fiche de sa version** quand elle est inconstruisable. Le skill la **saute et la
   journalise** ; il ne vide pas son `version:` pour la ranger hors séquence (fait à la main au
   run précédent, cf. passation 2026-10-11).

## Proposition

- **Un drapeau `--versions <liste|all>`** (ou `--until <vX.Y.Z>`) : la boucle enchaîne les
  versions dans l'ordre du plan, chacune avec sa frontière = rétro (selon `--retro`) + close/tag.
- **Un opt-in explicite pour l'auto-tag/close local** (ex. `--seal-versions local`), par défaut
  **absent** — car c'est un assouplissement d'un garde-fou PO voulu. Documenté par un **ADR**
  (le tag n'est plus seulement un geste PO quand ce drapeau est posé en flux local `github:false`).
- **Un geste « parker hors version »** appelable par l'auto-groom quand une fiche est
  inconstruisable : vider `version:`, poser `blocked:`/`milestone: parked`, journaliser — au lieu
  de seulement sauter.
- POC d'abord : le `--versions all` qui boucle + rétro/close par version. Le reste ensuite.

## Critères d'acceptation

- [ ] `ezk-product-build run --versions all` enchaîne les versions prêtes du plan, avec une rétro
      et une clôture (+ tag si opt-in) à chaque frontière de version.
- [ ] L'auto-tag/close local est **opt-in** et **absent par défaut** ; un ADR acte l'assouplissement.
- [ ] L'auto-groom peut **sortir** une fiche de sa version (version vidée + blocked + journal)
      quand elle est inconstruisable, pas seulement la sauter.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# dérouler un run --versions all sur un plan jouet : constater rétro + close/tag par version
```

## Notes / décisions

- Née de la **rétro légère de v0.8.0** (run auto du 2026-10-11) : la plupart des consignes PO
  étaient déjà des réglages du skill ; ces 3 manques ne l'étaient pas. Répond à la question PO
  « faut-il que ezk-product-build fonctionne comme ça à chaque fois ? » : oui, mais via une
  fiche/ADR car le point 2 touche un garde-fou voulu — pas en ajout silencieux.
- Garde-fou ADR-0001 tenu : le skill **décide** (quand clore, quoi parker), `ezk backlog version`
  et `ezk-pr` **exécutent** le git.
