---
id: 0176
title: Interdit gitconfig global pour l'identité agent — commits cop1 locaux / one-shot only
type: feature
priority: P0
product: cop1
status: todo
ready:
pr:
github: "#86"
created: 2026-08-01
---

# 0176 — Interdit `~/.gitconfig` global pour l'identité agent

## Contexte / Problème

Le **2026-08-01**, le `~/.gitconfig` global de la machine PO était à
`cop1 CI <ci@cop1.local>`. Des commits hors cop1 (ex. muti PR #39) ont hérité
de cette identité → Vercel a bloqué le deploy (email non lié au compte GitHub).

Cause probable : un agent / script a fait `git config --global user.*` au lieu
d'un scope **local** (repo/worktree) ou **éphémère** (`git -c` / `GIT_AUTHOR_*`).

Règle PO (non négociable) :

- **Global** = toujours l'humain (Thomas) — **jamais** d'identité agent/CI.
- **Local** sur un worktree de PR auto de nuit = OK pour tracer « qui a fait quoi ».
- Un commit signé `cop1` sur une PR lancée auto = OK ; toucher le global = **interdit**.

Issue : [elzinko/vectorz#86](https://github.com/elzinko/vectorz/issues/86).

## Proposition

1. **Audit** — inventaire des chemins (cop1, skills mega-city, docs, CI) qui
   exécutent ou *recommandent* `git config --global user.name|email`.
2. **Remplacer** tout usage global par :
   - `git -c user.name=… -c user.email=… commit …`, ou
   - `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` (+ committer) pour le process, ou
   - `git config` **sans** `--global` dans le repo/worktree de la mission.
3. **Garde-fou** — dans le code / skills qui commitent en autonomie :
   - refuse / warn si on s'apprête à écrire `user.*` en global ;
   - documente le pattern one-shot ou local-only dans la skill concernée
     (`ezk-sprint` / product-builder / DevAgent).
4. **Optionnel** — test ou smoke qui échoue si un script du repo contient
   `git config --global user.`.

## Critères d'acceptation

- [ ] Cause racine de l'incident documentée dans #86 (ou « agents ad-hoc hors repo »).
- [ ] Aucun chemin produit ne fait `git config --global user.name|email`.
- [ ] Les commits d'une PR auto de nuit peuvent encore être attribués à `cop1`
      (local ou one-shot) — traçabilité conservée.
- [ ] Le `~/.gitconfig` global n'est **jamais** modifié par cop1 / skills / agents
      pour `user.name` / `user.email`.
- [ ] Skill ou doc courte : « identité agent = local | one-shot ; global = humain ».

## Notes / décisions

- Global restauré manuellement le 2026-08-01 → Thomas Couderc /
  `thomas.couderc@gmail.com`.
- Pas de recherche `ci@cop1.local` restante dans le monorepo au moment de la
  capture — la pollution a pu venir d'un agent hors code versionné ; l'audit
  doit quand même verrouiller les chemins futurs.
- Hors scope : changer l'identité humaine globale ; rewrite de commits historiques
  hors incident muti déjà traité.
