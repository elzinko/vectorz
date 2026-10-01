---
id: "20260825161522791"
title: "Un grooming guidé : l'agent propose des améliorations, tu choisis"
type: feature
priority: P3
product: mega-city
version: V0.4
labels: [backlog]
epic:
status: shipped
pr: "#309"
created: 2026-08-25
---

# 20260825161522791 — Un grooming guidé

**En clair.** Quand on affine une fiche (`groom`), ezk part en brainstorm libre. BMAD, lui, a une boucle outillée. Après chaque bout écrit, l'agent propose des façons concrètes de l'améliorer. Tu en choisis une. Il l'applique et te montre le résultat. Puis il re-propose, jusqu'à ce que tu sortes. Le benchmark a désigné cette boucle comme le vrai trésor de BMAD.

On la transpose à `groom` : un petit catalogue de 9 techniques (une donnée qu'on édite) et un menu de 3 choix à chaque tour. Deux techniques appellent un skill : l'architecte et le brainstorm. Elles sont proposées d'office quand la fiche s'y prête, et on peut les forcer ou les couper par un paramètre.

Pour toi : tu guides au lieu de discuter à main levée. Tu sors quand tu veux, même au premier tour.

**Si tu arrives frais.** *elicitation* = « faire émerger » : une boucle « propose, tu choisis, il applique, il re-propose » pour muscler un document. *groom* = l'étape qui fait mûrir une fiche vers la DoR (Definition of Ready : problème, valeur, critères).

## Contexte / Problème

Le benchmark BMAD vs ezk (2026-08-25, [rapport](../../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md)) compare deux mécanismes.

- **BMAD** : `advanced-elicitation`, 50 méthodes cataloguées (`methods.csv`). L'agent en choisit 5 selon le contenu, en applique une, montre le résultat, demande validation, puis re-propose. Offert après chaque section écrite.
- **ezk** : `groom` délègue à `product-management:product-brainstorming`, un échange libre. Pas de menu, pas de boucle répétable, pas de catalogue.

Le trou est un manque de **qualité de raffinement**, pas de découvrabilité. En plus, `groom` n'appelle jamais `engineering:architecture`, alors que beaucoup de fiches portent une décision de conception qui mérite l'architecte dès le grooming (besoin PO du 2026-08-12).

## Proposition (arbitrages du grooming)

MVP resserré, garde-fou [ADR-0013](../../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) : pas de moteur générique.

1. **Un catalogue, une donnée.** `products/mega-city/skills/ezk-backlog/groom-techniques.yml` : 9 techniques. Chacune a un `id`, un `title`, un `slot` visé (liste fermée : probleme, valeur, criteres, dependances, perimetre, structure, projet), une `ask` (la consigne appliquée) et, pour deux d'entre elles, un `calls` (le skill appelé).
2. **Une boucle, une convention de `groom`.** Menu de 3 techniques (4 au plus) choisies sur le slot le plus faible. L'opérateur en choisit une. L'agent l'applique, montre la section améliorée, demande « garder / retoucher / annuler », puis re-propose sans les techniques déjà jouées. Sortie explicite avec `0`. Sortir au premier tour est légitime : aucune passe n'est forcée.
3. **Sans opérateur, pas de menu.** Quand personne ne peut répondre à un menu (un orchestrateur ou un run autonome : `ezk-product-build`, `ezk-pm`, `ezk-sprint` à l'intake), l'agent applique lui-même, pour chaque slot manquant, la technique la plus utile (une par slot, en une passe) et note lesquelles. Un slot qui ne se remplit pas sans arbitrage reste dit tel quel : la fiche n'est pas prête. Sinon la boucle bloquerait l'auto-groom, ou l'auto-groom ne passerait plus le gate.
4. **Appels de skills** (reprend [`20260812104022243`](20260812104022243_groom-appelle-architecture-brainstorming.md)). `avis-architecte` appelle `engineering:architecture`. `brainstorm-cible` appelle `product-management:product-brainstorming`. Règle de défaut tranchée : l'architecte est proposé au menu quand la fiche est de type `feature` ou `refactor` **et** porte une décision de structure (frontière de module, format ou contrat, dépendance). Le brainstorm est proposé quand le slot « problème » est faible. Paramètres : `--archi` / `--no-archi`, `--brainstorm` / `--no-brainstorm`.
5. **Slots du projet** (lien avec [`20260815080414006`](20260815080414006_dor-extensible-par-projet.md), livrée). Un slot déclaré dans `.vectorz/dor.yml` n'est pas connu du catalogue. Une technique de repli générique, `slot-du-projet`, reprend la `ask` et les `items` du slot que `ezk dor check` nomme. Elle est proposée d'office. Sans elle, un slot propre au projet n'aurait aucune technique applicable.
6. **Frontière** ([ADR-0001](../../products/mega-city/docs/adr/0001-monorepo-composable-coeur-deterministe.md)). Le LLM rédige et juge dans la boucle. Aucun script ne décide. Le seul code est un test qui garde la **forme** de la donnée (comme `fiche-schema-contract.test.ts` garde le schéma).

## Critères d'acceptation

- [x] `groom-techniques.yml` existe : 6 à 10 techniques, ids uniques, `slot` dans la liste fermée, chacune avec une `ask`. Un test le garde.
- [x] Le skill `ezk-backlog` décrit la boucle : menu court (3 à 4), appliquer, remontrer, re-proposer, sortie explicite. Sortie au premier tour sans passe forcée. Preuve : skill, section `groom`, étape 2.
- [x] Le skill décrit le mode sans opérateur (pas de menu, une technique d'office par slot manquant).
- [x] `avis-architecte` et `brainstorm-cible` sont au catalogue. Les 4 paramètres et la règle de défaut sont écrits dans le skill. Preuve : skill, section `groom`, étape 3.
- [x] Un slot propre au projet a une technique applicable : `slot-du-projet`, générique (retour Codex, PR #309). Preuve : `groom-techniques.test.ts`.
- [x] Respect d'[ADR-0001](../../products/mega-city/docs/adr/0001-monorepo-composable-coeur-deterministe.md) : aucune décision de rangement dans un prompt ; aucun script load-bearing.
- [x] Une note relie le mécanisme au prior art BMAD (`advanced-elicitation`, `methods.csv`) via le rapport de benchmark, en tête du catalogue et dans le skill.

## Comment vérifier

1. `pnpm --dir products/mega-city exec vitest run src/backlog/__tests__/groom-techniques.test.ts` : catalogue valide, le skill cite le catalogue et les 4 paramètres, le lien de prior art résout.
2. Essai à la main (une boucle LLM ne se rejoue pas en CI) : `/ezk-backlog groom <id>` sur une fiche `idea` affiche un menu de 3 techniques. En choisir une : la section améliorée est remontrée, puis un nouveau menu apparaît. Taper `0` : fin.
3. **Sabotage.** Taper `0` au premier menu : la fiche n'est pas modifiée.
4. Mode sans opérateur : essayé sur cette fiche même. Les deux techniques d'office ont été `couper-au-poc` (périmètre ramené à un MVP, le reste en « Suite ») et `criteres-testables` (chaque critère a sa preuve).

## Suite (hors POC)

- Panel de challenge adverse comme technique du catalogue : attend la fiche [[0161]].
- Catalogue étendu par projet (`.vectorz/`) : à faire si un projet le réclame.
- Choix automatique du menu par un score : non, le LLM choisit (ADR-0001).

## Glossaire

- `elicitation` : boucle de raffinement guidée. L'agent propose, tu choisis, il applique, il re-propose.
- `advanced-elicitation` (BMAD) : l'implémentation BMAD. 50 méthodes, 5 proposées à la fois, boucle jusqu'à « proceed ».

## Notes / décisions

- **Source** : benchmark BMAD vs ezk du 2026-08-25 ([rapport](../../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md), Dim 2), recommandation n°2.
- **Voisines** : [[20260817113353538]] (étude prior art, dont ce build est la suite actionnable), [[20260825160456259]] (affordance next-step, reco n°1), [[0161]] (panel de challenge).
- Lien fort avec la composition comportementale [[20260812104022246]] : « forcer l'appel d'un skill au grooming » en est une instance concrète, livrée ici sans attendre le mécanisme général.

## ⤓ Absorbe (tri du 2026-09-30)

- [`20260812104022243`](20260812104022243_groom-appelle-architecture-brainstorming.md) : `groom` appelle aussi l'architecte et le brainstorm, par défaut ou forcé. Intégré (point 4).
