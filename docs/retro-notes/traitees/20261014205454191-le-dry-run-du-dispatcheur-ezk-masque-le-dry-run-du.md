---
date: 2026-10-14
session: "fix/version-sequence-tri-sur / ezk-reviewer-agent-skill-f5e5b1"
type: friction
---

# Le --dry-run du dispatcheur ezk masque le --dry-run du sous-script

Au run v0.15, `ezk forge integrate … --dry-run` ne déclenche PAS la simulation merge-tree de ship_local :
le dispatcheur ezk capte --dry-run comme SON flag (il imprime la commande et sort 0, ezk.ts ~210), avant
que le script le voie. Pour éprouver le vrai dry-run d'un sous-script (forge integrate, ship), appeler le
bin directement (pnpm exec tsx bin/forge-integrate.ts … --dry-run).
Leçon : pour tester le dry-run EFFECTIF d'une commande ezk, viser le bin, pas le dispatcheur.
