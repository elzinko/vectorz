---
id: 0157
title: ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés)
type: feature
priority: P1
product: mega-city
epic: "20260824060737115"
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Créer une landing page « pro » pour un produit est un déroulé récurrent, refait de zéro à
chaque fois : structure (hero / features / CTA), i18n FR/EN, SEO/OG, responsive, déploiement.
Or l'utilisateur possède déjà des landing pages qui **lui appartiennent** et qui marchent —
livestreamz.fr et https://byhere.fr/ (dans ses projets GitHub). Le savoir-faire (mise en
page, sections, ton, i18n, stack de déploiement) y est fossilisé et se re-devine à chaque
nouveau produit au lieu d'être capitalisé.

## Proposition (à cadrer)

Un skill `ezk-landing` (nom candidat) qui **part des patrons existants** plutôt que d'une
page blanche :

- **Récolte du pattern** : composer `ezk-ezk` (harvest) sur livestreamz.fr / byhere.fr pour
  extraire le squelette réutilisable (sections types, tokens/design, i18n FR/EN, méta
  SEO/OG, pipeline de déploiement) — pas réinventer un générateur de site.
- **Génération** : à partir d'un brief produit (nom, promesse, audience, langue par défaut),
  produire une landing bilingue FR/EN conforme au patron, prête à déployer.
- **Frontière** : réutilise `ezk-design-system` pour la cohérence visuelle si le projet en a
  un ; s'appuie sur `ezk-preview` pour l'URL de démo. Le skill **compose**, il ne
  réimplémente ni design-system ni déploiement.

## Critères d'acceptation (esquisse)

- [ ] Vérifier explicitement l'absence de skill équivalent avant de créer (fait le 2026-07-15 : aucun)
- [ ] Le skill récolte le pattern des landings existantes (livestreamz.fr, byhere.fr) au lieu de repartir de zéro
- [ ] Un run produit une landing FR **et** EN (i18n de premier ordre, pas un afterthought)
- [ ] Sortie déployable + URL de démo (via `ezk-preview`)
- [ ] Doc : quand l'utiliser (page produit / vitrine) vs quand ne pas (app → ezk-sprint, article → ezk-article)

## Notes

- À cadrer avant de tirer : périmètre exact (mono-page vs multi-sections), stack cible
  (réutiliser celle des patrons existants ?), où vivent les patrons récoltés.
- Patrons sources : livestreamz.fr, https://byhere.fr/ (repos GitHub de l'utilisateur).
- Piste d'orchestration : `ezk-ezk harvest` puis `create` pour packager le skill.
- **Voisine, pas doublon : 0052 `ezk-marketing`** (créée le même jour dans une autre
  session). Frontière : ezk-landing **produit** le site (l'artefact) ; ezk-marketing
  **promeut** le produit (épopées, canaux, vidéos). Composition naturelle : ezk-marketing
  peut proposer « créer une landing » et déléguer ici. À confirmer au grooming si un
  rattachement est préférable.
