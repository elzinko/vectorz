---
schema: method-review@0.1
fiche: "20261102165708468"
branch: "feat/20261102165708468-daemon-refuse-autre-site"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-02"
run_id: "2026-11-02T21-17-00-436Z-bf3b7868"
---

# Review — 20261102165708468

## Résumé

Revue adverse ezk-reviewer : GO, six critères prouvés par les tests (garde pure cas par cas, quatre routes d'écriture au serveur réel, actions non appelées sur refus). Attaques tenues : Host en majuscules, [::1], Host sans port, Origin null, corps refusé drainé. Non bloquant : une future écriture en GET ou OPTIONS ne passerait que le contrôle du Host ; les lectures ne contrôlent pas l'Origin, sûr tant qu'aucune ne renvoie un secret.

## Rendus

N.A.

## Matrice de validation

Tests mission control=728 verts ; Lint=propre ; Essai réel=autre site 403, text/plain 415, Host étranger 403, terminal traité, page 200 ; Revue adverse=GO

## À tester

curl -X POST -H 'Origin: https://exemple.test' -H 'Content-Type: application/json' http://127.0.0.1:4343/api/blocages/x/resolve doit rendre 403 ; curl -H 'Host: piege.test:4343' http://127.0.0.1:4343/api/board doit rendre 403 ; la page de mission control lit toujours le board

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
