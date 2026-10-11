---
id: "20261007135620590"
title: "Unifier les tableaux de bord en un seul (Moniteur + cockpit + board), guidé par maquette"
type: feature
priority: P1
product: cop1
milestone: parked
version:
labels: [supervision, moniteur, cockpit, board, lisibilite, ux]
status: idea
blocked: "re-scopée en refonte unifiée (PO 2026-10-11) ; maquettes en cours de production + évaluation par agents UX/UI ; à versionner et dé-parker une fois la maquette validée par le PO"
pr:
evidence: before-after
created: 2026-10-07
---

# 20261007135620590 — Unifier les tableaux de bord en un seul, guidé par maquette

**En clair.** Aujourd'hui il y a **trois tableaux de bord éparpillés** : le Moniteur (les runs), le
cockpit (les projets et leur config), et ezk:map/board (le plan, le board, les sprints). On ne sait
pas où regarder, les vues se contredisent, et le coût en tokens s'affiche « non mesuré » partout. On
veut **un seul tableau de bord lisible** qui réunit ces trois surfaces. Avant de coder, on produit
**une ou deux maquettes**, on les fait **départager par des agents UX/UI**, et la maquette retenue
(validée par le PO) devient la cible de la fiche.

**Si tu arrives frais.** Une *maquette* est une page d'exemple du nouvel écran, sans le vrai code
derrière. Les trois surfaces à unifier :
- le **Moniteur** — webapp cop1 qui lit le journal de supervision (`.supervision/runs/`) et affiche
  les *runs* (un passage d'une méthode) et leurs *jalons* (checkpoints) ;
- le **cockpit** — tableau de bord multi-projets (v0.6) : choisir un projet, voir sa config, ses fiches ;
- **ezk:map / board** — les vues côté méthode : accueil, vue Plan, board d'avancement, sprints réalisés.

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

**Objectif : un seul tableau de bord** qui réunit les trois surfaces (Moniteur, cockpit, board), avec
une hiérarchie claire — « où en suis-je », « qu'est-ce qui a coûté cher », « qu'est-ce qui a bloqué ».
On distingue ce qui relève de la **présentation** (cette fiche) et de la **donnée manquante** (les
tokens par fiche/sprint/version — c'est le socle, voir Notes).

Démarche **guidée par maquette**, avec un départage UX :

1. **Une ou deux maquettes** du tableau de bord unifié (pages d'exemple, sans backend).
2. **Départage par des agents UX/UI** : on leur fait évaluer et tester les maquettes contre des
   critères d'usage (lisibilité au premier coup d'œil, hiérarchie, une seule vérité par projet,
   parcours « où en suis-je »), et ils disent **laquelle est la mieux** et pourquoi.
3. **Validation PO** : le PO tranche sur la maquette gagnante (ou demande une itération). La maquette
   validée devient l'**artefact de référence** de la fiche ; les critères d'acceptation en découlent.

POC d'abord (l'écran se lit), polish ensuite.

## Critères d'acceptation

> À remplir au grooming, une fois la maquette validée. Graines connues, à confirmer :

- [ ] La maquette retenue **réunit les trois surfaces** (runs, projets/config, plan/board/sprints) en un seul écran cohérent.
- [ ] La maquette a été **départagée par des agents UX/UI** (verdict + justification) avant la validation PO.
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
  voûte [20261004101755756](done/20261004101755756_contrat-bus-catalogue-moments.md) (ready, P1, V0.7) :
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

## Re-scope — refonte unifiée (PO 2026-10-11)

Le PO a élargi la fiche : au-delà de la vue de supervision du Moniteur, **unifier les trois tableaux
de bord éparpillés** (Moniteur + cockpit + board) en un seul. Démarche demandée : je produis **une ou
deux maquettes**, je les fais **tester et départager par des agents UX/UI**, le PO tranche sur la
gagnante. La fiche reste parkée tant que la maquette n'est pas validée ; ensuite on la versionne
(place pressentie : près de **v0.15 « Voir les runs »**, ou une version UX dédiée) et on la dé-parke.
Lien décision de regroupement des commandes : [brainstorm CLI/DSL](20261010153046143_brainstorm-dsl-cli-methode.md)
(`dashboard` + `map` → `board`).

## Sortie de v0.7 — parkée (run autonome 2026-10-11)

Sortie de v0.7 par le run autonome `ezk-product-build` : **non construisable sans geste humain**. La
fiche dit elle-même qu'elle commence par un **gros brainstorming avec le PO débouchant sur une maquette**
— donc une décision/un geste produit, hors d'un build autonome ; et c'est une **webapp cop1** (hors du
périmètre vectorz de ce run, besoin du banc). Les 3 autres fiches v0.7 ont été livrées ; celle-ci est
**parkée, sans version**, pour laisser la v0.7 se clore. **À re-verser par le PO** (re-mettre `version:`
+ dé-parker) après le brainstorming et la maquette.
