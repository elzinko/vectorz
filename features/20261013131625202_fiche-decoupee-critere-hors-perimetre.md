---
id: "20261013131625202"
title: "Une fiche découpée ne porte pas un critère du périmètre de sa fiche sœur (grooming)"
type: chore
priority: P2
product: mega-city
milestone: parked
version:
labels: [backlog, grooming, process]
status: idea
pr:
evidence: none # règle de process, pas d'écran
created: 2026-10-13
blocked: oversized
---

# 20261013131625202 — Une fiche découpée reste dans son périmètre

**En clair.** Quand on découpe une fiche en deux sœurs (lecture / écriture, par ex.), chaque sœur
ne doit porter que des critères de SON périmètre. Si un critère exige de construire le périmètre de
l'autre, le sprint gonfle et demande un arbitrage en cours de route. On veut une garde de grooming
qui attrape ça avant la construction.

**Si tu arrives frais.** « Découper une fiche » = la scinder en plusieurs fiches sœurs, liées par
le même `milestone:`/`version:` (jamais une fiche-chapeau). Chaque sœur est une story à part.

## Contexte / Problème

Vécu au run v0.12 (2026-10-13), fiche de **lecture** `20261013073300242` : son critère #4
(« ezk-sprint ne cite plus de chemin `products/mega-city/…` ») exigeait des verbes d'**écriture**
(`journal add`, `pr ship-in-pr`), soit le périmètre de la fiche **sœur** « écriture ». Résultat :
le sprint a gonflé (~400k jetons au lieu de ~200k visés) et a demandé un arbitrage PO en plein
build. Le découpage lecture/écriture était bon ; c'est le critère #4 qui était mal rangé.

## Proposition

Poser une **règle de grooming** (à ranger dans `rules/`, cible `skill:ezk-backlog`, après grooming) :
au `groom`/`ready` d'une fiche née d'un découpage, vérifier que chaque critère reste dans le
périmètre de la fiche, pas dans celui d'une sœur. Forme exacte (contrôle mécanique vs lentille de
revue) à trancher au grooming.

## Critères d'acceptation

- [ ] Une règle (ou un contrôle) existe qui signale un critère hors-périmètre sur une fiche découpée.
- [ ] Rattachée à son symptôme (fiche 242) et mesurable.

**Mesure de suivi** — sur les 5 prochaines fiches issues d'un découpage, 0 porte un critère qui
exige de construire le périmètre d'une sœur.

## Comment vérifier

```bash
# À définir au grooming : contrôle sur les fiches `split_from:` liées, ou lentille de revue ezk-reviewer.
```

## Notes / décisions

- Origine : rétro du run v0.12 ([capture](../docs/captures/2026-10-13-retro-run-v012.md)), proposition P4.
- Adjacent à « une story = une fiche » et « split : pas de chapeau » (sans les contredire : ici on
  parle du périmètre des CRITÈRES, pas du nombre de fiches).
- À groomer en **règle** `rules/<cat>/` + bundle (cible `skill:ezk-backlog`), pas construit tel quel.
- 2026-10-27 : raison blocked: passée à `oversized` ; contexte d'origine déplacé de la valeur : parké hors version par auto-groom le 2026-10-17
