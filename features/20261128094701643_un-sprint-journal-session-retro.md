---
id: "20261128094701643"
title: "La page d'un sprint montre son journal, sa session et sa rétro"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, sprints]
status: ready
blocked:
depends: ["20261128094701629", "20261128093846710"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701643 — La page d'un sprint montre son journal, sa session et sa rétro

**En clair.** Sur la page d'un sprint, trois cartes disent « non publié » : Session, Dans le journal, Rétro.
Le journal de supervision et les captures de rétro existent pourtant. On branche ces trois cartes.

**Si tu arrives frais.** Le journal de supervision note les moments d'un lancement : démarrage, fin de
sprint, reprise, fin. Le daemon de mission control le lit déjà. Une rétro laisse une capture datée.
Mission control n'invente rien (ADR-086). La maquette est la référence d'écran du PO : page « Un sprint ».

## Contexte / Problème

La maquette montre, pour un sprint : sa session (branche, type de lancement), quatre lignes de journal
(« 11:41 Lancement », « 11:44 Fin de sprint », « Reprise », « Fin du lancement »), et sa rétro (faite ou
non, la précédente). L'app affiche « non publié » aux trois endroits.

## Proposition

1. **Dans le journal** : les moments du lancement qui tombent dans la fenêtre du sprint, heure, nom en
   français et détail. Source : le journal de supervision que le daemon lit déjà. Hors fenêtre publiée,
   la carte dit « non publié ».
2. **Session** : la branche publiée du sprint, avec un lien vers la page de la session.
3. **Rétro** : « faite » avec un lien vers la rétro quand une capture nomme ce sprint ; sinon « pas encore
   de rétro ». La ligne « Précédente » nomme la capture précédente.
4. **Compte rendu** : le bouton « Afficher » ouvre le fichier du compte rendu (page « Un fichier
   Markdown »).

## Critères d'acceptation

- [ ] La carte « Dans le journal » liste les moments du lancement dans la fenêtre du sprint, dans l'ordre.
- [ ] La carte « Session » nomme la branche publiée et mène à la page de la session.
- [ ] La carte « Rétro » dit si une capture couvre ce sprint, d'après les captures publiées.
- [ ] Un sprint ancien, sans fenêtre ni branche publiées, garde « non publié ».
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Un sprint : http://localhost:5274 → Sprints → le sprint le plus récent
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Le bouton « Afficher » attend la page « Un fichier Markdown » ; sans elle, il est masqué.
