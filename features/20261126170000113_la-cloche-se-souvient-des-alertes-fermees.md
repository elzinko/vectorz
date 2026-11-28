---
id: "20261126170000113"
title: "La cloche se souvient des alertes fermées"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: ready
blocked:
depends: ["20261114131612944", "20261126170000112"]
pr:
evidence: before-after
created: 2026-11-26
---

# 20261126170000113 — La cloche se souvient des alertes fermées

**En clair.** La cloche de mission control montre une alerte par élément, publiée par `ezk now --json`.
On ne peut pas encore fermer une alerte : il faut un geste d'écriture, côté méthode et côté daemon. Cette
fiche ajoute la croix de fermeture et la mémoire des alertes fermées, pour qu'une alerte fermée ne revienne pas.

**Si tu arrives frais.** Mission control lit ce que la méthode publie et n'écrit rien de lui-même (ADR-086).
Fermer une alerte est une écriture : elle doit passer par une commande de la méthode, que le daemon lance.

## Contexte / Problème

Le POC des alertes (fiche 20261114131612944) publie la liste en lecture seule. Son contrôle « prête »
du 2026-11-26 a sorti la fermeture du périmètre, faute de geste d'écriture dans le daemon.

## Proposition

1. Une commande de la méthode ferme une alerte et la range dans `fermees[]` (fichier local du projet).
2. `ezk now --json` ne republie pas une alerte fermée.
3. Le daemon expose ce geste ; la cloche porte une croix par alerte.

## Critères d'acceptation

- [ ] Fermer une alerte l'enlève de `alertes[]` au prochain `ezk now --json`.
- [ ] La fermeture survit à un redémarrage du daemon.
- [ ] La croix de la cloche lance ce geste, et l'alerte disparaît de l'écran.

## Comment vérifier

- vue Cloche : http://localhost:5273 → cloche de l'en-tête

## Hors périmètre

- Une alerte qui revient après fermeture parce que son élément a changé (à décider plus tard).

## Notes / décisions

- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. La commande de fermeture est nommée au build. Une alerte fermée le reste tant que son identifiant existe. Le fichier des fermetures est local, hors git.
