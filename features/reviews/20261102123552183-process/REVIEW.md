---
schema: method-review@0.1
fiche: "20261102123552183"
branch: "feat/20261102123552183-process"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-02"
run_id: "2026-11-02T21-17-00-436Z-bf3b7868"
---

# Review — 20261102123552183

## Résumé

Revue adverse ezk-reviewer : GO. Le dossier du projet est passé jusqu'à chaque appel git et gh, avec le défaut d'avant pour les autres appelants. Un projet github: false ne lance aucun gh, prouvé par la vraie commande et un faux gh qui note ses appels. Les livrées coupées disent « 20 / 337 ». La coquille PendingView est retirée. Deux remarques non bloquantes, appliquées : un test interdit tout chemin absolu ou session dans l'exemple du contrat, et un test couvre une réponse qui n'est pas du JSON (la source passe en indisponible).

## Rendus

N.A.

## Matrice de validation

Gate de la méthode=2411 tests + 47 suites ; Mission control=768 tests ; Page web=137 tests + typecheck ; Lint=propre ; Essai réel=mêmes colonnes et comptes que la méthode ; Revue adverse=GO

## À tester

ezk board process --json | jq '.stages[] | {stage, n: (.fiches|length)}' ; ezk --root <autre projet> board process montre les branches de cet autre projet ; sur vectorz (github: false), aucun gh n'est lancé et « en revue » est dite inconnue ; dans mission control, Méthode puis Process montre les colonnes

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
