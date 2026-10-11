---
id: "20260922175954296"
title: "Release gate — passe qualité avant versionnement (revue design-system + chasse aux bugs)"
type: feature
priority: P0
product: mega-city
milestone:
version: v0.11.0
status: ready
pr:
evidence: none # capacité méthode / concept, pas d'écran
created: 2026-09-22
---

# 20260922175954296 — Release gate : passe qualité avant versionnement

## En clair

Avant de taguer une version, on veut une **passe ultime** qui verrouille la qualité et **bloque le
tag** tant que ce n'est pas GO. On en fait un **skill `ezk-release`**, joué en **fin d'itération**
(le lot de features d'une version, pas chaque feature). Il est **composable** : au départ il enchaîne
deux passes bloquantes — la *Definition of Done* mécanique (gate locale verte) et une **chasse aux
bugs** adverse. D'autres passes, comme une **revue design-system** (fiche sœur
[[20261011153019643]]), s'y **branchent** ensuite, sans être mélangées. Capacité **méthode**,
réutilisable par tous les projets et **désactivable** par config.

## Contexte / Problème

- `ezk-reviewer` juge déjà le **code d'une feature** (par PR, GO/NO-GO). Mais **rien** ne fait une
  passe qualité au niveau de la **version entière** avant le tag.
- Symptôme concret (muti, 2026-09-22) : des features fonctionnelles mais un rendu **hors design
  system** (le « verrou » moche) découvert tard, avec des retours PO **répétés** faute de contrôle
  systématique avant release.
- En agile, chaque incrément livré doit être « fini » selon une DoD partagée ; une **Release
  Readiness Review** avant de déclarer prêt est un rituel canonique. Cette fiche l'outille.

## Proposition

**Un skill `ezk-release`** (forme tranchée par le PO le 2026-10-11), joué **avant un tag de version**.
Il **compose**, il ne réimplémente rien. Il enchaîne des **passes bloquantes composables** (GO/NO-GO) ;
au départ, deux :

1. **DoD mécanique** : la **gate locale** existante est verte (tests + scripts), 0 lien cassé, la
   version est complète (toutes ses fiches livrées). NO-GO sinon.
2. **Chasse aux bugs de fonctionnement** : un agent adverse (`ezk-reviewer` en mode adverse) rejoue
   les **parcours réels** du lot et cherche les régressions, au-delà des tests unitaires. GO/NO-GO.

**Composable, pas monolithique** (demande PO : « le design-system peut être un step supplémentaire,
pas forcément mélangé — j'aime la composition »). Les passes sont **déclarées**, pas codées en dur :
ajouter une passe ne réécrit pas le skill. La **revue design-system** est la première passe ajoutée
ainsi — elle vit dans sa **fiche sœur** [[20261011153019643]], pas ici.

**Verdict et blocage.** GO seulement si toutes les passes sont GO. Un NO-GO **bloque le tag** :
`ezk backlog version close <vX.Y> --tag` refuse tant que ce n'est pas traité. **Soupape PO
journalisée** possible (décision explicite, notée).

**Désactivable par config** : `.vectorz/config.yml` → `release.gate: off` (projet sans version taguée)
→ le skill se saute proprement.

**Restitution** : un compte rendu de release lisible (passes jouées, verdict, ce qui a bloqué) —
gabarit + rendu, règle des livrables.

**Vocabulaire :** dans ezk, un « sprint » = 1 feature ; ce que le PO appelle « sprint » (plusieurs
fiches → une version) = une **itération**. Le gate se place en **fin d'itération**.

## Critères d'acceptation

- [ ] `ezk release <vX.Y>` enchaîne des passes **composables** ; au départ (1) DoD mécanique et (2)
      chasse aux bugs adverse, chacune GO/NO-GO.
- [ ] Un NO-GO **bloque le tag** (`version close --tag` refuse) tant qu'il n'est pas traité, sauf
      soupape PO journalisée.
- [ ] `release.gate: off` (ou projet sans version taguée) → le skill se saute proprement.
- [ ] Il **compose** la gate locale + `ezk-reviewer` adverse, sans réimplémenter de logique de revue.
- [ ] **Ajouter une passe** (ex. la revue design-system, fiche sœur) ne demande **pas** de réécrire
      le skill : les passes sont déclarées.
- [ ] Première preuve : sur un lot avec une régression connue → **NO-GO** qui la nomme ; sur un lot
      propre → **GO** et tag autorisé.

## Comment vérifier

```bash
# Lot propre : GO, le tag est autorisé.
ezk release v0.11.0
# Introduire une régression connue, rejouer : NO-GO nommé, tag refusé.
ezk release v0.11.0
```

## Notes / décisions

- **Direction PO** (Thomas, 2026-09-22) : « une passe ultime avant versionnement pour verrouiller un
  peu tout ». À **inclure pour muti 1.8.0** (passe manuelle en attendant l'outil pérenne).
- **Complète** `ezk-reviewer` (niveau code/feature) par une passe au **niveau release** (design-system
  + fonctionnement). Rejoint la *Definition of Done* d'itération et la rétro de fin d'itération
  (`ezk-product-build`).
- Réutilise le **référentiel design-system par projet** (né côté muti : `.rules/design-system.md`).
- Voisines : `ezk-reviewer`, `ezk-product-build` (rétro d'itération), agent `ezk-ux` prévu (jalon UX),
  ADR-0016 (revues). À passer en **panel** pour la forme (cran product-build vs skill dédié).
- **Sauvetage (2026-10-02)** — fiche créée le 2026-09-22 sur une branche locale jamais ouverte en
  PR (`chore/fiche-release-gate`), retrouvée au ménage des branches. Remise telle quelle : seul le
  champ `ready:`, retiré par la migration 005, a été enlevé. Priorité et version restent à trancher
  au grooming par le PO.
- **Grooming 2026-10-11 (PO)** : forme tranchée = **skill `ezk-release`** (pas un cran dans
  `ezk-product-build`). La **revue design-system** est sortie en **step composable**, dans la fiche
  sœur [[20261011153019643]] ; v0.11 livre le squelette composable + DoD mécanique + chasse aux bugs.
  Rangée v0.11.0, passée `ready`.
