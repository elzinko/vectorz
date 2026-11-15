---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213634"
title: La méthode refuse une version de fiche qui n'est pas en semver
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [scout, backlog, versions]
status: idea
pr:
evidence: none # pas d'écran : contrôle des fiches
created: 2026-11-15
---

# 20261115195213634 — La méthode refuse une version de fiche qui n'est pas en semver

**En clair.** La méthode n'accepte qu'un format de version : `v1.0.0`. Pourtant, rien ne contrôle ce
format quand on écrit une fiche. samplerz a donc 21 fiches en `V1.0` ou `V1.1`, que la vue par
version ignore en silence. La fiche fait signaler toute version hors format par le contrôle des
fiches, puis convertit les fiches de samplerz.

**Si tu arrives frais.** Le champ `version:` d'une fiche dit dans quelle version elle doit sortir.
Le semver est le format `vX.Y.Z` : trois nombres, avec un `v` minuscule devant. samplerz est un
projet piloté par la méthode, dans un dépôt à part.

## Contexte / Problème

La passe du scout du 2026-11-04 a vu que mission control n'affiche pas les versions de samplerz.

Constat du 2026-11-15 :
- La règle existe. La méthode a fixé le semver strict le 2026-10-08.
  - `products/mega-city/src/backlog/versions.ts`, ligne 18.
- Elle n'est appliquée qu'au moment de sortir une version. `ezk backlog version` refuse un nom hors
  format. Le contrôle des fiches, lui, laisse passer `V1.0` sans rien dire.
  - `ezk backlog check --root /Users/elzinko/git/samplerz` ne relève aucune anomalie de version.
- samplerz : 14 fiches en `V1.0`, 6 en `V1.1`, 1 en `V0.9`.
- vectorz : toutes ses fiches versionnées sont déjà en semver.

Décision du PO, le 2026-11-15 : on force le semver dans la méthode. Pas de lecture tolérante. Le cas
d'un produit existant repris avec un autre format n'existe pas aujourd'hui.

## Proposition

1. **Contrôler.** Le contrôle des fiches signale toute `version:` hors semver, avec la forme
   attendue. Exemple : « V1.0 → attendu v1.0.0 ».
2. **Convertir samplerz.** Ses 21 fiches passent au semver : `V1.0` devient `v1.0.0`. La conversion
   se fait dans le dépôt de samplerz, en un commit à part.
3. **Ne rien perdre en silence.** Une vue qui rencontre une version hors format la montre comme
   telle, au lieu de l'ignorer.

## Critères d'acceptation

- [ ] Une fiche en `version: V1.0` fait sortir une anomalie du contrôle des fiches, avec la forme
      attendue.
- [ ] Le contrôle passe sans anomalie de version sur vectorz.
- [ ] Après conversion, le contrôle passe sans anomalie de version sur samplerz.
- [ ] Les 21 fiches versionnées de samplerz apparaissent sous leur version dans mission control.

## Comment vérifier

```bash
ezk backlog check --root /Users/elzinko/git/samplerz
ezk backlog check
ezk backlog version --root /Users/elzinko/git/samplerz
```

Avant la conversion, la première commande doit nommer les 21 fiches. Après, aucune.

## Notes / décisions

- Source : session du 2026-11-04, `docs/sessions/2026-11-04-run-autonome-sprints-7-26.md`, ligne 33.
- Recadrée le 2026-11-15 sur la décision du PO : semver forcé, pas de lecture tolérante.
- Priorité P2 donnée par le PO le 2026-11-15.
- Où poser le contrôle : `products/mega-city/src/backlog/fiche-validator.ts`, qui valide déjà le
  front-matter de chaque fiche.
- Dépendance externe : le dépôt samplerz, `/Users/elzinko/git/samplerz`, accès constaté le
  2026-11-15.
