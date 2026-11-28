---
id: "20261128094701684"
title: "Versions : choisir le prochain numéro, et « Versionner » dit ce qu'il déroule"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, versions]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701684 — Versions : choisir le prochain numéro, et « Versionner » dit ce qu'il déroule

**En clair.** Sur la page Versions, la ligne « Prochaine version » dit « numéro non publié ». La maquette
propose trois numéros au choix et un bouton « Versionner ». On calcule ces trois numéros depuis la
dernière version posée, et le bouton montre la commande.

**Si tu arrives frais.** Une version est une étiquette posée sur tout ce qui est livré, quand le PO le
décide. Trois suites sont possibles après v0.23.0 : v0.24.0 (mineure), v0.23.1 (correctif), v1.0.0
(majeure). Mission control ne lance aucune commande : il la montre (`CommandHint`). La maquette est la
référence d'écran du PO : pages « Versions » et « Une version ».

## Contexte / Problème

La carte « À versionner » de l'app a le bouton « Versionner », mais pas le choix du numéro. La page d'une
version n'a pas de bouton quand la version reste à poser. La commande existe : `ezk backlog version tag`.

## Proposition

1. **Choix du numéro** : une liste avec les trois suites de la dernière version étiquetée (mineure,
   correctif, majeure), la mineure choisie par défaut. Les numéros se calculent depuis l'étiquette
   publiée ; sans étiquette publiée, la ligne garde « non publié ».
2. **« Versionner »** montre la commande avec le numéro choisi, sans rien exécuter. Son « i » dit ce
   qu'elle déroule : les contrôles de la gate, puis l'étiquette locale.
3. **Page d'une version à poser** : le même bouton « Versionner ‹numéro› » dans l'en-tête.
4. **Le compte** « N fiches livrées depuis » mène à Fiches, filtrée sur les livrées sans version.

## Critères d'acceptation

- [ ] La liste propose les trois numéros suivants calculés depuis la dernière étiquette publiée.
- [ ] « Versionner » montre la commande avec le numéro choisi ; changer le choix change la commande.
- [ ] La commande montrée existe côté méthode ; un test le vérifie.
- [ ] Sans étiquette publiée, pas de liste : « non publié ».
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Versions : http://localhost:5274 → Versions
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Le texte du « i » de « Versionner » est court et écrit dans l'écran ; il passera au glossaire quand il sera publié.
