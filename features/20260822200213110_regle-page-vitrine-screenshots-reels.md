---
id: "20260822200213110"
title: Règle — une page (vitrine/landing/capture) construite par un skill utilise des screenshots réels de l'app, jamais des visuels générés
type: feature
priority: P2 # provisoire — posée à la capture (PO à confirmer au grooming)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-22
---

# Règle — page construite par un skill ⇒ screenshots réels du produit

## Contexte / Problème

Capturé pendant la session samplerz du 2026-08-21 (revue du site vitrine déployé
sur samplerz.vercel.app). La page Fonctionnalités illustrait chaque section par un
**emoji géant** (`🎵 ✂️ ⚡ 📂`) en guise de visuel — un « placeholder », pas le
produit. Le PO a formulé une règle générale :

« Quand un skill (ou une recette) construit une PAGE — vitrine pour vendre un
produit (muti, samplerz), page temporaire de capture d'emails d'un futur
projet… — les images doivent SYSTÉMATIQUEMENT être des **screenshots de l'app
lancée par le LLM**, au **format adapté au web**. Jamais des visuels générés
(emoji, illustrations abstraites, placeholders). »

C'est une CONVENTION transverse aux skills qui produisent des pages, pas une
feature d'un produit particulier.

## Proposition

(à groomer — pistes)
- Faire de « visuels = screenshots réels » une **règle** (au sens de
  `development/pr-before-after-media`, déjà existante) qui s'applique à tout skill
  bâtisseur de page : `web-artifacts-builder`, un futur `ezk-landing`, la tranche
  vitrine d'`ezk-sprint` / `website_showcase`, etc.
- Mécanique = COMPOSER l'outil existant plutôt que réimplémenter :
  `20260812104022228` (`ezk-screenshots` : lancer l'app → capturer un jeu nommé →
  déposer au format web) fournit le geste ; cette règle en fait une **obligation
  par défaut** au moment où une page est générée.
- Definition of Done d'une page livrée par un skill : aucun visuel « placeholder »
  restant ; chaque zone d'illustration est soit un screenshot réel, soit
  explicitement marquée « à shooter » avec un ticket de suivi.
- Garde-fou honnêteté : le screenshot montre l'app RÉELLE (pas une maquette
  survendue) — cohérent avec la règle « claims vitrine vs code ».

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)
- [ ] Trancher au grooming : vraie **règle** `development/…` vs fiche feature.
- [ ] La règle nomme les skills bâtisseurs de page concernés + le point d'ancrage
      (DoD de page) où elle est vérifiée.

## Notes / décisions

- Origine : session samplerz 2026-08-21 (revue du site déployé). Déclencheur
  concret = les emoji de `website/src/views/FeaturesView.vue`.
- Fiches sœurs (à ne pas confondre) :
  - `20260812104022228` `ezk-screenshots` = l'OUTIL (capture → doc/site).
  - `20260812104022231` `dor-balayage-surfaces` = balayer les surfaces au grooming.
  - CETTE fiche = la RÈGLE « une page = des screenshots réels », qui s'appuie sur
    l'outil et complète le balayage.
- Consommateur pilote côté produit : fiche samplerz `site_features_real_screenshots`
  (remplacer les emoji de la page Fonctionnalités par de vrais screenshots).
- ⚠ Créée pendant une migration de layout du backlog vectorz (dossier `features/`
  → `products/mega-city/features/`) menée par une autre session : déposée dans
  `features/` (emplacement committé de ses fiches sœurs) ; à redéployer avec le lot
  si la migration déplace le dossier.
