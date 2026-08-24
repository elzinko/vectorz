---
id: "20260821163346503"
title: La méthode s'auto-évalue : sa cohérence, et la fidélité de sa représentation
type: feature
priority: P3
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---
# Est-ce que la méthode peut se noter elle-même ?

## En clair

Question ouverte du PO : *« comment la méthode elle-même peut-elle s'auto-évaluer sur sa
propre validité et la validité de sa représentation ? »* C'est la fiche la plus lointaine
de l'épic — une direction, pas encore un chantier.

## Contexte / Problème

L'audit du 2026-08-20 a produit des chiffres qui ressemblent déjà à une note :

- 19 décisions d'architecture sur 29 restées à l'état de proposition ;
- 11 contradictions entre décisions, dont une qui cassait un artefact utilisé ;
- 2 commandes sur 23 déclaraient leurs dépendances (avant correction) ;
- 4 cartes concurrentes de la méthode, aucune générée, donc toutes en dérive.

Ces mesures ont été faites **à la main**, une fois. Rien ne les rejoue.

## Proposition

À groomer — et à cadrer avant tout : **une note qui ne déclenche rien ne sert à rien.**
Le risque est de fabriquer un tableau de bord que personne ne regarde.

Pistes :
- quelques indicateurs **calculables** : part des décisions ratifiées, contradictions
  détectées, part de la carte sourcée, part revue et fraîcheur de la revue ;
- un **seuil** qui déclenche une action (une cérémonie d'amélioration, une fiche), pas
  seulement un affichage ;
- afficher la note **sur la carte elle-même** : la représentation dit à quel point on peut
  s'y fier.

⚠️ Ne pas confondre avec le contrat d'améliorabilité déjà décidé côté ombrelle, qui traite
de l'auto-amélioration **mesurée** du produit. Frontière à écrire au grooming.

## Critères d'acceptation

- [ ] Les indicateurs sont **calculés par un script**, jamais estimés à la main.
- [ ] Chaque indicateur a un **seuil** et une action associée.
- [ ] La note est visible là où on lit la méthode.
- [ ] La frontière avec le contrat d'améliorabilité existant est écrite.

## Comment vérifier

Rejouer le calcul à deux dates et comparer. Si la note ne bouge pas alors que la méthode a
bougé, l'indicateur est mauvais.
