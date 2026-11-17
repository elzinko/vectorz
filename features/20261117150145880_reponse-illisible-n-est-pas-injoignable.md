---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117150145880"
title: Une réponse illisible du daemon n'est plus dite « injoignable »
type: bug
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control, carte]
status: ready
pr:
evidence: none # message d'erreur, rare
created: 2026-11-17
---

# 20261117150145880 — Une réponse illisible du daemon n'est plus dite « injoignable »

**En clair.** Quand le daemon répond quelque chose qui n'est pas du JSON (une page d'erreur, une
réponse coupée), les cartes de mission control disent « serveur de mission control injoignable ». C'est
faux : le serveur a répondu. On le dit tel quel, et on ne re-tente pas, puisque le réseau va bien.

**Si tu arrives frais.** Les cartes Process et Carte de la méthode chargent leurs données par un même
mécanisme, `useDaemonContract.ts`, qui re-tente les erreurs réseau depuis le 17 novembre.

## Contexte / Problème

Relevé par la revue adverse du sprint 5 du 17 novembre (fiche 20261117135600942), non bloquant : un
`res.json()` qui échoue tombe dans la même branche qu'une coupure réseau.

## Proposition

Distinguer les deux cas : une réponse HTTP reçue mais illisible donne « réponse illisible du daemon
(HTTP <code>) », sans re-tentative ; seule une vraie coupure réseau est re-tentée puis dite
« injoignable ».

## Critères d'acceptation

- [x] Une réponse reçue mais illisible affiche « réponse illisible du daemon (HTTP <code>) » et ne
      re-tente pas.
- [x] Une coupure réseau garde son comportement : trois re-tentatives, puis « injoignable ».

## Comment vérifier

```bash
cd products/cop1/packages/web && pnpm exec vitest run src/board/useDaemonContract.test.tsx
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés. Corrigé après revue : un JSON valide mais vide (`null`) est traité de la même façon, avec son test.


- Origine : revue du sprint 5 et [rétro du sprint 5 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-5-cartes-qui-chargent.md),
  qui l'avait laissé en reste ouvert ; tirée au sprint 8 par délégation du PO absent.
