# Recette — Brancher un domaine + environnements (prod/staging/dev) sur Vercel, DNS chez IONOS

> Mettre `ton-domaine.fr` en **production** sur Vercel, plus des sous-domaines
> **`staging.`** et **`dev.`** qui montrent des versions de test — le DNS restant
> géré chez **IONOS**. Méthode appliquée à samplerz.
>
> **Composée d'une brique** : les enregistrements DNS peuvent être posés à la main
> (UI IONOS) **ou** via la brique [`dns-ionos-mcp`](./dns-ionos-mcp.md) (ton agent les
> crée pour toi).

## Quand l'utiliser

Ton site est déployé sur Vercel et tu veux ton vrai nom de domaine dessus — avec, en
prime, des adresses séparées pour tester (`staging`, `dev`) sans toucher à la prod.

## Le principe — Vercel commande, IONOS exécute

Vercel te **dit** quels enregistrements créer. IONOS est l'endroit **où** tu les crées
(ta zone DNS). Et chaque adresse pointe vers une **branche Git** → un environnement.

```
Vercel (dit quoi créer) ─→ IONOS (zone DNS : tu crées les A/CNAME)
                                        │
        domaine.fr / www  ─→ branche main    → Production
        staging.domaine.fr ─→ branche staging → Preview (vrai site de test)
        dev.domaine.fr     ─→ branche dev     → Preview (vrai site de test)
```

| Adresse | Environnement Vercel | Branche Git | Ce qui s'affiche |
|---|---|---|---|
| `domaine.fr` + `www` | **Production** | `main` | la prod (ici : page d'attente) |
| `staging.domaine.fr` | **Preview** | `staging` | le vrai site (test) |
| `dev.domaine.fr` | **Preview** | `dev` | le vrai site (dev) |

> **Pourquoi des branches ?** Le vrai site ne s'affiche que **sans** la variable
> `VITE_COMING_SOON` (voir [`page-attente-marketing`](./page-attente-marketing.md)).
> Cette variable n'est posée qu'en **Production**. Donc pour voir le vrai site, il faut
> un environnement **Preview** = une branche autre que `main`.

## Prérequis — les branches Git

Les branches `staging` et `dev` doivent **exister**, créées depuis `main` :

```bash
git push origin origin/main:refs/heads/staging
git push origin origin/main:refs/heads/dev
```

Vercel les déploie alors automatiquement en Preview (donc : vrai site).

## Étapes — le domaine racine (`domaine.fr` + `www`)

1. **Vercel** → projet → **Settings → Domains → Add** `domaine.fr`.
2. Vercel affiche **deux enregistrements** à créer (exemple samplerz) :
   - `A` · nom `@` · valeur `216.198.79.1`
   - `CNAME` · nom `www` · valeur `xxxxxxxx.vercel-dns-017.com`
3. **IONOS** → zone DNS du domaine → crée/modifie ces deux enregistrements.
   **Copie** les valeurs depuis Vercel (bouton 📋) — un caractère faux = cassé.

⚠️ **Deux pièges IONOS au niveau racine :**
- IONOS met souvent **déjà** un `A` sur `@` (page de parking). **Modifie-le**, n'en
  ajoute pas un deuxième (deux `A` sur `@` = conflit).
- **NE TOUCHE PAS** aux lignes marquées **« Mail »** (`MX`, `TXT` SPF, `_dmarc`,
  `_domainkey` DKIM, `autodiscover`) : c'est ta messagerie `@domaine.fr`. Les
  supprimer = tes emails cassés.

## Étapes — les sous-domaines (`staging`, `dev`)

1. **Créer le sous-domaine dans IONOS** (étape à part, avant tout enregistrement) :
   `https://my.ionos.fr/domain/details/<domaine>/subdomain/add` → ajoute `staging`,
   puis `dev`.
2. **Vercel** → Settings → Domains → **Add** `staging.domaine.fr` →
   choisis **« a specific Git branch »** → tape `staging`.
   ⚠️ **Pas « Production »** (sinon il montrerait la page d'attente).
   Recommence pour `dev.domaine.fr` → branche `dev`.
3. Vercel affiche le **CNAME** à créer pour chaque sous-domaine (souvent
   `cname.vercel-dns.com`).
4. **IONOS** → dans la zone du sous-domaine → crée le `CNAME` → valeur Vercel copiée.

> **Raccourci agent** : au lieu des clics IONOS (étapes 1, 3-4 côté DNS), tu peux
> demander à l'agent de poser les enregistrements via la brique
> [`dns-ionos-mcp`](./dns-ionos-mcp.md) : *« ajoute un CNAME `staging` →
> `cname.vercel-dns.com` sur `domaine.fr` »*.

## Vérifier

- Vercel passe de **« Invalid Configuration » à vert** tout seul. Compte de quelques
  minutes à **~1 h** (propagation DNS).
- Le **HTTPS** est posé automatiquement par Vercel.
- Ouvre `staging.domaine.fr` → tu dois voir le **vrai site**, pas la page d'attente.

## Pièges

- **Sous-domaine assigné à « Production »** au lieu d'une branche → il montre la prod
  (page d'attente), pas le vrai site. Assigne à `staging` / `dev`.
- **Créer le sous-domaine IONOS est une étape distincte** (`subdomain/add`) **avant**
  d'ajouter son CNAME. Sans ça, l'enregistrement n'a nulle part où vivre.
- **Copier, ne pas retaper** les valeurs Vercel (A et surtout les CNAME en hash).
- **Propagation lente** : ce n'est pas cassé, c'est le DNS qui met du temps. Vercel
  valide seul ensuite.
- **Enregistrements « Mail » IONOS** : jamais touchés (voir plus haut).
- **Jour du lancement** : retirer `VITE_COMING_SOON` de la Production fait passer
  `domaine.fr` de la page d'attente au vrai site (cf. recette page d'attente).
