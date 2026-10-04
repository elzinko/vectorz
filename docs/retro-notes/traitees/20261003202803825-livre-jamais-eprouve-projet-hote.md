---
date: 2026-10-03
session: test du cycle local sur le banc cop1-cobaye (branche claude/github-workflow-user-story-276456)
type: problème
---

# Le mode local était livré, mais n'avait jamais tourné dans un projet hôte

**En clair.** Le mode local de la méthode (`github: false`) est livré depuis septembre par quatre
PR. Ses tests unitaires étaient verts. Le 2026-10-03, on l'a fait tourner pour la première fois
dans un vrai projet hôte : 16 gênes, dont 4 bloquantes. Rien n'oblige à prouver une capacité dans
un projet hôte avant de la livrer.

## Ce qui s'est passé

- Les PR #250, #252, #253 et #259 ont livré le fichier de PR local, son émetteur, le câblage
  d'`ezk-pr` et l'interrupteur `ezk config github`.
- Premier usage réel, sur `~/git/bacasable/cop1-cobaye` : une story livrée de bout en bout
  (`47c5f65`, rangée en `68d0797`), mais avec cinq contournements.
- Les 4 défauts bloquants ont été fichés puis corrigés le 2026-10-04 (squash local `eb8de257`) :
  `features/done/20261003200945204_mode-local-depuis-projet-hote.md`.
- La liste complète des 16 gênes est dans `features/0171-adapter-github-issues-push-only.md`,
  section « Gênes relevées au test du cycle local ».

## À juger en rétro

Une capacité destinée aux projets hôtes se prouve une fois sur le banc `cop1-cobaye` avant son
ship. Le banc repart de son étiquette `banc-vierge` (`git reset --hard banc-vierge`).

Mesure proposée : sur les 3 prochaines capacités destinées aux projets hôtes, 0 gêne bloquante au
premier usage hors vectorz.
