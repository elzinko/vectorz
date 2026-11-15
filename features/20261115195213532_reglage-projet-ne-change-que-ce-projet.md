---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213532"
title: Les réglages ⚙ préviennent qu'ils valent pour tous les projets
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-15
---

# 20261115195213532 — Les réglages ⚙ préviennent qu'ils valent pour tous les projets

**En clair.** Dans mission control, le panneau ⚙ modifie une config commune à tous tes projets. Tu
ouvres les réglages depuis un projet, tu changes une valeur, et les autres projets changent aussi.
La fiche propose de le dire au moment où tu modifies, pas seulement dans un sous-titre.

**Si tu arrives frais.** Mission control est l'écran de pilotage de la méthode (produit cop1). Une
config a deux portées : celle du **poste**, commune à tous les projets de la machine, et celle du
**projet**, qui voyage avec le dépôt.

## Contexte / Problème

La passe du scout du 2026-11-04 a relevé ce symptôme. Elle n'a pas fiché le bug, faute de temps.

Le partage est voulu. Le code de `products/cop1/packages/web/src/board/ToolConfigView.tsx` le dit :
le sous-titre affiche « global · partagé par tous tes projets ». Le modèle à deux portées vient de
l'ADR-074.

Le problème est la surprise. Le panneau s'ouvre depuis un projet. Rien, au moment d'enregistrer, ne
rappelle que le changement touche aussi les autres projets.

## Proposition

1. Garder le partage tel qu'il est : il est voulu.
2. Avant d'enregistrer, montrer une ligne claire : « Ce réglage vaut pour tous tes projets ».
3. Si un projet surcharge déjà ce réglage, le dire aussi : le changement ne s'y verra pas.

## Critères d'acceptation

- [ ] Avant d'enregistrer un réglage commun, l'écran dit qu'il vaut pour tous les projets.
- [ ] Un projet qui surcharge ce réglage est nommé au même endroit.
- [ ] Le comportement d'écriture ne change pas : la config du poste reste la seule cible.

## Comment vérifier

À préciser au grooming. Piste : ouvrir le panneau ⚙ depuis deux projets, modifier une valeur, puis
comparer l'écran avant et après.

```bash
cd products/cop1/packages/web && pnpm exec vitest run
```

## Notes / décisions

- Source : session du 2026-11-04, `docs/sessions/2026-11-04-run-autonome-sprints-7-26.md`, ligne 33.
- Priorité P3 donnée par le PO le 2026-11-15.
- À trancher au grooming : l'avertissement suffit-il, ou faut-il un choix « ce projet seulement » ?
