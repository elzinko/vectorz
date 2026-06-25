---
id: clean-code/no-dead-code
level: MUST
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

Pas de code mort, pas de TODO masqué, pas de code simulé. Toute branche est
atteignable et testée. Si un bout n'est plus utilisé, on le supprime — git garde
l'historique. Vérifié à la revue par l'agent `ezk-reviewer` (enforcement niveau 1).
