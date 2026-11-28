---
date: 2026-10-14
session: "fix/v014-bughunt-findings / solar-car-charging-feasibility-cd67a1"
type: friction
---

# backlog ship ne persiste que si CWD = le depot cible

Run v0.14 : `ezk backlog ship --status shipped --root <principal>` lancé depuis le worktree a rapporté un succès mais RIEN n'a persisté (fiche toujours en features/, arbre propre). Relancé avec CWD = le principal (cd principal && ezk ... --root principal), les écritures ont persisté. Geste : lancer `ezk backlog ship` depuis le dépôt cible (cd), pas seulement avec --root.
