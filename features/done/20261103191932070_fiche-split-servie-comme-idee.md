---
id: "20261103191932070"
title: "Une fiche découpée est servie comme une idée par mission control"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: shipped
pr: "local (e9756c47)"
evidence: auto
created: 2026-11-03
---

# Une fiche découpée est servie comme une idée par mission control

**En clair.** La fiche 20261007135620590 est au statut `split` : elle a été découpée en fiches sœurs. Mission
control la sert comme une idée et l'affiche dans la colonne « Idées ». Les comptes divergent : 103
fiches dans la vue Fiches, 17 idées et 85 parkées, soit 102, dans la vue d'ensemble.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. `curl -s http://127.0.0.1:<port>/api/board | python3 -c "import json,sys;print(json.load(sys.stdin)['vectorz']['fiches']['20261007135620590']['status'])"`
   affiche `idea`.
2. `grep '^status:' features/20261007135620590_refondre-vue-supervision-moniteur-lisible.md`
   affiche `status: split`.

## Proposition

Une fiche close sans être livrée, `split`, `superseded` ou `merged`, n'est pas du travail à faire. La
vue d'ensemble ne la compte déjà pas. Le traducteur de mission control l'écarte aussi de la vue
Fiches, au lieu de la ranger en idée.

## Critères d'acceptation

- [ ] Une fiche `split`, `superseded` ou `merged` publiée par la méthode n'apparaît pas dans
      `/api/board`.
- [ ] La vue Fiches et la vue d'ensemble comptent le même nombre de fiches à faire.

## Comment vérifier

1. Les tests du traducteur passent.
2. Mission control lancé, la commande de la reproduction ne trouve plus la fiche 20261007135620590.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B4), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `ezkPlanTranslator.ts`, fonction `ficheStatus`, range tout statut
  autre que `ready` en idée.
- **Groomée `ready` le 2026-11-03** (run autonome) : écarter plutôt que ranger en
  « Livrées » : une fiche découpée n'a rien livré, ses sœurs portent le travail.
