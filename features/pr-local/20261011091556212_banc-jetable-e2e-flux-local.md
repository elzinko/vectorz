> 🗎 Rendu de la fiche [features/20261011091556212_banc-jetable-e2e-flux-local.md](../done/20261011091556212_banc-jetable-e2e-flux-local.md)

# 20261011091556212 — Banc jetable E2E du flux local (sans GitHub)

**En clair.** Les outils du flux local (sans GitHub) cassent en silence, et on ne s'en rend compte qu'en
plein run. On veut un banc d'essai jetable qui rejoue le flux local de bout en bout et relit les artefacts
produits : le bilan accepte un sha, le compte rendu est daté, le bon dépôt est visé. Ce banc attraperait
ces régressions avant un vrai run.

**Si tu arrives frais.** Le « flux local », c'est le mode `github: false` : pas de PR, les merges se font
en local par `ship-merge --local`. Un « banc E2E jetable », c'est un petit dépôt temporaire monté puis
détruit, où on rejoue la chaîne complète pour vérifier qu'elle tient.

## Contexte / Problème

Pendant le run v0.7, trois outils du flux local ont frotté : le bilan de run refusait un merge sans
numéro de PR, le compte rendu de sprint restait non daté, et un merge visait le worktree au lieu du
checkout principal. Chacun a été vu tard, à la main. Rien ne rejoue le flux local de bout en bout.

## Proposition

Un spike : monter un dépôt jetable en `github: false` (worktree), y rejouer `run report`, `sprint close`
et `backlog regen`, puis relire les artefacts. Mesurer : sha accepté, date et durée non nulles, bon dépôt
visé, titres de vues corrects. Décider ensuite si ce banc devient un test de CI ou reste un outil manuel.

## Critères d'acceptation

- [x] Le banc monte un dépôt jetable `github: false` (sans remote) et rejoue les commandes **déterministes** du flux local **sans réseau** : `run report` et `regen`. (Le `sprint close` **daté** exige un gate de supervision — hors d'un banc hermétique ; couvert par la fiche sœur 20261002230039863. Portée notée en tête du banc.)
- [x] Il relit les artefacts et échoue si un sha local est **refusé** (sha absent du main → écart code 1, sha nommé) ou si le **mauvais dépôt** est visé (le HEAD du dépôt jetable doit figurer dans le bilan).
- [x] Le spike conclut : **banc gardé en CI** — c'est la suite `bin/test-flux-local-e2e.sh`, listée dans `bin/test-scripts.sh` (raison : déterministe et sans réseau, elle attrape les régressions du flux local avant un run).

## Comment vérifier

```bash
# le banc s'exécute d'un coup et sort OK/KO sur chaque artefact relu.
bash products/mega-city/bin/<banc-a-creer>.sh
```

## Notes / décisions

- Sort de la rétro du run autonome v0.7 (capture `docs/captures/2026-10-11-retro-run-v07-autonome.md`, S6).
- Couvre d'un coup les symptômes des fiches [[20261010235330118]] et [[20261002230039863]].


## Validation

| Modalité | Statut |
|---|---|
| Gate locale (build · test · lint) | ⏳ |
| Revue adverse locale (ezk-reviewer) | ⏳ |
