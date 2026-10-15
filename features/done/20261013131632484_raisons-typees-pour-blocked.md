---
id: "20261013131632484"
title: "Des raisons typées pour le drapeau bloquée, que next et le run savent lire"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.13.0
labels: [backlog]
status: shipped
blocked:
pr: "local (fc172439)"
evidence: none # champ de données + commandes, pas d'écran
split_from: "20261002133125418"
created: 2026-10-13
---

# 20261013131632484 — Des raisons typées pour le drapeau bloquée

**En clair.** Aujourd'hui, la raison d'un drapeau `blocked:` est du texte libre. Le tirage et le run
autonome ne peuvent pas la lire pour décider seuls. On range ces raisons dans une **liste fermée** (par
exemple : différée-PO, attend-maquette, attend-GitHub, auto-édition-risquée), que `next` et le run
savent interpréter pour sauter une fiche **sans délibérer**.

**Si tu arrives frais.** Le drapeau `blocked:` marque une fiche prête qui attend une dépendance. Le
*run autonome* (`ezk-product-build`) enchaîne des sprints sans humain ; il doit décider seul quoi sauter.

## Contexte / Problème

2026-10-11, run autonome v0.7 : le run a longuement hésité sur des fiches que le PO avait différées
(« réveiller quand F1/F2 »). Le drapeau `blocked:` existe, mais sa raison est du texte libre : ni le
tirage ni le run ne peuvent la lire pour trancher. Un run « auto » qui délibère sur une fiche
explicitement différée gaspille des jetons et use le pilote — l'inverse du but.

## Proposition

Étendre le champ `blocked:` existant avec des **raisons typées et lisibles**, dans une liste fermée. Une
raison inconnue échoue (pas de typo silencieuse). `next` et le run autonome lisent la raison typée et
sautent la fiche sans délibérer. C'est le **socle machine** qui rend la règle d'arrêt du run
déterministe.

## Critères d'acceptation

- [ ] Le champ `blocked:` accepte une **raison typée** dans une liste fermée ; une raison inconnue échoue
      avec un message qui nomme la valeur et la liste admise.
- [ ] `next` (tirage) et le run autonome **sautent sans délibérer** une fiche dont la raison typée dit
      « différée » (ex. différée-PO, attend-maquette, attend-GitHub, auto-édition-risquée).
- [ ] Une raison typée reste lisible par un humain dans la fiche (pas un code opaque).

## Comment vérifier

```bash
pnpm --dir products/mega-city test        # le validateur refuse une raison hors liste
pnpm --dir products/mega-city plan:head   # une fiche « différée-PO » n'est pas proposée
```

## Notes / décisions

- Découpée de la fiche `20261002133125418` le 2026-10-13 (côté **raisons typées**, symptôme du run v0.7
  du 2026-10-11). Le bug d'alignement `plan:head`/`plan:lot` est la fiche sœur
  [La tête du plan respecte le drapeau bloquée](20261013131632277_tete-plan-respecte-drapeau-bloquee.md).
  Même version v0.13.0 ; la liste fermée des raisons se partage entre les deux.
- **Socle de** la règle d'arrêt du run autonome
  [Le run filtre l'éligibilité + borne de version](20261011091553794_run-autonome-filtre-eligibilite-avant-deliberer.md)
  (v0.15) : cette fiche doit shipper avant, dans l'ordre des versions.
- Enrichie à la rétro du 2026-10-11 (run autonome v0.7),
  [capture](../../docs/captures/2026-10-11-retro-run-v07-autonome.md), S7.
