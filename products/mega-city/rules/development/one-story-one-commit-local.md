---
id: development/one-story-one-commit-local
kind: disposition
level: SHOULD
title: Flux sans PR — une story atterrit comme son propre commit
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** En flux **sans PR** (`github: false`), rien n'impose plus le 1:1 story↔commit que
  « une PR par feature » garantissait. Du coup, deux stories peuvent finir **dans un seul commit
  squashé**. La règle : chaque story (y compris un enrichissement accepté en cours de sprint)
  **atterrit comme son propre commit** sur le `main` local.
- **Symptôme fondateur** (rétro du 2026-10-10) : la vue process et le fix 404 cockpit, deux stories,
  ont été livrées dans **un seul commit squashé**, sur la même branche de session — l'historique de
  `main` ne distingue plus les deux livraisons.
- **La règle.** Flux local, ≥ 2 stories : chaque story mappe **≥ 1 commit distinct** sur `main`. La
  règle n'interdit **pas** la croissance de périmètre en cours de sprint (soupape PO légitime) ; elle
  exige seulement la traçabilité commit-par-story.
- **Frontière.** Ne double pas `development/acceptance-criteria-before-merge` (le critère coché, déjà
  en loi) : le juge a scindé la proposition, la part « critère » est renvoyée au grooming
  (fiche `20261010114133469`). Ici, uniquement le grain de commit du flux local.
- **Mesure (removability).** Sur les 5 prochains sprints en ship local à ≥ 2 stories : 0 sprint
  « 2 stories / 1 commit ». Retrait quand le flux local porte toujours un commit par story.

Origine : rétro du 2026-10-10, capture
`docs/captures/2026-10-10-retro-vue-process-worktree-silences.md` (proposition 8, lentille produit,
clause réduite par le juge). Appliquée par `skill:ezk-sprint`.
