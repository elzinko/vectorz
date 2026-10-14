---
id: "20261013131852779"
title: "L'auto-groom sort une fiche inconstruisable de sa version"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.15.0
labels: [methode, ezk-product-build]
status: ready
blocked:
pr:
evidence: none # auto-groom + journal, pas d'écran
split_from: "20261011103839682"
created: 2026-10-13
---

# 20261013131852779 — L'auto-groom sort une fiche inconstruisable de sa version

**En clair.** Quand une fiche de la version en cours s'avère inconstruisable, le run la **saute et la
journalise**, mais la laisse dans la version — elle y revient au run suivant. On veut que l'auto-groom
puisse la **sortir** : vider son `version:`, poser un drapeau `blocked:` / `milestone: parked`, et
journaliser le geste. La version avance sans traîner une fiche qui ne peut pas se construire.

**Si tu arrives frais.** L'*auto-groom* est l'étape où le run mûrit la tête du plan tout seul avant de
la construire. *Parker* une fiche = la retirer de la séquence active en vidant sa version et en la
marquant bloquée.

## Contexte / Problème

Au run v0.8→v0.10 du 2026-10-11, l'opérateur a dû **sortir à la main** des fiches inconstruisables de
leur version (cf. passation 2026-10-11 : générateur multi-IDE + bascule `scrum/` sortis de version).
Le skill sait **sauter** une fiche `blocked:` et la lister dans le RUN-REPORT, mais il ne vide pas son
`version:` : la fiche reste dans la version et le run rebute dessus à chaque passage.

## Proposition

Un geste **« parker hors version »**, appelable par l'auto-groom quand une fiche est jugée
inconstruisable : vider `version:`, poser `blocked:` (raison typée) et/ou `milestone: parked`,
journaliser dans le RUN-REPORT. Le geste reste **réversible** (le PO ou un grooming la réveille).

## Critères d'acceptation

- [ ] L'auto-groom peut **sortir** une fiche de sa version (version vidée + `blocked:`/`parked` +
      entrée de journal) quand elle est inconstruisable, au lieu de seulement la sauter.
- [ ] Le geste est tracé : le RUN-REPORT nomme la fiche sortie et la raison.
- [ ] Le geste est réversible : la fiche reste dans le backlog, réveillable au grooming.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# auto-groom sur une fiche jouet inconstruisable : version vidée, blocked posé, ligne de journal
```

## Notes / décisions

- Découpée de la fiche `20261011103839682` le 2026-10-13 (le point 3 : parker hors version). Le POC de
  boucle est [ezk-product-build enchaîne plusieurs versions](done/20261013131852375_product-build-boucle-multi-versions.md) ;
  l'auto-tag est [auto-tag et clôture en opt-in](done/20261013131852581_auto-tag-close-local-opt-in.md).
  Même version v0.15.0.
- S'appuie sur les **raisons typées** du drapeau `blocked:` posées en v0.13
  ([raisons typées pour blocked:](done/20261013131632484_raisons-typees-pour-blocked.md)) : la raison de la
  sortie est une raison typée.
