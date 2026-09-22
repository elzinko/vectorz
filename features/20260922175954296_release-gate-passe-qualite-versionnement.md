---
id: "20260922175954296"
title: "Release gate — passe qualité avant versionnement (revue design-system + chasse aux bugs)"
type: feature
priority: P0
product: mega-city
milestone:
status: idea
ready:
pr:
evidence: none # capacité méthode / concept, pas d'écran
created: 2026-09-22
---

# 20260922175954296 — Release gate : passe qualité avant versionnement

## En clair

Avant de taguer une version, on veut une **passe ultime** qui verrouille la qualité : un agent
vérifie que le **design system** est respecté, un autre **chasse les bugs** de fonctionnement, et le
versionnement est **bloqué** tant que ce n'est pas GO. C'est la *Definition of Done* d'un incrément
(revue de mise en production), à jouer en **fin d'itération** — le lot de features qui compose une
version, pas à chaque feature. Capacité **méthode**, réutilisable par tous les projets.

## Contexte / Problème

- `ezk-reviewer` juge déjà le **code d'une feature** (par PR, GO/NO-GO). Mais **rien** ne fait une
  passe qualité au niveau de la **version entière** avant le tag.
- Symptôme concret (muti, 2026-09-22) : des features fonctionnelles mais un rendu **hors design
  system** (le « verrou » moche) découvert tard, avec des retours PO **répétés** faute de contrôle
  systématique avant release.
- En agile, chaque incrément livré doit être « fini » selon une DoD partagée ; une **Release
  Readiness Review** avant de déclarer prêt est un rituel canonique. Cette fiche l'outille.

## Proposition

**Composer, ne pas réimplémenter.** Un « release gate » qui, **avant un tag de version**, enchaîne
deux passes **bloquantes** (GO/NO-GO), en plus de la DoD (gate locale verte, pas de régression) :

1. **Revue design-system** : un agent vérifie la conformité de l'UI de la version au **référentiel
   du projet** (ex. muti `.rules/design-system.md`). NO-GO si écarts bloquants.
2. **Chasse aux bugs de fonctionnement** : un agent adverse cherche des dysfonctionnements sur le
   lot (parcours réels, régressions), au-delà des tests unitaires. GO/NO-GO.

**Forme (à trancher au grooming/panel) :** soit un **cran dans `ezk-product-build`** (fin
d'itération, avant que le PO tague), soit un petit skill **`ezk-release`**. Compose des agents
existants/à créer : un **design/UX reviewer** (rejoint l'agent `ezk-ux` prévu, jalon UX) + un agent
**chasse-bugs** (`ezk-reviewer`/`ezk-qa` en mode adverse). Config-gated si besoin (projet sans
release taguée = gate off).

**Vocabulaire (à aligner) :** dans ezk, un « sprint » = 1 feature. Ce que le PO appelle « sprint »
(plusieurs fiches → une version) = une **itération**. Le gate se place en **fin d'itération**.

## Critères d'acceptation

À compléter au grooming / panel (fiche `idea`).

- [ ] Avant un tag, la méthode lance une **revue design-system** + une **chasse aux bugs**, chacune
      rendant un verdict GO/NO-GO.
- [ ] Un **NO-GO bloque le versionnement** (pas de tag tant que non traité, ou soupape PO
      **journalisée**).
- [ ] La revue design-system s'appuie sur le **référentiel du projet** (ex. `.rules/design-system.md`).
- [ ] Capacité **réutilisable** par tout projet (méthode), config-gated.
- [ ] **Appliqué à muti 1.8.0** comme première preuve — en attendant l'outil, la passe est jouée
      **manuellement** (2 agents) avant le tag.

## Comment vérifier

À définir après cadrage (fiche de concept). Piste : rejouer le gate sur un lot portant un écart DS
**connu** → il rend **NO-GO** et nomme l'écart ; puis sur un lot propre → **GO**.

## Notes / décisions

- **Direction PO** (Thomas, 2026-09-22) : « une passe ultime avant versionnement pour verrouiller un
  peu tout ». À **inclure pour muti 1.8.0** (passe manuelle en attendant l'outil pérenne).
- **Complète** `ezk-reviewer` (niveau code/feature) par une passe au **niveau release** (design-system
  + fonctionnement). Rejoint la *Definition of Done* d'itération et la rétro de fin d'itération
  (`ezk-product-build`).
- Réutilise le **référentiel design-system par projet** (né côté muti : `.rules/design-system.md`).
- Voisines : `ezk-reviewer`, `ezk-product-build` (rétro d'itération), agent `ezk-ux` prévu (jalon UX),
  ADR-0016 (revues). À passer en **panel** pour la forme (cran product-build vs skill dédié).
