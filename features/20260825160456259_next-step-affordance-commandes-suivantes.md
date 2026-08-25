---
id: "20260825160456259"
title: "Proposer les commandes suivantes en fin de sprint/skill (affordance next-step, à la BMAD *help)"
type: feature
priority: P2
product: mega-city
epic: "20260816131703334"
status: todo
ready:
pr:
created: 2026-08-25
---

# 20260825160456259 — Proposer les commandes suivantes en fin de sprint/skill

**En clair.** Aujourd'hui, quand une commande ezk se termine, elle ne dit pas « et maintenant ? ».
L'opérateur doit se souvenir de la commande d'après. BMAD, lui, le fait : chaque agent affiche un
**menu numéroté** (`*help`) et chaque workflow annonce **quoi lancer ensuite**. L'idée : à la fin d'un
sprint ou d'un skill, proposer les **1 à 3 commandes suivantes** qui ont du sens dans le contexte, avec
une raison en une ligne — pour qu'on ne cherche plus « c'était quoi la commande pour X ».

**Si tu arrives frais.** *ezk* = la méthode outillée en skills Claude Code (`/ezk-…`). *affordance* =
un indice visible qui suggère l'action suivante. `/ezk-help` existe déjà mais c'est un **index global**
(« quelles commandes existent »), pas un « **et maintenant, ici** ».

## Contexte / Problème

Déclencheur daté : **2026-08-25**, le PO (Thomas), pendant un `/ezk-backlog add` :
« il faudrait que quand on lance un sprint ou une commande / skill, à la fin les commandes suivantes
soient proposées » — en citant le `help` de BMAD.

Le trou : une commande ezk se **clôt sans indiquer la suite**. Après `ezk-backlog ready <id>`, la
suite déterministe est `next --ready-only` puis `ezk-sprint` — mais rien ne le dit. Après un ship de
sprint, la suite est `reconcile` / `next` — mais rien ne le dit. `/ezk-help` (livré, #151) répond
« quelles commandes existent », **pas** « que faire maintenant, dans cet état ». C'est un besoin de
découvrabilité **contextuelle**, complémentaire de l'index global.

**Prior art BMAD (vérifié dans le code v6.0.4).** `*help` et `*exit` sont **auto-injectés** dans le
menu de chaque agent ; à l'activation, l'agent affiche un **menu numéroté** puis s'arrête et attend ;
les descriptions de workflow **encodent la chaîne** (« Create Story → Validate → Dev → Code Review →
Retrospective ») ; un workflow « Sprint Status » a pour seul rôle « summarize status and **route to
next workflow** » ; « Correct Course » sert d'échappatoire à tout moment.

## Proposition

**MVP resserré** — une **convention de restitution**, pas un moteur de menu (garde-fou ADR-0013) :

1. Chaque skill termine sa restitution humaine par un bloc court **« Et maintenant ? »** : les 1 à 3
   commandes suivantes **pertinentes au contexte**, chacune sur sa ligne, avec un « pourquoi » d'une ligne.
2. Le bloc distingue la **suite déterministe** (ex. après `ready` → `next --ready-only`) des **suggestions**.
3. Mécanisme **composable** : une règle/snippet partagé (« affordance next-step ») que les skills
   **référencent**, pas ré-écrit dans chacun. Le LLM rédige le bloc ; aucun nouveau script requis pour le MVP.
4. Commencer par **`ezk-sprint`** (fin de sprint) et **`ezk-backlog`** (après `add` / `ready` / `ship`),
   les points où « la suite » est la plus attendue.

Plus tard (hors MVP) : générer la **carte des successions** depuis le modèle de la méthode
(cf. [[20260821204737357]], modèle compilé) au lieu de la curer à la main.

## Critères d'acceptation

- [ ] `ezk-sprint` (fin de sprint) et `ezk-backlog` (après `add`/`ready`/`ship`) terminent leur
      restitution par un bloc « Et maintenant ? » listant 1–3 commandes suivantes contextuelles, chacune motivée en une ligne
- [ ] le bloc **distingue** suite déterministe et suggestions (ne présente pas une suggestion comme une obligation)
- [ ] le mécanisme est une **convention partagée** (règle composable citée par les skills), pas dupliquée dans chaque `SKILL.md`
- [ ] respecte « En clair » : bloc en **clôture**, court, sans jargon (règle `human-facing-lisibility`)
- [ ] une note relie le besoin au **prior-art BMAD** (menu/`*help` + routage next-step) — sortie du benchmark de cette session

## Comment vérifier

<à groomer> Exemple attendu : lancer `/ezk-backlog ready <id>` et constater que la sortie se termine par
« Et maintenant ? → `/ezk-sprint` (la fiche est tirable maintenant) ». Sabotage : une commande sans
suite naturelle n'invente pas un bloc creux (pas de « next » forcé).

## Glossaire

- `affordance` — indice visible qui suggère l'action suivante possible.
- `*help` (BMAD) — commande auto-injectée affichant le menu numéroté des actions d'un agent.

## Notes / décisions

- **Fille** de l'épic [[20260816131703334]] (Rationalisation doc + découvrabilité). **Distinct** de
  `/ezk-help` (#151, index global) : ici = next-step **contextuel**.
- Voisines : [[20260817113353538]] (étude templates + elicitation BMAD), [[20260821204737357]]
  (modèle compilé — pourrait générer la carte des successions).
- **Source** : benchmark BMAD vs ezk conduit cette session (2026-08-25) — voir le rapport joint à la PR.
- **P2 = proposition** ; à confirmer/ajuster au grooming (choix MVP : curé par skill vs généré).
