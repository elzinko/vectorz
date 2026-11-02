---
id: "20261102123552181"
title: "Le pouce de revue se pose par une commande ezk, et mission control le pose avec elle"
type: feature
priority: P2
product: cop1
milestone: board
version:
depends: ["20261031160441412"]
labels: [board, mission-control, un-seul-ecran]
status: idea
pr:
evidence: before-after
created: 2026-11-02
---

## En clair

Le pouce de revue (👍 ou 👎 sur une fiche) ne se pose aujourd'hui que dans la page web de la méthode.
Cette page doit disparaître : mission control devient le seul écran. Cette fiche ajoute une commande
`ezk` qui pose le pouce, et un bouton dans mission control qui appelle cette commande.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. La page web de la méthode (`ezk board open`) sera retirée.
- Le pouce est la seule chose que cette page écrit
  ([ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)) : une
  requête `POST /api/verdict` écrit `features/reviews/verdicts/<id>.json`, avec la valeur `up` ou
  `down`. Aucune commande `ezk` ne sait le faire.
- La règle de l'ADR-086 tient : seules les commandes `ezk` écrivent dans un projet. Mission control ne
  peut donc pas écrire ce fichier lui-même.
- Le 2026-11-02, aucun pouce n'a encore été posé dans vectorz : le dossier `verdicts/` n'existe pas.

## Valeur

- Le pouce survit au retrait de la page de la méthode.
- Il se pose aussi depuis un terminal ou par un agent, sans écran.

## Proposition

1. **Une commande pose le pouce.** `ezk review verdict <id> up|down` écrit le même fichier que la page
   web, avec les mêmes contrôles : fiche connue, valeur permise, un seul dossier écrit, jamais de
   commit.
2. **Mission control le montre et le pose.** La fenêtre d'une fiche montre son pouce, lu dans
   `ezk board show --json`, qui le porte déjà. Deux boutons le posent : le daemon lance la commande et
   rend son résultat.

## Critères d'acceptation

- [ ] **La commande écrit le pouce.** `ezk review verdict <id> up` écrit
      `features/reviews/verdicts/<id>.json`, octet pour octet comme la page web le fait aujourd'hui.
- [ ] **Refus sans écriture.** Une fiche inconnue ou une valeur autre que `up` ou `down` est refusée,
      avec un code d'erreur et aucun fichier écrit.
- [ ] **Mission control montre le pouce.** La fenêtre d'une fiche montre le pouce que publie
      `ezk board show --json` ; une fiche sans pouce n'affiche rien de plus.
- [ ] **Mission control pose le pouce par la commande.** Un clic lance `ezk review verdict` ; le daemon
      n'écrit jamais le fichier lui-même. La fenêtre montre le nouveau pouce à la relecture suivante.
- [ ] **Avant / après.** Capture de la fenêtre d'une fiche avant (sans pouce) et après (pouce posé).

## Comment vérifier

```bash
ezk review verdict <id> up
cat features/reviews/verdicts/<id>.json
ezk board show --json | jq '.verdicts'
```

Dans mission control, ouvrir la fiche : son pouce s'affiche. Cliquer 👎 : le fichier change, la
fenêtre suit.

## Notes

- Une des cinq fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Le retrait vient en dernier :
  [retirer la page web de la méthode](20261102123552185_retirer-la-page-web-de-la-methode.md).
- Aucun pouce posé à ce jour. Si le PO juge le pouce inutile, cette fiche se clôt « superseded » et le
  retrait s'en passe.
- Le nom de la commande est à confirmer au build, avec la fiche
  [un seul vocabulaire pour les boards](20261031160441559_un-seul-vocabulaire-boards.md).
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
