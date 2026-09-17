---
id: "20260917143616286"
title: Recette — brancher Lemon Squeezy + gating Pro in-app (étend lancement-app)
type: chore
priority: P2
product: vectorz
epic:
milestone:
labels: [recette, lancement, monetisation]
status: idea
ready:
pr:
created: 2026-09-17
---

# Recette — brancher Lemon Squeezy + verrou Pro in-app

## En clair

On vient de câbler **à la main**, pour samplerz, toute la chaîne « vendre une app :
produit Lemon Squeezy → clé de licence → l'app valide la clé → débloque le Pro ».
Cette fiche capture **tous les sujets rencontrés** pour qu'on écrive une **recette
réutilisable** (volet de `recipes/lancement-app/`) et qu'on ne réapprenne rien à la
prochaine app.

Ce n'est pas la recette elle-même : c'est la **liste de tout ce que la recette doit
couvrir**. Preuve que ça marche : samplerz PR `pro_runtime_gating` (elzinko/samplerz #419).

## Pourquoi (déclencheur)

Session du 2026-09-17 : mise en place du gating Pro de samplerz. Beaucoup de pièges
et de décisions qui reviendront pour muti-comme, la prochaine app monétisée, etc.
On capitalise pendant que c'est frais.

## Ce que la recette DOIT couvrir (checklist exhaustive)

### 1. Modèle de clé et de comptes LS
- **1 clé API = tout le COMPTE** (générale), pas par app. Ce qui varie par app =
  le **`store_id`** + les **IDs de produits** (non secrets).
- **Test vs Live = deux clés distinctes** (la clé encode le mode, façon Stripe).
  Commencer en **test**.
- ⚠ **Le secret est rangé sous `LEMONSQUEEZY_API_KEY_TEST`** (trousseau macOS,
  `ezk-secret get`) + `LEMONSQUEEZY_API_SECRET_TEST` dans le `.env` du main
  (= secret **webhook**, à ne pas confondre avec la clé API). **Le
  `catalogue-secrets.md` disait `lemonsqueezy-api` — c'est FAUX, à corriger.**

### 2. Inspecter / comparer un produit (API REST, lecture libre)
- `GET /v1/stores`, `GET /v1/products?filter[store_id]=<id>&include=variants`,
  `GET /v1/products/<id>?include=variants`.
- ⚠ **Piège curl** : les crochets de `filter[store_id]` sont interprétés comme du
  **globbing** → il faut **`curl -g` / `--globoff`**, sinon réponse vide.
- **Comparer à un produit qui VEND** (ici muti, store 280899) pour caler la config.

### 3. Réglages du produit (dashboard)
- **Achat unique** (`is_subscription=false`), **licence perpétuelle**
  (`is_license_length_unlimited=true`) = MAJ à vie pour la version courante.
- **1 appareil par clé** = `license_activation_limit=1` **ET décocher
  « unlimited »** (sinon le chiffre est ignoré).
- Le **`status=pending`** d'un variant « Default » est **NORMAL** (produit à une
  seule option) — ne pas s'en inquiéter (muti est pareil et vend).
- ⚠ **La modif du réglage d'activation se fait au DASHBOARD** (écrire ce champ via
  l'API est incertain — hors recette). ⚠ **Vécu : un changement dashboard ne s'est
  PAS reflété tout de suite dans l'API** (réglé « 1 » mais l'API montrait encore
  illimité) — re-vérifier / laisser un délai.

### 4. Validation in-app (le code)
- **API License de LS** : `POST /v1/licenses/{activate,validate,deactivate}`,
  appelée avec **la clé DU CLIENT** → **AUCUN secret de boutique embarqué** dans l'app.
- **1 appareil** : `activate` consomme un slot (renvoie un `instance_id` à stocker) ;
  `deactivate` le libère → bouton **« Libérer cet appareil »** pour changer de machine.
- **« v1 à vie, pas v2 »** : licence perpétuelle **+** l'app vérifie que la clé est
  rattachée au **produit v1** (`meta.store_id` / `meta.product_id`). Une **v2** = un
  **nouveau produit LS** (id différent) = nouvel achat.
- **Marche hors-ligne** : activer/valider **une fois** (réseau), puis faire confiance
  au **fichier local** ; `validate` **ne rétrograde JAMAIS** sur panne réseau —
  seulement sur un **verdict LS explicite** « invalide / désactivée ».
- **Frontière propre** : un `entitlement.get_entitlement()` lit un `license.json`
  local (source unique free/Pro) ; le module licence **écrit** ce fichier. Les
  endpoints d'activation sont **OPÉRATEUR-only** (garde refus-par-défaut, jamais
  via le tunnel public).
- **Bouton « Passer à Pro »** = ouvre le **`buy_now_url`** du produit.

### 5. Test → Live (le passage en vente réelle)
- Le **produit live a des IDs distincts** du test → paramétrer par env :
  `SAMPLERZ_LS_STORE_ID` / `_PRODUCT_ID` / `_CHECKOUT_URL` (samplerz les expose déjà).
- Ranger une **`lemonsqueezy-api-live`** le jour du live (cf. catalogue-secrets).

## Où la recette vivra

`recipes/lancement-app/` (à côté de la section « D. Boutique Lemon Squeezy » du
README) : un volet **`boutique-licence.md`** (setup produit + code de validation) +
**mise à jour du `catalogue-secrets.md`** (le vrai nom de clé). Voir aussi
[[reference_launch_infra_recipe]] côté mémoire samplerz.

## Hors périmètre de CETTE recette, mais à ne pas perdre (méthode)

Apprentissages transverses de la session, à capitaliser côté **ezk-method / rétro**
(pas dans la recette LS) :
- **Discipline revue Codex** : tours bornés, **chaque finding vérifié contre le code
  avant d'en faire une spec** ; ne pas relancer à l'infini (re-checkpoint au 3ᵉ tour
  sur un P3).
- **Passe transverse AVANT la PR** sur un sujet cross-cutting (ex. handlers Escape :
  grep TOUS les sites d'abord, sinon N tours Codex en cascade).
- **Prouver l'état avant de qualifier « bloqué / à refaire »** : le seam de gating
  (#380) et la sync des versions étaient déjà en place — on a failli les refaire.
