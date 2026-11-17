---
schema: method-review@0.1
fiche: "20261117141828100"
branch: "feat/20261117141828100-portier-session-active"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "ca6fcb35"
status: ready-for-review
created: "2026-11-17"
---

# Review — 20261117141828100

## Résumé

GO après re-revue. NO-GO initial (P0) : la promotion session-active écrasait principal/réserve/fusionnée. Corrigé : promotion dans les seules copies signalées, test principal + session fraîche → ignoré. 3 critères prouvés.

## Rendus

N.A.

## Matrice de validation

gate mega-city ✅ · test-check-gate PASS · E2E N.A.

## À tester

bash products/mega-city/skills/ezk-sprint/scripts/check.sh --gate depuis un worktree, avec une autre session active dans une copie voisine

## Qualité

N.A.

## Provisioning / preview

aucun

## Trouvailles

N.A.
