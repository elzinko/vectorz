---
id: 0104
title: "Kit d’analyse de session — journal + Moniteur + transcript Claude Code en un rapport"
type: feature
priority: P1
epic:
depends: []
labels: [supervision, tooling, dogfood]
status: todo
ready:
pr:
created: 2026-07-29
product: mega-city
---

# 0104 — Kit d’analyse de session (post-mortem fiable)

## En une phrase

Après un dogfood (ou un bug « le Moniteur n’a pas bougé »), pouvoir **reconstruire
fidèlement** ce qui s’est passé : événements supervision, état Moniteur, et appels MCP
dans la session Claude Code — sans fouiller à la main trois endroits.

## Contexte / Problème

Aujourd’hui les sources existent mais sont **éclatées** :

| Source | Où | Ce qu’on y voit |
|--------|-----|-----------------|
| Journal méthode | `<projet>/.supervision/runs/<id>/events.jsonl` | start / gates / heartbeat / fin |
| Moniteur | daemon SSE + UI | projection + overlay silence |
| Session Claude Code | `~/.claude/projects/<slug>/*.jsonl` | prompts, outils, y compris `mcp__supervision__*` |

Dogfood 2026-07-29 : en croisant transcript + journal, on voit clairement **1 seul**
`run_start` et zéro autre événement — d’où « Silence prolongé ». Un humain non outillé
conclut à tort « pas synchro ».

Un agent (Cursor / Claude) **peut** déjà lire ces fichiers s’il connaît les chemins —
mais ce n’est pas un produit : pas de commande, pas de rapport, pas de garde-fous PII.

## Proposition

Script / CLI unique, ex. :

```bash
pnpm --filter mega-city supervision:analyze [--run <id>] [--since 2h] [--project .]
```

Sortie :

1. **Rapport markdown** (humain) : timeline fusionnée (CC tools MCP ↔ events journal ↔
   changements d’état Moniteur si dispo).
2. **JSON** machine (pour CI / 2103 plus tard).
3. Verdicts simples : `emission_gap` (start sans fin), `silence_explained` (pas de
   heartbeat), `orphan_run`, `mcp_ok_but_no_journal`, etc.

MVP volontairement **lecture seule** : ne démarre pas le Moniteur, n’appelle pas le LLM.

### Ce que ça n’est pas

- Pas le harness E2E-LLM (**2103** / testbed) — ici on **explique** une session déjà
  faite.
- Pas un stream live de tous les messages Claude dans l’UI Moniteur (trop de surface /
  privacy).

## Critères d'acceptation

- [ ] Sur le dogfood 2026-07-29 (fixtures ou chemins doc), le rapport dit en clair :
      « 1× run_start, 0 heartbeat, 0 gate, run encore ouvert → silence Moniteur attendu ».
- [ ] Trouve automatiquement le transcript CC du projet (slug Cursor/Claude) ou accepte
      un chemin `--transcript`.
- [ ] Liste les appels `mcp__supervision__*` avec timestamp + args résumés.
- [ ] Liste les events du run (ou tous les runs `--since`).
- [ ] Rapport écrit sous `docs/dogfood-reports/<stamp>/` (ou stdout) ; rien de secret
      commité par défaut (gitignore déjà en place côté PR dogfood).
- [ ] Doc courte dans `docs/DOGFOOD.md` (ou équivalent sur la branche courante) :
      « Si tu ne comprends pas le Moniteur → `supervision:analyze` ».

## Notes / décisions

- Preuve que c’est faisable aujourd’hui à la main : lecture de
  `2809b04c-2d3c-46fd-aa90-155bd610bb12.jsonl` + `events.jsonl` du run
  `2026-07-29T12-48-47-648Z-2a4f2f22`.
- Privacy : ne pas dumper le plein texte des prompts utilisateur dans le rapport par
  défaut (option `--full` derrière un warning).
- Complète **0103** (heartbeat) : analyze explique le passé ; heartbeat améliore le futur.
