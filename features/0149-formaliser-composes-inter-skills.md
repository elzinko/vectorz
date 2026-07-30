---
id: 0149
title: formaliser la composition inter-skills (composes)
type: feature
priority: P1
product: mega-city
labels: [enabler]
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
La doctrine « compose, ne réinvente pas » vit en prose : les dépendances inter-skills sont
invisibles à expand/bind (un profil peut binder ezk-product-builder sans ezk-sprint sans
erreur), et 4 intégrations fantômes ont été constatées à l'audit. Par ailleurs le modèle
`Skill {id, content}` ne représente ni `scripts/` ni le format dossier. ADR-0012.
(Le bug avéré du flywheel capture→bind est extrait en fiche 0037, bug P1 découplé.)

## Proposition
1. Frontmatter `composes:` / `composes-external:` sur les skills orchestratrices
   (ezk-product-builder, ezk-sprint, ezk-ezk, ezk-archive, ezk-recipy).
2. `docs/domain.ts` : `Skill.composes?: string[]` + Skill = dossier (SKILL.md + assets) ;
   expand résout la fermeture transitive ; bind émet un warning déterministe non bloquant
   sur composant manquant.
3. Génération du diagramme Mermaid du graphe de composition dans `skills/README.md`
   (bloc managé, script — le LLM ne range jamais).

## Critères d'acceptation
- [ ] binder un profil sans un composant requis (manquant DIRECT ou TRANSITIF) émet un warning listant les manquants
- [ ] les refs externes (skill-creator, product-brainstorming) ne déclenchent AUCUN warning
- [ ] le diagramme Mermaid est régénéré par script et à jour dans skills/README.md

## Notes
**Remontée P2 → P1 le 2026-07-26** (arbitrage PO). Déclencheur : [ADR-0020](../docs/adr/0125-capacite-partagee-brique-autonome.md)
grave la doctrine « briques autonomes **composables** » et la fiche [0102](0102-ezk-testbed-brique-boot-env-test.md)
crée `ezk-testbed`, que `ezk-pr-pilot`, `ezk-preview` et `ezk-sprint` doivent composer.
Sans `composes:`, ces trois liens naissent **en prose** — un profil pourra binder
`ezk-pr-pilot` sans `ezk-testbed` sans qu'aucun warning ne tombe, exactement le symptôme
d'origine d'ADR-0012. À livrer **avant** 0102 si possible : la fiche annote alors ses
composants à la naissance au lieu d'un rattrapage.

ADR-0012. Chantier structurel (domaine + loaders + tests) — après les quick wins
0036/0028/0029. Le fix du flywheel capture→bind est la fiche 0037 (bug P1, découplé).
ezk-recipy (fiche 0042) : ne l'annoter que si 0042 est déjà livrée, sinon l'annoter à sa
création. La mutation « Skill = dossier » est celle qui impacte les caps : à signaler au
gate de la fiche 0016.
