---
date: 2026-10-11
session: "main / vectorz"
type: friction
---

# archive-commit.sh : helper commit-doc-via-worktree.sh absent de ~/.claude/bin

Le 2026-10-11, `ezk-archive` (run/close) a échoué à committer l'archive de session : son script
`~/.claude/skills/ezk-archive/scripts/archive-commit.sh` calcule le helper partagé en
`$(dirname)/../../../bin/commit-doc-via-worktree.sh` = `~/.claude/bin/commit-doc-via-worktree.sh`,
dossier qui N'EXISTE PAS. L'install globale copy-mode ne déploie que les fichiers du skill
(skillFolderFiles), pas le helper partagé `products/mega-city/bin/commit-doc-via-worktree.sh`.
Erreur observée : « archive-commit.sh : helper introuvable : /commit-doc-via-worktree.sh ».

Contournement utilisé cette fois (muti, github:false) : commit de l'archive directement sur `main`
local depuis le checkout principal (propre, au même commit que la branche de session) — l'état final
visé par le script en mode local. Mais ça perd le garde-fou du worktree jetable (le commit n'isole
plus l'archive si le checkout principal n'était pas propre).

Piste : soit déployer le helper dans `~/.claude/bin/` au bind global, soit qu'`archive-commit.sh`
le cherche aussi via un chemin de repli (le `bin/` de mega-city lié au poste). Le helper existe à
`/Users/elzinko/git/bacasable/vectorz/products/mega-city/bin/commit-doc-via-worktree.sh`.
