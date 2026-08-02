---
id: 0176
title: Interdit gitconfig global pour l'identité agent — commits cop1 locaux / one-shot only
type: feature
priority: P0
product: cop1
status: in-progress
ready: 2026-08-02
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

- [x] Cause racine de l'incident documentée dans #86 (ou « agents ad-hoc hors repo »).
- [x] Aucun chemin produit ne fait `git config --global user.name|email`.
- [x] Les commits d'une PR auto de nuit peuvent encore être attribués à `cop1`
      (local ou one-shot) — traçabilité conservée *(aucun chemin produit n'a été
      retiré ; skill documente encore local/one-shot — pas de PR nuit live dans ce sprint)*.
- [x] Le `~/.gitconfig` global n'est **jamais** modifié par cop1 / skills / agents
      pour `user.name` / `user.email`.
- [x] Skill ou doc courte : « identité agent = local | one-shot ; global = humain ».

## Scénarios Gherkin (Definition of Done)

```gherkin
Feature: Interdiction de modifier l'identité git globale depuis les agents/skills

  # ── Scénario 1 : Audit code produit ──────────────────────────────────────────
  Scenario: Audit — zéro occurrence de git config --global user.* en code produit
    Given le monorepo vectorz est présent en local
    When on inspecte tous les fichiers sources (hors docs/, features/, *.md)
    Then aucun fichier ne contient "git config --global user.name"
    And aucun fichier ne contient "git config --global user.email"
    And la cause racine de l'incident est documentée dans la fiche 0176
      comme "agents ad-hoc exécutés hors repo versionné"

  # ── Scénario 2 : Garde-fou skill ezk-commits ─────────────────────────────────
  Scenario: Skill ezk-commits documente l'interdiction --global et le pattern autorisé
    Given la skill ezk-commits est chargée par un agent
    When l'agent cherche comment attribuer un commit automatisé
    Then la skill contient une règle explicite : "--global user.name/user.email est INTERDIT"
    And la skill documente le pattern one-shot autorisé :
      "git -c user.name=… -c user.email=… commit"
      ou "GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL (+ COMMITTER)"
    And la skill précise que "git config user.*" sans --global (scope local/worktree) est autorisé

  # ── Scénario 3 : Traçabilité cop1 conservée (non-régression) ─────────────────
  Scenario: Attribution cop1 conservée pour les PR automatiques de nuit
    Given un agent cop1 pousse une PR automatique de nuit dans son worktree dédié
    When il applique l'identité cop1 via scope local ou one-shot
    Then le commit apparaît attribué à "cop1" dans l'historique GitHub de la PR
    And le ~/.gitconfig global de l'humain (Thomas Couderc / thomas.couderc@gmail.com)
      n'est pas modifié
    And git config --global user.name retourne "Thomas Couderc" après la mission cop1

  # ── Scénario 4 : Smoke test — détection régression ───────────────────────────
  Scenario: Smoke test échoue si une source introduit git config --global user.*
    Given la suite de tests (vitest ou script dédié) est lancée
    When un fichier source (hors docs/, features/, *.md) contient "git config --global user."
    Then le test échoue
    And le message d'erreur identifie le fichier et la ligne incriminée

  Scenario: Smoke test passe sur codebase clean
    Given aucun fichier source ne contient "git config --global user."
    When la suite de tests est lancée
    Then le test passe (exit 0)
```

## Notes / décisions

- Global restauré manuellement le 2026-08-01 → Thomas Couderc /
  `thomas.couderc@gmail.com`.
- **Cause racine** : aucune occurrence `git config --global user.*` n'a été trouvée
  dans le code versionné (`products/`, `scripts/`, `tools/`). La pollution a donc été
  causée par un **agent ad-hoc exécuté hors repo versionné** (session Cursor / Claude
  interactive, sans skill chargée), qui a fait `git config --global user.*` directement
  depuis un terminal sans passer par les patterns one-shot ou local autorisés.
- Smoke test `tools/boundary/no-global-gitconfig-identity.test.ts` ajouté (scénario 4) :
  échoue si un fichier source (hors tests) introduit le pattern interdit.
- Guard documenté dans `products/mega-city/skills/ezk-commits/SKILL.md` (symlinké
  depuis `~/.claude/skills/ezk-commits`).
- Hors scope : changer l'identité humaine globale ; rewrite de commits historiques
  hors incident muti déjà traité.
