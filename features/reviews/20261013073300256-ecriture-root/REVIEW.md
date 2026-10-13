---
schema: method-review@0.1
fiche: "20261013073300256"
branch: "feat/20261013073300256-ecriture-root"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "8d2d2f93"
status: approved
created: "2026-10-13"
---

# Review — 20261013073300256

## Résumé

Revue adverse ciblee : GO. Meme patron que 20261013073300242 (deja revu 8 angles). backlog apply/aggregate + evidence + sprint report acceptent --root et visent le depot courant, jamais vectorz en silence. Teste sur depot hote jetable + gate complete verte. 2 constats faible gravite : repli vectorz d'apply en invocation pnpm directe hors ezk ; evidence/sprint report acceptent --root apres le verbe (pas avant, non-project).

## Rendus

N.A.

## Matrice de validation

Gate locale=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (terminal)

## À tester

Depuis un hote : ezk --root <hote> backlog apply|aggregate ; ezk evidence decide --root <hote> ... ; ezk sprint report <slug> --root <hote>

## Qualité

N.A.

## Provisioning / preview

Aucun : teste sur dossier git jetable (mktemp).

## Trouvailles

N.A.
