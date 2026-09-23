---
id: "20260923220631498"
title: "Portier ezk-archive — le compte annoncé doit égaler l'énumération (ou dire « X/Y »)"
type: bug
priority: P2
product: mega-city
version:
epic:
labels: [ezk-archive, outillage]
depends: []
status: idea
ready:
pr:
created: 2026-09-24
---

## En clair

Le portier de clôture (`ezk-archive`) annonce un nombre de branches absorbées **plus grand** que
ce qu'il liste : `branch_absorbed=26`, mais seulement **16** lignes émises (le cap `MAX_FACTS`
tronque la liste, pas le compteur). Un compte qui contredit sa propre liste **masque du travail** —
ici des branches non mergées, l'inverse du job « ne rien perdre entre sessions ». On veut que le
compte annoncé **égale** l'énumération, ou qu'il dise franchement **« X sur Y »**.

## Contexte / Problème

Constaté à la clôture du **2026-09-21** (worktree `models-per-client-config-ad598f`, note de carnet
`docs/retro-notes/traitees/20260921152637187-…`) : `scripts/check.sh --gate --point 2` a affiché
`branch_absorbed=26` mais n'a émis que **16** lignes `[P2] branch ABSORBED … safe_delete=1`. Le
compteur est calculé indépendamment de la liste qu'il résume ; quand `MAX_FACTS` tronque la liste,
compte et énumération divergent **en silence**.

Enjeu : ce portier existe pour ne **rien perdre** entre sessions. Sous-compter (ou sur-annoncer) des
branches, c'est exactement le risque qu'il doit couvrir.

## Proposition

Aligner le compteur sur ce qui est réellement montré (règle de rétro
[`documentation-guidelines/human-facing-lisibility`](../products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md),
puce « A count shown next to a truncated list ») :

- soit **relever la borne** (`MAX_FACTS`) pour que tout soit énuméré quand le volume est raisonnable ;
- soit, quand le cap mord, **afficher « 16 sur 26 (tronqué) »** au lieu du total nu.

Le compteur DOIT dériver de la **même source** que la liste (pas d'un calcul parallèle).

## Critères d'acceptation

- [ ] Sous le cap : `lignes émises == compte annoncé` (aucun écart silencieux).
- [ ] Au-dessus du cap : le libellé porte explicitement **« X sur Y »** (tronqué), jamais le total seul.
- [ ] Un test du portier couvre les deux cas (sous et au-dessus du cap) et **rougit sur l'écart actuel**.

## Comment vérifier

```bash
# fixture avec > MAX_FACTS branches absorbées → la sortie du portier dit « X sur Y », et
# lignes-émises == compte quand le volume est sous le cap.
bash products/mega-city/skills/ezk-archive/scripts/check.sh --gate --point 2   # (sur un repo de test)
```

## Notes / décisions

- **Origine** : note de carnet du 2026-09-21, remontée à la rétro du 2026-09-24 (« versions + config github »).
- **Priorité** : posée **P2** (bug d'affichage, correctif court ; l'énumération existe, seul l'affichage
  du total triche). Le PO peut la monter **P1** (argument : un compteur qui masque des branches non
  mergées touche au cœur « ne rien perdre »). À trancher au tirage.
- Compose la règle de lisibilité (compteur ≠ énumération) posée à la même rétro — la règle dit *quoi*,
  cette fiche *où* (le portier `check.sh`).
