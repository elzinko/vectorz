---
date: 2026-11-15
session: "claude/process-schema-semantic-zoom-a83062 / process-schema-semantic-zoom-a83062"
type: friction
---

# forge integrate --dry-run dit « propre » depuis un worktree alors que la vraie fusion y est impossible

Vécu le 2026-11-15, fiche 20261110185357446, branche claude/process-schema-semantic-zoom-a83062.

Depuis le worktree .claude/worktrees/process-schema-semantic-zoom-a83062, la commande
`ezk forge integrate --root <worktree> --branch <b> --base main --dry-run` a répondu
« squash local … merge propre, rien n'est écrit ». La même commande sans --dry-run a échoué
(code 128) : « fatal: 'main' is already used by worktree at /Users/elzinko/git/bacasable/vectorz ».
Le dry-run simule par git merge-tree et ne vérifie pas que main est sorti dans un autre checkout.
Il a fallu passer la main à la session pilote, qui a posé le squash depuis le checkout principal
(commit 2e73ff01).

Deuxième friction, même jour : lancé depuis products/mega-city sans --root, le guichet ne trouve
pas .vectorz/config.yml (il est à la racine du dépôt) et répond « pr allumé : --pr requis »,
alors que le projet a github: false.

Pistes : le dry-run signale « main est sorti dans <chemin> : lance l'intégration depuis là » ;
le guichet cherche .vectorz/ en remontant jusqu'à la racine git.
