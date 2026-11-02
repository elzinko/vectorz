---
schema: method-review@0.1
fiche: "20261102100505427"
branch: "feat/20261102100505427-web-port"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "f2a118ab"
status: ready-for-review
created: "2026-11-02"
run_id: "2026-11-02T12-10-28-139Z-2c358329"
---

# Review — 20261102100505427

## Résumé

Revue adverse GO. Les 4 critères sont prouvés et rejoués par le relecteur : port web pris → exit 1, pid nommé, daemon non lancé, refus avant le build ; port libre → page et /api/board en 200 à l'adresse affichée ; vite avec PORT sur port pris → erreur, aucun glissement ; vite sans PORT → strictPort faux, il glisse (lu dans vite.config.ts:17, rejoué par le constructeur 5173→5175). Constat P2 non bloquant, hors périmètre et préexistant : un port non numérique (COP1_WEB_PORT=abc) passe la garde, puis le lancement échoue en exit 1 avec le daemon nettoyé.

## Rendus

N.A.

## Matrice de validation

Gate locale ✅ · Revue ✅ GO · E2E N.A. · Before/after N.A.

## À tester

Lancer pnpm cop1:dev avec un port web déjà pris : refus net qui nomme le port et le pid.

## Qualité

N.A.

## Provisioning / preview

Aucun : pnpm install puis pnpm build dans le worktree.

## Trouvailles

N.A.
