---
schema: method-review@0.1
fiche: "20261103203943909"
branch: "fix/20261103203943909-pastille-bloquee"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T19-20-33-578Z-29f05c02"
---

# Review — 20261103203943909

## Résumé

Revue adverse ezk-reviewer : GO. fiche.blocked n'a qu'un consommateur, la pastille de la fenêtre : la variante .pill.blocked ne touche aucune autre pastille. overflow-wrap anywhere ne coupe un mot que sans autre possibilité. Le retour à la ligne est prouvé par la mesure en navigateur, le contrat React par les tests. Non bloquant : la règle du bouton Fermer touche aussi deux autres fenêtres, sans dommage.

## Rendus

N.A.

## Matrice de validation

Gate locale 2319 tests et 48 suites de scripts verts ; 173 tests de la page web ; mesure navigateur avant et après

## À tester

Fiche Sortir la 1.8.0 de muti : la raison du blocage se lit en entier, sans défilement de côté

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
