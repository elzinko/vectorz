---
id: 0017
title: cap global — matérialiser un profil dans ~/.claude (remplace install.sh)
type: feature
priority: P1
status: todo
pr:
created: 2026-06-27
---

## Contexte / Problème
ADR-0006. `bind` ne sait viser qu'un **projet** (`<projet>/.claude/`). `claude-skills`
installe aussi en **global** (`~/.claude/skills|agents`, symlink, `git pull` met à jour
partout) — c'est le daily-driver. Pour retirer `install.sh`, mega-city doit couvrir ce cas.

## Proposition
Un chemin d'install **global** : `bind --global <profile>` (ou un cap/cible dédié
`HostId='claude-code-global'`) qui matérialise un profil résolu dans `~/.claude/skills/*`
et `~/.claude/agents/*`. Réutilise `expand` + le plan pur ; seule la coquille I/O change de
racine cible. Non-destructif : ne touche QUE ses propres entrées (invariant ADR-0006).

## Critères d'acceptation
- [ ] `bind --global mobile` écrit les skills/agents du profil dans `~/.claude/`
- [ ] ne supprime/écrase jamais une entrée `~/.claude` qui n'est pas la sienne
- [ ] calcul du plan pur (réutilise expand), testé ; seule la racine I/O diffère du cap projet
- [ ] idempotent : deux `bind --global` → même état

## Notes
Couplé à 0018 (mode link vs copy) : le global veut le **symlink** par défaut (live-update).
Prérequis à l'archivage de `claude-skills` (ADR-0006, action item 5).
