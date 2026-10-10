---
date: 2026-10-05
session: "main / vectorz"
type: friction
---

# la clôture prépare l'archive de session mais ne la committe pas

Le 2026-10-05, `ezk-archive run` (verdict propre) a écrit
`docs/sessions/2026-10-05-cloture-v0-5-et-cockpit-v0-6.md` dans le worktree, sans le committer : le
skill dit « proposer le commit, ne pas committer à l'aveugle ». Le PO a demandé « il faut commiter les
archives de session non ? pourquoi ce n'est pas fait automatiquement ? ». Commit fait à la main ensuite
(4ac4674a). Risque : un fichier non suivi dans un worktree part avec lui si l'app le supprime avant le
commit (même famille que la note de passation perdue, corrigée par 20261003105820077).

Piste : en mode local, la clôture committe l'archive sur une branche et la merge en local
(`ship-merge.sh --local`), le push restant au PO ; ou elle écrit l'archive dans le dossier commun
`<git-common-dir>/ezk/` jusqu'au commit.
