---
date: 2026-10-14
session: "fix/v014-bughunt-findings / solar-car-charging-feasibility-cd67a1"
type: idée
---

# la chasse aux bugs de release gagne sa place

Run v0.14 : la passe chasse-aux-bugs de `ezk release` (revue adverse de version, 3 relecteurs indépendants) a trouvé 4 vrais bugs que la revue par fiche + la gate verte avaient ratés (clé détachée mouvante, collision de sanitisation sans garde, mv de migration silencieux, résolution archive-progress.sh fragile). Idées : (a) garder cette gate ; (b) la résolution de clé de journal par branche est DUPLIQUÉE dans 3 fichiers — un résolveur partagé la corrigerait une fois (altitude).
