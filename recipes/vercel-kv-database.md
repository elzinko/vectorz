# Recette (brique) — Base de données KV sur Vercel (Upstash Redis)

> **Brique réutilisable.** Créer un store clé-valeur Redis (Vercel KV, propulsé par
> Upstash) et le brancher à un projet Vercel, pour que le code y lise/écrive via des
> variables injectées automatiquement.
>
> Se **compose** dans d'autres recettes qui ont besoin d'un petit store : mailing
> list ([`mailing-list-coming-soon`](./page-attente-marketing.md)), rate limit
> partagé, compteurs, cache léger, sessions.

## Quand l'utiliser

Tu as un projet sur Vercel et tu veux **stocker un peu de données** sans monter une
base lourde (Postgres, Mongo…) : une liste d'emails, un compteur, un cache, un set
de valeurs uniques. Redis (clé-valeur) est parfait pour ça, et Vercel l'intègre en
2 clics.

## Les étapes (dashboard Vercel)

1. Projet → **Storage → Create Database** (ou « Add Store » / « Marketplace » selon
   la version de l'UI).
2. Choisir **Upstash for Redis** — c'est ce que Vercel appelait « KV ».
3. Nom (ex. `mon-projet-store`) + **région proche** (Europe : Frankfurt).
4. **⚠️ Connecter la base au projet** (onglet « Projects » / « Connect »). **C'est
   l'étape que tout le monde rate** : créer la base ne suffit pas — sans la
   connecter, les variables ne sont pas injectées et ton code verra un store absent.
5. Vérifier dans **Settings → Environment Variables** : tu dois voir
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` + `_TOKEN`).
6. **Redéployer** — les variables ne s'appliquent qu'au prochain déploiement.

## Le code (adaptateur réutilisable)

```js
import { Redis } from '@upstash/redis' // pnpm add @upstash/redis

// Accepte les DEUX nommages (Vercel KV historique OU Upstash direct) — rien à renommer.
function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null // base pas (encore) branchée → réponds 503, honnêtement
  return new Redis({ url, token })
}

// Exemple : un set dédoublonné (SADD renvoie 1 si nouveau, 0 si déjà là).
const redis = getRedis()
const added = await redis.sadd('waitlist:emails', email)
```

**Timeout sans pendre** : le SDK Upstash accepte un `signal`. Passe un
`AbortController` pour borner l'appel — au dépassement le fetch est **vraiment**
annulé (pas d'écriture fantôme après un timeout) :

```js
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 5000)
try {
  const redis = new Redis({ url, token, signal: controller.signal })
  return (await redis.sadd(key, value)) === 1
} finally {
  clearTimeout(timer)
}
```

## Vérifier

Dans le **Data Browser** de la base (console Upstash), tu vois tes clés en direct —
par ex. le set `waitlist:emails` se remplit à chaque écriture.

## Pièges

- **Créer ≠ connecter** : sans connecter la base au projet, aucune variable → store
  absent (503). Le piège n°1.
- **Deux nommages de variables** : `KV_REST_API_*` (ancien Vercel KV) ou
  `UPSTASH_REDIS_REST_*` (Upstash direct). Gère les deux dans le code (`??`).
- **L'UI Vercel bouge** : libellés « KV » / « Upstash » / « Marketplace » selon la
  version. L'important : une base **Redis (Upstash) connectée au projet**.
- **Redéploiement obligatoire** après avoir posé/changé les variables.
