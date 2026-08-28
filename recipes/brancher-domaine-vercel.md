# Recette — Brancher un domaine + environnements (prod / staging / dev) sur Vercel, DNS chez IONOS

> **Générique** — n'importe quel domaine. Providers : **Vercel** (hébergement) + **IONOS**
> (registrar / DNS). Mettre un domaine en **production** sur Vercel, plus des sous-domaines
> **`staging.`** et **`dev.`** qui suivent des branches de test, le DNS restant géré chez
> IONOS.
>
> **Composée de briques** :
> - poser les enregistrements DNS → brique [`dns-ionos-mcp`](./dns-ionos-mcp.md) (ou à la main) ;
> - faire différer prod et preview (ex. page d'attente en prod) → recette
>   [`page-attente-marketing`](./page-attente-marketing.md).

## Quand l'utiliser

Un site déployé sur Vercel, à mettre sur ton vrai domaine — avec des adresses séparées
pour tester (`staging`, `dev`) sans toucher à la prod.

## Le principe — Vercel commande, IONOS exécute

Vercel **dit** quels enregistrements DNS créer. IONOS est **où** tu les crées (ta zone).
Chaque adresse se **rattache** ensuite à une cible Vercel.

Vercel n'a que **deux cibles** pour un domaine :

| Cible Vercel | Ce qu'elle suit | Variables d'env utilisées |
|---|---|---|
| **Production** | la branche de prod (`main`) | celles de *Production* |
| **Preview** | **une branche Git** que tu choisis | celles de *Preview* |

C'est la cible — et donc les variables d'env de cet environnement — qui décide **quel
contenu** s'affiche. Exemple : une variable `COMING_SOON` posée seulement en *Production*
fait que l'apex montre la page d'attente, pendant que les previews montrent le vrai site
(voir [`page-attente-marketing`](./page-attente-marketing.md)).

## Le mapping (à adapter)

```
apex + www          ─→ Production   (branche main)      → version de prod
staging.<domaine>   ─→ Preview      (branche staging)   → contenu de cette branche
dev.<domaine>       ─→ Preview      (branche dev)       → contenu de cette branche
```

| Adresse | Cible Vercel | Branche suivie |
|---|---|---|
| `<domaine>` + `www` | Production | `main` |
| `staging.<domaine>` | Preview | `staging` |
| `dev.<domaine>` | Preview | `dev` |

> Un sous-domaine peut aussi être rattaché à la **Production** (il reflète alors la prod)
> plutôt qu'à une branche. Choisis Preview pour **tester une branche**, Production pour
> **miroiter la prod**.

## Prérequis (fondations — sans elles rien ne se déploie)

1. **Projet Vercel lié au repo GitHub** — Settings → Git → Connect. Sans ce lien, aucune
   branche ne déclenche de déploiement. C'est la base de tout.
2. **Root Directory** — si le site vit dans un **sous-dossier** d'un monorepo (ex.
   `website/`), règle **Settings → Build & Deployment → Root Directory** sur ce dossier.
   Sinon Vercel build la **racine** du repo → le build échoue (souvent
   `vite: command not found`, car les dépendances du site ne sont pas là).
3. **Les branches existent**, créées depuis `main` :
   ```bash
   git push origin origin/main:refs/heads/staging
   git push origin origin/main:refs/heads/dev
   ```
   Un push sur l'une d'elles déclenche son déploiement Preview.

## Étapes — le domaine racine (apex + `www`)

1. **Vercel** → projet → **Settings → Domains → Add** `<domaine>`.
2. Vercel affiche **deux enregistrements** à créer :
   - `A` · nom `@` · valeur `216.198.79.1` (IP Vercel standard)
   - `CNAME` · nom `www` · valeur `<hash>.vercel-dns-###.com` (propre à ton domaine)
3. **IONOS** → zone DNS → crée/modifie ces deux enregistrements. **Copie** les valeurs
   depuis Vercel (un caractère faux = cassé).

⚠️ **Deux pièges IONOS au niveau racine :**
- IONOS pose souvent **déjà** un `A` sur `@` (parking). **Modifie-le**, n'en ajoute pas
  un second (deux `A` sur `@` = conflit).
- **NE TOUCHE PAS** aux lignes **« Mail »** (`MX`, `TXT` SPF, `_dmarc`, `_domainkey`
  DKIM, `autodiscover`) : c'est ta messagerie `@<domaine>`. Les supprimer = emails cassés.

## Étapes — les sous-domaines (`staging`, `dev`)

1. **Créer le sous-domaine chez IONOS** (étape distincte, avant tout enregistrement) :
   `https://my.ionos.fr/domain/details/<domaine>/subdomain/add` → ajoute `staging`, puis `dev`.
2. **Vercel** → Settings → Domains → **Add** `staging.<domaine>` → choisis
   **« a specific Git branch »** → `staging`. Recommence : `dev.<domaine>` → `dev`.
3. Vercel affiche le **CNAME** à créer pour chaque (souvent `cname.vercel-dns.com`).
4. **IONOS** → dans la zone du sous-domaine → crée le `CNAME` → valeur Vercel copiée.

> **Raccourci agent** : au lieu des clics DNS IONOS, demande à l'agent de poser les
> enregistrements via [`dns-ionos-mcp`](./dns-ionos-mcp.md) — *« ajoute un CNAME
> `staging` → `cname.vercel-dns.com` sur `<domaine>` »*.

## Vérifier

- Vercel passe de **« Invalid Configuration » à vert** seul (propagation : minutes → ~1 h).
- **HTTPS** posé automatiquement.
- Ouvre `staging.<domaine>` → la version de la branche `staging` (ex. le vrai site).

## Pièges

- **Projet non lié à GitHub** → les branches ne déploient pas. Prérequis n°1.
- **Root Directory oublié** sur un monorepo → build échoue (`vite: command not found`,
  exit 127). Règle-le sur le dossier du site.
- **Sous-domaine mal ciblé** : « Production » alors que tu voulais une branche (ou
  l'inverse) → mauvais contenu affiché.
- **Créer le sous-domaine IONOS** est une étape distincte (`subdomain/add`) **avant** le CNAME.
- **Copier, pas retaper** les valeurs Vercel (surtout les CNAME en hash).
- **Propagation lente** : pas cassé, juste le DNS. Vercel valide seul ensuite.
- **Enregistrements « Mail » IONOS** : jamais touchés.
