---
id: "20261117141828100"
title: "Le portier d'ezk-sprint dit quand une copie voisine est tenue par une session active"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [sprint, portier, sessions-paralleles]
status: shipped
blocked:
pr: "local (062937f2)"
evidence: none # un script de contrôle, aucun écran modifié
created: 2026-11-17
---

# 20261117141828100 — Le portier d'ezk-sprint dit quand une copie voisine est tenue par une session active

**En clair.** Le 17 novembre, deux pilotes autonomes travaillaient sur vectorz. Le portier d'ouverture
de sprint a signalé la copie de l'autre comme « non mergée », sans dire qu'une session vivante la
tenait. La seconde session l'a rejointe et a rejoué sa gate pendant que la première l'intégrait :
environ 100 000 jetons pour rien. Le portier dit désormais quand une copie voisine est tenue par une
session active, et propose de se coordonner plutôt que de rejoindre.

**Si tu arrives frais.** Le portier est `skills/ezk-sprint/scripts/check.sh --gate`, lancé par
`sprint.sh start`. Son point P2 liste les copies voisines du dépôt (les worktrees git). La commande
`ezk sessions state` sait déjà dire si un worktree est tenu par une session active.

## Contexte / Problème

- Ligne vue le 17 novembre : `[P2] ALERT …/ezk-product-build-autonomy-060fc6 branch=feat/20261110185357446-schema-process-zoomable raison=unmerged`.
- Au même moment, `ezk sessions state` disait de ce dossier « session active — garder ».
- Le choix « Rejoindre » du gabarit de choix a été pris sur la seule raison `unmerged`.

## Proposition

Le point P2 du portier réutilise le calcul d'`ezk sessions state` : une copie tenue par une session
active porte `raison=session-active`, quelle que soit son autre raison. Le gabarit de choix dit alors
« une autre session y travaille : coordonne-toi avec elle, ne rejoins pas ».

## Critères d'acceptation

- [x] Une copie voisine à risque (signalée) tenue par une session active porte `raison=session-active` sur sa
      ligne P2 ; une copie sûre (principal, réserve, fusionnée) reste ignorée, même avec une session.
- [x] Le calcul « session active » vient du même code qu'`ezk sessions state`, sans second calcul.
- [x] Le gabarit de choix d'ezk-sprint dit, pour `session-active`, de se coordonner au lieu de rejoindre.

## Comment vérifier

```bash
pnpm --dir products/mega-city test:scripts   # le cas « copie tenue par une session active » est vert
```

## Notes / décisions

- Livrée le 2026-11-17. Revue ezk-reviewer : NO-GO d'abord (la promotion `session-active` écrasait les copies sûres, le dossier principal serait passé en alerte à presque chaque sprint), puis GO après correctif. Critères prouvés : copie à risque + session fraîche → `raison=session-active`, copie sûre + session → reste ignorée ; même calcul qu'`ezk sessions state` (`ezk-sessions active`) ; le gabarit de choix dit « se coordonner, ne pas rejoindre ». Best-effort hors monorepo : sans `tsx`, le portier garde ses raisons d'avant.

- Origine : [rétro du 17 novembre, deux pilotes sur un dépôt](../../docs/captures/2026-11-17-retro-sprint-objectifs-versions-deux-pilotes.md), proposition P1.
- Priorité P1 tranchée par ezk-pm le 17 novembre, par délégation du PO.
- Mesure (retirabilité) : 0 fiche intégrée deux fois sur les 5 prochains runs parallèles.
