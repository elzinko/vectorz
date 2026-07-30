---
id: 0047
title: Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article)
type: feature
priority: P3
product: vectorz
status: idea
pr:
created: 2026-07-16
---

# 0047 — Migration réflexive (le produit se teste lui-même)

## Contexte / Problème

Le self-hosting (cop1 développe/teste cop1) crée une situation particulière : **le produit
se teste lui-même avant de se versionner**. La question de la migration cesse d'être linéaire
(« l'utilisateur met à jour l'outil ») et devient **réflexive** — mettre à jour cop1 *avec*
cop1 qui tourne, valider une nouvelle version de la méthode *avec* la méthode elle-même.

C'est le **plan LIVRAISON** de la capture du 2026-07-13
(`docs/captures/2026-07-13-contrat-methode-et-versions.md` §1) vu sous l'angle du
self-hosting : D1 (« pas de migration à chaud, jamais »), D2 (adoption aux gates), D11
(éligibilité de MAJ déclarée par la méthode) prennent une saveur réflexive quand l'outil
migré et l'outil migrant sont le même.

Sujet riche et non urgent : promet **un ADR** (la sémantique de la migration réflexive,
ses garde-fous) **et un article** (angle inédit repéré en session : *« quand le produit se
teste lui-même, la migration devient un problème réflexif »*).

## Proposition

À groomer. Pistes : formaliser le cas réflexif du plan LIVRAISON, ses invariants (jamais
migrer le cœur en vol pendant un self-host, blast-radius markdown d'abord), et en tirer
l'article.

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Non prioritaire** (PO, 2026-07-16) — capturé pour ne pas perdre l'angle.
- Voisin de 0026 (article « fenêtres de mise à jour ») — angle distinct (réflexivité), pas
  un doublon. Lié au plan LIVRAISON (capture 13 juil. §1, D1/D2/D11) et à la trajectoire
  self-hosting (carte `docs/captures/2026-07-16-carte-auto-amelioration.md`).
- Origine : session 2026-07-16 (stratégie self-hosting).
