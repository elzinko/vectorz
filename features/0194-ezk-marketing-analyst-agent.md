---
id: 0194
title: Agent marketing analyste — copy qui vend, benchmark concurrents, métriques, A/B
type: feature
priority: P2 # provisoire — posée à la capture (PO à confirmer ; siblings 0156/0157 = P1)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-10
---

# 0188 — Agent marketing analyste (+ skills/capacités associées)

## Contexte / Problème

Demande PO (2026-08-10, session samplerz — grooming du site vitrine) : un **agent
marketing** capable de (spec utilisateur, verbatim résumé) :

1. **gérer les textes selon le produit** (copy par produit, FR/EN) ;
2. **visualiser le rendu** (la page telle qu'elle s'affiche) et dire si c'est
   **OK niveau marketing** ;
3. **trouver des concurrents** et vérifier si le wording est « banger » et
   **fait vendre** ;
4. **proposer des stratégies marketing orientées dev** → produire des demandes
   d'instrumentation (métriques à se mettre sous la dent) ;
5. **proposer du A/B testing** si besoin (= générer des demandes de features
   pour le développement) ;
6. **lire les métriques** selon ce qui a été livré, suivi grosse maille ;
7. **inventorier les outils existants** et proposer leur intégration.

**Symptôme déclencheur** : la refonte du pitch samplerz a exigé, EN SESSION, un
benchmark concurrents + des formulations vendeuses (« cœur gratuit » rejeté,
« la base » rejeté), une grille de prix, un choix de licence protectrice — tout
fait par un agent frais briefé à la main. Ce déroulé manuel est la **matrice de
harvest** de la présente fiche (doctrine « une fois à la main d'abord »,
cf. 0156 critère 5 et contre-exemple ezk-readme).

## Frontière (anti-doublon vérifié 2026-08-10)

- **≠ [[0156]] ezk-marketing (promotion)** : 0156 = orchestrateur OUTBOUND
  (articles d'épopée via ezk-article, canaux via postiz, divulgation). 0188 =
  ANALYSTE inbound : qualité du wording, concurrence, prix, mesure, expériences.
  0156 avait explicitement repoussé « mesure/attribution » en post-v1 → ça vit
  ICI. Composition naturelle : l'analyste (0188) juge/mesure, le promoteur
  (0156) diffuse. Renommage éventuel au grooming (ezk-marketing-analyst vs
  ezk-promo) pour lever l'ambiguïté du nom.
- **≠ [[0157]] ezk-landing** : 0157 produit l'artefact site ; 0188 le juge et
  le mesure.
- **≠ ezk-article** : rédaction longue-forme avec panel — 0188 peut le
  composer pour la relecture, pas le réimplémenter.

## Proposition

(à groomer — pistes)
- **Un agent de rôle** (`ezk-marketing-analyst`, modèle jugement) + des
  **capacités composées**, pas un monolithe :
  - copy-review par produit (compose le panel d'ezk-article OU une lentille
    dédiée « conversion » ; style-guide par produit — voir celui de 0156) ;
  - visual-review : compose le navigateur/preview (et [[0186]] screenshots)
    pour juger la page RENDUE, pas le source ;
  - benchmark concurrents : recherche web + fiche concurrents datée par
    produit (append-only, comme le journal 0156) ;
  - stratégie métriques : sait ce qui est instrumenté (PostHog) et propose
    les événements/funnels manquants sous forme de FICHES backlog (« demandes
    de features pour le dev ») ;
  - A/B : propose des expériences (PostHog Experiments natif) → fiches ;
  - lecture métriques : rapport grosse maille post-livraison (pageviews,
    CTA, funnels) via le MCP PostHog.
- **Inventaire outils existants à intégrer plutôt que réécrire** (point 7 de la
  spec — état 2026-08-10) : **PostHog** (MCP branché : analytics, Experiments
  A/B, surveys, feature flags, session replay), **Vercel Analytics / Speed
  Insights**, **Google Search Console** (playbook muti SEO.md), plugins Claude
  disponibles : similarweb (trafic concurrents), amplitude, pendo ; browser
  MCP pour le visual-review ; postiz = diffusion (0156).
- Sorties TOUJOURS en propositions/fiches — l'agent ne modifie pas le site
  lui-même (frontière : il juge, le sprint construit).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E si UI.

## Notes / décisions

- **Matière de harvest** : session samplerz 2026-08-10 — brief de l'agent
  manuel (benchmark produits sampling/slicing, formulations « gratuit »
  FR, grille de prix à la carte, licences protectrices type VCV Rack
  GPLv3+plugins payants) + ses livrables. À récupérer pour le grooming.
- Liens : [[0156]] · [[0157]] · [[0186]] · [[0187]] · samplerz
  `plugin_marketplace_model` (le modèle de prix que cet agent aidera à
  benchmarker/mesurer).
- « Gros sujet complexe » (PO) — probablement une ÉPIC au grooming : agent de
  rôle + 2-3 skills capacités + intégrations. Ne pas tout construire d'un
  coup ; premier lot = copy-review + benchmark (les deux déjà déroulés à la
  main).
