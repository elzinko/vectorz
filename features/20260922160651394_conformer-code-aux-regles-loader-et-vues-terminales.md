---
id: "20260922160651394"
title: "Conformer le code aux 2 règles neuves : lecteur de fiche par loader + vues sans statut terminal"
type: chore
priority: P2
product: mega-city
version:
epic:
labels: [dette, revue]
status: idea
ready:
pr:
evidence: none # code / outillage, pas d'écran
created: 2026-09-22
---

# Conformer le code aux règles `fiche-read-via-loader` + `active-views-exclude-terminal-status`

## En clair

La rétro du 2026-09-20 a posé **deux règles `MUST`** (`development/fiche-read-via-loader` et
`development/active-views-exclude-terminal-status`). Codex (PR #256) a montré qu'elles sont
**violées par du code existant** dès leur activation. Les règles sont donc **cadrées en
déploiement progressif** (le legacy = dette listée), et cette fiche **porte la mise en
conformité**. Deux volets indépendants.

## Contexte / Problème

Retour Codex sur la PR #256 (2026-09-21), deux findings :

1. **Lecteurs de fiche en parse maison** — la règle `development/fiche-read-via-loader` exige que
   tout lecteur passe par `loadFiches` / `readField`. Or trois outils parsent le front-matter à la
   main : `products/mega-city/bin/regen-backlog.sh` (fonction `extract`, `awk` sur id/title/status…),
   `products/mega-city/bin/portfolio.sh` (même `awk`), et `products/mega-city/bin/plan-head.ts`
   (parser maison). Le bundle `development` est donc non conforme immédiatement.
2. **Vues `plan-*` qui laissent fuiter les terminaux** — la règle
   `development/active-views-exclude-terminal-status` inclut `plan-*`, mais `buildPlanViewData`
   copie **toutes** les fiches référencées, `buildPlanDelta` ne filtre que `done`/`shipped`, et le
   board ne masque que `shipped`. Résultat : `window.EZK_PLAN` porte **10 cartes `superseded`**
   (dont 2 sur des lignes non barrées) ; l'onglet Plan présente du travail terminal comme actif et
   « Masquer les fiches livrées » ne les cache pas.

## Proposition (2 volets)

### Volet A — lecteurs de fiche via le loader
- Réécrire `regen-backlog.sh` et `portfolio.sh` pour consommer le loader testé (via un `bin/*.ts`
  qui lit `loadFiches`, ou porter ces vues en TS), et faire passer `plan-head.ts` par `readField`.
- À la fin, la **liste legacy** de la règle `fiche-read-via-loader` est **vide**.

### Volet B — vues `plan-*` alignées sur `TERMINAUX`
- `buildPlanViewData`, `buildPlanDelta` et le rendu board excluent les statuts `TERMINAUX`
  (`superseded/merged/split`) comme le fait déjà `buildAvancementData`.
- Après regen, `window.EZK_PLAN` ne contient **aucune** carte terminale ; « Masquer les livrées »
  et le tri du plan ignorent les terminaux.

## Critères d'acceptation (à groomer)

- [ ] `git grep` de parse front-matter hors loader = **0** (liste legacy de la règle vidée).
- [ ] `regen-backlog.sh` / `portfolio.sh` / `plan-head.ts` lisent les fiches par le loader testé ;
      `test:scripts` + `fiches:check` verts.
- [ ] Une fiche `superseded` restée dans `features/` n'apparaît dans **aucune** vue `plan-*`
      (`window.EZK_PLAN`, écart-plan, board) — test de fidélité à l'appui.
- [ ] Les deux règles perdent leur clause « déploiement / dette » (le code est conforme).

## Comment vérifier

- Poser une fiche `status: superseded` dans `features/` → elle n'apparaît ni au board avancement,
  ni au plan, ni dans BACKLOG/PORTFOLIO ; « Masquer les livrées » ne change rien pour elle.
- `git grep -n "awk" products/mega-city/bin/regen-backlog.sh products/mega-city/bin/portfolio.sh`
  → aucune lecture de front-matter maison.

## Notes / anti-doublon

- **Née du retour Codex sur PR #256** (les 2 règles de la rétro 2026-09-20). Recoupe la note de
  carnet N5 (aligner les vues bash sur `TERMINAUX`) et l'**élargit** aux vues `plan-*` (TS).
- Voisin : [20260910155608287](20260910155608287_problematique-regles-ezk-typologie-verification-mesure.md)
  (typologie / vérification des règles) — cadre général ; ici c'est la mise en conformité concrète.
