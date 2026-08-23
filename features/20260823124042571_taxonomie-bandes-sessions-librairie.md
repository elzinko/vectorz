---
id: "20260823124042571"
title: Taxonomie — séparer scrum / hôte LLM / librairie, et poser une nomenclature des skills
type: refactor
priority: P1
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-23
---

## En clair

Les 4 bandes officielles ne suffisent pas : 5 commandes restent « hors bande » et
deux commandes de la bande méthode (`ezk-start`, `ezk-archive`) ne sont pas du scrum.
La coupure qui manque : **scrum** vs **hôte LLM** vs **la librairie elle-même**.
Cette fiche propose la nouvelle taxonomie, une règle de nommage dans LA LOI, et la
première fusion concrète (`ezk-session`). Décision structurante → panel adverse avant exécution.

> Priorité P1 **proposée**, à confirmer par le PO.

## Contexte / problème

Constat porté par la carte compilée (retour PO du 2026-08-23) :

- Les 4 bandes d'ADR-0020 §1 ne citent pas `ezk-codex`, `ezk-ezk`, `supervision-analyze`,
  `supervision-demo`, `vz-product-builder` — ils s'affichent « hors bande ».
- `ezk-start` et `ezk-archive` sont rangés en « Artefacts & rituels de méthode », mais
  archiver une **session** n'est pas un rituel agile : c'est une contrainte de l'hôte LLM
  (les sessions se ferment, le contexte se perd). Même chose pour l'ouverture (`ezk-start`).
- `ezk-steward` (gardien de la librairie) et `ezk-ezk` (fabrique de skills) ne servent pas
  la méthode agile d'un produit : ils servent **le catalogue lui-même**.
- L'agent `ezk-archive` s'affiche parmi les « juges » alors que c'est un **exécutant**
  technique (sous-agent de délégation, pinning de modèle) — pas un rôle scrum.
- Aucune nomenclature de nommage des skills n'existe (constat PO). Les renames d'ADR-0020
  (`ezk-pr`, `ezk-dev`) ont corrigé des cas, pas posé la règle.

Ce que la fiche ne rouvre PAS : « pourquoi `ezk-commits` reste un skill au lieu d'une
compétence par agent » — ADR-0020 y répond déjà (capacité partagée = brique autonome ;
`ezk-commits` est composé par 5 skills, le fondre dans chaque agent le dupliquerait 5 fois).

## Proposition

1. **Deux bandes de plus** (amendement d'ADR-0020) :
   - **Sessions & hôte LLM** — l'hygiène de l'hôte, pas du scrum : `ezk-start`,
     `ezk-archive`, `supervision-*`. C'est la couche « déployer et faire tourner la
     méthode dans Claude/Cursor », pas la méthode.
   - **La librairie** — le catalogue qui se fabrique et se garde lui-même : `ezk-ezk`,
     (rôle) `ezk-steward`.
2. **Fusion `ezk-session`** : `ezk-start` + `ezk-archive` deviennent les sous-commandes
   `start` / `close` d'un seul skill `ezk-session`. Un skill, un cycle de vie.
3. **Règle de nommage dans LA LOI** (`rules/…`, enforced par `ezk-steward`) :
   préfixe `ezk-`, un nom = un objet de sa bande (cérémonie → verbe de rituel ;
   capacité → l'outil ; rôle → le métier), pas de doublon sémantique.
4. **Clarifier product-builder** : le rôle décideur existe déjà (agent `ezk-pm`) ;
   le skill est la cérémonie. Option de renommage (`ezk-product-build`) à trancher
   dans la même passe de nomenclature. `ezk-codex` se range en capacité de méthode
   (adressage de revue) ou d'outillage — à trancher au panel.
5. La carte lit la taxonomie depuis les fichiers (aujourd'hui la table d'ADR-0020
   est recopiée dans `map-data.ts` — la déplacer vers un frontmatter `bande:` ou un
   YAML unique pour qu'elle soit dérivée, pas recopiée).

## Critères d'acceptation

- [ ] Panel adverse tenu sur la taxonomie (attaquants + juge), verdict capturé.
- [ ] ADR-0020 amendé (ou nouvel ADR) : bandes actées, tableau à jour.
- [ ] `pnpm graph:check` et la carte n'affichent plus aucun skill « hors bande ».
- [ ] `ezk-session` existe avec `start`/`close` ; les anciens noms redirigent ou sont retirés.
- [ ] La règle de nommage existe dans `rules/` et `ezk-steward` la vérifie.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:check
pnpm --dir products/mega-city map:data && git diff --stat diagrams/
pnpm --dir products/mega-city test
```

La carte (`pnpm ezk:map`) ne doit plus montrer d'entrée « sans bande officielle ».

## Notes

Origine : retour PO sur la carte compilée (session 2026-08-23, PR #162). Lignée :
ADR-0020 (amendement 4 bandes), ADR-0022 (superseded), renames `ezk-pr`/`ezk-dev`.
