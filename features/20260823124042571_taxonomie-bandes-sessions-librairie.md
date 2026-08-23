---
id: "20260823124042571"
title: Taxonomie & vocabulaire — réparer les arêtes, compléter les 4 bandes, étiqueter honnête (plan post-panel)
type: refactor
priority: P1
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-23
---

## En clair

La version initiale de cette fiche (2 nouvelles bandes + fusion `ezk-session` + règle de
nommage bloquante) a été **démolie par le panel adverse du 2026-08-23** — trois attaquants
indépendants, verdicts convergents. Ce qui survit est plus petit et mieux ordonné :
réparer d'abord les liens `composes:` manquants, compléter les 4 bandes existantes,
puis rendre le vocabulaire Scrum honnête — **sans aucun rename de skill**.

> Priorité P1 confirmée (le PO a délégué le choix, 2026-08-23). Panel tenu le
> 2026-08-23 — capture complète : `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`.

## Ce que le panel a écarté (et pourquoi, en une ligne)

- **Fusion `ezk-session`** : inexécutable (le binder ne sait pas retirer un skill
  renommé — dépend de la fiche `20260813131737962`, encore `idea`), churn record
  (~110 fichiers), doublon sémantique avec l'AGENT ezk-archive, gain nul mesurable.
  Remplacée par une doc croisée (2 phrases par SKILL.md).
- **Les 2 nouvelles bandes** : la prémisse était fausse (`ezk-sprint` COMPOSE
  `ezk-start` → c'est de la méthode par le critère mécanique d'ADR-0020), et à
  6 bandes le critère mécanique meurt. 3ᵉ refonte en 24 jours = ré-ouvrir une
  décision jamais testée.
- **`bande:` en frontmatter** : ré-éparpille ce que le compilateur vient de
  centraliser. L'option retenue : un YAML unique (la table actuelle, déplacée).
- **Règle de nommage bloquante** : naissait violée par ses propres exemples ;
  reformulée en règle descriptive enseignée à la création.

## Étapes retenues (chacune : petite, réversible, livrée seule)

1. **Réparer les arêtes `composes:` manquantes** (XS). `ezk-codex` est composé par
   `ezk-sprint` (étape 10) et `ezk-pr` (ship) d'après leur prose — aucun ne le déclare.
   Balayer les autres écarts prose/frontmatter. Puis `graph:check` + `map:data`.
   *On apprend : ce que dit vraiment le critère mécanique.*
2. **Compléter les 4 bandes existantes** (XS). Les 5 hors-bande (`ezk-codex`,
   `ezk-ezk`, `supervision-*`, `vz-product-builder`) rangés dans les 4 bandes par
   arbitrage PO éclairé par l'étape 1 ; la table sort de `map-data.ts` vers un YAML
   unique lu par le compilateur ; une ligne d'amendement ADR-0020.
   *On apprend : le « problème de taxonomie » survit-il à une carte propre ?*
3. **Vocabulaire honnête, zéro rename** (S). Sur la carte : étiquettes Scrum marquées
   (`≈` adapté, `≠` faux ami), étape 4 = « livraison (release gate) », bandeau
   « inspiré de Scrum ». Dans la prose : le persona « scrum master » d'`ezk-sprint`
   débaptisé (il exécute et juge — un SM sert et établit) ; « DoD » réservé à la gate
   uniforme, « critères d'acceptation » pour le Gherkin ; un **Product Goal** en une
   ligne en tête de `features/PLAN.md`.
   *On apprend : la confusion baisse-t-elle sans churn ?*
4. **Doc croisée start ↔ archive** (XS). Deux phrases dans chaque SKILL.md.
   *On apprend : la confusion visée par la fusion existe-t-elle encore ?*
5. **Règle de nommage descriptive** (S). Rédigée pour que le catalogue ACTUEL passe ;
   enseignée au point de création (chemin ezk-ezk / skill-creator) ; steward la
   vérifie en conseil, pas en blocage.

Hors de cette fiche : bundles orphelins → fiche `20260823124042708` ; board
d'avancement → fiche `20260823124042842`.

## Critères d'acceptation

- [ ] Les arêtes déclarées reflètent la prose (zéro écart connu prose/frontmatter).
- [ ] `graph:check` vert ; la carte n'affiche plus aucun skill « hors bande ».
- [ ] La taxonomie vit dans UN fichier data (YAML), plus dans le code du compilateur.
- [ ] ADR-0020 amendé d'une ligne (rangement des 5, critère mécanique intact).
- [ ] Les cinq mots trompeurs relevés par le panel (Sprint, Scrum Master,
      Sprint Review, DoD, équipe) sont soit étiquetés `≈/≠`, soit reformulés en prose.
- [ ] `features/PLAN.md` ouvre sur un Product Goal d'une ligne.
- [ ] La règle de nommage existe et le catalogue actuel la passe sans exception.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:check
pnpm --dir products/mega-city map:data && git diff --stat diagrams/
pnpm --dir products/mega-city test
```

Et sur la carte (`pnpm ezk:map`) : plus d'entrée « sans bande officielle », étiquettes
Scrum marquées, étape 4 « livraison ».

## Notes

Origine : retours PO des 2026-08-23 sur la carte compilée (PR #162). Panel adverse du
2026-08-23 (A architecte / B puriste Scrum / C pragmatiste YAGNI), capture verbatim :
`docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`. Lignée : ADR-0020
(4 bandes + critère mécanique), ADR-0022 (superseded), ADR-0016 (rituels),
Scrum Guide 2020 (scrumguides.org).
