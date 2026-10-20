---
id: "20261013013553044"
title: "ship/close committe les recals de liens hors features/ (sinon principal dirty)"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.19.0
labels: [dette, revue]
status: shipped
pr: "local (d7559d50)"
evidence: none # outillage de livraison, pas d'écran
created: 2026-10-13
---

# 20261013013553044 — ship/close committe les recals de liens hors features/

**En clair.** Quand `ezk backlog ship` range une fiche dans `done/`, il recale les liens qui
pointent vers elle — y compris depuis des fichiers **hors `features/`** (une capture de rétro, un
doc). Mais son commit ne fait que `git add features`. Ces recals hors `features/` restent donc **non
committés**. Résultat : le checkout principal est « dirty » juste après le ship, et le `close` du
sprint suivant **refuse d'intégrer son compte rendu** (« dossier principal non propre »).

**Si tu arrives frais.** `ship` déplace une fiche livrée dans `done/` et répare tous les liens
Markdown qui la citaient. `close` scelle un sprint et committe un compte rendu dans `docs/sprints/`
via un worktree jetable, qui exige un principal propre.

## Contexte / Problème

Vécu 2× pendant le run autonome v0.11 (2026-10-13) :

- Sprint « commande gate » (fiche 20261002230039555) : le ship a recalé un lien dans
  `docs/captures/2026-10-03-retro-session-2026-10-02.md` (`features/…` → `features/done/…`). Ce
  recal n'a pas été committé par le ship (qui ne stage que `features/`). Le `close` a répondu
  `LOCAL-DEFERRED: dossier principal non propre → pas de merge`, et le compte rendu de sprint est
  resté sur une branche `docs/sprint-report-*` au lieu d'atterrir sur `main`.
- Contourné à la main (commit manuel du recal, puis ré-intégration du compte rendu), mais c'est
  structurel : rien ne garantit que les recals hors `features/` soient committés.

## Proposition

Au choix, à trancher au grooming :

1. **`ship` élargit son `git add`** aux fichiers qu'il a effectivement recalés hors `features/`
   (il les connaît : il vient de les réécrire), et les inclut dans le commit `docs(features): ship`.
2. **ou `close` tolère** un principal « dirty » limité aux recals de liens d'un ship récent (plus
   fragile — préférer 1).

## Critères d'acceptation

- [ ] Après un `ship` dont une fiche était citée par un fichier hors `features/`, le checkout est
      propre (`git status --porcelain` vide), le recal étant committé avec le ship.
- [ ] Le `close` qui suit intègre son compte rendu sur `main` sans `LOCAL-DEFERRED`.
- [ ] Un test couvre « fiche citée depuis docs/ → ship committe le recal ».

## Comment vérifier

```bash
# Dépôt jetable : une fiche active citée par un fichier sous docs/, puis ship.
# Attendu : après le ship, git status --porcelain est vide.
```

## Notes

- Sortie de la rétro du run autonome v0.11 (2026-10-13). Observé 2× dans la même session.
- **Confirmé au run v0.12 (2026-10-13) : 3 occurrences de plus.** Les ships de `20261013074251752`,
  `20261013074251767` et `20261002230039863` ont recalé des liens dans `docs/adr/0061-*.md` et
  `docs/captures/2026-10-*.md` ; le `git add features/` du commit de ship les a oubliés → `main` est
  resté sale → il a fallu les rattacher à la main (sinon le `close`/merge suivant refusait).
  Symptôme désormais vu sur **5 ships au total**. Priorité P2 maintenue.

## Décision de grooming (2026-10-17, run v0.19 auto/lean)

**Option 1 retenue** : `ship` stage lui-même tous les fichiers touchés. `ship-fiche.ts` connaissait
déjà `plan.touched` (chemins finaux, recals hors `features/` compris) et l'imprimait ; le `git mv`
ne stageait que les déplacements, laissant les recals de contenu en working tree. `applyShip` appelle
désormais `io.stage(plan.touched)` après la régénération (nouveau méthode `stage` de l'interface
`ShipIo`, implémentée par `nodeShipIo` en `git add -- <touchés>`). Il ne committe toujours pas : le
commit reste à `ezk-commits`. Un recal hors `features/` est maintenant dans l'index avant le commit,
donc le `close` suivant trouve un principal propre.

Critère 3 (« un test couvre : fiche citée depuis docs/ → ship committe le recal ») couvert par le
test d'intégration `ship-fiche.test.ts` « un recal hors features/ (docs/) est stagé par le ship ».
