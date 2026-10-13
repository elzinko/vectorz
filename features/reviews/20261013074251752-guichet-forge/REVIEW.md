---
schema: method-review@0.1
fiche: "20261013074251752"
branch: "feat/20261013074251752-guichet-forge"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "8d2d2f93"
status: approved
created: "2026-10-13"
---

# Review — 20261013074251752

## Résumé

Revue adverse : GO. Guichet forge changes (cœur pur + bin) : 3 etats verifies sur depot jetable (off rc=0 sans gh, unavailable rc=3, ok liste la PR), ezk help liste forge, codes fixes, test vitest vert, gate complete verte. 1 constat faible gravite : si 'gh pr list' echoue APRES un auth OK (reseau), listPrs leve une exception non attrapee (plante au lieu d'un message propre) — bord rare, etat ok deja garanti par ghReady.

## Rendus

N.A.

## Matrice de validation

Gate locale=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (terminal)

## À tester

cf. Comment verifier de la fiche : projet github:false -> off sans gh ; config on + gh ko -> unavailable ; config on + gh ok -> liste

## Qualité

N.A.

## Provisioning / preview

Aucun : teste sur dossier git jetable + gh factice.

## Trouvailles

N.A.
