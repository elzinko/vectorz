---
id: 0130
title: cap global mode link — symlinker AUSSI les agents (pas seulement les skills)
type: bug
priority: P1
product: mega-city
version:
status: shipped
pr: local (squash-merge)
created: 2026-07-03
---

## Contexte / Problème

Le mode `link` du cap global (fiche 0018) ne symlinke que les **skills**
(`skills/<id>/SKILL.md`) : dans `applyGlobalPlan`, la branche `mode === 'link'`
ne traite que les fichiers finissant par `/SKILL.md` puis `return` — les
**agents** (`agents/<id>.md`, pourtant présents dans le plan) sont ignorés.
Or fiche 0017 et ADR-0006 exigent que le bind global matérialise l'équipe
**complète** (skills **et** agents), comme le faisait `install.sh` de
claude-skills. Conséquence : au switchover (fiche 0024), `~/.claude/skills/*`
bascule vers mega-city mais `~/.claude/agents/*` resterait pointé vers
claude-skills → single-source non atteint pour les agents.

Découvert en finissant 0024. En prime, en mode `copy`, l'écriture d'un agent
qui préexiste en symlink passait **à travers** le lien (corruption possible de
la source), faute du même `rm` préalable que pour les skills.

## Proposition

Étendre `applyGlobalPlan` pour traiter les agent-fichiers **symétriquement**
aux skill-dirs, dans les deux modes :
- garde non-destructive dédiée (`assertReplaceableAgent`) : remplaçable si
  inexistant ou simple symlink (le nôtre / l'ancien de claude-skills) ; un vrai
  fichier utilisateur → refus ;
- `link` : `linkAgent` symlinke `agents/<id>.md` → source du catalogue ;
- `copy` : retirer un symlink préexistant avant d'écrire le fichier figé
  (comme pour les skills) pour ne pas écrire à travers le lien.

## Critères d'acceptation
- [x] mode `link` symlinke chaque agent-fichier vers `<catalogRoot>/agents/<id>.md`
- [x] non-destructif : refuse un vrai fichier agent utilisateur ; bascule un ancien symlink
- [x] idempotent ; mode `copy` ne corrompt plus la source via un symlink préexistant
- [x] testé en temp dir (link, copy, idempotence, bascule ancien lien, refus)

## Notes

Complète le **trou** de la fiche 0018 (livrée sans le volet agents). Prérequis
au switchover complet de la fiche **0024** (`~/.claude/{skills,agents}` → mega-city).
