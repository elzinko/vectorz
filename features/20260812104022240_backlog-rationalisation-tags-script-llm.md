---
id: "20260812104022240"
title: "Rationalisation du backlog — regrouper/splitter (épics/stories) via tags : mode script + mode analyse LLM"
type: feature
priority: P1 # choisie par le PO (session 2026-08-12)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-12
---

# Rationaliser le backlog — regrouper / splitter, vite

## Contexte / Problème

Besoin PO (session 2026-08-12) : quand on **crée beaucoup de fiches**, il faut
périodiquement **rationaliser le backlog** — **regrouper** ou **splitter** les features
en user stories / épics — pour garder un backlog **travaillable**. Sans outil dédié :
prolifération, et tri manuel de plus en plus coûteux (« je crée plein de fiches et je ne
sais plus comment les trier facilement »). Besoin décrit comme **structurant** pour la
méthode (« j'en ai vraiment besoin »).

**État de la méthode.**
- `review` (fiche `0071`, **shipped**) fait déjà un sanity-check doublons / regroupement
  **par intention** — mais en pur jugement LLM, sans tags ni pré-groupement rapide.
- `0092` (idea) propose les champs front-matter **`labels:` / `depends:`** — le **modèle
  de données** des tags dont ce besoin a besoin (probable **prérequis**).
- Manque : un **workflow de rationalisation outillé et rapide**, avec **deux moteurs**
  (le PO les nomme) : un **mode script** (mécanique, sur tags) pour pré-grouper, **et**
  un **mode analyse LLM** pour réconcilier les **faux positifs/négatifs** du script
  (« sanitarisation »).

## Proposition

**À groomer — solution non tranchée** (décision architecte). Pistes :

- Un geste de rationalisation (extension d'`ezk-backlog review` ? nouveau sous-commande /
  skill ? — **frontière à trancher**) :
  - **mode script** : propose des clusters à partir des `labels:`/`depends:` (`0092`) et
    d'heuristiques mécaniques — **déterministe, cheap** (le script range, ADR-0001) ;
  - **mode analyse LLM** : passe sur les clusters pour trancher les **faux
    positifs/négatifs** (fiches mal taguées, regroupements par intention que les tags
    ratent), proposer **épics** (regrouper) ou **splits** (découper).
- **Tags** : s'adosse à `0092` (labels/depends) plutôt que réinventer un champ.
- Sorties = **propositions numérotées**, arbitrage **PO** (invariant `review` — jamais
  d'auto-modification).

**À groomer avec `/engineering:architecture`** (frontière avec `0071`/`0092`, articulation
script↔LLM, forme de la « sanitarisation ») **et `/product-management:product-brainstorming`**
(cadrer le vrai geste de rationalisation dans le flux PO).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)

## Notes / décisions

- **Absorbe `0092`** (fermée le 2026-08-23, paquet 1) : `depends:` existait déjà dans
  les fiches ; le reliquat — un champ `labels:`/tags — est LE cœur de cette fiche.
  Registre : `docs/captures/2026-08-23-fermetures-backlog-paquet1.md`. Étend l'esprit
  de `0071` (review, shipped). **Distinct** de `0065` (lui = granularité sprint/PR,
  pas organisation du stock).
- Voisin de méthode : [[20260812104022237]] (owner de PR, même session).
- Origine : session 2026-08-12.
