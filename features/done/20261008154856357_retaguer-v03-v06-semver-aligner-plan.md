---
id: "20261008154856357"
title: "re-taguer V0.3–V0.6 en semver (vX.Y.Z) + aligner PLAN.md"
type: chore
priority: P2
product: mega-city
milestone:
version:
labels: [backlog, version]
status: shipped
blocked:
pr: "local (d7936b30)"
created: 2026-10-08
---

# 20261008154856357 — re-taguer V0.3–V0.6 en semver + aligner PLAN.md

## En clair

Quatre versions de vectorz s'affichent « à clore » à tort. La commande `ezk backlog version`
ne reconnaît plus une version comme sortie que par une étiquette à trois chiffres (`v0.3.0`).
Les versions V0.3 à V0.6 n'ont que l'étiquette courte (`v0.3`), donc l'outil les croit
inachevées. On pose les quatre étiquettes semver manquantes et on remet PLAN.md d'accord.

## Contexte / Problème

Le 2026-10-08, la commande `ezk backlog version` est passée en **semver strict** : elle
reconnaît une version comme livrée seulement si une étiquette `vX.Y.Z` existe. Le changement
vit dans la fiche sœur, déjà livrée :
[backlog version reconnaît les tags semver à 3 chiffres](20261008063957243_version-reconnait-tags-semver-3-chiffres.md)
(commit `77ec3162`).

Conséquence sur vectorz. V0.1 et V0.2 ont déjà un `v0.x.0`, elles restent « livrée ». Mais
V0.3, V0.4, V0.5 et V0.6 n'ont que l'étiquette courte. L'outil ne les voit plus sorties et
les affiche « à clore ». C'est un faux signal : ces quatre versions sont bel et bien livrées,
chacune sur un commit connu.

Les étiquettes courtes pointent sur ces commits :

| Version | Étiquette courte → commit |
|---|---|
| V0.3 | `v0.3` → `08e7d492` |
| V0.4 | `v0.4` → `188a0558` |
| V0.5 | `v0.5` → `de438ab6` |
| V0.6 | `v0.6` → `005f01ab` |

## Proposition

1. Poser quatre étiquettes semver **en local**, chacune sur le même commit que l'étiquette
   courte : `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`. Réversible (`git tag -d`).
2. Aligner la table « Train de versions » de `features/PLAN.md` : la ligne V0.6 passe de
   « à clore (`v0.6`) » à « livrée (`v0.6.0`) ». Vérifier que V0.3 à V0.5 restent cohérentes
   et que toute référence d'étiquette est au format `vX.Y.0`.
3. Proposer au PO de supprimer les étiquettes courtes `v0.3`…`v0.6` pour l'hygiène. Son
   arbitrage : elles sont inoffensives, l'outil les ignore.

Pas de code, pas de PR : vectorz est en `github: false`. La livraison, c'est quatre étiquettes
git locales et une édition de doc curée.

## Critères d'acceptation

- [ ] Les étiquettes `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0` existent en local, chacune sur le
      commit de l'étiquette courte correspondante.
- [ ] `ezk backlog version` montre V0.3, V0.4, V0.5 et V0.6 en « livrée (vX.Y.0) ».
- [ ] `ezk backlog version check` est vert (aucune erreur de lot).
- [ ] La ligne V0.6 de la table « Train de versions » de `features/PLAN.md` dit « livrée
      (`v0.6.0`) » ; aucune référence d'étiquette courte ne subsiste dans la table.
- [ ] Les étiquettes restent locales (aucun `git push origin <tag>`).

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"

# Les 4 étiquettes semver pointent sur les bons commits
for v in 0.3 0.4 0.5 0.6; do
  printf "v%s.0 -> " "$v"; git rev-list -n1 "v${v}.0"
  printf "v%s   -> " "$v"; git rev-list -n1 "v${v}"
done
# attendu : v0.x.0 et v0.x pointent sur le MÊME commit

# L'outil voit les 4 versions livrées
ezk --root "$ROOT" backlog version | grep -E "V0\.[3-6]"
# attendu : chacune « livrée (v0.x.0) »

# Cohérence des lots
ezk --root "$ROOT" backlog version check
# attendu : vert (exit 0, aucune erreur)
```

Attendu : V0.3 à V0.6 passent de « à clore » à « livrée (vX.Y.0) », et `version check` ne
remonte aucune erreur.

## Notes / décisions

- Fiche née du constat du 2026-10-08 : la fiche sœur a durci la reconnaissance semver ; cette
  fiche-ci applique la conséquence sur les versions déjà sorties de vectorz.
- Suppression des étiquettes courtes : laissée à l'arbitrage du PO (réversible, sans effet sur
  l'outil qui les ignore).
