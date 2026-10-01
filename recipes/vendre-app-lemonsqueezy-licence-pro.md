---
id: "20261001025515331"
title: "Vendre une app avec Lemon Squeezy : clé de licence et verrou Pro in-app"
makes: "Une boutique Lemon Squeezy en achat unique et un verrou Pro dans l'app : le client colle sa clé, l'app l'active sur un appareil, et le Pro marche ensuite hors-ligne"
source: ~/git/samplerz # implémentation prouvée (PR #419, mergée le 2026-09-17)
composes: [plan-distribution-app]
profile:
status: draft
home: central
created: 2026-10-01
updated: 2026-10-01
---

## En clair

Cette recette montre comment vendre une app en achat unique avec Lemon Squeezy. Elle montre aussi
comment l'app débloque son mode Pro à partir de la clé de licence du client. Le client colle sa clé,
l'app l'active auprès de Lemon Squeezy, puis le Pro marche même sans réseau. Aucun secret de boutique
ne voyage dans l'app. La recette vient d'un câblage fait à la main pour samplerz : elle garde ses
pièges pour que la prochaine app n'ait rien à réapprendre.

## Ingrédients (prérequis)

- Un compte Lemon Squeezy et une boutique. Le `store_id` de la boutique n'est pas secret.
- Une **clé API du compte**, pas de l'app : une seule clé voit toutes les boutiques du compte.
  Le mode **test** et le mode **live** ont chacun leur clé. On commence en test.
- La clé de test rangée dans le trousseau macOS sous `LEMONSQUEEZY_API_KEY_TEST`.
- Pour les webhooks, le secret `LEMONSQUEEZY_API_SECRET_TEST` dans le `.env` du dépôt principal.
  C'est le secret **webhook**, à ne pas confondre avec la clé API.
- Les identifiants du produit, non secrets : `store_id`, `product_id`, URL de checkout.
  Ils se notent dans le [catalogue des secrets](lancement-app/catalogue-secrets.md).

## Ustensiles (outils — CLI d'abord)

- `curl`, avec l'option `-g` pour toute URL qui contient des crochets.
- `jq` pour lire les réponses.
- `ezk-secret get <nom>` pour lire la clé dans le trousseau. On la garde dans une variable, on ne
  l'affiche jamais (voir [secrets-trousseau](secrets-trousseau/)).
- Le dashboard Lemon Squeezy, pour les réglages du produit (voir Préliminaires).

## Préliminaires (gestes manuels ⚙️)

- ⚙️ Créer le compte et la boutique Lemon Squeezy. Un humain le fait, jamais l'agent.
- ⚙️ Générer la clé API en mode test, puis la ranger :
  `ezk-secret set LEMONSQUEEZY_API_KEY_TEST --clip` (la clé est longue, donc presse-papier).
- ⚙️ Régler le produit au dashboard (étape 3). Écrire ce champ par l'API est incertain.
- ⚙️ Le jour du passage en vente réelle : créer le produit live et ranger la clé live (étape 5).

## Le concept (mécanisme + schéma)

L'app ne parle jamais avec un secret de boutique. Elle parle à l'API License de Lemon Squeezy
avec la **clé du client**. Un fichier local devient la seule source du tier gratuit ou Pro.

```
 Client                 App                               Lemon Squeezy
   │ achète ────────────────────────────────────────────▶ produit v1
   │◀──────────────── clé de licence ──────────────────────┘
   │ colle la clé ──▶ activate(clé du client) ───────────▶ POST /v1/licenses/activate
   │                 ◀── instance_id + meta{store, produit}
   │                 écrit license.json ──▶ get_entitlement() lit ce fichier
   │ hors-ligne      le Pro reste actif : on fait confiance au fichier
   │ validate ───────────────────────────────────────────▶ POST /v1/licenses/validate
   │                 rétrograde SEULEMENT sur un « invalide » explicite
   │ « Libérer cet appareil » ──▶ deactivate ────────────▶ rend le slot
```

Trois règles à retenir :

1. La clé du client suffit : aucun secret de boutique dans l'app.
2. Le fichier local est la source unique : le module de licence l'écrit, le reste de l'app le lit.
3. Une panne réseau ne punit jamais un client qui a payé.

## Exemples pour goûter (référence)

L'implémentation prouvée est celle de samplerz, PR #419 (`pro_runtime_gating`), mergée le
2026-09-17. Ses tests rejouent chaque règle : `tests/test_plugins/test_license.py` couvre
l'activation, la validation hors-ligne et la libération de l'appareil.

## Les étapes (playbook)

### 1. Clés et comptes

1. ⚙️ Ranger la clé de test (Préliminaires). Elle ne se lit qu'avec `ezk-secret get`.
2. Noter le `store_id` et les `product_id` de l'app dans le catalogue des secrets. Ce sont les
   seuls éléments qui changent d'une app à l'autre.
3. ⚠ Le nom du secret est `LEMONSQUEEZY_API_KEY_TEST`. L'ancien nom `lemonsqueezy-api`, qui figurait
   dans le catalogue, n'existait pas dans le trousseau.

### 2. Inspecter et comparer un produit (lecture libre)

1. `GET /v1/stores`, puis `GET /v1/products?filter[store_id]=<id>&include=variants`, puis
   `GET /v1/products/<id>?include=variants`. Chaque appel porte l'en-tête
   `Authorization: Bearer <clé>` et `Accept: application/vnd.api+json`.
2. ⚠ **Piège curl.** Les crochets de `filter[store_id]` sont lus comme un motif de globbing. Sans
   `-g`, curl refuse l'URL et sort en erreur 3. Avec `-s`, aucun message ne s'affiche : on croit à
   une réponse vide. Toujours `curl -g`.
3. Comparer le nouveau produit à un produit qui **vend déjà** (muti, boutique `280899`) pour caler
   la configuration.

### 3. Régler le produit (dashboard ⚙️)

1. **Achat unique** : `is_subscription=false`.
2. **Licence perpétuelle** : `is_license_length_unlimited=true`. Le client garde les mises à jour de
   la version courante.
3. **Un appareil par clé** : `license_activation_limit=1` **et** décocher « unlimited ». Sans ce
   second geste, le chiffre est ignoré.
4. Le variant « Default » en `status=pending` est **normal** pour un produit à une seule option.
   muti est dans le même cas et vend.
5. ⚠ Un réglage changé au dashboard peut ne pas apparaître tout de suite dans l'API. Vécu : réglé
   sur « 1 », l'API montrait encore « illimité ». Laisser un délai, puis relire.

### 4. Brancher la validation dans l'app

1. **Activer, valider, libérer** par `POST /v1/licenses/activate`, `validate` et `deactivate`, avec
   la clé du client.
2. **Un appareil** : `activate` consomme un slot et renvoie un `instance_id`, à stocker.
   `deactivate` rend le slot. Prévoir un bouton « Libérer cet appareil » pour changer de machine.
3. **« v1 à vie, pas v2 »** : après l'activation, vérifier que `meta.store_id` et `meta.product_id`
   correspondent au produit v1. Une v2 est un **nouveau produit** Lemon Squeezy, donc un nouvel achat.
4. **Marche hors-ligne** : activer une fois avec le réseau, puis faire confiance au fichier local.
   `validate` ne rétrograde jamais sur une panne réseau ou un 429 ou 5xx. Il rétrograde seulement sur
   un verdict explicite « invalide » ou « désactivée ».
5. **Frontière propre** : une fonction `get_entitlement` lit le fichier local de licence, et le
   module de licence l'écrit. Les endpoints d'activation sont réservés à l'opérateur local, avec un
   refus par défaut et jamais d'accès par le tunnel public.
6. **Verrou côté serveur** : un plugin laissé activé après une rétrogradation ne doit plus servir sa
   fonction Pro. Les points d'entrée consultent le tier vivant, pas seulement l'option activée.
7. **Bouton « Passer à Pro »** : il ouvre l'URL de checkout du produit.

### 5. Passer du test au live

1. Le produit live a des identifiants **différents** du produit test. Les exposer par variables
   d'environnement : `<APP>_LS_STORE_ID`, `<APP>_LS_PRODUCT_ID`, `<APP>_LS_CHECKOUT_URL`.
2. Ranger la clé live à part de la clé test. Le trousseau porte aussi un `LEMONSQUEEZY_API_KEY` sans
   suffixe. Son rôle reste à confirmer avant de s'en servir.

## Checklist « rien d'oublié »

- [ ] la clé API est celle du **compte**, rangée sous `LEMONSQUEEZY_API_KEY_TEST`, jamais affichée
- [ ] les appels avec crochets utilisent `curl -g`
- [ ] le produit est en achat unique, licence perpétuelle, `license_activation_limit=1` et « unlimited » décoché
- [ ] la configuration a été relue par l'API après un délai
- [ ] l'app appelle l'API License avec la clé du client, sans secret de boutique
- [ ] l'activation vérifie `meta.store_id` et `meta.product_id`
- [ ] une panne réseau ou un 429 ou 5xx ne rétrograde jamais un client Pro
- [ ] un bouton « Libérer cet appareil » rend le slot, et le fichier local n'est effacé qu'après la confirmation de Lemon Squeezy
- [ ] les endpoints d'activation sont réservés à l'opérateur local
- [ ] les identifiants du produit live passent par des variables d'environnement

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/samplerz`** (pointeurs relevés le 2026-10-01 sur le checkout local).

- `src/samplerz/plugins/license.py:37` — l'URL de l'API License, appelée avec la clé du client
- `src/samplerz/plugins/license.py:49` — identifiants attendus et URL de checkout, surchargeables par variable d'environnement
- `src/samplerz/plugins/license.py:95` — `_meta_matches` : le verrou « v1 oui, v2 non »
- `src/samplerz/plugins/license.py:217` — `activate` : consomme un slot, écrit le fichier local
- `src/samplerz/plugins/license.py:302` — `validate` : ne rétrograde jamais sur une panne
- `src/samplerz/plugins/license.py:368` — `deactivate` : efface la clé locale seulement si Lemon Squeezy confirme
- `src/samplerz/plugins/entitlement.py:65` — `get_entitlement` lit le fichier de licence local
- `src/samplerz/web/license_router.py:76` — état local et URL de checkout pour « Passer à Pro »
- `src/samplerz/web/pro_gate.py:1` — le verrou Pro côté serveur
- `src/samplerz/web/access.py:1` — la garde « opérateur local », refus par défaut
- `src/samplerz/web/api.py:404` — `_operator_gate` branché sur l'API
- `src/samplerz/web/static/js/plugins-ui.js:198` — l'interface lit l'URL de checkout
- `src/samplerz/web/static/js/plugins-ui.js:211` — `activateLicense`, côté interface
- `tests/test_plugins/test_license.py:81` — une clé d'un autre produit est refusée et le slot rendu
- `tests/test_plugins/test_license.py:175` — la validation hors-ligne garde le Pro
- `tests/test_plugins/test_license.py:279` — la libération hors-ligne garde la licence

## Statut de cette recette

Capturée le 2026-10-01, après la session du 2026-09-17 qui a câblé le gating Pro de samplerz.
Elle comble le point « Validation de la clé Pro dans l'app » laissé ouvert par
[plan-distribution-app](plan-distribution-app.md).

Elle reste en `draft` : personne ne l'a encore rejouée sur une deuxième app. Les numéros de ligne
dérivent avec le code de samplerz. Le passage en live n'est décrit que dans son principe, pas rejoué.
