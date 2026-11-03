---
id: "20261102234112839"
title: "Réécrire les guides de l'ancien écran de supervision pour mission control"
type: chore
priority: P2
product: cop1
milestone: board
version:
depends: ["20261031160441559"]
labels: [board, documentation, vocabulaire]
status: idea
pr:
evidence: none # documentation ; les écrans montrés sont ceux de mission control
created: 2026-11-03
---

## En clair

Cinq guides décrivent pas à pas l'écran de supervision d'avant le board unifié, qu'on appelait « le
Moniteur ». Ils gardent leur texte d'origine, sous un bandeau « Ancien écran, retiré » : leurs étapes et
leurs commandes ne sont plus garanties. Cette fiche les réécrit d'après mission control tel qu'il est,
ou les retire s'ils n'ont plus d'usage. Elle corrige aussi les messages du code qui disent encore les
anciens mots.

## Contexte / Problème

- La fiche [un seul vocabulaire pour les boards](20261031160441559_un-seul-vocabulaire-boards.md) a
  remplacé le mot dans les documents actifs, le 2026-11-03. Dans ces guides, le remplacer rendait des
  phrases fausses : la revue adverse l'a vu, et le décideur produit a choisi de les garder tels quels
  jusqu'à leur réécriture, qui demande de rejouer chaque parcours dans mission control.
- Les guides concernés portent le bandeau « Ancien écran, retiré » : `docs/DOGFOOD.md`,
  `docs/demo-desktop-checklist.md`, `docs/USER-GUIDE-web-ui.md`, `docs/tests/moniteur-smoke.md`,
  `docs/tests/auth-panel.md`.
- Des messages affichés par le code disent encore les anciens mots : « Moniteur » dans cop1 et dans
  `scripts/dogfood-guided.sh` et `scripts/dogfood-smoke.sh`, « cockpit » dans
  `products/mega-city/bin/supervision-registry-add.ts`, « ancien dashboard » dans
  `products/cop1/packages/web/src/board/Board.tsx`.

## Valeur

Un lecteur qui suit un guide voit à l'écran ce que le guide annonce.

## Proposition

Rejouer chaque guide dans mission control, puis le réécrire étape par étape, ou le retirer s'il n'a
plus d'usage. Corriger les messages du code qui disent encore les anciens mots. Retirer le bandeau.

## Critères d'acceptation

- [ ] Chaque guide du bandeau est réécrit ou retiré, et son bandeau « Ancien écran, retiré » a
      disparu.
- [ ] Chaque étape d'un guide réécrit se rejoue dans mission control, et le dit (date du rejeu).
- [ ] `grep -rniwE "moniteur|cockpit|dashboard" products/cop1/packages/*/src scripts products/mega-city/bin`
      ne trouve plus de message affiché (les identifiants internes peuvent rester).

## Comment vérifier

```bash
grep -rln "Ancien écran, retiré" docs
grep -rniwE "moniteur|cockpit|dashboard" products/cop1/packages/*/src scripts products/mega-city/bin
```

## Notes

- Née du groom de la fiche « vocabulaire » le 2026-11-03 (run autonome) : coupe annoncée par la porte
  « prête » si la story gonflait.
