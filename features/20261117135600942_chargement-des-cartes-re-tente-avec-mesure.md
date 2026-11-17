---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117135600942"
title: Le chargement des cartes re-tente avec mesure, puis dit pourquoi il s'arrête
type: bug
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, carte]
status: ready
pr:
evidence: none # pas de changement visible tant que le daemon répond
created: 2026-11-17
---

# 20261117135600942 — Le chargement des cartes re-tente avec mesure, puis dit pourquoi il s'arrête

**En clair.** Les deux cartes de mission control, Process et Carte de la méthode, chargent leurs
données par le même mécanisme. Aujourd'hui, si le daemon dit « je lis encore », la page redemande toutes
les 2 secondes, sans fin. Et si le réseau coupe une seule fois, la page affiche « injoignable » pour
toujours, même quand le daemon revient. On borne la première attente et on re-tente la seconde.

**Si tu arrives frais.** Le daemon est le petit serveur local de mission control. Il lance les
commandes `ezk` et relaie leurs réponses aux pages. La lecture d'un contrat peut prendre quelques
secondes.

## Contexte / Problème

Relevé par les revues adverses du 2026-11-15 (carte Process) et du 2026-11-17 (carte de la méthode),
non bloquant à chaque fois. Le mécanisme est partagé depuis le 17 novembre :
`products/cop1/packages/web/src/board/useDaemonContract.ts`.

## Proposition

1. « En cours de lecture » : re-tenter toutes les 2 secondes, au plus 30 fois (une minute), puis dire
   « le daemon lit encore ce contrat depuis plus d'une minute ».
2. Erreur réseau : re-tenter 3 fois, après 2, 4 puis 8 secondes, avant de dire « injoignable ».
3. Changer de projet, ou quitter la page, arrête toute re-tentative en cours.

## Critères d'acceptation

- [x] Après 30 réponses « en cours de lecture », la carte dit qu'elle attend depuis plus d'une minute
      et cesse de redemander.
- [x] Une erreur réseau suivie d'une réponse correcte affiche la carte, sans rechargement de la page.
- [x] Après 4 erreurs réseau de suite, la carte dit « injoignable » et cesse de redemander.

## Comment vérifier

```bash
cd products/cop1/packages/web && pnpm exec vitest run src/board/ProcessMap.test.tsx src/board/GraphMap.test.tsx
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 3 critères prouvés par des tests à horloge simulée. Vérifié dans le navigateur : les deux cartes chargent sur le daemon réel. Reste ouvert, non bloquant : une réponse HTTP illisible est dite « injoignable » alors que le serveur a répondu (comportement hérité).


- Origine : [rétro du sprint 4 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-4-petites-reparations.md),
  proposition 3, retenue par délégation du PO absent.
