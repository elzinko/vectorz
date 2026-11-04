---
id: "20261104204526516"
title: Un test vérifie que chaque écran de mission control montre ce que la méthode publie, pour chaque projet
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control, theme:qualite]
status: idea
pr:
evidence: none # un test de plus, aucun écran modifié
created: 2026-11-04
---

# 20261104204526516 — Un test vérifie les écrans de mission control, projet par projet

**En clair.** Le 2026-11-04, chaque écran de mission control a été vérifié à la main, par captures.
Une erreur est passée un moment : la vue Recettes de vectorz montrait 2 recettes au lieu de 3, parce
que l'instance lisait un autre dossier. Un test ouvre chaque vue, pour chaque projet, et compare ce
qu'elle affiche à ce que la méthode publie. « Mission control affiche les bonnes choses » devient une
vérification qu'on rejoue, plus une relecture humaine.

**Si tu arrives frais.** Mission control est l'app web de cop1 (`products/cop1/packages/web`), servie
par un démon (`packages/app`). La méthode publie ses données par `ezk … --json` ; mission control les
recopie à l'écran (ADR-086).

## Contexte / Problème

- cop1 n'a aucun test de navigateur : pas de configuration Playwright, aucune spec (constaté le
  2026-11-04). Les tests actuels rendent un composant seul, avec des données écrites à la main.
- Le 2026-11-04, la vue Recettes de vectorz montrait 2 recettes sur une instance lancée depuis un
  worktree, et 3 sur l'instance du dossier principal. samplerz et muti n'ont été vus que par une
  capture chacun.
- Le même jour, le PO a demandé que mission control « affiche les bonnes choses à chaque fois ».
  Aujourd'hui, seule une relecture humaine le garantit.

## Proposition

- Une commande locale dans cop1, lancée contre une instance qui tourne. Pour chaque projet
  enregistré, elle ouvre dans un navigateur sans écran les vues Vue d'ensemble, Fiches, Process et
  Recettes.
- Pour chaque vue, elle relit un compteur visible. Elle le compare au JSON de la méthode pour ce
  projet (`ezk board show --json`, `ezk recipes --json`). Un écart la fait échouer, en nommant la vue,
  le projet, la valeur vue et la valeur attendue.
- Elle affiche aussi le dossier que l'instance lit pour chaque projet. Un dossier de worktree, au lieu
  du dossier principal, est signalé.
- Un projet témoin permet de la jouer dans la gate de cop1, sans les vrais projets.
- Le nom de la commande se décide au grooming.

## Critères d'acceptation

- [ ] La commande couvre au moins les quatre vues citées et tous les projets enregistrés. Elle liste
  ce qu'elle a couvert.
- [ ] Un écart entre l'écran et le JSON la fait sortir en code 1, avec la vue, le projet, la valeur
  vue et la valeur attendue.
- [ ] Le dossier lu par l'instance s'affiche pour chaque projet ; un worktree est signalé.
- [ ] Sur le projet témoin, la commande passe dans la gate de cop1.
- [ ] Un écart provoqué sur le projet témoin fait échouer la commande. Exemple : une recette ajoutée
  côté méthode seulement.

## Comment vérifier

- Lancer la commande contre l'instance locale de mission control : elle passe, et liste les vues et
  projets couverts.
- Provoquer l'écart sur le projet témoin, relancer : code 1, avec la vue et les deux valeurs.
- Lancer la gate de cop1 : la commande y tourne sur le projet témoin.

## Notes

- Origine : bilan du run du 2026-11-04, demandé par le PO après l'arrêt.
- Lien utile : [la vue Recettes](done/20261104090518109_mission-control-montre-les-recettes.md), où
  l'écart 2 contre 3 a été vu.
