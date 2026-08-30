---
id: "20260829123707100"
title: « Labo de cuisine » — journaliser les difficultés vécues et leurs corrections (près de la feature, pas dedans) comme matière première d'ezk-chef et des rétros
type: feature
priority: P0
product: mega-city
version:
epic:
depends: []
status: shipped
ready: 2026-08-30
pr: "#195"
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

## ▶️ Groomé 2026-08-30 (ezk-architect) — pas de nouvel objet, deux petites soudures

**La bonne nouvelle : 80 % existe déjà**, et depuis un jour de plus qu'à la rédaction de cette
fiche.

- `ezk-chef extract` (livré #192/#194) laisse **exactement** des trous `TODO(jugement)` là où
  manquent les gestes d'interface, les prérequis et le *pourquoi* (`ezk-chef-extract.sh:136-146`).
- `ezk-archive run/close` **archive déjà** un récit de session dans `docs/sessions/YYYY-MM-DD-<slug>.md`
  à la clôture (`skills/ezk-archive/SKILL.md:154-163`).

**La seule vraie nouveauté = 2 petites soudures :**
1. une section filtrée **`## Galères & gestes (labo)`** dans le scratch `SPRINT.md`, **clé sur
   l'id de fiche**, remplie au fil de l'eau quand une galère est **corrigée + validée** ;
   `ezk-archive` la fige dans `docs/sessions/` avec le reste (aucun nouveau déclencheur — la
   clôture EST le moment où « corrigé + validé » est vrai par construction).
2. apprendre à **`ezk-chef extract`** à **lire** ce récit (via l'`id` de fiche) et à verser
   « Galères & gestes » dans ses `TODO(jugement)`.

**Le lien** : rien à inventer — la branche `feat/<id>-<slug>` (ADR-0018) + un `fiches: <id>` en
tête du récit rendent tout retrouvable (`git log --grep=<id>`, `grep -rl <id> docs/sessions/`).
**Le filtre** : *corrigé+validé* = mécanique (état à la clôture) ; *utile* = jugement pur, **pas
de gate** (garde-fou repris d'`ezk-retro` : rien à retenir → on n'écrit rien).
**La commande** : **aucun nouveau `ezk-*`** — capture par `ezk-archive` (gabarit étendu),
consommation par `ezk-chef extract`. (`ezk-ezk extract` évoqué plus bas = abandonné : `ezk-ezk`
fait des *skills*.)

### MVP recommandé = la moitié CAPTURE seulement

Une clôture de session produit un récit `docs/sessions/` clé sur l'id de fiche, avec ≥1 entrée
« galère → geste d'interface → pourquoi », committée de façon retrouvable.
**Critère testable** : pour la galère réelle du 2026-08-29 (samplerz : Root Directory Vercel,
DNS IONOS), l'entrée existe, porte `fiches: 20260829123707100`, et `git log --grep=…` la retrouve.
**Fast-follow (fiche fille)** : brancher la lecture dans `ezk-chef extract`.

### ⚖️ 3 décisions produit à trancher au tampon (l'architecte ne les invente pas)

1. **OÙ** — reco archi : **réutiliser `docs/sessions/`** (YAGNI + consolidation récente). ⚠️ Ça
   **contredit la préférence écrite plus bas** dans cette fiche (« une fiche de réalisation
   indépendante, dans un autre répertoire »). Arbitrage de direction — **à toi**.
2. **Priorité** — vu qu'`extract` couvre déjà la charpente, la nouveauté nette est petite. P0
   tient, ou reclasser ?
3. **Périmètre** — MVP = capture seule, la consommation par `ezk-chef extract` en **fiche fille** ?

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
- Alimente : [`20260824122629794`](20260824122629794_ezk-extract-capitaliser-feature-en-recette.md)
  (feature → recette) et le futur **ezk-chef**.
- Doctrine : ADR-0013 (une recette **propose**, ne fabrique jamais de code seule).
- Sœur : [`20260829123707200`](../20260829123707200_reunifier-tagger-cluster-recette.md)
  (réunifier + tagger le cluster recette).

## Notes

Origine : session samplerz du 2026-08-29 (câblage domaine + Vercel : Root Directory oublié,
DNS IONOS). Priorité **P0** demandée par le PO. `idea` — **à groomer**.
