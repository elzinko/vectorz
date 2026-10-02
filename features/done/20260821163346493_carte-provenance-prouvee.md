---
id: "20260821163346493"
title: "Chaque élément de la carte montre le fichier d'où il vient"
type: feature
priority: P1
product: mega-city
version: V0.1
milestone: fondation
labels: [carte]
status: shipped
pr: "#269"
created: 2026-08-21
---
# Prouver d'où vient chaque élément de la carte

## En clair

La carte dessine ses liens depuis les fichiers, mais elle ne le montre pas. On ne voit ni le
fichier d'où vient un élément, ni la part de la carte qui est prouvée. Cette fiche ajoute un
lien « Source » cliquable dans chaque dossier, un ratio « prouvé / déduit » en haut, et un
pointillé sur ce qu'aucun fichier ne déclare.

## Contexte / Problème

Le 2026-08-20, la carte dessinait ~40 liens pour 7 déclarés. Depuis, briques et liens sont
compilés depuis le catalogue (PR #234 et #265 : **déjà livré**). Reste le cycle en 5 temps,
écrit à la main, qui s'affichait à égalité avec le prouvé.

## Proposition (POC)

- Chaque brique et chaque cérémonie porte sa **source**, vérifiée à la régénération.
- Le cycle passe dans `src/core/cycle.ts` : chaque puce est **prouvée** (`ceremonies.yml`,
  `roles:`) ou **déduite** (pointillé). Un id inconnu fait échouer la régénération.
- **Prouvé** = lu dans un fichier versionné et vérifié. **Déduit** = écrit à la main, sans fichier.

## Critères d'acceptation

- [x] Chaque dossier (brique, cérémonie) affiche « Source : *fichier* » en lien cliquable.
- [x] Une source qui ne mène à aucun fichier fait échouer la régénération (test sur le réel).
- [x] Le ratio « prouvé / déduit » est affiché en haut, définition au survol.
- [x] Ce qu'aucun fichier ne déclare (puces du cycle, humains) est en pointillé.
- [x] Sabotage : id inconnu dans le cycle = échec ; puce connue sans appui = pointillé.

## Comment vérifier

```bash
pnpm ezk:map                                          # « La méthode » : cliquer trois cartes
pnpm --dir products/mega-city test -- map-provenance  # sabotage automatisé
```

Barre du haut : « 98 % prouvé ». Dossiers : « Source : … ↗ ». Cycle : pointillé = lecture d'auteur.

- vue carte-haut : /diagrams/methode-mega-city/carte-interactive.html
- vue dossier-skill : idem, après un clic sur la carte « ezk-sprint »

**Avant / après** (règle `development/pr-before-after-media`)
| Vue | Avant | Après |
|---|---|---|
| carte-haut | ![carte-haut avant](https://github.com/elzinko/vectorz/blob/fec0a1405990fca77eaf502d9df243ac1360090e/docs/pr-evidence/20260821163346493/carte-haut-before.png?raw=true) | ![carte-haut après](https://github.com/elzinko/vectorz/blob/fec0a1405990fca77eaf502d9df243ac1360090e/docs/pr-evidence/20260821163346493/carte-haut-after.png?raw=true) |
| dossier-skill | ![dossier-skill avant](https://github.com/elzinko/vectorz/blob/fec0a1405990fca77eaf502d9df243ac1360090e/docs/pr-evidence/20260821163346493/dossier-skill-before.png?raw=true) | ![dossier-skill après](https://github.com/elzinko/vectorz/blob/fec0a1405990fca77eaf502d9df243ac1360090e/docs/pr-evidence/20260821163346493/dossier-skill-after.png?raw=true) |

## Suite (hors POC)

- La ligne du fichier et la provenance lien par lien ; un seuil de ratio en CI.
- La page « le domaine » et son schéma dessiné à la main : à marquer « lecture d'auteur ».
- Au PO : `taxonomie.yml` (qui range chaque brique) compte comme source, à confirmer.
