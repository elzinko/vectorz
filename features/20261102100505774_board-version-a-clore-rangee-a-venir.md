---
id: "20261102100505774"
title: "Le board de mission control range une version « à clore » parmi les versions à venir"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control, board]
status: idea
pr:
evidence: auto
created: 2026-11-02
---

# Le board range une version « à clore » parmi les versions à venir

**En clair.** La méthode dit que la version v0.24.0 est écartée et « à clore » : ses 3 fiches sont
livrées. Mission control la montre pourtant dans « à venir », comme du travail futur. Le geste attendu,
clore la version, disparaît de l'écran. C'est la dérive « mission control recopie et se trompe » que
l'ADR-086 veut supprimer.

**Si tu arrives frais.** La méthode publie l'état du backlog en JSON (`ezk board show --json`).
Mission control doit afficher ce que la méthode dit, sans le recalculer.

## Contexte / Problème

Gravité : **mineure**. Rien ne casse, mais le board ment sur l'état d'une version.

Reproduction, constatée 2 fois sur 2 :

1. Lancer le daemon de mission control (voir la fiche sur le port web pour la commande).
2. `curl -s http://127.0.0.1:<port>/api/board | python3 -c "import json,sys;print(json.load(sys.stdin)['vectorz']['versions']['upcoming'])"`
   affiche v0.24.0, avec 3 fiches livrées sur 3.
3. `ezk --root . board show --json` donne `versions.ecartees = ["v0.24.0"]` et `etat: "a-clore"`
   pour ce lot.

Attendu : la version apparaît « à clore », ou parmi les écartées. Obtenu : elle apparaît « à venir ».

## Proposition

Faire lire au traducteur du plan les champs `ecartees` et `etat` que la méthode publie déjà, au lieu
de reclasser les versions lui-même.

## Critères d'acceptation

- [ ] Une version que la méthode dit « à clore » n'apparaît pas dans « à venir » sur le board.
- [ ] Le board montre cette version avec son état « à clore ».

## Comment vérifier

Rejouer la reproduction ci-dessus, puis ouvrir le board dans le navigateur et comparer avec
`ezk board show --json`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B3), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts:162`, qui ignore `ecartees`
  et `etat`.
- Voisine : le contrat JSON de la méthode (ADR-086). Si une fiche de traduction du plan existe au
  moment du groom, enrichir celle-là plutôt que garder deux fiches.
