---
id: "20260829123707100"
title: « Labo de cuisine » — journaliser les difficultés vécues et leurs corrections (près de la feature, pas dedans) comme matière première d'ezk-chef et des rétros
type: feature
priority: P0
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-29
---

## En clair

Quand on résout une galère en session — exemple vécu : le **Root Directory** Vercel oublié,
le **DNS IONOS** à câbler pour samplerz — l'info se perd une fois la session finie. Les
commits gardent le **code**, mais pas les **gestes dans les interfaces** (Vercel, IONOS) ni
le **pourquoi**. On veut un endroit où noter, **une fois la galère corrigée ET validée**, ce
qui a coincé et comment on l'a réglé — **seulement si c'est utile pour reproduire**.

Deux usages :
1. les **rétrospectives** (amélioration continue) ;
2. nourrir **ezk-chef** : il générera des recettes à partir de cet **historique de
   fabrication** — le « **labo de cuisine** ». Aujourd'hui les recettes de `recipes/` ont été
   **notées à la main**, pas générées depuis un tel historique. Ce journal est le chaînon
   manquant.

## Le vrai problème à trancher (grooming)

Où vit cette matière, sans **polluer** la fiche de feature ?

- **Où** : une **fiche de réalisation indépendante**, dans un **autre répertoire**, mais
  **près** de la fiche feature (rattachée à elle) ?
- **Quand** : en **fin de session** ? en **fin de PR** ? au moment où une galère est
  corrigée + validée ?
- **Dans le sprint / dans la fiche / fiche séparée** : les trois sont sur la table.
- **Le lien** : un **commit conventional bien nommé** qui permet de **retrouver tous les
  commits** du sujet et de les **rapprocher de la feature**.
- **Le filtre** : uniquement **corrigé + validé + utile** — pas les fausses pistes, pas le
  bruit.

## Piste (vision énoncée en session)

Une **commande bien placée dans le workflow ezk** qui, en fin de session/PR, **traque les
sujets à retenir** et écrit un **fichier de journalisation** (faits utiles pour une rétro,
info réutilisable), dans un répertoire dédié, **rattaché à la fiche feature**, committé avec
un nom conventional qui rend le tout **retrouvable et rapprochable** de la feature.

## Dépendances / voisinage

- **Enabler à trancher avec l'architecte** (panel `engineering:architecture`) : la commande
  qui fabriquera **ezk-chef**. `ezk-ezk` est plutôt l'outil pour **créer des commandes** dans
  l'esprit ezk (formats/types du domaine mega-city) ; le nom `ezk-ezk extract` **n'est pas
  acquis**. À concevoir avant de coder.
- Alimente : [`20260824122629794`](done/20260824122629794_ezk-extract-capitaliser-feature-en-recette.md)
  (feature → recette) et le futur **ezk-chef**.
- Doctrine : ADR-0013 (une recette **propose**, ne fabrique jamais de code seule).
- Sœur : [`20260829123707200`](20260829123707200_reunifier-tagger-cluster-recette.md)
  (réunifier + tagger le cluster recette).

## Notes

Origine : session samplerz du 2026-08-29 (câblage domaine + Vercel : Root Directory oublié,
DNS IONOS). Priorité **P0** demandée par le PO. `idea` — **à groomer**.
