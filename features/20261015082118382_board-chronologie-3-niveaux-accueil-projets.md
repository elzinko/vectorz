---
id: "20261015082118382"
title: "Board : chronologie à 3 niveaux (D+B) + accueil « Tous les projets »"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.23.0
labels: [dashboard, board, ux, supervision, multi-session]
status: idea
blocked:
pr:
evidence: before-after # l'écran chronologie + l'accueil, avant/après multi-sessions
created: 2026-10-15
---

# 20261015082118382 — Board : chronologie à 3 niveaux + accueil « Tous les projets »

**En clair.** C'est l'écran. On montre la chronologie en **3 niveaux** — les chantiers → un
chantier (ses ouvriers + leur fil fusionné) → un ouvrier (son fil à lui) — et un **accueil « Tous
les projets »** qui montre la flotte avant d'entrer dans un projet. La maquette est déjà faite et
validée ; ici on la construit.

**Si tu arrives frais.** Maquette de référence :
[board-runs-concurrents.html](../docs/maquettes/board-runs-concurrents.html) (cas 6 chronologie,
cas 8 accueil) ; décision [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md)
§D11.

## Contexte / Problème

La chronologie validée de v0.17 est un fil unique sans notion de session, bâtie sur l'axiome « un
run = une session » qu'ADR-079 remplace. La vue des projets passe par une liste déroulante qui ne
montre jamais la flotte. On construit les deux surfaces sur le nouveau read-model.

## Proposition (maquette cas 6 et 8 ; ADR-079 §D11)

- **Chronologie D+B, 3 niveaux** : (1) les chantiers (vue globale) → (2) un chantier, avec la
  **liste de ses sessions** (hiérarchie) + son **fil fusionné** (évènements étiquetés par session)
  → (3) une session, son **fil propre**. Le menu de gauche sert de liste **et** de filtre.
- **Accueil « Tous les projets »** : chaque projet avec son compte de sessions et leur état ; on
  clique pour entrer dans le board d'un projet (inchangé) ; la déroulante reste un raccourci.
- Servies **live**, jamais committées (ADR-0043/0055).

## Critères d'acceptation

- [ ] La chronologie se navigue en 3 niveaux (chantiers → chantier → session) ; chaque évènement
      d'un fil fusionné porte le libellé de sa session.
- [ ] L'accueil « Tous les projets » liste les projets avec leurs sessions et états ; un clic entre
      dans un projet ; la déroulante reste disponible.
- [ ] Aucune ligne n'affiche un identifiant opaque comme seule identité.
- [ ] Rien n'est écrit sur disque (live only).

## Comment vérifier

- `pnpm --dir products/cop1/packages/web build` passe.
- Parcours filmé : accueil → un projet → un chantier (2 sessions) → une session.
- Vérifier qu'aucun fichier de vue n'est créé/committé après ouverture.

Preuve : before/after de la chronologie (fil unique → 3 niveaux) et de l'accueil.

## Notes / décisions

- Dépend du [read-model](20261015082118353_board-read-model-chantier-sessions-evenements.md) et de
  la [découverte des worktrees](20261015082118368_board-decouverte-worktrees-watch-dynamique.md).
- **Sœurs (sans chapeau)** : émetteur, read-model, découverte, étape d'accueil —
  `milestone: board` + `v0.23.0`.
- Contraint les tranches v0.17 [activité run→moments→fiches](20261012231419211_board-activite-run-moments-fiches.md)
  et [chronologie condensée](20261012231419237_board-chronologie-condensee.md) : les construire
  **sans graver « run = session »** pour que cette fiche étende au lieu de réécrire.
