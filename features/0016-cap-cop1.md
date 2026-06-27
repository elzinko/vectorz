---
id: 0016
title: cap cop1 — matérialiser un profil en config native cop1
type: feature
priority: P2
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
cop1 (orchestrateur de dev autonome, agents via Claude SDK) est déjà listé comme `HostId`
(`docs/domain.ts`) mais n'a pas de cap. Son objectif : être **gouverné** par mega-city
(rules + agents + skills) **sans coupler les runtimes** — cop1 lit sa config native, ignore
mega-city ; mega-city l'écrit via un cap isolé. Cf. ADR-0005 (modes de consommation) et,
côté cop1, ADR-021 (frontière d'intégration).

## Proposition
Un `caps/cop1/` qui `materialize(resolved, projectDir) → WritePlan` (pur), ciblant le format
que cop1 lit déjà :
- **Phase 1 — règles** : profil → `iamthelaw/global.yaml` (+ scrum/architecture). Les
  `enforcements:[{type:'agent-check', agent}]` se mappent sur le `Rule.check` → DoDCheck de
  cop1 (cop1 ADR-020 / fiche 0014). Plus petit incrément, réutilise l'existant des deux côtés.
- **Phase 2 — équipe** : matérialiser agents/skills une fois le format de consommation cop1
  confirmé (sous-agents / skills `ezk-*`).

⚠️ **Ne pas implémenter** tant que (a) le schéma mega-city n'est pas stabilisé (fiches 0012
« aligner domain.ts », 0006 « migrer rulesets iamthelaw ») et (b) cop1 ADR-021 n'est pas acté.

## Critères d'acceptation
- [ ] `bind <profile> <projet-cop1> cop1` produit un `iamthelaw/global.yaml` valide que cop1 lit.
- [ ] les `enforcements` agent-check se traduisent en `Rule.check` (DoDCheck cop1).
- [ ] cap **pur** (resolved → plan), testé sans FS, déterministe (byte-for-byte).
- [ ] zéro import croisé : mega-city ne dépend pas de cop1, cop1 ne dépend pas de mega-city.

## Notes / décisions
Dépend d'ADR-0005 (ce repo) + cop1 ADR-021. Voir aussi `caps/claude-desktop` (fiche 0003)
comme modèle de cap.
