---
date: 2026-10-08
session: "main / vectorz"
type: friction
---

# Tester dans un worktree en retard sur main donne de faux rouges

Symptôme (2026-10-08) : test-links-repo puis check-fiches rouges dans un worktree, sur des états déjà corrigés sur main (ADR-0068 pointait vers une fiche pas encore en done/ ICI ; le split avait tourné sur main). Cause : tout le travail backlog était committé sur main via git -C <principal>, pas sur la branche du worktree, qui restait en retard. Geste : avant de valider les gates depuis un worktree, le remettre à l'état réel — git reset --hard main (sûr quand rien d'unique au worktree : git log main..HEAD vide). Sinon on diagnostique des régressions fantômes.
