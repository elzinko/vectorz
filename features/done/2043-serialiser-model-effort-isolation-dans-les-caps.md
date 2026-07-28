---
id: 2043
product: mega-city
title: caps claude-code — sérialiser model/effort/isolation dans les fichiers agents générés
type: bug
priority: P2
status: shipped
pr: local (squash-merge)
created: 2026-07-12
---

## Contexte / Problème
Repéré par une revue automatique (chatgpt-codex-connector) sur la PR #1, commentaire inline
sur `src/loaders/catalog.ts:144` : la fiche 0039 (ex-0028) a ajouté `model`/`effort`/`isolation`
au frontmatter des agents et au loader (`readAgent`), mais **aucun des deux caps ne les
réémet**. `agentFiles()` dans `src/caps/claude-code.ts:20-24` et `src/caps/claude-code-global.ts:19-23`
écrit uniquement `agent.role.trim()`, sans reconstruire de frontmatter du tout. Résultat : un
`bind`/`bind-global` en mode copy (le mode par défaut) génère des `.claude/agents/*.md` où
model/effort/isolation sont **silencieusement absents** — le réglage choisi (ex. `opus`/`high`
pour ezk-architect) n'a aucun effet, alors que les tests (`catalog.test.ts`) valident bien que
le *loader* les lit, donnant une fausse impression de couverture bout-en-bout.

## Proposition
1. Dans `agentFiles()` (les deux caps), reconstruire un frontmatter YAML minimal quand au
   moins un des 3 champs est présent (`name`, `model?`, `effort?`, `isolation?`), suivi du
   corps `agent.role`. Absence des 3 champs → comportement actuel inchangé (pas de frontmatter
   vide ajouté inutilement).
2. Étendre `bind.test.ts`/`expand.test.ts` (ou un nouveau test caps) pour vérifier que le
   WritePlan contient bien ces champs dans le contenu généré — pas seulement dans le catalogue
   chargé.

## Critères d'acceptation
- [x] un agent avec `model`/`effort`/`isolation` en frontmatter source produit un
      `.claude/agents/<id>.md` (et l'équivalent global) qui porte ces mêmes champs
- [x] un agent sans ces champs ne voit pas son fichier généré changer (pas de régression)
- [x] test qui couvre le WritePlan généré, pas seulement le catalogue chargé

## Notes
Trouvé pendant la résolution du conflit PR #1 (2026-07-12), commentaire GitHub
https://github.com/elzinko/mega-city/pull/1#discussion_r3566573249. Fix : nouveau
`src/caps/agent-content.ts` (helper partagé par les 2 caps) qui reconstruit le frontmatter
via `matter.stringify` (même lib que le loader) quand model/effort/isolation présents, sinon
comportement historique inchangé. 3 nouveaux tests (`claude-code.test.ts`,
`claude-code-global.test.ts`). Gate 107/107.
