---
id: "20260830104013372"
title: Brancher un domaine + environnements (prod / staging / dev) sur Vercel, DNS chez IONOS
makes: Un domaine et ses sous-domaines staging/dev posés sur Vercel, DNS géré chez IONOS, alias posés par la CI par tag
source: # aucune implémentation prouvée pointée — playbook dashboard, pas de code (voir Statut)
composes: [dns-ionos-mcp, page-attente-marketing]
status: draft # pas de `source:` honnête — playbook manuel, signalé (voir Statut)
home: central
created: 2026-08-29
updated: 2026-08-30
---

# Recette — Brancher un domaine + environnements (prod / staging / dev) sur Vercel, DNS chez IONOS

> **Générique** — n'importe quel domaine. Providers : **Vercel** + **IONOS**. Mettre un
> domaine et ses sous-domaines `staging.` / `dev.` sur Vercel, le DNS restant chez IONOS.
> ⚠️ Les environnements sont **pilotés par la CI selon les tags** (GitLab Flow, façon muti)
> — **jamais** par des branches Git.
>
> **Composée** :
> - poser les DNS → brique [`dns-ionos-mcp`](./dns-ionos-mcp.md) ;
> - le déploiement par tags + les alias → **recette « CI type muti »** (fiche backlog, à écrire) ;
> - différer prod / le reste (page d'attente) → [`page-attente-marketing`](./page-attente-marketing.md).

## ⚠️ Le piège à NE PAS refaire — pas de branches d'environnement

Le réflexe naïf : créer une branche `staging`, une branche `dev`, et les « assigner » à
un sous-domaine sur Vercel. **Fausse route.** Le bon modèle (muti) n'a **qu'une seule
branche `main`**. Les environnements sont des **alias Vercel** que la **CI** pose selon ce
que tu pousses ou tagges. *(Vécu sur samplerz le 2026-08-29 : branches `dev`/`staging`
créées à tort, puis supprimées.)*

## Le modèle — une branche, des tags, des alias posés par la CI

| Ce que tu fais | Ce qui se déploie | Comment |
|---|---|---|
| push sur `main` | **dev**.`<domaine>` | la CI : `vercel deploy` + `vercel alias set … dev.<domaine>` |
| tag `v…-rc` (release candidate) | **staging**.`<domaine>` | idem, alias `staging` |
| tag `v…` (version finale) | **staging**, puis **prod** à la demande | prod = workflow manuel |
| apex + `www` (prod) | la version validée | déploiement **à la demande** |

C'est la **CI** (voir recette « CI type muti ») qui déploie puis fait `vercel alias set
<url> <sous-domaine>`. Vercel ne « suit » **aucune** branche pour dev/staging.

## La partie DNS (le cœur de CETTE recette)

### Le domaine racine (apex + `www`)

1. **Vercel** → Settings → Domains → **Add** `<domaine>` (cible : **Production**).
2. Vercel affiche **deux enregistrements** :
   - `A` · `@` · `216.198.79.1` (IP Vercel standard)
   - `CNAME` · `www` · `<hash>.vercel-dns-###.com` (propre à ton domaine)
3. **IONOS** → zone DNS → crée/modifie ces deux enregistrements (**copie** les valeurs).

⚠️ Pièges IONOS au niveau racine :
- IONOS pose souvent **déjà** un `A` sur `@` (parking) → **modifie-le**, n'en ajoute pas un 2e.
- **NE TOUCHE PAS** aux lignes **« Mail »** (`MX`, `TXT` SPF, `_dmarc`, `_domainkey`,
  `autodiscover`) : c'est ta messagerie `@<domaine>`.

### Les sous-domaines (`staging`, `dev`)

1. **Créer le sous-domaine chez IONOS** (étape distincte) :
   `https://my.ionos.fr/domain/details/<domaine>/subdomain/add`.
2. **IONOS** → zone du sous-domaine → un **CNAME** `staging` (puis `dev`) → la valeur
   Vercel (`cname.vercel-dns.com`, ou le même hash `…vercel-dns-###.com` que ton `www`).
3. **Vercel** → ajoute `staging.<domaine>` au projet **sans l'assigner à une branche** :
   c'est la **CI** qui le pointera par alias au premier déploiement.

> **Raccourci agent** : pose les CNAME via [`dns-ionos-mcp`](./dns-ionos-mcp.md).

## Prérequis

1. **Projet Vercel lié au repo GitHub** (Settings → Git).
2. **Root Directory** si monorepo (ex. `website/`) — sinon le build échoue
   (`vite: command not found`, exit 127).
3. **La CI de déploiement** (recette « CI type muti ») : elle pose les alias
   dev/staging/prod. Sans elle, les sous-domaines restent « Invalid » (aucun alias).

## Vérifier

- apex / `www` : Vercel passe de « Invalid » à vert (propagation : minutes → ~1 h) + HTTPS auto.
- dev / staging : verts **après** que la CI a posé l'alias — pas avant.

## Pièges

- **Branches d'environnement** = la fausse route. Une seule `main` ; le reste = alias CI.
- **Root Directory oublié** (monorepo) → `vite: command not found`, exit 127.
- **Créer le sous-domaine IONOS** est une étape distincte (`subdomain/add`) avant le CNAME.
- **Copier, pas retaper** les valeurs Vercel.
- **« Invalid » tant que la CI n'a pas déployé** le sous-domaine : normal, l'alias n'existe pas encore.
- **Enregistrements « Mail » IONOS** : jamais touchés.

## Statut de cette recette

Normalisée le 2026-08-30 (front-matter ajouté, étape 5 de la fiche
[`20260824185422122`](../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md)).
**`status: draft`** : c'est un **playbook dashboard** (Vercel/IONOS, clics guidés), pas une
implémentation de code — aucun `source:` honnête à pointer sans inventer. La recette « CI type
muti » qu'elle cite (déploiement par tags + alias) n'existe pas encore comme fiche séparée.
Signalé au PO plutôt qu'un `source:` inventé.

