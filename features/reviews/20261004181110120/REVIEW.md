---
schema: method-review@0.1
fiche: "20261004181110120"
branch: "fix/20261004181110120-init-cwd-perime"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "ffc23c19"
status: approved
created: "2026-10-04"
---

# Review — 20261004181110120

## Résumé

GO de ezk-reviewer : aucun usage légitime cassé (pnpm ezk à la racine ou en sous-dossier, pnpm --dir, binaire global, délégation, liens symboliques). Correctif adopté : remplacer l'INIT_CWD périmée par le vrai dossier. Limites dites dans la fiche : un enfant resté dans le dossier du paquet est encore cru ; yarn 1 et npm 6 ne posent pas npm_package_json.

## Rendus

N.A.

## Matrice de validation

test-note=✅, ezk-cli.test=✅, vitest 1836=✅, test:scripts 36=✅, typecheck=✅, carnet inchangé=✅, Revue ezk-reviewer=✅ GO, CI cloud=N.A. github off, Codex=N.A. github off

## À tester

bash products/mega-city/skills/ezk-retro/scripts/test-note.sh ; pnpm --dir products/mega-city test:scripts puis note.sh list : même liste

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
