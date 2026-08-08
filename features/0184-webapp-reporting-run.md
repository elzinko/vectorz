---
id: 0184
title: Webapp de reporting de run — features livrées façon PR + preview/démo local + reste-à-tester
type: feature
priority: P2
product: vectorz
status: idea
ready:
pr:
created: 2026-08-08
---

# 0184 — Webapp de reporting de run

## Contexte / Problème

Après qu'une méthode a tourné seule, l'humain a besoin d'une surface qui **restitue
le livrable** — pas l'état live du run (ça, c'est le Moniteur) :

- visualiser les features développées pendant la période autonome ;
- afficher les rendus (screenshots / before-after, comme dans une PR) ;
- boutons pour lancer provisioning / preview en local rapidement + mode démo ;
- afficher ce qui reste à tester humainement (même si la méthode a déjà auto-testé).

Sans pack markdown SoT (0183), toute UI risque de recoller du monitoring ou de
coupler GitHub. Avec le pack, la webapp n'est qu'**un lecteur / émetteur**.

## Proposition

Vue **Reporting** distincte du Moniteur, hébergée dans la coquille web existante
(mission-control / `@cop1/web` — même posture que 0056 : surface conceptuelle
séparée, pas une app neuve).

**Lot 1 (MVP)** — lecteur statique :

- liste les `features/reviews/*/REVIEW.md` d'une branche / d'un run ;
- carte **façon PR** par feature : résumé, rendus (`assets/`), matrice validation,
  section « À tester » (lien / rendu de `features/checks/` si présent).

**Lot 2** — actions (gated) :

- bouton **preview / provisionner local** → **délègue** à ezk-testbed (0102) /
  ezk-preview — ne réimplémente pas le boot ;
- **mode démo** → compose 0050 (canal release / pastille) quand disponible.

Règles dures :

- **lecture seule** des artefacts repo — la webapp n'écrit aucun `REVIEW.md` ;
- **aucune nouvelle collecte** (leçon 0022 : pas d'onglet mort / API 404) ;
- Moniteur reste la vue « est-ce vivant maintenant ? » ; Reporting = « qu'a livré
  ce run ? ».

## Critères d'acceptation

- [ ] Vue « Reporting » accessible, clairement séparée du Moniteur (libellé / nav)
- [ ] Liste au moins un pack `REVIEW.md` réel (dogfood 0183 + cobaye 0041) en carte
      façon PR (résumé + rendus + à-tester)
- [ ] Aucune écriture d'artefact depuis l'UI ; zéro nouvelle collecte inventée
- [ ] Lot 2 : bouton preview/provision **délègue** à 0102 / ezk-preview (skip / N.A.
      documenté tant que 0102 blocked)
- [ ] Mode démo : compose 0050 ou N.A. explicite si 0050 non tirée
- [ ] Gate locale verte puis E2E UI (smoke Pareto, pas exhaustif)

## Notes / décisions

- **2026-08-08** — Enfant de l'initiative reporting ; `depends` de fait :
  **0183** (contrat SoT), **0178** (reste-à-tester), **0102** (boutons preview —
  blocked → lot 2 non tirable avant déblocage). Voir arbitrage
  ezk-pm + ezk-architect (session 2026-08-08).
- **Hôte** : réutiliser `@cop1/web` (défaut) — pas 0114 (webapp config profiles,
  icebox, autre sujet).
- **0161** ezk-challenge = panel adversarial de *production* d'artefacts — orthogonal
  (peut `--challenge` un REVIEW.md plus tard, hors MVP).
- **Dogfood React+TS** = banc **0041** (cobaye), hors périmètre de *cette* fiche ;
  0184 consomme les packs produits sur ce banc (ou autre repo).
