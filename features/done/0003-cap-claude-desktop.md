---
id: 0003
title: cap claude-desktop — continuer à charger les skills
type: feature
priority: P1
status: shipped
pr: "#6"
created: 2026-06-26
---

## Contexte / Problème
Tenir « ne rien casser » : continuer à charger les skills dans Claude Desktop pendant la transition.

## Proposition
Cap qui matérialise un profil en dossiers de skills importables (`<name>/SKILL.md` + `scripts/`).

## Critères d'acceptation
- [x] un profil produit des dossiers skills utilisables dans Claude Desktop (`<id>/SKILL.md`) —
      cap `src/caps/claude-desktop.ts`, atteignable via `bind <profile> <dir> claude-desktop`.
- [x] aucune régression vs le chargement des skills actuel — `install.sh` supprimé (remplacé par le
      cap global, fiche 0017) ; réf = cap global, dont la sortie reste byte-identique (helper partagé).

## Notes de livraison (#6, ADR-0014)
- Helper partagé `skillFolderFiles(resolved, prefix)` (`src/caps/skill-content.ts`) : global `prefix='skills'`, desktop `prefix=''`.
- Périmètre skills-seuls (`hooks: []`). `scripts/` hors MVP → **follow-up** : étendre `Skill` (domain + loader) + matérialiser `scripts/`.
- 6 tests unitaires sur le WritePlan ; suite verte (113) ; typecheck OK.
