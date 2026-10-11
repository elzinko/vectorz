---
id: "20261010215345931"
title: Le tirage reste dans la version en cours (garde-fou de séquence)
type: feature
priority: P0
product: mega-city
milestone:
version: v0.7.0
labels: [ergonomie-cli]
status: shipped
pr: "local (v0.7)"
evidence: none # commande CLI, pas d'écran
created: 2026-10-10
---

# 20261010215345931 — Le tirage reste dans la version en cours

**En clair.** Aujourd'hui, choisir la prochaine fiche à coder (`next`, `plan-lot`) suit
l'ordre de `PLAN.md` et prend la première fiche prête, **sans regarder sa version**. Preuve
datée du 2026-10-10 : un lot proposait deux fiches **v0.8** et une **v0.9** alors que la
**v0.7 n'était pas finie**. On veut que le tirage reste **par défaut** dans la version en
cours, et ne débloque la suivante que quand la précédente est **étiquetée**.

**Si tu arrives frais.** Le « train de versions » (v0.1 → v0.9) est l'ordre de livraison du
projet : on code **une version à la fois**. *Tirer* = choisir la prochaine fiche, ou le lot
d'un sprint. *Groomer* = préparer une fiche jusqu'à « prête ». Le grooming reste **libre** à
tout moment, sur n'importe quelle version ; c'est le **tirage** qu'on discipline.

## Contexte / Problème

- `plan-lot` et `next --ready-only` ordonnent par `PLAN.md` puis prennent la première fiche
  `ready`. Le champ `version:` **n'entre jamais** dans la décision.
- **Preuve (2026-10-10)** : `ezk backlog plan-lot 3` sur ce backlog a proposé
  [20261008154803440](20261008154803440_consommateur-cite-un-bundle.md) (v0.8),
  [20261008183238365](20261008183238365_spike-divergence-dev-reviewer.md) (v0.8) et
  [20261009104436287](../20261009104436287_next-nu-montre-la-suite.md) (v0.9) — **aucune v0.7** —
  pendant que la v0.7 avait encore une fiche prête et trois idées.
- Cause : `PLAN.md` périmé **plus** aucune porte de version. Le garde-fou ne peut pas reposer
  sur un `PLAN.md` curé à jour — il doit lire la version réelle des fiches.
- Confusion à éviter : `milestone:` est un **tag libre** (surtout `parked`), pas un axe de
  séquence. L'axe de séquence est `version:`. On ne veut **qu'un seul** axe.

## Valeur — coût de ne rien faire

- Sans garde-fou, l'outil **recommande activement** de coder hors séquence. Une version peut
  rester inachevée pendant qu'on entame la suivante : une version ne « sort » jamais
  proprement, et l'incrément perd son sens.
- Le PO doit vérifier **à la main** la version de chaque fiche tirée. La vigilance humaine
  n'est pas un mécanisme : le jour où on oublie, on dérape.

## Proposition

- **Scope par défaut** de `next --ready-only` et `next --lot N` = la **version en cours**,
  définie comme la **plus basse version** (ordre `vX.Y`) qui ne porte **pas encore** son étiquette
  git. Une version tout livré mais pas taguée reste donc « en cours » jusqu'au tag. Pas de flag à
  cocher : c'est le comportement normal, on ne peut pas l'oublier.
- **Déblocage de la version suivante** = toutes les versions inférieures portent leur étiquette
  `vX.Y`. « Étiquetée = validée par le PO », car pousser le tag est **ton** geste. Déterministe,
  réutilise le calcul de `ezk backlog version`.
- **Grooming inchangé** : `groom` / `ready` restent libres sur n'importe quelle version.
- **Soupape explicite** : `next --all-versions` (bruyant) pour regarder volontairement au-delà.
  Décision **journalisée** dans la fiche et le scratch de sprint. C'est le « si je bute, je peux
  déplacer » traduit en commande consciente.
- **Pas** de `next --version` / `--us` / `--milestone` : un seul axe (version), par défaut ;
  la granularité une-fiche vs lot est déjà couverte par `--ready-only` et `--lot`.
- Deux fins de scope, **aucun saut silencieux** vers la version suivante :
  - version en cours avec seulement des **idées / fiches bloquées** → « groome la tête » ;
  - version en cours **tout livré mais pas étiquetée** → « pousse l'étiquette
    (`ezk backlog version close`) pour débloquer la suite ».
- Fiches **sans `version:`** (petits correctifs hors train) : **gardées** dans le scope — on
  n'écarte que les fiches de version **supérieure** à la version en cours (décision PO 2026-10-11).

## Conception (ezk-architect — [ADR-0070](../../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md))

- UN module pur `src/backlog/version-scope.ts` (dépend du seul `versions.ts`) calcule la version en
  cours = plus bas lot **sans étiquette git**, via `buildVersions` + `releaseTagFor` déjà en place —
  rien de réinventé.
- Le filtre `applyVersionScope(fiches, scope)` s'applique au **bord I/O** (`bin/plan-lot.ts`,
  `bin/plan-head.ts`) **avant** la sélection : les cœurs `selectLot` / `crossBacklogHead` restent inchangés.
- Un seul filtre sert `next --ready-only`, `next --lot N` et `plan-lot` (DRY).
- Tags lus en **best-effort local** (`git tag -l`, try/catch → vide) extrait dans `src/io/git-tags.ts` ;
  hors git le tirage dégrade sans planter. Tags **locaux** (partagés entre worktrees), cohérent avec
  `backlog version close --tag`.
- Règle de scope : on garde la version en cours **+ les fiches sans version** ; on écarte version > current.

## Critères d'acceptation

- [ ] Définition respectée : `next --ready-only` / `plan-lot` ne proposent que la version en cours
      (plus basse sans étiquette git) **et** les fiches sans version — jamais une version supérieure.
      Fixture multi-versions, **y compris versions non contiguës** (v0.7 puis v0.9, pas de v0.8).
- [ ] Une version supérieure reste bloquée tant qu'une version inférieure n'a pas son tag `vX.Y`.
- [ ] `next --all-versions` lève le scope **et le signale bruyamment**.
- [ ] Deux fins de scope, **jamais** de saut silencieux : idées/bloquées → « groome la tête » ;
      tout-livré-pas-taguée → « pousse l'étiquette (`ezk backlog version close`) ».
- [ ] `groom` / `ready` restent utilisables sur toute version (non régressés).
- [ ] La règle est écrite dans le `SKILL.md` d'ezk-backlog (sections `next` / `--lot`).

*Reste entière : un seul mécanisme (un module pur + un bord I/O, ADR-0070), 2 surfaces (CLI + `SKILL.md`). Pas de découpage.*

## Comment vérifier

```bash
# fixture : v0.6 étiquetée, v0.7 (1 ready) + v0.8 (2 ready)
ezk backlog plan-lot 3 --root <fixture>          # → seulement la fiche v0.7, pas les v0.8
# on retire l'étiquette v0.6 :
ezk backlog plan-lot 3 --root <fixture>          # → bloqué : v0.6 pas validée
# soupape :
ezk backlog next --all-versions --root <fixture> # → voit au-delà, et le signale
```

## Notes

- Lié : [next nu montre la suite](../20261009104436287_next-nu-montre-la-suite.md) (v0.9) et
  [boussole de session](../20261010091118580_boussole-session-quoi-faire-maintenant.md) (v0.10) —
  ce sont du **confort de restitution** ; cette fiche est le **verrou**.
- Décision PO du 2026-10-10 : le tirage doit rester dans la version en cours ; on ne déplace une
  fiche que si l'on **bute** dessus (grooming ou code impossible), et alors de façon journalisée.
