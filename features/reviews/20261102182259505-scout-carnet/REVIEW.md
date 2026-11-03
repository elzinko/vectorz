---
schema: method-review@0.1
fiche: "20261102182259505"
branch: "feat/20261102182259505-scout-carnet"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T00-12-05-042Z-3ef43c62"
---

# Review — 20261102182259505

## Résumé

Revue adverse ezk-reviewer : GO. Le filtre --zone recompte juste (feuille, parent, préfixe voisin, branche inconnue refusée). Le contrôle du rapport refuse une Couverture absente, menteuse ou à Y différents. Sans carnet, la passe et la garde find-only tournent comme avant.

## Rendus

N.A.

## Matrice de validation

Gate locale 2261 tests verts ; test-ezk-carto.sh cas A à G verts ; test-check-report.sh cas s à w verts ; rétro-compat JSON et texte sans --zone vérifiée

## À tester

ezk carto status --zone <nœud> sur un projet qui déclare un arbre ; une passe /ezk-scout run sur une app avec carnet

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
