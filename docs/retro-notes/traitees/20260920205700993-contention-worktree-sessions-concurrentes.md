# Contention de worktree entre sessions concurrentes (2026-09-20)

**Symptôme.** Pendant une session (renommage `--check-ready` → `--review`, ADR-0053), le
worktree `.claude/worktrees/ready-todo-status-distinction-d96e52` a été **basculé sur une
autre branche** (`chore/add-ezk-config-fiche`, HEAD `1d84c93`) en cours de route —
vraisemblablement par une autre session active en parallèle, ou après une reconnexion MCP.
Le contenu à l'écran (fichiers, HEAD) ne correspondait plus au travail en cours ; l'ADR-0053
et le renommage avaient « disparu » du disque. Frayeur côté PO : « je ne veux pas perdre mon
travail ».

**Ce qui a sauvé la mise.** Tout était committé. Le commit `dd26ad1` restait intact sur sa
branche `claude/check-ready-grooming-params-8f3088` (non checked-out sur le moment, mais bien
présente comme référence). Rappel : git ne perd que le **non-committé**.

**Geste de récupération, sans perte.**
1. Diagnostiquer AVANT d'agir : `git worktree list`, `git rev-parse --verify <ma-branche>`,
   `git show -s <mon-commit>` — confirmer que le commit et sa branche existent.
2. Revenir : `git checkout <ma-branche>` (le worktree était propre → zéro perte ; la branche
   étrangère reste restaurable via `git checkout chore/add-ezk-config-fiche`).
3. Publier en local : `git -C <checkout-principal> merge --ff-only <ma-branche>`.

**Piste pour la rétro.** Faut-il un garde-fou contre le basculement de branche d'un worktree
par une session concurrente ? Options à débattre : un verrou par worktree, ou un réflexe
outillé « vérifier HEAD + branche au réveil / après reconnexion MCP » avant toute écriture.
Coût observé : une frayeur + plusieurs échanges de diagnostic. Parade actuelle = humaine
(vérifier avant d'écrire). Symptôme voisin déjà connu : « worktree RESET après reconnexion
MCP » (mémoire `vectorz-pieges-outillage`) — ici c'est une variante (bascule sur une branche
sœur, pas un simple reset).
