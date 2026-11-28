# Vérifier la branche feat/ du run avant de retirer un chemin concurrent

Session du 2026-11-15, fiche 20261110191135802 (étapes fines). Le pilote d'un run autonome avait annoncé le départ du sprint avant `ezk-sprint start`. La session de cadrage a donc retiré sa propre carte de sprint trop tôt, puis constaté que la branche feat/20261110191135802-etapes-fines (worktree .claude/worktrees/ezk-product-build-autonomy-060fc6) existait bien : le départ était réel, mais rien ne le garantissait au moment du retrait.

Proposition : avant de retirer un chemin concurrent, vérifier que la branche feat/<id>-<slug> existe (`git branch --list 'feat/<id>*'`), pas seulement l'annonce du pilote.
