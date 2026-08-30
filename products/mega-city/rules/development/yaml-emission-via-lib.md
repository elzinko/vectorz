---
id: development/yaml-emission-via-lib
kind: disposition
level: MUST
title: Le front-matter généré est émis par la lib YAML, jamais par concaténation
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **Tout front-matter écrit par un générateur** (fiches, recettes : `ezk-chef extract`,
  `ezk-backlog add`/`ship`, tout futur émetteur) est produit par la **bibliothèque YAML**
  (`yaml.stringify` / `gray-matter`, déjà en dépendances), **jamais** par concaténation de
  chaînes ni template maison. Un `title`/`makes`/`source` contenant `:` ou `#` casse un
  scalaire non quoté — la lib quote pour toi.
- **Chaque fixture de test d'un artefact généré est re-parsée** par le vrai parseur YAML
  (round-trip), jamais laissée en string brute : une fixture aux valeurs « simples » masque le
  bug de quotage (vécu : `ezk-chef extract`, front-matter invalide invisible aux fixtures naïves).
- **Complète, ne remplace pas** `rules/recipe/valid-frontmatter.md` : celle-ci porte sur le
  *résultat* (front-matter valide, champs requis) ; celle-ci porte sur la *méthode d'émission*
  qui le garantit à la source. Le filet mécanique reste `fiches:check --strict` (ADR-0040).
- Origine : rétrospective PO du 2026-08-30 (symptôme : YAML invalide généré, attrapé seulement
  en revue adverse par un parseur réel). Enforcement niveau 1 = l'agent `ezk-reviewer` lit cette
  règle ; le filet déterministe est `fiches:check --strict`.
