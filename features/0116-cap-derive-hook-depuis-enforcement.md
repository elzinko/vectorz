---
id: 0116
title: cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode)
type: refactor
priority: P3
product: mega-city
status: idea
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0106 (finding F2). `src/caps/claude-code.ts` → `collectHooks`
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
- [x] le contenu du hook provient de `enforcement.hook.script`, plus de hardcode — livré via
      fiche 0111 (commit `752d1cd`) : le LOADER résout `hook.script` (chemin→contenu, avec
      garde-fou anti-traversal + anti-symlink après revue sécurité), le cap relaie tel quel.
- [x] deux règles `type: hook` sur des stages différents → deux hooks distincts corrects —
      vérifié : `conventional-commits/format` (commit-msg), `ci-cd/local-reproduction`
      (pre-push), `typescript-2026/strict-config` (pre-commit) coexistent, testé (bind.test.ts).
- [ ] deux enforcements sur le même `stage` → composition déterministe, pas d'écrasement —
      **PAS livré**. `collectHooks` (claude-code.ts) pousse un `HookWrite` par enforcement
      sans grouper par stage ; `io/apply.ts:poseHook` en mode `skip-if-exists` ferait taire
      silencieusement le second hook déclaré sur un stage déjà écrit dans le même bind. Aucune
      règle réelle ne collide aujourd'hui (1 seul hook/stage dans le catalogue migré), donc
      latent, pas actif — mais l'AC de composition reste ouvert.
- [x] plus aucune donnée de frontmatter chargée puis ignorée — `enforcement.hook.script` n'est
      plus une donnée morte.

## Notes
Ironique vu que la règle matérialisée est `clean-code/no-dead-code`.
Reste ouvert : grouper `collectHooks` par `stage` (ex. `Map<stage, HookWrite[]>` → concaténer
les scripts avec un séparateur explicite, ou lever si collision non résolvable) — petit
chantier, à reprendre séparément plutôt que de bloquer la fiche 0111 dessus (YAGNI tant
qu'aucune règle réelle ne collide).

**2026-07-17 (review)** : sortie d'in-progress → `todo` P3. Le gros du sujet a été **livré
par la fiche 0111** (commit `752d1cd`) : 3 ACs sur 4 cochés (résolution `hook.script`, deux
règles `type: hook` sur stages différents, plus de donnée morte). Ne reste que l'AC de
**composition sur un même `stage`** — latent (aucune règle réelle ne collide aujourd'hui),
d'où P3. Personne ne travaillait dessus : le statut in-progress était faux.
