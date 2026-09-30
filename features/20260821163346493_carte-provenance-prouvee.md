---
id: "20260821163346493"
title: "Chaque élément de la carte montre le fichier d'où il vient"
type: feature
priority: P1
product: mega-city
version: V0.1
milestone: fondation
labels: [carte]
status: idea
pr:
created: 2026-08-21
---
# Prouver d'où vient chaque élément de la carte

## En clair

La carte dessine déjà ses liens depuis les fichiers du dépôt. Elle ne le **montre** pas : on
ne voit ni le fichier d'où vient un élément, ni la part de la carte qui est prouvée. Cette
fiche ajoute un lien « Source » cliquable dans chaque dossier, un ratio « prouvé / déduit »
en haut de la carte, et un pointillé sur tout ce qu'aucun fichier ne déclare.

## Contexte / Problème

Le 2026-08-20, la carte dessinait ~40 liens pour 7 déclarés : le reste était de
l'interprétation, dont un lien faux. Depuis, briques et liens sont compilés depuis le
catalogue et un test refuse la divergence (PR #234, puis #265 : **déjà livré**). Le risque
a changé de place : le cycle en 5 temps, écrit à la main, s'affichait à égalité avec le prouvé.

## Proposition (POC)

- Chaque brique et chaque cérémonie porte la **source** qui la déclare, vérifiée à la régénération.
- Le cycle passe dans `src/core/cycle.ts` : chaque puce est **prouvée** (`ceremonies.yml`,
  `roles:`) ou **déduite** (pointillé). Un id inconnu fait échouer la régénération.
- **Prouvé** = lu dans un fichier versionné et vérifié. **Déduit** = écrit à la main, sans fichier.

## Critères d'acceptation

- [x] Le dossier de chaque brique (commande, juge, règle, bundle, profil) et de chaque
      cérémonie affiche « Source : *fichier* » en lien cliquable.
- [x] Chaque source pointe vers un fichier qui existe : la régénération échoue sinon, et un
      test le prouve sur le catalogue réel.
- [x] Le ratio « prouvé / déduit » est affiché en haut de la carte, définition au survol.
- [x] Ce qu'aucun fichier ne déclare (puces du cycle sans appui, acteurs humains) est en
      pointillé, étiqueté « lecture d'auteur ».
- [x] Sabotage : une puce du cycle qui cite un id inconnu fait échouer la régénération ; une
      puce connue sans appui ressort en pointillé, jamais en silence.

## Comment vérifier

```bash
pnpm ezk:map                                              # menu des cartes → « La méthode »
pnpm --dir products/mega-city test -- map-provenance      # sabotage automatisé
```

1. Barre du haut : « 98 % prouvé » ; le survol donne la définition.
2. Trois cartes au hasard : chaque dossier porte « Source : … » ; le lien ouvre le fichier.
3. Cycle en 5 temps : les puces en pointillé sont les lectures d'auteur.

- vue carte-haut : /diagrams/methode-mega-city/carte-interactive.html
- vue dossier-skill : idem, après un clic sur la carte « ezk-sprint »

## Suite (hors POC)

- La ligne du fichier, et la provenance lien par lien (aujourd'hui : le fichier de la brique).
- Sourcer ou retirer ce qui reste déduit ; un seuil de ratio en CI.
- Marquer en « lecture d'auteur » la page « le domaine » et son schéma dessiné à la main.
- À trancher par le PO : `taxonomie.yml` (qui range chaque brique dans son étage) compte
  aujourd'hui comme source, est-ce une lecture d'auteur ?
