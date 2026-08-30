---
id: "20260830184917144"
title: "ezk-chef extract lit le « labo » — remplir les TODO(jugement) depuis docs/sessions"
type: feature
priority: P1
product: mega-city
version:
epic:
depends: []
status: todo
ready: 2026-08-30
pr:
created: 2026-08-30
---

## En clair

`ezk-chef extract` produit un brouillon de recette depuis une fiche shippée, mais laisse des
trous **`TODO(jugement)`** là où manquent les **gestes d'interface** et le **pourquoi**. Le
« labo de cuisine » (livré #195) capture justement cette matière dans `docs/sessions/`, clé
sur l'id de fiche. **Cette fiche branche les deux** : `extract` va **lire** le récit de session
qui référence la fiche et **verser** la section « Galères & gestes (labo) » dans ses trous.

C'est la **fiche fille** annoncée par #195 (la moitié « consommation »). Elle **boucle la
chaîne** : recette (objet, #192) → `extract` (producteur, #194) → labo (matière, #195) → **ici**,
la matière remplit le producteur.

## Contexte

- `ezk-chef-extract.sh` (livré #194) écrit des `TODO(jugement)` explicites dans le brouillon
  aux sections **Ingrédients (prérequis)**, **Préliminaires (gestes manuels ⚙️)** et **Le concept**
  (le *pourquoi*) — cf. `products/mega-city/bin/ezk-chef-extract.sh:130-146`.
- Le labo (livré #195) écrit une section **`## Galères & gestes (labo)`** dans les récits
  `docs/sessions/YYYY-MM-DD-<slug>.md`, avec un entête **`fiches: <id>`** qui rend le récit
  rapprochable de la feature. Entrée de référence : `docs/sessions/2026-08-29-samplerz-cablage-domaine.md`.
- Aujourd'hui les deux ne se parlent pas : `extract` ignore `docs/sessions/`.

## Proposition (design cadré au groom de #195)

Étendre `ezk-chef-extract.sh` : après avoir localisé la fiche, **chercher les récits
`docs/sessions/*.md` dont l'entête `fiches:` contient l'`<id>`**, en extraire la section
`## Galères & gestes (labo)`, et **verser** son contenu dans le brouillon **à la place (ou en
regard) des `TODO(jugement)`** correspondants :

- les **gestes d'interface** (Vercel Root Directory, DNS IONOS…) → section **Préliminaires (⚙️)** ;
- les **prérequis** (comptes, secrets) évoqués → section **Ingrédients** ;
- le **pourquoi** → section **Le concept**.

Entonnoir (ADR-0013) respecté : on **verse un pointeur + le résumé du geste** capturé, jamais
du code. Si **aucun** récit labo ne référence l'id, comportement **inchangé** (les `TODO(jugement)`
restent) — dégradation propre, jamais d'invention.

## Critères d'acceptation

- [ ] `ezk-chef extract <id>` sur une fiche dont **un récit `docs/sessions/` porte `fiches: <id>`
      + une section labo** → le brouillon contient les **gestes du labo** (au moins un) aux bonnes
      sections, **plus** de `TODO(jugement)` vide là où le labo a fourni la matière.
- [ ] **Sans** récit labo pour l'id → comportement **identique à #194** (les `TODO(jugement)`
      restent) — testé rouge→vert par la présence/absence du récit.
- [ ] Entonnoir : le brouillon **pointe** le récit source (`docs/sessions/…`), ne recopie pas de code.
- [ ] Déterministe (rejeu → même sortie hors id/dates), front-matter YAML valide (comme #194).
- [ ] Gate locale verte (typecheck / graph:check / vitest / test:scripts dont test-ezk-chef-extract étendu / biome).

## Comment vérifier

```bash
# fixture : une fiche shippée + un docs/sessions/*.md avec `fiches: <id>` et une section labo
bash products/mega-city/bin/test-ezk-chef-extract.sh   # étendu : cas « avec labo » et « sans labo »
```

## Notes

- **Lignée** : ferme la boucle #192 (objet) → #194 (extract) → #195 (labo). Design tranché au
  groom archi de #195 (récit clé sur `fiches: <id>`, versement dans les trous `TODO`).
- **Frontière** : #195 = la **capture** (déjà livrée) ; ici = la **consommation**. Pas de
  nouvel objet ni de nouvelle commande — on étend `ezk-chef-extract.sh`.
- **Réutilise** : le lecteur de section `## <nom>` déjà présent dans `ezk-chef-extract.sh`
  (fonction `section()`), l'entête `fiches:` du récit, la convention `feat/<id>-<slug>` (ADR-0018).
