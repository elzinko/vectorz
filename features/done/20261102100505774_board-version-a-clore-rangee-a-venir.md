---
id: "20261102100505774"
title: "Le board de mission control range une version « à clore » parmi les versions à venir"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control, board]
status: shipped
pr: "local (c6a25fa8)"
evidence: before-after
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

Le traducteur du plan lit l'état que la méthode publie pour chaque lot, le champ `etat`. Il ne
reclasse rien lui-même.

- Un lot « à clore » a toutes ses fiches livrées, mais pas encore d'étiquette. Il quitte « à venir »
  et rejoint les versions réalisées. Il porte une marque « à clore ».
- La vue d'ensemble écrit « à clore » dans la colonne « Versionné », à la place de « — ». La version
  courante aussi, quand la méthode la dit à clore : c'est le cas de v0.23.0 aujourd'hui.
- « ✓ taguée » reste réservé à une version qui a son étiquette.
- Un lot sans `etat`, publié par une méthode plus ancienne, garde le classement d'aujourd'hui.

## Critères d'acceptation

- [ ] Une version que la méthode dit « à clore » n'apparaît pas dans « à venir » sur le board.
- [ ] Le board montre cette version avec la mention « à clore », la version courante comprise.
- [ ] Une version taguée garde « ✓ taguée », et une version à venir garde « — ».
- [ ] Un lot publié sans `etat` est rangé comme aujourd'hui.

## Comment vérifier

1. Les tests du traducteur et de la vue d'ensemble passent :
   `pnpm exec vitest run products/cop1/packages/app/src/features/board`, puis
   `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, `curl -s http://127.0.0.1:<port>/api/board` ne cite plus v0.24.0 dans
   `versions.upcoming`.
3. La vue d'ensemble montre v0.23.0 et v0.24.0 avec « à clore ». Capture avant et après dans
   `docs/pr-evidence/20261102100505774/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B3), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts:162`, qui ignore `ecartees`
  et `etat`.
- Voisine : le contrat JSON de la méthode (ADR-086). Si une fiche de traduction du plan existe au
  moment du groom, enrichir celle-là plutôt que garder deux fiches.
- **Groomée le 2026-11-03** (run autonome) : le défaut est confirmé dans le code. Le
  traducteur range un lot selon sa seule étiquette (`ezkPlanTranslator.ts`, `upcoming` et `past`), sans
  lire `etat`. Aucune autre fiche ne traduit le plan : rien à fusionner. L'écran change : preuve avant et
  après exigée.
