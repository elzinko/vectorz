---
date: 2026-10-14
session: "fix/version-sequence-tri-sur / ezk-reviewer-agent-skill-f5e5b1"
type: friction
---

# Worktree neuf : cop1 web/app ne se teste pas sans install complet + build des frères

Au run v0.15 (2026-10-14), les tests web cop1 échouaient 36/36 dans le worktree alors qu'ils passaient
sur le principal. Cause : le principal résout un vitest 2.1.9 PÉRIMÉ, le worktree (install frais) le
vitest 4.1.11 DÉCLARÉ. Le stub EventSource du test (vi.fn() + new) n'est constructible qu'en vitest 2 →
un install frais révèle un bug latent masqué par le principal. Corrigé : stub en classe (marche dans les
deux). De plus, l'app cop1 ne se typecheck/teste pas sans le dist des packages frères (@cop1/sprint-core,
@cop1/observability).
Leçon : sur un worktree neuf, pour cop1, vérifier la version vitest RÉSOLUE (pas déclarée) et construire
les packages frères avant de conclure « tests cassés ». Le principal peut masquer une incompat de version.
