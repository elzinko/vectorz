# Journal des difficultés — feat/20261031160441412-mission-control-consomme-ezk

## [20261031160441412] Capture avant/après sans Playwright
- **Coincé** : pnpm exec playwright screenshot échoue : le navigateur de Playwright n'est pas installé sur le poste, et l'installer est un téléchargement
- **Réglé** : PR_EVIDENCE_SHOT_CMD pointe vers un petit script qui lance le Chrome du poste en mode headless, avec un profil jetable et --virtual-time-budget=6000 pour laisser arriver les données live
- **Pourquoi** : le contrat du backend de capture (4 arguments) permet de changer d'outil sans toucher à ezk evidence

## [20261031160441412] Sous-agent ezk-dev isolé dans son propre worktree
- **Coincé** : le harnais a refusé l'accès au worktree de la story et a fait travailler l'agent dans .claude/worktrees/agent-<id>, sur sa propre branche
- **Réglé** : l'agent est parti du sommet de la branche de la story ; ses commits sont revenus par git merge --ff-only, puis son worktree et sa branche ont été supprimés après comparaison des sommets
- **Pourquoi** : donner au sous-agent le sommet de la branche permet un rapatriement en avance rapide, sans patch
