# Sprint — ezk-ci conso : script déterministe + endpoint billing migré

Périmètre: 1 feature (POC), fiche 20260828150801613   Statut: en cours
Branche: feat/20260828150801613-ezk-ci-conso   Base: origin/main

## Ouverture (portier)
- VERDICT ALERT points=1,2,3 le 2026-08-29 → **override PO journalisé** (« on continue »).
  - P1 arbre sale = `vite.config.ts` (fix PORT gardé local, hors périmètre).
  - P2 worktrees = principal + 2 agents périmés + 2 sessions parallèles (dashboard, feedback/retro) — sujets disjoints d'ezk-ci.
  - P3 in-progress = 5 fiches, aucune n'est celle-ci.
- reconcile : rien de mergé à rattacher pour cette fiche (neuve).

## Backlog (1 ligne = 1 feature = 1 PR)
- [x] feat: ezk-ci conso — core + CLI + endpoint /usage + test + doc SKILL   (PR #186, gate verte, reviewer GO — EN ATTENTE MERGE)

## Revue adverse (ezk-reviewer, GO)
- Traités : casse tolérante product/unitType (P2, évite le silence « 0 min ») + nit `m!`.
- Acceptés cosmétiques : arrondi du total, net d'un repo public (théorique), billing user-only (pas org).

## Décisions d'archi (les 3 de la fiche, tranchées)
1. **Emplacement** : cœur PUR testable `src/core/ci-conso.ts` (agrégation) + wrapper I/O `bin/ci-conso.ts` (fetch `gh` + rendu). Même patron port/adaptateur que `avancement-data.ts`. (Inline SKILL rejeté : un script testé est plus robuste ; portage copy-mode = chantier séparé.)
2. **Granularité** : agrégats **mensuels par repo** depuis `/settings/billing/usage` (défaut = mois courant). Le fin « depuis DATE » (API runs) = **hors périmètre MVP** (noté en Notes).
3. **public/privé** : une visibilité par repo via `gh api /repos/<o>/<r> --jq .visibility`, **best-effort** (si l'appel échoue → « ? », pas de crash) ; N appels acceptés au MVP.

## Definition of Done (BDD)
- Given un `usageItems` (fixture) When on agrège Then une ligne par repo, minutes = somme des SKU « Actions … Minutes », triée par minutes desc, + total.
- Given un item non-Actions (codespaces/packages) When on agrège Then il est **ignoré**.
- Given une carte de visibilité When on rend Then chaque repo porte public/privé (défaut « ? » si inconnu).
- Given l'API billing renvoie 410/erreur When la CLI tourne Then message clair + exit ≠ 0, **pas** de stacktrace.
- `pnpm --dir products/mega-city test` vert (fixture) ; SKILL ezk-ci cite l'endpoint `/usage` + le repli.

## Notes / décisions
- Endpoint mort : `/users/<u>/settings/billing/actions` → **410**. Cible : `/users/<u>/settings/billing/usage?year&month` (`usageItems`).
- Hors MVP : granularité par runs (`/repos/.../actions/runs` + timing), cache visibilité.
