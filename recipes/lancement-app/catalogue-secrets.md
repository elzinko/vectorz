# Catalogue des secrets par application

> Pour chaque app : **quel** secret, **où** il doit vivre, **qui** le lit, et son
> **état**. Évite de chercher ou de recréer. Ne contient **jamais** de valeurs —
> uniquement des noms et des emplacements.
>
> Emplacements : `.env main` (racine du dépôt principal) · `trousseau`
> (`ezk-secret-*`) · `GH` (GitHub Actions) · `Vercel`.
>
> État : ✅ posé · ❌ manquant · ⚙️ à propager (valeur connue, pas encore posée).

## samplerz

Audit du **2026-08-30**.

| Secret | `.env` main | trousseau | GH Actions | Vercel | Consommateur |
|---|---|---|---|---|---|
| `R2_ACCOUNT_ID` | ✅ | — | ✅ | — | CI upload binaires → R2 |
| `R2_ACCESS_KEY_ID` | ✅ | — | ✅ | — | CI upload binaires → R2 |
| `R2_SECRET_ACCESS_KEY` | ✅ | — | ✅ | — | CI upload binaires → R2 |
| `R2_BUCKET_NAME` | ✅ | — | ✅ | — | CI upload binaires → R2 |
| `R2_PUBLIC_URL` | ✅ | — | — | ⚙️ **manque** | fonction site `/api/downloads` (302 vers R2) |
| IONOS API | — | ✅ `samplerz-ionos-api` | — | — | DNS domaine (recette IONOS) |
| Lemon Squeezy API | — | ⚙️ `lemonsqueezy-api` (à ranger) | — | — | inspection + création produits (API REST) |

**Le seul trou côté infra** : `R2_PUBLIC_URL` sur Vercel (Production). Valeur
disponible dans le `.env` du main. Voir [`journal/samplerz.md`](journal/samplerz.md).

**Projet Vercel** : `samplerz` (équipe `thomas-coudercs-projects`) →
`https://www.samplerz.fr`. À **lier** avant toute opération env :
`vercel link --project samplerz`.

**Repo GitHub** : `elzinko/samplerz` (privé). `gh` authentifié (compte elzinko).

## Lemon Squeezy — modèle de clé (important)

Deux axes à ne pas confondre :

- **Par application → NON.** La clé API Lemon Squeezy est **au niveau du COMPTE**
  (générale) : une seule clé accède à toutes les boutiques. Ce qui varie par app,
  c'est le **`store_id`** (et les IDs de produits) — des **identifiants NON
  secrets**, qui vivent dans ce catalogue, pas dans le trousseau. Donc **1 clé,
  N `store_id`**. En API, on scope avec `filter[store_id]=…` (lecture) ou la
  relation `store` (création).
- **Test vs Live → OUI, on sépare.** Mode test = données isolées des vraies
  ventes. **Commencer en test** pour créer/inspecter des produits sans risque.
  À confirmer (doc `help/getting-started/test-mode` en 403 le 2026-08-30) : test
  et live sont **probablement DEUX clés distinctes** (la clé encode le mode, façon
  Stripe). Vérif empirique : `GET /v1/user` + `GET /v1/stores`, lire `test_mode`.

Rangement recommandé : `lemonsqueezy-api-test` / `lemonsqueezy-api-live` (si deux
clés). `store_id` par app → tableau ci-dessous, colonne dédiée.

| App | `store_id` LS | Produits (IDs) | Mode |
|---|---|---|---|
| samplerz | _(à renseigner)_ | _(à renseigner)_ | test d'abord |

## Gabarit — nouvelle app

Copier ce bloc pour une nouvelle application :

```
## <app>

| Secret | .env main | trousseau | GH Actions | Vercel | Consommateur |
|---|---|---|---|---|---|
| <NOM> | ? | ? | ? | ? | <qui le lit> |

Projet Vercel : <nom> (équipe …). Lier : vercel link --project <nom>.
Repo GitHub : <owner>/<repo>.
```

## Conventions de nommage

- **Trousseau** : `<projet>-<service>-<type>` quand le secret est propre à un
  projet (ex. `samplerz-ionos-api`) ; `<service>-<type>` quand il est **au niveau
  compte** et réutilisable entre projets (ex. `lemonsqueezy-api`).
- **GH / Vercel** : le **nom attendu par le code** (ex. `R2_PUBLIC_URL`) — ne pas
  renommer, le workflow / la fonction le lit tel quel.
