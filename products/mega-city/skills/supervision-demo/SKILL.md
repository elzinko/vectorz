---
name: supervision-demo
argument-hint: "[sujet-du-run-jouet]"
description: >-
  Méthode JOUET à 2 gates pour éprouver le kit émetteur de supervisabilité
  (fiche 0050) depuis une session Claude Desktop réelle — SANS toucher aux
  skills de méthode de prod (ezk-*). A utiliser quand on veut tester l'émission
  du journal du contrat v0.1 : « teste le kit émetteur », « supervision-demo »,
  « émets un journal jouet », « run de démo supervisabilité ». Déroule
  run_start → travail simulé → gate 1 (STOP, attend) → gate 2 (STOP, attend) →
  run_finished, en pilotant les 6 outils MCP de l'émetteur (dont `heartbeat`). N'est PAS une
  méthode de travail réelle : c'est le banc d'essai du contrat, jetable.
---

# supervision-demo — méthode jouet, banc d'essai du kit émetteur

Tu es une **méthode jouet supervisable** : ton seul travail réel est d'émettre un
journal de supervisabilité **conforme au contrat v0.1** via les outils MCP de
l'émetteur, en simulant deux étapes de travail séparées par des gates.

> **Banc d'essai, pas méthode de prod.** Les skills de méthode réelles (ezk-*) ne
> sont PAS instrumentées : c'est ce skill-ci qu'on utilise pour tester. Le template
> d'intégration pour une vraie méthode vit dans la doc du kit
> (`src/supervision/README.md` de mega-city).

## Pré-requis

Le serveur MCP émetteur est configuré dans le client (Claude Desktop : entrée MCP
lançant `pnpm exec tsx bin/supervision-mcp.ts` avec `SUPERVISION_PROJECT_ROOT`
pointant sur la racine du projet supervisé). Si les 6 outils (`run_start`,
`gate_reached`, `gate_resumed`, `escalate`, `heartbeat`, `run_finished`) ne sont pas visibles
dans le contexte : **STOP** — explique la config manquante, n'émets rien.

## Le déroulé (strict, 2 gates)

1. **`run_start`** `{method_name: "supervision-demo", method_version: "0.1.0",
   seat: "human"}` — annonce le run. Montre à l'utilisateur le `run_id` retourné.
2. **Étape 1 (travail simulé)** : produis 3-5 lignes sur le sujet donné en argument
   (n'importe quoi de plausible — c'est un jouet). Émets un **`heartbeat`**
   `{note: "étape 1 en cours"}` pendant ce travail (signe de vie Moniteur). Si le sujet
   s'y prête, émets une **`escalate`** `{type: "blocked", detail: …}` factice pour tester
   le signal non-bloquant (et continue — une escalade n'arrête jamais).
3. **`gate_reached`** `{gate_id: "demo-gate-1", outcome: "ok", report_markdown: <ton
   résumé de l'étape 1>}` — puis **ARRÊTE-TOI VRAIMENT** : le résultat d'outil dit
   « STOP » ; termine ton tour et attends que l'humain réponde. C'est le cœur du
   contrat (stop-par-défaut au jalon).
4. À la reprise humaine : **`gate_resumed`** (avec le `gate_event_id` que l'outil
   t'a donné en 3), puis **étape 2** (encore 3-5 lignes + un `heartbeat` `{note:
   "étape 2"}`), puis **`gate_reached`**
   `{gate_id: "demo-gate-2", …}` — STOP à nouveau.
5. À la 2ᵉ reprise : `gate_resumed` puis **`run_finished`** `{status: "success"}`.
   Termine en montrant où vit le journal
   (`<projet>/.supervision/runs/<run_id>/events.jsonl`) et propose de le vérifier
   (validateur cop1 0027 quand il existera ; en attendant `cat` + lecture).

## Garde-fous

- Tu n'écris JAMAIS les champs d'enveloppe (event_id, seq, ts, contract — le
  serveur les calcule) et tu ne forces jamais `upgrade_ok` (au mieux un veto).
- Un gate atteint = un tour terminé. Tu ne « continues » jamais de toi-même après
  un `gate_reached` — c'est l'humain (le siège) qui rouvre.
- Outils absents → tu n'émets rien et tu le dis (best-effort classe B assumé).
- Une seule responsabilité : éprouver l'émission. Tu ne fais aucun vrai travail
  (pas de code, pas de fichiers hors journal).
