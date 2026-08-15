---
id: "20260812104022231"
title: DoR — balayer les surfaces produit impactées (doc, site, release notes…) au grooming
type: feature
priority: P2 # provisoire — posée à la capture (PO à confirmer au grooming)
product: mega-city
epic: "20260815080413884"
status: idea
ready:
pr:
created: 2026-08-10
---

# DoR — balayage des surfaces produit au grooming

## Contexte / Problème

Proposition PO (2026-08-10, session samplerz) : « une feature doit inclure tous
les aspects du produit — si on a une nouvelle feature, il faut regarder si elle
doit être incluse, et comment, dans les autres parties (doc, site web, …). La
méthode devrait vérifier ces points au grooming et pour déclarer la fiche
ready. Ça doit être une règle. »

**État actuel de la méthode** : la DoR existe (ADR-0016 — `groom <id>` remplit
3 slots : problème / valeur / critères, + slot conditionnel « dépendances
externes » ; gate `ready <id>` bloquant, jamais auto-tamponné). Mais **aucun
slot ni aucune règle ne demande d'inventorier les surfaces produit impactées**
(doc, site vitrine, README, release notes, screenshots, tutoriels, pricing…).
La plus proche est `rules/development/pr-before-after-media` — côté preuve en
PR (DoD), pas côté cadrage (DoR).

**Symptôme vécu** (déclencheur, repo samplerz 2026-08-10) : le site vitrine a
dérivé du produit — section « Modular pipeline architecture » périmée,
screenshots absents, features livrées sans jamais se demander « et le site ?
et la doc ? ». Un audit d'écarts a posteriori a dû être lancé — coût qu'un
slot DoR à 30 secondes aurait évité fiche par fiche.

## Proposition

(à groomer — pistes)
- **Slot DoR n°4 « surfaces impactées »** dans `ezk-backlog groom <id>` :
  passer une checklist courte des surfaces du repo (doc, site, README, release
  notes, captures, …) et pour chacune décider **oui/non/comment** ; les « oui »
  deviennent des **critères d'acceptation** de la fiche. Le gate `ready <id>`
  vérifie que le balayage a été fait (pas qu'il est non-vide).
- **Appairage DoR→DoD** : le slot rempli au grooming alimente mécaniquement la
  checklist de clôture du sprint (ezk-sprint étape 9/10) — on cadre à l'entrée,
  on vérifie à la sortie.
- **Règle** dans `rules/` (famille `development/` ou `documentation-guidelines/`)
  pour que la loi soit opposable hors ezk-backlog.
- **Manifeste par repo** (léger) : la liste des surfaces du projet (ex.
  samplerz : `website/`, `docs/`, README, release notes) — sinon la checklist
  est générique et devient du bruit.
- Amendement ADR-0016 (le gate DoR est déjà son objet) plutôt qu'un ADR neuf.

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E si UI.

## Notes / décisions

- Lien : [[20260812104022228]] (ezk-screenshots — l'outillage d'UNE surface ; la présente
  fiche est la RÈGLE méthode qui décide *quand* on s'en sert).
- Anti-bruit : le slot doit rester un **balayage à 30 s** (oui/non/comment par
  surface), pas une étude d'impact — sinon il sera sauté.
- Origine : grooming `website_showcase` (samplerz) — audit d'obsolescence
  site↔code lancé le même jour, preuve du coût de l'absence de cette règle.
