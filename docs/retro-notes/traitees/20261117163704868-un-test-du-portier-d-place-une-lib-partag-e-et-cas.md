---
date: 2026-11-17
session: "main / vectorz"
type: friction
---

# Un test du portier déplace une lib partagée et casse une gate parallèle

Deux exécutions de tests simultanées dans le même worktree se cassent entre elles : skills/ezk-sprint/scripts/test-check-gate.sh (cas S6) déplace un instant skills/ezk-archive/scripts/lib-worktree-safety.sh pour simuler son absence ; pendant ce temps, test-check-gate.sh et test-mainsync.sh d'ezk-archive, joués par une gate complète dans le même dossier, échouent en « lib introuvable ». Vu le 2026-11-17 au sprint 5 (portier), rejoués seuls : verts. Piste : simuler l'absence par une variable qui pointe la lib ailleurs, au lieu de déplacer le vrai fichier.
