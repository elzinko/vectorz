---
schema: method-review@0.1
fiche: "20261003011750433"
branch: "test/20261003011750433-sprint-md-committe"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T17-58-04-719Z-1c9ce288"
---

# Review — 20261003011750433

## Résumé

Revue adverse ezk-reviewer : GO. Le cas S25 prouve le cas exact de muti (SPRINT.md suivi par git, ancien format, sans Branche:). Deux mutations de sprint.sh dans une copie : recompter l'instantané comme ouvert, ou le reprendre sans vérifier la branche ; le test passe rouge les deux fois. Hermétique. Remarques non bloquantes : l'assertion sur le fichier suivi ne mord pas sur une exclusion inutile ; SPRINT-FOREIGN s'imprime avant le contrôle d'ouverture, c'est l'assertion START OPENED qui garde l'ouverture.

## Rendus

N.A.

## Matrice de validation

Gate locale 2315 tests et 48 suites de scripts verts ; test-sprint-lifecycle.sh PASS ; deux mutations attrapées

## À tester

Au prochain sprint dans un projet hôte qui a committé un SPRINT.md : start ouvre et dit SPRINT-FOREIGN

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
