# Revue adverse — 20261008154804532 (DoD/DoR contrat partagé)

- **Fiche** : [20261008154804532](../../20261008154804532_dod-dor-contrat-partage.md)
- **Branche** : `feat/20261008154804532-dod-dor-contrat-partage`
- **Reviewer** : `ezk-reviewer` (Opus, modèle distinct), self-review signalée (le patch modifie son propre agent)
- **Verdict** : **GO** (aucun bloquant) — 3 réserves **corrigées avant merge**
- **Date** : 2026-10-10

## En clair

Le patch fait ce qu'il annonce et n'affaiblit pas le plancher de revue : `dod.yml` liste
exactement les 5 règles que le reviewer contrôlait (aucune perdue, aucun procédé dev glissé),
`appliedRuleIds([dod])` les redonne toutes, `.vectorz/dor.yml` intact, aucun kind nouveau. Le
reviewer a examiné sans complaisance le changement de son propre contrat : passer de 5 règles
recopiées à `[dod]` ne diminue pas ce qu'il contrôle.

## Découverte structurelle décisive

Le champ `interactions:` est de la **métadonnée de catalogue/graphe** : Claude Code retire le
front-matter avant de bâtir le prompt, le modèle ne lit jamais `interactions:` (`law-coverage.ts`).
Donc le patch unifie le contrat **déclaré** (une seule source, auditable au `graph:check`), il ne
change pas le prompt runtime. L'enforcement réel du reviewer (prose + cliquet `law-coverage`) est
**inchangé** — pas de régression. C'est la portée honnête de F2.

## Réserves (toutes corrigées avant merge)

- **[P1 — corrigé] Honnêteté ADR-0050.** L'ADR-0070 affirmait que la DoD est « injectée dans le
  prompt des deux côtés » → faux (voir ci-dessus). **Corrigé** : l'ADR dit maintenant que le
  contrat est unifié au **catalogue/graphe** (déterministe, auditable), que `interactions:` n'est
  pas lu par le modèle, et que l'enforcement réel reste prose + `law-coverage`.
- **[P2 — corrigé] Test tautologique.** Le 4ᵉ test (`rev ∩ (development − dod)`) était vide par
  algèbre d'ensembles, quel que soit le contenu réel. **Corrigé** : il confronte désormais ce que
  le reviewer déplie à une **liste blanche figée** de règles de procédé (`DEV_PROCESS`),
  indépendante de la définition de `dod` — non circulaire.
- **[P2 — corrigé] Portée `development.yml`.** L'ADR annonçait sortir les done-criteria de
  `development.yml` « maintenant ». Non fait (exprès : `development` est cité par des profils →
  régression + tests de comptage). **Corrigé** : déplacé en « Suites » de l'ADR, avec la raison.

## Ce qui a été éprouvé et qui tient

- Pas de régression du contrat reviewer : `dod.yml` = les 5 règles exactes, pas d'`extends`,
  `appliedRuleIds([dod])` = ces 5 triées.
- Frontière adverse : le reviewer cite `dod` seul ; `development.yml` (procédé) n'est jamais cité
  par lui → aucun procédé dev n'atteint ce qu'il contrôle.
- Aucun kind nouveau ; `.vectorz/dor.yml` intact ; parité carte↔graphe assurée par F1
  (`interactions-bundle`) ; cliquet LOI (`law-coverage`/`law-debt`) indépendant d'`interactions`.

## Gate locale (rejouée par le constructeur)

- `tsc --noEmit` : OK.
- `pnpm --dir products/mega-city test` : **1903/1903 vert** (155 fichiers).
- `pnpm --dir products/mega-city graph:check` : **299 liens, aucun cassé** (bundle `dod` intégré).
