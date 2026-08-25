---
id: "20260812104022246"
title: "Composition comportementale des skills ezk — directives composables (format imposé, appels de commandes forcés)"
type: feature
priority: P1 # choisie par le PO (session 2026-08-12)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-12
---

# Composer du COMPORTEMENT dans un skill ezk (pas seulement des dépendances)

## Contexte / Problème

Besoin PO (session 2026-08-12) : pouvoir créer de la **composition** dans les skills
générés par ezk — ajouter des **lignes/directives** qui **imposent** à la commande/skill
un **formalisme** particulier : *répondre de telle manière*, *appeler telle commande*
(architecte, brainstorming, …), etc. Autrement dit des **fragments comportementaux
réutilisables** (mixins / aspects) qu'un skill **déclare** et qui se **tissent** dans ses
instructions.

**État de la méthode — trois voisins, aucun ne couvre exactement ça.**
- **`0149` composition inter-skills (`composes:`) — SHIPPED** (ADR-0025-composes) : graphe
  de dépendances + warning sur composant manquant. C'est **QUI dépend de QUI** (structurel),
  **pas QUELLE directive comportementale** un skill impose.
- **Système `rules/` (iamthelaw)** : sait déjà « imposer une ligne de conduite » à
  l'échelle d'un **profil** (ex. `rules/documentation-guidelines/human-facing-lisibility.md`
  = « réponds ainsi »). Mais ce n'est pas déclaré **au niveau d'un skill généré**, ni
  orienté « force l'appel de telle commande ».
- **`0075`** (idea) : corpus de règles de **persona/format** pour `ezk-article` — cousin,
  mais scopé écriture d'articles.

## Proposition

**À groomer — solution non tranchée** (demande PO : « peux-tu créer une fiche… il faudra
la groomer avec `/engineering:architecture` et `/product-management:product-brainstorming` »).
Pistes :

- Un mécanisme (frontmatter ? bloc dédié ? références vers des `rules/` ?) par lequel un
  skill ezk **déclare des directives comportementales composables** : format de
  restitution imposé, **appels de commandes obligatoires** (ex. « ce skill DOIT appeler
  `engineering:architecture` à l'étape X »), tics à éviter, etc.
- **Frontière à trancher** avec : `0149` (`composes:` structurel — est-ce une facette
  `composes-behavior` ?), le système **`rules/`** (est-ce une extension de rules bindées au
  skill ?), `0075` (persona/format), et le générateur **`ezk-ezk`** (qui fabrique les
  skills : c'est probablement lui qui poserait ces directives).
- **Cas d'usage moteur** : [[20260812104022243]] (③ — groom force l'appel archi+brainstorm)
  est une **instance** de ce mécanisme.
- **2e cas d'usage (PO 2026-08-25)** : une directive « **`ezk-archive` ne restitue QUE la session
  courante** » — ne pas afficher le pending des autres worktrees/sessions (les **nommer** suffit),
  tissée dans le **bundle d'archivage**. Règle de sortie voisine : [[20260824111001836]] ; le cockpit
  [[20260825141012293]] EXPOSE déjà l'état des autres sessions, donc l'archivage n'a pas à le dupliquer.

**À groomer avec `/engineering:architecture`** (frontière `composes:`↔`rules/`↔`ezk-ezk`,
forme de la directive) **et `/product-management:product-brainstorming`** (le vrai besoin
et ses cas).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)

## Notes / décisions

- **Sœur de `0149`** (composition **structurelle**, shippée) — ici = composition
  **comportementale**. Voisins : `rules/` (iamthelaw), [[0075]] (persona/format),
  instance concrète [[20260812104022243]] (③). Générateur concerné : `ezk-ezk`.
- Solution **non tranchée** (demande PO) → architecte.
- **Idée map (PO 2026-08-25)** : la carte de la méthode (`ezk:map`, qui liste les skills dont
  `ezk-archive`) pourrait **afficher, par skill/agent, les directives/règles composées** — rendre
  visible « ce qui est tissé » à l'exécution, très parlant pour comprendre le comportement réel.
  Recoupe l'onglet sessions de [[20260825141012293]].
- Origine : session 2026-08-12.
