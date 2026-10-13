---
schema: method-review@0.1
fiche: "20261013073300242"
branch: "feat/20261013073300242-commandes-lecture-root"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "8d2d2f93"
status: approved
created: "2026-10-13"
---

# Review — 20261013073300242

## Résumé

Revue adverse (code-review high, 8 angles) : GO. Aucun bug de correction. 2 constats faible gravite : garde d'ecriture cwd sur 'journal add' (exige features/, defendable), et import de findGitRoot depuis le gros module ezk-cli (couplage mineur). Change teste sur depot hote jetable + sous-dossier + gate complete verte.

## Rendus

N.A.

## Matrice de validation

Gate locale=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (terminal)

## À tester

Depuis un projet hote : ezk --root <hote> board check ; ezk run context --root <hote> ; ezk --root <hote> docs check-links ; ezk journal add <id> ... ; ezk pr ship-in-pr check --repo . --ref HEAD --fiche-id <id>

## Qualité

N.A.

## Provisioning / preview

Aucun : build autonome dans mega-city, teste sur dossier git jetable (mktemp).

## Trouvailles

N.A.
