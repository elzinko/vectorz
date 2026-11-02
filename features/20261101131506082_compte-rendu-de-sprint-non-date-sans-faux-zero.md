---
id: "20261101131506082"
title: "Un compte rendu de sprint non daté le dit d'emblée, sans faux zéro, et le run autonome date ses sprints"
type: bug
priority: P2
product: mega-city
milestone: observabilite
version:
labels: [sprint, compte-rendu, supervision]
status: idea
pr:
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Les comptes rendus de sprint d'un run autonome commencent par « a duré 0 min et consommé 0 tokens ».
C'est faux : la durée n'a simplement pas été mesurée. Cette fiche fait dire « non mesuré » dès la
première phrase, et fait poser par le run autonome le point de passage qui permet de dater le sprint.

## Contexte / Problème

Constaté au run du 2026-11-01 : les deux comptes rendus `docs/sprints/2026-11-01-sprint-*.md`
s'ouvrent sur « 0 min » et « 0 tokens ». La raison n'arrive qu'entre parenthèses : aucun point de
passage de supervision `sprint-<slug>-checkpoint` n'a été posé. En mode autonome,
`ezk-product-build` absorbe le point de contrôle d'`ezk-sprint`, et personne ne pose ce point.

La méthode promet déjà le contraire dans `skills/ezk-sprint/SKILL.md` (section « Le compte rendu du
sprint ») : « jamais un faux zéro ». L'outil ne tient pas cette promesse. Effet de bord : la
détection des candidats-recette (`ezk-chef suggest`) ne peut pas tourner, faute de rapport daté.

Constaté aussi le 2026-11-02 : un sprint daté peut porter des chiffres absurdes. Sur 27 comptes
rendus de vectorz, 23 ont une durée de 0 et 3 seulement une durée mesurée. Deux de ces trois sont
faux :

- `2026-11-01-sprint-mission-control-lit-le-board-par-ezk.md` dit 390 h 35, 3,5 milliards de jetons
  et 49 fiches livrées, pour un sprint d'une soirée et une fiche ;
- `2026-10-17-sprint-board-multi-llm-v0-18-emetteur-contrat-0-2-journ.md` dit 3 milliards de jetons
  en 8 minutes.

La fenêtre de mesure semble partir d'un point de passage bien plus ancien que le sprint. Ces chiffres
empêchent aussi mission control d'afficher le temps et les jetons cumulés
([vue d'ensemble : sprints et rétros réels](done/20261102104443762_vue-ensemble-sprints-retros-reels.md)).

Revu le 2026-11-02 au soir, sprint 7 du run autonome : le compte rendu
`2026-11-02-sprint-mission-control-se-prot-ge-et-compte-vrai.md` est daté (1 h 25, point de passage
posé), mais il annonce « 0 fiche(s) livrée(s) » pour deux fiches livrées, et 306 millions de jetons.
Le point de passage ne suffit donc pas : le compte des fiches et la fenêtre des jetons sont faux eux
aussi.

## Valeur

Pour le PO qui relit un sprint : un chiffre faux en première phrase trompe plus qu'une absence
dite. Et un sprint daté rend la rétro outillée (recettes, durées) possible.

## Proposition

À préciser au grooming.

- Le rendu du compte rendu non daté remplace « 0 min / 0 tokens » par « durée et jetons non
  mesurés » dans sa première phrase.
- En mode autonome, le run pose le point de passage `sprint-<slug>-checkpoint` avec le slug que
  `close` dérivera de l'objectif.

## Critères d'acceptation

- [ ] Un compte rendu sans point de passage dit « non mesuré » dans sa première phrase, et aucun zéro
      de durée ou de jetons n'y apparaît.
- [ ] Au prochain run autonome, chaque compte rendu de sprint porte une durée non nulle.
- [ ] `ezk sprint report <slug>` d'un sprint de run autonome ne refuse plus faute de point de passage.
- [ ] La fenêtre d'un sprint commence à son ouverture : rejoué sur le sprint
      `mission-control-lit-le-board-par-ezk`, le compte rendu ne dit plus 390 h, ni 49 fiches livrées
      pour une seule fiche au lot.

## Comment vérifier

```bash
grep -n "0 min" docs/sprints/*.md
```

## Notes

- Née de la rétro légère du 2026-11-01 (P5 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
