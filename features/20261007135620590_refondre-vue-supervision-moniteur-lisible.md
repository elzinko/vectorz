---
id: "20261007135620590"
title: "Refondre la vue de supervision du Moniteur pour qu'elle soit lisible"
type: feature
priority: P1
product: cop1
milestone:
version: V0.7
labels: [supervision, moniteur, lisibilite]
status: idea
pr:
evidence: before-after
created: 2026-10-07
---

# 20261007135620590 — Refondre la vue de supervision du Moniteur pour qu'elle soit lisible

**En clair.** Le Moniteur montre bien les runs, mais il se lit mal : on ne voit pas d'un coup d'œil
ce qui s'est passé, le coût en tokens s'affiche « non mesuré » partout, et deux vues du même projet
se contredisent (une dit « aucun run », l'autre en montre 32). On veut le refondre pour qu'il soit
lisible. Avant de coder, on fait un **gros brainstorming** avec le PO, qui débouche sur une
**maquette** ; c'est ce travail-là qui remplit cette fiche.

**Si tu arrives frais.** Le *Moniteur* est la webapp (produit cop1) qui lit le journal de
supervision (`.supervision/runs/`) et affiche les *runs* (un passage d'une méthode) et leurs
*jalons* (checkpoints de sprint, inter-sprint, dérives de tokens). Une *maquette* est une page
d'exemple du nouvel écran, sans le vrai code derrière.

## Contexte / Problème

Constaté le 2026-10-07, en regardant le vrai Moniteur live (vectorz · 32 runs) :

- **Pas lisible d'un coup d'œil.** Les cartes de run mélangent méthode, siège, dates, note de
  l'agent et jalons sans hiérarchie claire. On ne sait pas où regarder en premier.
- **« Tokens non mesurés » partout.** Le coût en tokens d'un run n'est pas capté, donc la colonne
  la plus utile pour piloter est vide. Le PO : « c'est problématique ».
- **Deux vues se contredisent.** La fiche projet affiche « 32 runs », mais sa vue détaillée dit
  « Aucun run… pas encore d'activité observée » et « Historique récent : aucun run passé trouvé ».
  Il faut cliquer « Voir tous les runs » pour voir les 32.
- **Maille run/jalon, pas métier.** On voit des runs et des gates, pas « par version / sprint /
  fiche » — ce que le socle de la V0.7 doit apporter.

Une première vue rapide des mêmes 32 runs a été montée à part (page claude.ai, lien en Notes). Elle
sert de référence de ce qui se lit facilement, pas de cible finale.

## Proposition

À élaborer **au grooming, avec le PO**, en deux temps :

1. **Un gros brainstorming** (product-brainstorming) : qui regarde cet écran et pour quoi faire,
   qu'est-ce qu'on veut voir d'un coup d'œil, quelles questions l'écran doit répondre (« où en
   suis-je », « qu'est-ce qui a coûté cher », « qu'est-ce qui a bloqué »). On distingue ce qui
   relève de la **présentation** (cette fiche) et ce qui relève de la **donnée manquante** (les
   tokens, la clé par fiche/sprint/version — ça, c'est le socle, voir Notes).
2. **Une maquette** du nouvel écran, itérée avec le PO jusqu'à accord. La maquette validée devient
   l'artefact de référence de la fiche ; les critères d'acceptation en découlent.

POC d'abord (l'écran se lit), polish ensuite.

## Critères d'acceptation

> À remplir au grooming, une fois la maquette validée. Graines connues, à confirmer :

- [ ] Un lecteur neuf dit, en regardant l'écran sans explication, ce qui s'est passé et où regarder.
- [ ] Le coût en tokens d'un run est visible (ou son absence est explicite et justifiée, pas un
      « non mesuré » muet).
- [ ] Une seule vérité par projet : plus de « 0 run » d'un côté et « 32 » de l'autre.
- [ ] Une preuve **avant / après** en PR (règle `development/pr-before-after-media`).

## Comment vérifier

> À définir au grooming. Pistes : la maquette relue par le PO et par un persona « nouveau venu » ;
> l'écran réel comparé à la maquette ; `pnpm --dir products/cop1/packages/web build`.

## Glossaire

- **Moniteur** — la webapp cop1 qui lit le journal de supervision et affiche les runs.
- **Run** — un passage d'une méthode, du début (`run.started`) à la fin (`run.finished`).
- **Jalon** — un point où la méthode s'arrête et annonce quelque chose (checkpoint, inter-sprint).
- **Maquette** — une page d'exemple du nouvel écran, pour décider avant de coder.

## Notes / décisions

- 2026-10-07 : créée à la demande du PO en regardant le Moniteur live (« je trouve que ce n'est pas
  très lisible »). Anti-doublon fait : aucune fiche de refonte du Moniteur n'existe.
- **Version V0.7 « Voir sous le capot »**, volet **interface**. Elle est la sœur du socle, la clé de
  voûte [20261004101755756](20261004101755756_contrat-bus-catalogue-moments.md) (ready, P1, V0.7) :
  le PO a choisi « socle d'abord », donc l'ordre de BUILD est socle → cette refonte.
- **Le PO participe au grooming** : le brainstorming et la maquette se font avec lui, pas en
  autonomie.
- **Les tokens non mesurés sont un sujet de SOCLE, pas d'affichage.** Le journal ne capte pas le
  coût ; ça relève du cluster métriques ([0052](0052-socle-metrique-port-adaptateur-silo.md),
  [0055](0055-kpi-agreges-commit-pr-sprint-version.md)) et de l'attribution best-effort des tokens
  (ADR-0044). Peut devenir sa propre fiche ; à trancher au brainstorming.
- Voisines, à regarder au grooming : « cop1 — afficher les itérations lancées avec leurs
  paramètres » ([20260906142654370](20260906142654370_cop1-afficher-iterations-lancees-parametres.md)),
  « une page : une ligne par projet » ([20261002115451451](20261002115451451_page-une-ligne-par-projet.md)),
  « viz qualité par PR » ([0056](0056-viz-qualite-mission-control.md)).
- Référence « ce qui se lit » : page rapide des 32 runs, https://claude.ai/artifact/5EevcXyhCQ14AEqnr3HEte
