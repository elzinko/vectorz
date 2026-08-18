---
id: "20260818185931307"
title: Capability de vente LemonSqueezy (checkout + licence + entitlement) — récoltée de muti, réutilisable
type: feature
priority: P2
product: mega-city
status: idea
pr:
created: 2026-08-18
---

# Capability de vente LemonSqueezy — récoltée de muti, réutilisable

> **Idée** (capture 2026-08-18, session samplerz). À groomer avant tirage — pas
> encore de scénarios. Origine : le PO veut vendre les plugins samplerz sans
> réimplémenter la vente par produit ; muti a déjà une intégration LemonSqueezy
> qui marche → en faire une **capability mega-city** réutilisable.

## En clair

Une skill/capability mega-city qui outille **la vente d'un produit via LemonSqueezy**
(page d'achat → paiement → licence → l'app vérifie l'achat), pour que samplerz — et
tout futur produit payant — la branche au lieu de tout recoder.

## Contexte / Problème

samplerz doit vendre ses plugins (Stems 15 €, Digger Pro 15 €, bundle 29 € — modèle
acté PO 2026-08-17). La **vitrine** est faite (samplerz `#368` : `/plugins` + `/pricing`
affichent le catalogue et « Bientôt en boutique »), mais la **boutique transactionnelle**
n'existe pas : pas de checkout, pas de licence, pas d'entitlement (l'app ne sait pas
vérifier qu'un client a acheté), pas de webhook de confirmation, pas de canal de
téléchargement. Le **compte LemonSqueezy existe déjà** (PO). Recoder tout ça produit par
produit serait du gâchis.

## Pourquoi / Valeur

Débloque le **revenu** de samplerz (premier consommateur) et de tout futur produit payant,
via une **capability réutilisable** plutôt qu'un one-off. LemonSqueezy est Merchant of
Record (TVA UE gérée, clés de licence natives), ce qui réduit la surface à construire.

## Base / Référence (à harvester via `ezk-ezk`)

**muti** a déjà l'intégration qui tourne — `~/git/bacasable/muti/apps/website` :
- `api/webhooks/lemonsqueezy.js` — webhook de confirmation d'achat.
- `src/pages/Buy.vue` — page d'achat / checkout.
- `src/composables/usePromo.js` (+ test) — codes promo.
- `vercel.json` — routage des endpoints `api/`.

Doctrine (cf. `website_showcase` samplerz) : faire une fois à la main sous les yeux de
muti, PUIS harvester en skill via `ezk-ezk` — ne pas pré-designer une flotte de
sous-skills avant d'avoir déroulé le geste.

## Périmètre pressenti (à trancher au grooming)

- Page d'achat + retour succès (Buy/Success), checkout LemonSqueezy.
- Webhook (confirmation d'achat) → émission licence / entitlement.
- Vérification d'entitlement **côté app** (l'app télécharge + vérifie l'achat).
- Anti-piratage minimal ; mises à jour de plugins (versioning, canal).
- Nom de skill pressenti : `ezk-sell` / `ezk-store` (à décider).

## Dépendances / Garde-fous

- **Compte LemonSqueezy : existe** (PO). Les **clés API = secret humain**, jamais dans le
  repo — geste d'installation, pas automatisable.
- Côté samplerz, la **licence** (AGPL-3.0 + exception de liaison plugins) et l'**ouverture
  du repo** (relecture juriste, dépôt marque) sont des prérequis HUMAINS **hors** de cette
  capability — cf. `plugin_marketplace_model` (samplerz).

## Liens

- samplerz `plugin_marketplace_model` (le modèle de vente acté + le premier besoin) ·
  samplerz `/plugins` `#368` (la vitrine, déjà livrée).
- Voisins mega-city : `0156 ezk-marketing`, `0157 ezk-landing-pages`, `ezk-ezk` (harvest).
