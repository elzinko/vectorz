---
schema: method-review@0.1
fiche: "20260826222044335"
branch: "feat/20260826222044335-loi"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-02"
run_id: "2026-11-02T21-17-00-436Z-bf3b7868"
---

# Review — 20260826222044335

## Résumé

Revue adverse ezk-reviewer : GO. Les comptes et la portée viennent tels quels de la méthode ; la route lit la mémoire du daemon, sans attendre ezk ; une erreur rend « loi indisponible : raison », jamais des zéros. Les traits ne sont tracés que pour la sélection. Une remarque appliquée : l'en-tête « Règles — X / Y » compte désormais la liste rendue, plus le total publié à côté, pour qu'un compte ne contredise jamais sa liste.

## Rendus

N.A.

## Matrice de validation

Mission control=788 tests ; Page web=148 tests + typecheck ; Lint=propre ; Essai réel=96 règles aux comptes de la méthode, 4 traits pour ezk-sprint ; Revue adverse=GO

## À tester

ezk law show --json | jq .comptes ; dans mission control, Méthode puis Loi : les cinq compteurs valent ce JSON ; filtrer « citées » puis sélectionner ezk-sprint trace un trait vers ses règles, dont development/story-dans-un-worktree-dedie, dont le détail dit « citée par ezk-sprint, absente de la loi installée »

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
