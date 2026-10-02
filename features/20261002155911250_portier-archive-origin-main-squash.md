---
id: "20261002155911250"
title: "Le portier d'ezk-archive compare à origin/main et reconnaît un squash-merge"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [archive]
status: idea
pr:
evidence: none # script de clôture, pas d'écran
created: 2026-10-02
---

# 20261002155911250 — Le portier d'ezk-archive compare à origin/main et reconnaît un squash-merge

**En clair.** À la clôture d'une session, le portier d'`ezk-archive` classe « à récupérer » des
branches dont tout le contenu est déjà sur `main`. Il compare à `main` local, parfois en retard, au
lieu d'`origin/main`, et il ne reconnaît pas une branche fusionnée en squash. On le recale sur
`origin/main` et on lui apprend le squash : une clôture ne crie plus au loup.

**Si tu arrives frais.** Le *portier* est `skills/ezk-archive/scripts/check.sh` : il dit si une
session peut être archivée sans rien perdre. Un *squash-merge* écrase les commits d'une branche en un
seul commit sur `main` : la branche n'est plus un ancêtre de `main`, même si tout son contenu y est.

## Contexte / Problème

Deux occurrences, dans le projet muti :

- 2026-09-29 : une branche identique à `origin/main` (`git rev-list --count origin/main..HEAD` = 0)
  classée « REAL / unproven ». Note de carnet muti
  `20260929191041932-gate-archive-compare-a-main-local-perime`.
- 2026-10-01 : à la clôture, les branches des PR muti #266 et #267, déjà mergées en squash, classées
  « REAL ».

Coût : à chaque clôture, le pilote doit prouver à la main que rien n'est perdu. Pire, un faux
« REAL » peut cacher une vraie branche non mergée au milieu du bruit.

## Proposition

- Faire un `git fetch`, puis comparer à `origin/<base>`, pas à la branche locale.
- Reconnaître une branche absorbée par squash : PR mergée depuis cette branche
  (`gh pr list --state merged --head <branche>`), ou équivalence de patch (`git cherry`) en repli
  hors GitHub.
- Ne pas en faire une règle de discipline (« pense à fetch ») : c'est l'outil qui se corrige.

## Critères d'acceptation

- [ ] Une branche squash-mergée sur `origin/main` est classée absorbée, pas « REAL ».
- [ ] Une branche réellement non mergée reste classée « REAL ».
- [ ] Un `main` local en retard ne change pas le verdict.
- [ ] La suite shell couvre le cas squash et le cas « main local en retard ».

## Comment vérifier

Ajouter les deux cas aux tests shell d'`ezk-archive`, puis lancer la suite :

```bash
pnpm --dir products/mega-city test:scripts
```

Sur le terrain : 0 faux « REAL » sur les 5 prochaines clôtures d'un projet consommateur (muti).
*(Bloc provisoire, précisé au grooming.)*

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P1, unanime
  dans les quatre lentilles.
- Version V0.5 proposée par le pilote (P1 → release en cours) ; à confirmer au planning.
