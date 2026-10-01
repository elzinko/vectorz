---
id: "20260825160456259"
title: "À la fin d'une commande, proposer les 1 à 3 commandes suivantes"
type: feature
priority: P2
product: mega-city
version: V0.3
labels: [lisibilite]
epic:
milestone: rationalisation
status: idea
pr:
created: 2026-08-25
---

# 20260825160456259 — Proposer les commandes suivantes en fin de sprint/skill

**En clair.** Quand une commande ezk se termine, elle ne dit pas « et maintenant ? ». Tu dois te souvenir de la commande d'après. BMAD, lui, le fait : chaque workflow annonce quoi lancer ensuite. Cette fiche ajoute, à la fin d'un sprint et d'une commande de backlog, un bloc court **« Et maintenant ? »** : 1 à 3 commandes qui ont du sens dans le contexte, chacune avec une raison en une ligne.

**Si tu arrives frais.** *ezk* = la méthode outillée en skills Claude Code (`/ezk-…`). *affordance* = un indice visible qui suggère l'action suivante. `/ezk-help` existe déjà, mais c'est un **index global** (« quelles commandes existent »), pas un « **et maintenant, ici** ».

## Contexte / Problème

Déclencheur daté : **2026-08-25**, le PO (Thomas), pendant un `/ezk-backlog add` : « il faudrait que quand on lance un sprint ou une commande / skill, à la fin les commandes suivantes soient proposées », en citant le `help` de BMAD.

Le trou : une commande ezk se **clôt sans indiquer la suite**. Après `ezk-backlog ready <id>`, la suite est `next --ready-only` puis `ezk-sprint`, mais rien ne le dit. Après un sprint mergé, la suite est la fiche suivante, mais rien ne le dit. C'est un besoin de découvrabilité **contextuelle**, complémentaire de l'index global.

**Prior art BMAD** (vérifié dans le code v6.0.4, rapport [`2026-08-25-bmad-vs-ezk`](../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md)). `*help` et `*exit` sont injectés dans le menu de chaque agent. L'agent affiche un menu numéroté, puis attend. Les descriptions de workflow encodent la chaîne (« Create Story → Validate → Dev → Code Review → Retrospective »). Un workflow « Sprint Status » a pour seul rôle de router vers le workflow suivant.

## Décisions de grooming (MVP)

- **Une règle partagée** `documentation-guidelines/next-step-affordance` (SHOULD, bundle `base`) fixe le format du bloc. Les skills la déclarent dans `applies:` et la citent. Ils ne la recopient pas.
- Les **successions** (« après X, proposer Y ») sont **curées par skill**, dans une courte section « Et maintenant ? » du `SKILL.md` : une table `quand | suite logique | pistes`. Pas de script, pas de génération. Le LLM rédige le bloc d'après la table (garde-fou ADR-0013 : une convention de restitution, pas un moteur de menu).
- Le bloc a **deux étages** : « Suite logique » (la suivante est déterminée par l'état) et « Pistes » (au choix, jamais présentées comme une obligation). **1 à 3 commandes** au total, chacune avec un pourquoi d'une ligne.
- **Pas de bloc creux** : une sous-commande en lecture seule (`list`, `help`) ou sans suite naturelle n'invente rien. La table l'écrit « aucun bloc ».
- Premiers skills : `ezk-sprint` (après `check`, fin de sprint) et `ezk-backlog` (après `add`, `groom`, `ready`, `ship`).

## Critères d'acceptation (reste réel)

- [x] La règle existe, est rangée dans le bundle `base`, et relie le besoin au prior art BMAD (menu `*help` + routage vers le workflow suivant). Preuve : `next-step-affordance.test.ts`.
- [x] `ezk-sprint` et `ezk-backlog` déclarent la règle dans `applies:` et ont une section « Et maintenant ? » avec une table `quand | suite logique | pistes`.
- [x] Le bloc distingue suite logique et pistes ; 1 à 3 commandes par ligne de table ; un pourquoi d'une ligne (le test compte les commandes et les « — » de raison).
- [x] Une sous-commande sans suite naturelle est marquée « aucun bloc » (`help`, `list`, `review`, `check` en alerte) : pas de suite inventée.
- [x] Un test passe au rouge si : la section manque, `applies:` ou le lien vers la règle manque, une ligne cite 0 ou plus de 3 commandes, ou une commande citée n'existe pas. Sabotage prouvé à la main : `/ezk-fantome` dans la table d'`ezk-backlog` → « L11: … ni skill, ni commande ».
- [x] Respecte « En clair » : la règle impose un bloc en clôture, court, sans jargon. Le texte final rédigé par le LLM n'est pas testable : il se constate à l'usage.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/next-step-affordance.test.ts
```

À la main, une fois : `/ezk-backlog ready <id>` se termine par « Et maintenant ? » avec `/ezk-backlog next --ready-only` en suite logique. C'est le LLM qui rédige : le test garde la table et la règle, pas la phrase finale.

Sabotage : citer `/ezk-fantome` dans la table. Le test passe au rouge.

## Suite (hors POC)

- Étendre à `ezk-archive`, `ezk-pr`, `ezk-retro`, `ezk-chef`, `ezk-product-build`.
- Générer la carte des successions depuis le modèle compilé ([20260821204737357](done/20260821204737357_cabler-la-methode-modele-compile.md)) au lieu de la curer à la main.
- Adapter les pistes à l'état réel (statut de la fiche, PR ouverte) ; menu numéroté interactif à la BMAD.

## Glossaire

- `affordance` : indice visible qui suggère l'action suivante possible.
- `*help` (BMAD) : commande qui affiche le menu numéroté des actions d'un agent.

## Notes / décisions

- Ancienne fille de l'épic « Rationalisation doc + découvrabilité », retiré le 2026-09-15 (devenu le thème `lisibilite` et le jalon `rationalisation`). **Distinct** de `/ezk-help` (index global).
- Voisines : [20260817113353538](done/20260817113353538_etude-prior-art-bmad-templates-elicitation.md) (étude BMAD), [20260821204737357](done/20260821204737357_cabler-la-methode-modele-compile.md) (modèle compilé).
- **Source** : benchmark BMAD vs ezk du 2026-08-25.
- Choix MVP tranché au grooming : **curé par skill**, pas généré.
