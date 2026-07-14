---
id: 0045
title: ezk-dev — le rôle est un agent, la méthode (TDD) est une rule de profil
type: refactor
priority: P2
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
`ezk-tdd` fusionne un RÔLE (développeur) et une MÉTHODE (red-green-refactor) dans un seul
agent. Or le modèle mega-city sépare précisément les deux : l'Agent est le rôle, LA LOI est
le comment (Rule, composable par bundle/profil). Question de l'opérateur (2026-07-06) :
« un agent dev dont le TDD serait une compétence attribuée, voire une option » — c'est
exactement ce que le domaine sait déjà exprimer.

## Proposition
1. Renommer `agents/ezk-tdd.md` → `agents/ezk-dev.md` : rôle = implémenter une feature en
   clean code, POC-first ; garde model/effort/isolation de la fiche 0039.
2. Extraire la méthode en rules (rejoint la fiche 0006 — iamthelaw a déjà les rulesets
   `development` et `testing`) : ex. `testing/tdd-red-green-refactor` (SHOULD ou MUST selon
   bundle), `testing/bdd-scenarios-are-dod`.
3. Le TDD devient une option DE PROFIL : un profil `poc-rapide` n'inclut pas la rule, un
   profil `produit` l'impose en MUST — aucun code, pure composition YAML.
4. Mettre à jour les références : ezk-sprint (étape « TDD POC » → « Dev », délègue à
   ezk-dev), profiles/global.yml, skills/README.md.

## Critères d'acceptation
- [ ] `agents/ezk-dev.md` routable, ezk-tdd disparu du catalogue (pas de doublon)
- [ ] la rule TDD existe dans rules/ et est tirée par au moins un bundle
- [ ] un profil SANS la rule TDD binde un ezk-dev qui ne mentionne pas le TDD comme obligation
- [ ] ezk-sprint référence ezk-dev et la boucle tourne inchangée

## Notes
ADR-0011 (répartition rôles/méthode) + ADR-0010 (source des rules). Le futur
« ezk-dev-dispatcher » (devs parallèles sans conflit) est explicitement REPORTÉ : linéaire
pour l'instant ; les briques existent déjà (isolation worktree par agent, worktree par story
côté cop1, ordre de merge par ezk-pr-pilot) — à re-évaluer comme option d'ezk-product-builder
quand le besoin sera réel.
