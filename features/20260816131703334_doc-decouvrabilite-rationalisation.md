---
id: "20260816131703334"
title: "Épic — Rationalisation doc + découvrabilité (produit OSS de niveau pro)"
type: epic
priority: P1
product: mega-city
labels: [doc, decouvrabilite, oss, enabler]
status: todo
ready:
pr:
created: 2026-08-16
---

# Épic — Rationalisation doc + découvrabilité

> **Base** : deux audits documentaires indépendants (méthode mega-city + produit vectorz/cop1),
> 2026-08-16. Rapport de synthèse : « La clarté par construction ».

## Contexte / Problème

La doc du projet est éparpillée et **dérive**. Le fil rouge des deux audits : presque tout
ce qui est périmé est une **vue dérivée maintenue à la main** (method-map, compteurs
`skills/README` 19/6 vs réel 20/7, `docs/backlog-carte.md` périmée, `bin/README` qui décrit
2 commandes sur ~20, le diagramme global `ezk-methode-globale` citant des skills inexistants
et jamais rendu, les deux namespaces d'ADR `0001-0028` vs `ADR-015-037`). S'ajoutent :
la **confusion des audiences** (`docs/` plat mêle utilisateur / contributeur / mainteneur /
auteur-de-méthode), la **crise d'identité** `cop1 ↔ vectorz ↔ mega-city` (ADR-027 à moitié
exécuté, `package.json name: cop1`), l'**absence de LICENSE/CONTRIBUTING/SECURITY**, et
`products/cop1/` (le produit cœur) **sans README**.

**Racine unique** : rien n'est généré, tout se recopie → désynchronisation par construction.

## Proposition — 4 phases (voir rapport)

- **Phase 0 — Socle** : `LICENSE` (MIT, déjà annoncé) + `CONTRIBUTING` + `SECURITY` ;
  corriger compteurs `skills/README` (20/7, ajouter `ezk-archive`), coquilles « Moniteor »,
  lien README→brownfield périmé ; réécrire README mega-city (« rien n'est branché » = faux).
- **Phase 1 — Générer** (le cœur) : `/ezk-help` (index commandes généré depuis `argument-hint`) +
  **inventaire & method-map générés** depuis `profiles/global.yml` + frontmatters. → fiche fille `/ezk-help`.
- **Phase 2 — Ranger** : structure **Diátaxis** (start / guides / reference / explain) ;
  sortir le bruit interne (`docs/sessions/`) du dépôt ; scinder les SKILL.md (usage vs invariants) ;
  unifier les 2 namespaces d'ADR (index croisé).
- **Phase 3 — Trancher** : renommage `cop1 → vectorz` (finir ADR-027) + encart « méthode vs produit » ;
  README `products/cop1/` + carte des 9 packages ; site doc public + langue de référence externe.

## Ce qui est DÉJÀ BON (à préserver — ne pas casser en rationalisant)

Registre `docs/adr/` (le joyau) · `rules/` (58 fichiers, frontmatter homogène = le patron) ·
`profiles/README.md` (le modèle) · glossaire jargon + quarantaine pré-pivot (avec test anti-régression) ·
`PORTFOLIO.md` & `diagrams/` (déjà générés/versionnés = la preuve que « généré » marche).

## Critères d'acceptation (épic — jalons)

- [ ] Phase 0 livrée (socle OSS + mensonges corrigés)
- [ ] Phase 1 : `/ezk-help` + inventaire généré (fin de la dérive des compteurs/carte)
- [ ] Phase 2 : `docs/` en Diátaxis + audiences séparées
- [ ] Phase 3 : identité tranchée + README produit + porte publique

## Notes

- **Supersède l'antipattern de 0068** (« garder la method-map à jour à la main ») :
  une carte tenue à la main dérive par construction → on la **génère**.
- Voisines : [[0079]] (lisibilité — règle), [[0091]] (glossaire jargon), [[0133]] (fermée 2026-08-24 — la carte des rôles = le graphe compilé),
  [[0177]] (pack pratiques portables), [[0087]] (distribution/publication — LATER).
- Filles à ce jour : `/ezk-help` (Phase 1). Les autres phases → fiches filles à groomer au fil de l'eau.
