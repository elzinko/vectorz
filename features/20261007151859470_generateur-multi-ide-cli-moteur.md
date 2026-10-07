---
id: "20261007151859470"
title: "Générateur multi-IDE : une source → .claude/ + .cursor/ + AGENTS.md, CLI moteur"
type: feature
priority: P1
product: vectorz
milestone: portabilite
version: V0.10
labels: [portabilite, generateur, cli]
status: ready
pr:
evidence: none
created: 2026-10-07
---

# 20261007151859470 — Générateur multi-IDE + CLI moteur

**En clair.** Aujourd'hui vectorz ne tourne que dans Claude Code. On veut le faire tourner aussi
dans Cursor et les autres éditeurs, **sans dupliquer la méthode** : une seule source de vérité, et
un **générateur** qui en tire un jeu de fichiers par IDE. Le CLI `ezk` devient le **moteur
portable** ; le markdown par IDE n'est qu'une **façade** qui l'appelle.

**Si tu arrives frais.** `AGENTS.md` est un standard ouvert (Linux Foundation) lu par Cursor, Codex,
Copilot, Gemini, Windsurf… ; Claude Code garde son `CLAUDE.md`. Un **générateur** produit des copies
par IDE depuis une source ; il ne pose pas de **pointeur** vivant (les IDE ne suivent pas de pointeur
de façon fiable).

## Contexte / Problème

Le benchmark du 2026-10-07 ([4 méthodes sur une feature identique](../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md)
pour le cadre, run neuf en session) a montré deux choses :

- **Toutes les méthodes sont portables dans leurs artefacts** (markdown + code). Le verrou IDE ne
  vit **que** dans la couche d'automatisation (plugin, skills).
- **La bonne mécanique, c'est « générer, pas pointer ».** OpenSpec, observé en vrai, produit des
  copies par IDE où **seule la syntaxe de commande change** (`/opsx:x` vs `/opsx-x`) ; zéro symlink,
  zéro pointeur. Un spike maison (`gen.mjs`) a reproduit le patron : une source → `.claude/`,
  `.cursor/`, `AGENTS.md`, avec une garde anti-dérive.

C'est l'esprit de l'ADR-0029 (« la fiche est le document, la PR en est le rendu ») étendu : **une
source, des rendus par IDE**. La [fiche « CLAUDE.md = proxy vers la loi »](20261007115129448_claude-md-proxy-loi-bindee-par-projet.md)
en est **une facette** (les règles → `CLAUDE.md`) ; cette keystone généralise aux **commandes et
skills**, et à plusieurs IDE.

**Limite dure à acter.** Les sous-agents et les hooks ne se portent pas hors de Claude Code (Cursor
n'a pas de sous-agents). Donc la **méthode** (fiches, règles, specs, workflow) est portable, mais le
**moteur d'agents** (revue adverse inter-modèles, ezk-pm, loi par hook) reste **premium Claude Code**.

## Proposition

POC d'abord : deux IDE (`claude`, `cursor`) + `AGENTS.md`, sur un sous-ensemble de commandes.

1. **Étendre `lawgiver`** pour émettre, depuis une source unique, les fichiers par IDE
   (`.claude/`, `.cursor/`, `AGENTS.md`). Seule la **syntaxe d'invocation** diffère.
2. **Garde anti-dérive** : une commande `--check` échoue si une copie générée a été éditée à la main.
3. **CLI moteur** : promouvoir les scripts (`regen-backlog`, `graph:compile`, `fiches:check`) en
   vrais verbes `ezk …`. Le markdown par IDE ne fait **qu'appeler** le CLI (comme OpenSpec appelle
   `Bash(openspec:*)`).
4. **ADR** : trancher ce qui est portable (méthode) et ce qui reste premium Claude Code (agents,
   hooks).

## Critères d'acceptation

- [ ] Une **source unique** génère `.claude/`, `.cursor/` et `AGENTS.md`, régénérable à volonté.
- [ ] Entre deux IDE, **seule la syntaxe d'invocation diffère** (diff minimal vérifié sur une même commande).
- [ ] `--check` **échoue** (code non nul) si une copie générée a été éditée à la main.
- [ ] La logique vit dans le **CLI `ezk`** ; les fichiers markdown par IDE ne font que l'appeler.
- [ ] Un **ADR** consigne la frontière portable / premium Claude Code.

## Comment vérifier

```bash
# 1. Génération depuis une source unique (POC lawgiver).
pnpm --dir products/mega-city lawgiver gen-ide --root "$(git rev-parse --show-toplevel)"
ls .claude/ .cursor/ AGENTS.md
# 2. Même commande, deux IDE : une seule ligne diffère (la syntaxe d'invocation).
diff .claude/commands/<cmd>.md .cursor/commands/<cmd>.md
# 3. Garde anti-dérive : une édition manuelle d'une copie fait échouer le check.
printf '\nDERIVE\n' >> .cursor/commands/<cmd>.md && pnpm --dir products/mega-city lawgiver gen-ide --check ; echo "exit=$?"
```

## Glossaire

- **générateur** — produit des copies par IDE depuis une source ; on régénère, on n'édite jamais la copie.
- **proxy / façade** — un fichier par IDE qui ne porte pas la logique mais appelle le CLI.
- **AGENTS.md** — standard ouvert multi-outils ; le moyeu universel du thème.

## Notes / décisions

- **Origine** : session de brainstorm + benchmark du 2026-10-07 (OpenSpec / Superpowers / BMAD / vectorz).
- **Facettes liées** : [CLAUDE.md = proxy vers la loi](20261007115129448_claude-md-proxy-loi-bindee-par-projet.md)
  (V0.9, les règles → `CLAUDE.md`) et [ezk multi-client : cap Cursor + modèle par hôte](20260901173549334_ezk-multi-client-cursor-modeles-par-hote.md)
  (parkée, le cap Cursor). Elles restent où elles sont ; cette keystone les généralise, sans les absorber de force.
- **Prior art** : OpenSpec (`openspec init --tools claude,cursor,agents`), standard AGENTS.md.
- **Spike** : `gen.mjs` (preuve du patron, hors dépôt).
- **Taille** : reste entière — POC borné (2 IDE + `AGENTS.md`, sous-ensemble de commandes). Le
  découpage viendra au build si la frontière générateur / CLI / ADR le demande (règle
  [token-economy/fiche-tient-dans-un-sprint](../products/mega-city/rules/token-economy/fiche-tient-dans-un-sprint.md)).
