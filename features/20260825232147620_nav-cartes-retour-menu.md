---
id: "20260825232147620"
title: Barre de navigation sur chaque carte ezk:map — revenir au menu + sauter à une autre carte
type: feature
priority: P3
product: mega-city
version:
epic:
labels: [ezk-map, ux]
status: todo
ready: 2026-08-25
pr:
created: 2026-08-25
---

# 20260825232147620 — Navigation dans les cartes ezk:map

**En clair.** Le menu d'accueil `ezk:map` (fiche 20260825152954193) permet d'ouvrir une carte
d'un clic. Mais **une fois dans une carte**, pour revenir au menu il n'y a que le bouton
« Précédent » du navigateur, et pour changer de carte il faut revenir puis re-cliquer. Cette
fiche ajoute un **petit bouton repliable** dans le coin de chaque carte : **replié, il ne
masque rien** (un simple « ☰ ») ; **au clic**, il ouvre un panneau avec **« ← Retour au
menu »** et la **liste des cartes** pour **sauter directement** à une autre — sur **toutes**
les cartes, les interactives (HTML) comme les images (SVG).

**Si tu arrives frais.** *Carte* = une page de `diagrams/<slug>/`, servie par `ezk:map`
(un serveur local qui sert les fichiers du dépôt). Certaines cartes sont des pages HTML
interactives (`board.html`, `carte-interactive.html`), d'autres des images `SVG`
(`diagram.svg`). Le serveur **injecte** la barre à la volée : les fichiers sources ne
changent pas (le script range, il ne modifie pas le disque — ADR-0001).

## Contexte / Problème

C'est le reliquat explicitement **noté hors-MVP** par la fiche du menu (20260825152954193,
livrée #170) : « un lien "← cartes" injecté dans les pages servies serait un plus, mais hors
MVP (touche le rendu des cartes) ». Retour PO (2026-08-25) : depuis une carte, on veut
pouvoir revenir au menu OU choisir une autre carte, sans passer par le bouton du navigateur.

## Proposition

Le serveur `ezk:map` **enrobe** chaque carte d'une barre de navigation, sans toucher les
fichiers sur disque. Une seule barre, deux modes de rendu selon le type de carte :

1. **Cartes HTML** (`.html`) : le serveur lit le fichier et **injecte** un petit bloc
   flottant (position fixe, coin de l'écran, z-index élevé) juste avant `</body>`. La carte
   reste pleine page ; la barre flotte par-dessus sans perturber sa mise en page.
2. **Cartes SVG** (`.svg`) : le serveur sert une **page HTML enveloppe** = la barre + l'image
   SVG affichée. Le SVG brut reste accessible via `?raw` (l'enveloppe l'affiche avec
   `<img src="…?raw">`), donc rien n'est perdu.
3. **La barre** : « ← Cartes » (lien vers `/`) + un `<select>` listant toutes les cartes
   (changer d'option → va à cette carte). La carte courante est repérée (option sélectionnée).
4. **Compilé, pas dupliqué** : des fonctions **pures** (`renderNavBar(diagrams, currentSlug)`,
   `injectNavIntoHtml(html, nav)`, `renderSvgWrapper(rawUrl, nav)`) dans `src/core/ezk-map-menu.ts`
   (à côté du menu) ; `bin/ezk-map.ts` (bord I/O) les câble dans le serveur. Zéro dépendance.

**Périmètre** : uniquement les **cartes** (`.html`/`.svg` sous `diagrams/`). Les fiches
markdown ouvertes depuis le board (`features/*.md`, servies en texte brut) restent hors
périmètre — c'est un autre objet.

## Critères d'acceptation

- [ ] **Replié par défaut** : un petit bouton `☰` dans le coin qui **ne masque aucun
      contrôle** de la carte ; **au clic**, un panneau s'ouvre (« ← Retour au menu » + liste).
- [ ] Sur une carte **HTML** (`pnpm ezk:map avancement`), le bouton montre, une fois ouvert,
      **« ← Retour au menu »** et la **liste des cartes** ; la carte reste lisible.
- [ ] Sur une carte **SVG** (`pnpm ezk:map domaine-mega-city`), la même barre est présente,
      et l'image s'affiche ; le SVG brut reste servi via `?raw`.
- [ ] **« ← Cartes »** ramène au menu (`/`) ; **choisir une autre carte** dans le déroulant y
      va directement, sans repasser par le menu.
- [ ] La **carte courante** est repérée dans le déroulant (option sélectionnée).
- [ ] Les **fichiers sources ne sont pas modifiés** (injection à la volée ; l'invariant du
      board `avancement-board` reste vert — il lit le disque, pas le serveur).
- [ ] Texte injecté **échappé** (mêmes titres de meta.yaml que le menu) ; **zéro dépendance**.
- [ ] Gate locale verte (typecheck + tests + lint) ; le comportement `--list` et l'ouverture
      directe d'une carte restent **inchangés**.

## Comment vérifier

```bash
pnpm --dir products/mega-city test          # fonctions pures de nav (échappement, courant, wrapper)
pnpm ezk:map                                 # menu → clic sur une carte → barre visible
pnpm ezk:map domaine-mega-city               # carte SVG : barre + image
```

Preuve agent attendue : capture d'une carte HTML et d'une carte SVG avec la barre ; le
déroulant change de carte ; « ← Cartes » revient au menu.

## Notes / décisions

- Suite directe de 20260825152954193 (menu, #170) — le lot « nav dans les cartes » qu'elle
  avait différé. « Réunir l'accès, pas fusionner les vues » (PO 2026-08-23) reste vrai : la
  barre est de la **navigation**, pas une fusion des cartes.
- Injection à la volée (pas d'édition disque) : cohérent avec le rôle du serveur (ADR-0001)
  et ça garde l'invariant du board intact.
- `?raw` garde le SVG brut disponible (pour l'enveloppe, et tout autre usage image).
- **Repliable (retour PO 2026-08-25)** : une barre toujours ouverte recouvrait des zones de la
  carte interactive. Corrigé en `<details>` natif (ouverture au clic, accessible, zéro JS) —
  replié = un « ☰ » discret ; ça supprime aussi le `onchange` inline (surface en moins).
- **Dette connue (revue adverse, P1, non bloquant)** : le **câblage du serveur** (sélection de
  branche, bypass `?raw`, ordre du garde-fou de traversée) n'a pas de test d'intégration — les
  3 fonctions pures, elles, sont couvertes. Cohérent avec l'existant (la route `/` et le
  garde-fou n'en ont pas non plus). À fermer par un test serveur léger si on durcit.
