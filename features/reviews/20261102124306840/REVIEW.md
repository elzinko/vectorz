---
schema: method-review@0.1
fiche: "20261102124306840"
branch: "fix/20261102124306840-port-non-numerique"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T17-58-04-719Z-1c9ce288"
---

# Review — 20261102124306840

## Résumé

Revue adverse ezk-reviewer : GO. Le refus est posé avant tout lancement ; la regex et la borne 65535 rejettent non-numérique, zéro, zéro en tête, négatif, espaces, notation scientifique et 65536, et acceptent 1 à 65535. Les leurres prouvent que rien n'est lancé. Remarques non bloquantes : une valeur vide prend le défaut (voulu) ; lsof en erreur passe pour un port libre (préexistant, hors périmètre).

## Rendus

N.A.

## Matrice de validation

Gate locale 2314 tests et 48 suites de scripts verts ; test-cop1-dev.sh 10 cas ; rejeu de la fiche

## À tester

COP1_WEB_PORT=abc pnpm cop1:dev --no-build s'arrête tout de suite

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
