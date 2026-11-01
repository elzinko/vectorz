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

## Comment vérifier

```bash
grep -n "0 min" docs/sprints/*.md
```

## Notes

- Née de la rétro légère du 2026-11-01 (P5 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
