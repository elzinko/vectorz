---
schema: method-review@0.1
fiche: "20261101154419684"
branch: "feat/20261101154419684-retro-cible-projet"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "728bd848"
status: approved
created: "2026-11-01"
---

# Review — 20261101154419684

## Résumé

Revue adverse ezk-reviewer : GO, aucun bloquant. Chaque phrase ajoutée au skill sur la couche projet a été confrontée au code (manifeste requis même vide, MUST refusé sans binding, apply écrit .claude/rules/vectorz-project.md, le local durcit sans desserrer). Les nouveaux tests échouent sans le changement. Deux remarques mineures corrigées après la revue : « par défaut » ne veut pas dire « cible omise », et un MAY sans binding est aussi un conseil.

## Rendus

N.A.

## Matrice de validation

Gate locale (typecheck + pnpm test + test:scripts, 2333 tests)=vert ; Tests ciblés rétro (55)=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (texte de skill et validateur)

## À tester

pnpm --dir products/mega-city exec vitest run src/core/__tests__/retro-capture.test.ts src/__tests__/ezk-retro-capture-contract.test.ts ; une capture avec target: projet passe ezk retro captures --check (refusée par le code de main)

## Qualité

N.A.

## Provisioning / preview

Aucun.

## Trouvailles

N.A.
