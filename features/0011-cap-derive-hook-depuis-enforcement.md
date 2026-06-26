---
id: 0011
title: cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode)
type: refactor
priority: P2
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0001 (finding F2). `src/caps/claude-code.ts` → `collectHooks`
ignore `enforcement.hook.script` et émet toujours `commitMsgHookScript()`
(conventional-commits hardcodé). Le champ `script: hooks/commit-msg.sh` du
frontmatter est **chargé mais jamais lu** — donnée morte qui couple le cap à UNE
règle précise. Ajouter une 2ᵉ règle `type: hook` produirait deux hooks au même
`stage` au contenu identique.

## Proposition
Résoudre le hook depuis `enforcement.hook.script` : soit charger le script
référencé (fichier versionné dans `rules/`/`hooks/`), soit un registre id→script.
Grouper les enforcements par `stage` (un seul hook par stage, composé).

## Critères d'acceptation
- [ ] le contenu du hook provient de `enforcement.hook.script`, plus de hardcode
- [ ] deux règles `type: hook` sur des stages différents → deux hooks distincts corrects
- [ ] deux enforcements sur le même `stage` → composition déterministe, pas d'écrasement
- [ ] plus aucune donnée de frontmatter chargée puis ignorée

## Notes
Ironique vu que la règle matérialisée est `clean-code/no-dead-code`.
