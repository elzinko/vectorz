---
id: "20261128120000207"
title: "Un test commun vérifie que chaque commande --json sort en entier au-delà de 64 Ko"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000207 — Un test commun vérifie que chaque commande --json sort en entier au-delà de 64 Ko

**En clair.** Le 26 novembre, `ezk retro captures --json` coupait sa sortie à 64 Ko. C'est le deuxième cas, après `ezk backlog show --json` le 1er novembre. Une règle existe depuis ce premier cas, mais le défaut est revenu. Cette fiche remplace la vigilance par un test commun à toutes les commandes.

## Contexte / Problème

Cause : un `process.exit()` juste après l'écriture coupe la sortie quand elle part dans un tuyau. La règle `testing/sortie-machine-verifiee-par-un-tuyau` le dit, et un test existe pour `backlog show` (`json-output-large.test.ts`). Rien ne couvre automatiquement une commande `--json` nouvelle.

## Proposition

Un test qui parcourt toutes les commandes `--json` déclarées dans l'aide de `ezk`. Il fait produire à chacune une sortie de plus de 64 Ko, la lit par un tuyau et vérifie qu'elle se lit en entier. Une commande `--json` absente du test le fait échouer.

## Critères d'acceptation

- [ ] Le test couvre toutes les commandes `--json` de l'aide de `ezk`.
- [ ] Réintroduire un `process.exit()` après écriture dans une commande fait échouer le test.
- [ ] Ajouter une commande `--json` sans la couvrir fait échouer le test.

## Comment vérifier

- `pnpm --dir products/mega-city test` : le test passe sur `main`.

## Hors périmètre

- Retirer la règle existante : elle reste, le test la rend vérifiable.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
