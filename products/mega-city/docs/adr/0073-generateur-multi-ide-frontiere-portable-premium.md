# ADR 0073 — Générateur multi-IDE : on génère (pas on pointe), et la frontière portable / premium

**Statut :** Accepté (build, 2026-10-11)
**Date :** 2026-10-11
**Deciders :** PO (Thomas) ; direction validée au benchmark du 2026-10-07 (OpenSpec / Superpowers / BMAD / vectorz)
**Fiche :** [`20261007151859470`](../../../../features/done/20261007151859470_generateur-multi-ide-cli-moteur.md) (« Générateur multi-IDE, CLI moteur »)
**Compose :** [`src/core/gen-ide.ts`](../../src/core/gen-ide.ts) (`genIdeFiles`, pur) · [`bin/lawgiver.ts`](../../bin/lawgiver.ts) (`gen-ide`, I/O) · s'appuie sur [ADR-0029](0029-fiche-est-le-document-pr-en-est-le-rendu.md) (« une source, des rendus ») et [ADR-0003](0003-moteur-bind-plan-pur-coquille-io.md) (cœur pur / coquille I/O)

## En clair

vectorz ne tournait que dans Claude Code. On veut le faire tourner aussi dans Cursor et les autres
éditeurs, **sans dupliquer la méthode**. Deux décisions : **comment** on porte (générer, pas
pointer), et **jusqu'où** on porte (la méthode est portable ; le moteur d'agents reste premium
Claude Code).

## Décision 1 — Générer, pas pointer

Une **source unique** (les commandes `ezk` du manifeste) produit un jeu de fichiers **par IDE** :
`.claude/commands/`, `.cursor/commands/`, `AGENTS.md`. Entre deux IDE, **seule la syntaxe
d'invocation diffère** (`$ARGUMENTS` vs `{{args}}`). On **régénère**, on n'édite jamais une copie ;
une **garde anti-dérive** (`gen-ide --check`) échoue si une copie a été modifiée à la main.

Pourquoi générer et pas poser un pointeur : les IDE ne suivent pas un pointeur de façon fiable
(prior art OpenSpec, qui génère des copies par outil). C'est l'esprit d'ADR-0029 (« la fiche est le
document, la PR en est le rendu ») étendu : **une source, des rendus par IDE**.

Les fichiers par IDE **ne portent aucune logique** : ils ne font qu'appeler `ezk …`. Le **CLI `ezk`
est le moteur** ; le markdown par IDE est une façade.

## Décision 2 — Frontière portable / premium

- **Portable** (tout IDE, via les artefacts markdown + le CLI `ezk`) : les fiches, les règles/la loi,
  les specs, le workflow, les **commandes** générées par `gen-ide`.
- **Premium Claude Code** (ne se porte pas) : le **moteur d'agents** — sous-agents, revue adverse
  inter-modèles, `ezk-pm`, la loi posée par **hook** git. Cursor n'a pas de sous-agents ; un hook
  n'est pas un concept partagé.

Donc : la **méthode** est portable ; son **exécution autonome multi-agents** reste Claude Code.

## Conséquences

- POC livré : 2 IDE (`claude`, `cursor`) + `AGENTS.md`, sur un **sous-ensemble** de commandes
  (`now`, `paths`, `backlog check`, `graph query`). Critères prouvés en local (génération, diff
  minimal entre IDE, `--check` rouge sur édition manuelle) — **sans** exiger un Cursor à l'exécution.
- **Suite** : étendre à tout le manifeste, promouvoir les derniers scripts en verbes `ezk`, et
  éprouver les fichiers générés dans un vrai Cursor (hors périmètre du POC).
- Décision contestable à tenir : quelqu'un voudra « juste un pointeur » ou porter les sous-agents —
  cet ADR est le point de référence pour répondre « générer » et « premium reste premium ».
