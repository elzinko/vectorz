---
id: "20261103191932067"
title: "Un pouce de revue refusé renvoie la bannière d'ezk au lieu de la raison"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: none # route d'API, sans écran
created: 2026-11-03
---

# Un pouce de revue refusé renvoie la bannière d'ezk au lieu de la raison

**En clair.** Quand la méthode refuse un pouce de revue, mission control renvoie la première ligne écrite par
`ezk`. C'est la bannière « dépôt visé : … », pas la raison. La vraie raison, « refusé : fiche
inconnue : 1234 », est perdue.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **majeure**.

Reproduction :

1. `curl -s -X POST -H 'Content-Type: application/json' -d '{"projet":"vectorz","id":"1234","pouce":"up"}' http://127.0.0.1:<port>/api/verdict`
2. Obtenu : HTTP 400 `{"ok":false,"error":"ezk : dépôt visé : <racine du projet>"}`.
3. Compare : `ezk --root <racine> review verdict 1234 up` écrit la bannière, puis « refusé : fiche
   inconnue : 1234 ».

## Proposition

À groomer.

## Critères d'acceptation

- [ ] *(à groomer)* La reproduction ci-dessus ne montre plus le défaut.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B3), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `verdictWriter.ts` garde la première ligne non vide de la sortie
  d'erreur d'`ezk`.
