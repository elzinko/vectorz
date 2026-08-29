# Recette — Mailing list sur une page d'attente (coming-soon)

> Ajouter à un site **Vue + Vite sur Vercel** une page d'attente « coming soon » qui
> **remplace tout le site en prod** et **collecte des emails**, sans toucher au vrai
> site ni casser le staging. Méthode reprise de **muti / livestreamz**, appliquée à
> samplerz.
>
> **Composée de briques** :
> - stockage des emails → brique [`Base KV Vercel`](./vercel-kv-database.md) ;
> - mise en ligne du domaine + `staging`/`dev` → recette [`brancher-domaine-vercel`](./brancher-domaine-vercel.md) ;
> - (le reste ci-dessous : bascule d'affichage, page teaser, formulaire, noindex).
>
> Destinée à devenir `ezk-recipy` / `ezk-chef` (vectorz) — modulaire et composable.

## Quand l'utiliser

Le produit n'est pas prêt, mais tu veux une présence en prod : une page teaser qui
explique le produit **et collecte des emails**, pendant que le vrai site se prépare
en staging.

## Le principe — une seule bascule

Une variable d'environnement `VITE_COMING_SOON` :

| Environnement | Valeur | Ce qui s'affiche |
|---|---|---|
| **Prod** | `true` | Seulement la page d'attente + `noindex` (invisible aux moteurs) |
| **Staging / dev / preview** | absent | Le vrai site complet, pour tester |

Le jour du lancement : tu **retires** la variable → le vrai site revient (indexation
rétablie). ⚠️ Ne mets **jamais** `VITE_COMING_SOON` en Preview, sinon tu n'as plus
d'endroit pour tester le vrai site.

## Les ingrédients (fichiers)

1. **`src/views/ComingSoonView.vue`** — page teaser : badge, accroche, slogan, teaser
   honnête, **formulaire email + case de consentement** (RGPD) + honeypot anti-bot.
2. **`src/App.vue`** — la bascule sur `import.meta.env.VITE_COMING_SOON === 'true'`.
3. **`src/env.d.ts`** — déclare `VITE_COMING_SOON?: string`.
4. **`api/_lib/waitlist.js`** — cœur métier PUR (`registerEmail(store, email, consent)`,
   validation) indépendant du store → testable en mémoire, **sans Redis**.
5. **`api/notify.js`** — l'endpoint : garde-fous (honeypot + rate limit) + appelle le
   cœur métier avec l'**adaptateur KV de la brique** ([`Base KV Vercel`](./vercel-kv-database.md)).
   Sans base branchée → **503** honnête.
6. **`vite.config.ts`** — en coming-soon : `noindex` sur `index.html` (propagé aux
   routes par le plugin SEO) + `robots.txt` `Disallow: /`.

## Les étapes

1. **Le store** : suis la brique [`Base KV Vercel`](./vercel-kv-database.md)
   (`pnpm add @upstash/redis`, créer + connecter la base).
2. Créer `ComingSoonView` (design du site) + le formulaire (email, consentement, honeypot).
3. Brancher la bascule dans `App.vue` + déclarer la variable dans `env.d.ts`.
4. Cœur métier `registerEmail` (pur) + l'endpoint qui l'appelle avec l'adaptateur KV.
5. Noindex conditionnel dans `vite.config.ts`.
6. Tester les **deux modes** (build avec/sans la variable) + `registerEmail` en mémoire.

## Le déploiement (Vercel)

1. Brancher la base KV (brique) → variables `KV_REST_API_*` injectées.
2. `VITE_COMING_SOON=true` en *Production* (uniquement — pas en Preview).
3. Redéployer + brancher le domaine → recette [`brancher-domaine-vercel`](./brancher-domaine-vercel.md)
   (prod sur `domaine.fr`, vrai site sur `staging.`/`dev.`).
4. Lancement : retirer `VITE_COMING_SOON` → vrai site + indexation de retour.

## Les garde-fous (honnêteté + abus)

- **Consentement RGPD** obligatoire ; « merci » uniquement sur enregistrement réel.
- **Honnêteté** : sans base KV → message honnête, jamais de fausse inscription.
- **Anti-abus** (endpoint public) : honeypot (`website`) + rate limit par IP +
  timeout Redis (cf. brique).
- **Discrétion** : `noindex` + `robots Disallow` en coming-soon.
- **Teaser** : ne promets que ce qui existe ; produit pas fini → tease la *vision*.

## Pièges rencontrés

- Un `.env.local` `VITE_COMING_SOON=true` gardé en local fait **échouer les tests
  SEO** (build en coming-soon → `noindex` au lieu du contenu attendu). Le retirer
  avant la gate ; en CI il n'existe pas.
- Mock d'un constructeur (`new Redis(...)`) en test : utiliser une **classe**, pas
  une arrow function (« is not a constructor »).
- Voir aussi les pièges de la brique [`Base KV Vercel`](./vercel-kv-database.md)
  (créer ≠ connecter, deux nommages de variables…).
