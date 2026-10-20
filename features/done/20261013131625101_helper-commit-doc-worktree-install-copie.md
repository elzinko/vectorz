---
id: "20261013131625101"
title: "archive-commit trouve commit-doc-via-worktree.sh en install copie (helper partagé)"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.19.0
labels: [installation, dette]
status: shipped
pr: "local (776c2f68)"
evidence: none # outillage, pas d'écran
created: 2026-10-13
---

# 20261013131625101 — archive-commit trouve son helper en install copie

**En clair.** `ezk-archive` échoue à committer l'archive de session quand la méthode est installée
en **copie** (le défaut du bind global) : son script `archive-commit.sh` cherche le helper partagé
`commit-doc-via-worktree.sh` sous `~/.claude/bin/`, un dossier que l'install copie ne crée pas. On
veut qu'il le trouve — déployé au bind, ou cherché via un chemin de repli.

**Si tu arrives frais.** Le bind global installe les skills soit en **lien** (symlink vers vectorz,
le helper est atteignable), soit en **copie** (seuls les fichiers du skill sont copiés, pas les
helpers partagés de `products/mega-city/bin/`).

## Contexte / Problème

Friction du 2026-10-11 (carnet de rétro, run v0.11). `archive-commit.sh` calcule le helper en
`$(dirname)/../../../bin/commit-doc-via-worktree.sh` = `~/.claude/bin/commit-doc-via-worktree.sh`,
qui n'existe pas : l'install copie ne déploie que `skillFolderFiles`, pas le helper partagé. Erreur
observée : « archive-commit.sh : helper introuvable : /commit-doc-via-worktree.sh ». Contournement
cette fois : commit de l'archive à la main sur `main` local — ce qui perd le garde-fou du worktree
jetable.

## Proposition

Deux pistes (à trancher au grooming) : soit le bind global **déploie** `commit-doc-via-worktree.sh`
dans `~/.claude/bin/`, soit `archive-commit.sh` le **cherche aussi** via un repli (le `bin/` de
mega-city lié au poste, résolu depuis `ezk`).

## Critères d'acceptation

- [ ] Depuis une install **copie**, `ezk-archive` (run/close) committe l'archive de session sans
      « helper introuvable », avec le garde-fou du worktree jetable intact.
- [ ] Le chemin du helper est résolu de façon robuste au mode d'install (lien ou copie).

## Comment vérifier

```bash
# Depuis une install copie (bind-global sans --link), lancer une clôture ezk-archive
# et vérifier que l'archive est committée (pas de "helper introuvable").
```

## Notes / décisions

- Origine : note de carnet `20261011141013200-archive-commit-sh-helper-...`, versée à la rétro du
  run v0.12 ([capture](../../docs/captures/2026-10-13-retro-run-v012.md)).
- Le helper existe à `products/mega-city/bin/commit-doc-via-worktree.sh`.

## Décision de grooming (2026-10-17, run v0.19 auto/lean)

**Option (b) retenue** : `archive-commit.sh` cherche le helper via un repli, sans dépendre d'un
re-bind. Chaîne de résolution :

1. Chemin relatif au script (`../../../bin`) — marche en install **lien** et en source.
2. Repli en install **copie** : le `ezk` du PATH est un lien vers le vrai `products/mega-city/bin/`
   (`realpath` via node, garanti présent puisque `ezk` tourne dessus). Le helper en est le voisin.

Pourquoi pas l'option (a) (le bind global déploie le helper dans `~/.claude/bin/`) : elle n'agirait
qu'après un re-bind, et il faudrait énumérer les helpers partagés à copier. Le repli corrige les
installs copie **déjà posées**. Testé par le cas **H** de `test-archive-commit.sh` : depuis une
disposition copie-install (sans `bin/` à `../../../`), l'archive s'intègre quand même.
