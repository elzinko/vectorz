---
id: "20261103161632234"
title: "Rejouer ou retirer les guides de l'ancien écran de supervision, et leurs scripts"
type: chore
priority: P2
product: cop1
milestone: board
version:
labels: [board, documentation, vocabulaire]
status: idea
pr:
evidence: none # documentation ; les écrans montrés sont ceux de mission control
created: 2026-11-03
split_from: "20261102234112839"
---

# 20261103161632234 — Rejouer ou retirer les guides de l'ancien écran

## En clair

Cinq guides décrivent pas à pas l'écran de supervision d'avant mission control. Ils portent un bandeau
« Ancien écran, retiré ». Cette fiche rejoue chaque guide dans mission control, puis le réécrit, ou le
retire s'il n'a plus d'usage. Elle traite aussi les scripts qui servent ces guides.

**Si tu arrives frais.** Mission control est l'écran de cop1 depuis l'ADR-086 amendé. L'ancien écran
s'appelait « le Moniteur ».

## Contexte / Problème

Née du découpage de
[Réécrire les guides de l'ancien écran de supervision](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md),
le 2026-11-03. Les guides : `docs/DOGFOOD.md` (109 lignes), `docs/demo-desktop-checklist.md` (334),
`docs/USER-GUIDE-web-ui.md` (85), `docs/tests/moniteur-smoke.md` (75), `docs/tests/auth-panel.md` (55).
Leurs scripts : `scripts/dogfood-guided.sh`, `scripts/dogfood-smoke.sh`, `scripts/dogfood-screenshot.mjs`,
`scripts/e2e/moniteur-smoke.mjs`, `scripts/cobaye-smoke.sh`, `scripts/cop1-dev.sh`.

## Valeur

Un lecteur qui suit un guide voit à l'écran ce que le guide annonce.

## Proposition

À préciser au grooming : pour chaque guide, dire s'il a encore un usage. Le rejouer et le réécrire
s'il en a un, le retirer sinon. Certains parcours demandent l'app Claude Desktop et une vraie session
supervisée : le grooming dit lesquels le run autonome peut rejouer seul.

## Critères d'acceptation

- [ ] Chaque guide du bandeau est réécrit ou retiré, et son bandeau a disparu.
- [ ] Chaque étape d'un guide réécrit se rejoue dans mission control, et le dit (date du rejeu).
- [ ] Les scripts de ces guides ne disent plus « Moniteur », « cockpit » ni « dashboard » dans leurs
      messages, ou sont retirés avec leur guide.

## Comment vérifier

```bash
grep -rln "Ancien écran, retiré" docs
grep -rniwE "moniteur|cockpit|dashboard" scripts
```

## Notes

- Fiche mère : [Réécrire les guides de l'ancien écran](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md).
