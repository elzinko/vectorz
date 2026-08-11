---
id: 0187
title: ezk-article — « LLM skills migration » (versionner et migrer des skills LLM en markdown)
type: feature
priority: P3
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-09
---

# 0187 — Article « LLM skills migration »

## Contexte / Problème

Une skill LLM opérée en markdown est un **contrat vivant** : son front-matter,
ses étapes, le layout des artefacts qu'elle gère évoluent. Une fois déployée dans
plusieurs projets, se pose le même problème que les schémas de base de données :
**comment faire évoluer proprement ce qui est déjà installé**, sans rescanner
chaque repo à la main.

mega-city a déjà une réponse partielle — le pattern **Skema** (Skill Schema
Migrations, cf. `ezk-backlog/migrations/`) — mais elle n'est ni généralisée ni
racontée. Un article vulgarisé permettrait de (1) socialiser le pattern, (2)
clarifier le design de la généralisation (fiche 0186), (3) situer l'idée par
rapport à l'état de l'art (migrations DB, feature flags, semver de prompts).

## Proposition

Écrire l'article via la skill **`ezk-article`** (persona + panel de relecteurs
frais). Angle : « versionner et migrer des skills LLM comme on migre un schéma de
base de données ».

Plan pressenti :

1. Le problème : une skill markdown est un contrat déployé en N exemplaires.
2. L'analogie DB : `VERSION` courante vs installée, migrations ordonnées `NNN-*`.
3. Skema aujourd'hui : ce qui marche (ezk-backlog, layout `features/` v1→v2).
4. La frontière déterministe : le LLM propose, le script range (jamais de
   mutation silencieuse ; règle d'or `--apply`).
5. Le manque et la cible : registre de bind versionné, migrations par skill
   (renvoi à 0186).
6. Anti-patterns : muter sans OK, inférer une version depuis la simple présence
   d'un fichier, coupler la migration à un hôte précis.

## Critères d'acceptation

- [ ] Article rédigé via `ezk-article` (persona + panel de relecteurs) et relu.
- [ ] Il explique Skema à partir d'un exemple concret réel (migration `002` d'ezk-backlog).
- [ ] Il distingue clairement « versionner la skill » vs « versionner les artefacts gérés ».
- [ ] Il pose le problème général et renvoie à la fiche 0186 pour l'implémentation.
- [ ] Publié à l'emplacement des articles du repo (cohérent avec les articles existants).

## Notes / décisions

- Binôme de la fiche **0186** (généralisation de Skema) — l'article et le design
  s'éclairent mutuellement ; écrire l'article aide à figer le contrat de 0186.
- Rangé en **LATER / promo** (P3) dans l'esprit du PLAN : à écrire quand le PO
  ouvre le sujet ; ne bloque aucune livraison produit.
- `mega-city` est gelé comme repo autonome ; l'article vit désormais dans
  **vectorz** (`products/mega-city`), maison à jour de la méthode.
