---
schema: method-review@0.1
fiche: "20261004083838687"
branch: "feat/20261004083838687-integrer-push-ff"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "8d2d2f93"
status: approved
created: "2026-10-13"
---

# Review — 20261004083838687

## Résumé

Revue adverse : GO. ezk forge integrate + strategie push-ff. e2e sur remote nu local : push-ff depuis un worktree pousse feat/demo sur origin/main en avance rapide (aucun commit de fusion) ; refuse (rc=3, rien pousse, dit de rebaser) si origin a avance ; defaut sans cle = local-squash (test unitaire) ; config show affiche la strategie ; ezk-sprint/ezk-pr citent ezk forge integrate. Gate complete verte. Constats faible gravite : push-ff pousse les commits tels quels (sans squash, conforme au grooming) ; realign du main local par update-ref seulement s'il n'est pas sorti dans un worktree (sinon message).

## Rendus

N.A.

## Matrice de validation

Gate locale=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (terminal)

## À tester

cf. Comment verifier : remote nu local, forge integrate --branch feat/demo -> origin/main ff sans fusion ; pnpm test

## Qualité

N.A.

## Provisioning / preview

Aucun : remote git nu local (git init --bare), aucun reseau.

## Trouvailles

N.A.
