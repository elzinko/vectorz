---
id: development/worktree-secondary-inline-harvest
kind: disposition
level: MUST
title: En worktree secondaire, délégation inline ou moisson vérifiée
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

> Règle **conditionnée** au spike `20260906122942770` (S1) : il tranche *pourquoi* l'isolation
> worktree existe avant de figer la moisson. La discipline ci-dessous tient dès aujourd'hui.

- **Un sous-agent lancé depuis un worktree secondaire écrit dans SON worktree, pas dans celui du
  pilote.** L'isolation est confirmée : ses fichiers n'atterrissent pas sur la branche de session.
- **Défaut en worktree secondaire : délégation d'écriture inline.** Le pilote écrit lui-même les
  fichiers plutôt que de confier l'écriture à un sous-agent isolé.
- **Si un sous-agent produit quand même des fichiers, la moisson est obligatoire et vérifiée**
  AVANT la revue : copier depuis le worktree de l'agent → relire → tester. Rien ne part en revue
  sans cette étape.
- **Mesurable :** 0 écriture de sous-agent perdue (non moissonnée).
- Origine : rétrospective du 2026-09-05 (symptôme 5). Des écritures de sous-agents restaient dans
  leur worktree, invisibles du pilote. Enforcement niveau 1 : l'agent `ezk-reviewer` refuse de
  reviewer un travail non moissonné.
