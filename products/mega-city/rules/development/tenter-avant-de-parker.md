---
id: development/tenter-avant-de-parker
kind: disposition
level: MUST
title: Tenter avant de mettre une fiche de côté — le park est un constat après tentative, jamais un pré-filtre
---

- **En clair.** Un run autonome a mis 16 fiches de côté au lieu de les tenter : il a jugé « pas
  construisible » sans groomer ni essayer. Comme tout est local et annulable, la bonne règle est :
  **on tente d'abord, on annule si ça rate.** Mettre une fiche de côté (« park ») est le **dernier
  recours après une vraie tentative**, jamais le premier réflexe.
- **La règle.** Une fiche tirable de la version est **auto-groomée puis tentée en sprint au moins une
  fois** avant tout park. Le park ne se déclenche que sur un **blocage prouvé pendant la tentative**
  — une dépendance qui ne répond pas, une gate rouge irréductible, un conflit d'ADR constaté, ou une
  des 4 décisions humaines. Jamais sur une prédiction « ça n'a pas d'outcome testable » lue **avant**
  d'avoir groomé. Le plancher outcome-testable reste, mais ne s'applique qu'**après** l'étape de
  cadrage, pas à sa place.
- **Pourquoi c'est gratuit.** Le flux est tout-revertible : worktrees d'agents isolés, squash-merge
  local, `github: false`, rien de poussé. Le coût d'un groom raté est nul ; celui d'un park prématuré
  est une fiche perdue pour la version, découverte trop tard par le PO.
- **Mesure (retirabilité).** Sur les 5 prochains runs autonomes : **0 fiche parkée sans une ligne de
  journal (`SPRINT.md`) attestant une tentative** — un SHA de commit d'essai, ou « tenté X, bloqué
  sur Y ». Une fiche parkée sans trace de tentative est un échec de cette règle.
- **Origine.** Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`),
  run v0.19→v0.22 : 16/22 fiches parkées, auto-groom jamais lancé. Resserre la doctrine groom/park
  d'ADR-0028 sans la remplacer.
