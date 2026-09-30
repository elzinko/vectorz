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

La carte dessine déjà ses liens depuis les fichiers du dépôt. Mais elle ne le **montre** pas :
on ne voit ni de quel fichier vient un élément, ni quelle part de la carte est prouvée.
Cette fiche ajoute trois choses. Un lien « Source » cliquable dans chaque dossier. Un ratio
« prouvé / déduit » en haut de la carte. Un pointillé sur tout ce qu'aucun fichier ne déclare.

## Contexte / Problème

Mesure du 2026-08-20 : la carte dessinait ~40 liens, le graphe déclaré en comptait 7. Les 33
autres étaient de l'interprétation, dont un lien franchement faux. Une carte crédible mais
en partie inventée oriente les décisions dans le vide.

Depuis, les liens et les briques sont compilés depuis le catalogue (PR #234, puis #265 pour
les quatre verbes de lien et les références par id). Le risque a changé de place : ce qui
reste écrit à la main dans la page (le cycle en 5 temps) s'affiche à égalité avec le prouvé.

## Déjà livré

- [x] Les liens de composition viennent du graphe compilé, un test refuse la divergence
      (`map-data-graph-parity.test.ts`, PR #234 et #265).
- [x] Les références de `ceremonies.yml` et `taxonomie.yml` sont vérifiées contre le catalogue à
      la régénération (`validateMethod`, `validateTaxonomie`).

## Critères d'acceptation (le reste réel, POC)

- [ ] Le dossier de chaque brique (commande, juge, règle, bundle, profil) et de chaque
      cérémonie affiche « Source : *chemin du fichier* » en lien cliquable.
- [ ] Chaque source pointe vers un fichier qui existe : la régénération échoue sinon, et un
      test le prouve sur le catalogue réel.
- [ ] Le ratio « prouvé / déduit » est affiché en haut de la carte, avec sa définition au survol.
- [ ] Ce qu'aucun fichier ne déclare (puces du cycle sans appui, acteurs humains) est en
      pointillé, étiqueté « lecture d'auteur ».
- [ ] Sabotage : une puce du cycle qui cite un id inconnu fait échouer la régénération ; une
      puce connue mais sans appui ressort en pointillé, jamais en silence.

## Comment vérifier

```bash
pnpm ezk:map                                              # menu des cartes → « La méthode »
pnpm --dir products/mega-city test -- map-provenance      # sabotage automatisé
```

1. Barre du haut : le ratio « prouvé » s'affiche ; le survol donne la définition.
2. Cliquer trois cartes au hasard : chaque dossier porte « Source : … », le lien ouvre le fichier.
3. Cycle en 5 temps : les puces en pointillé sont les lectures d'auteur.

- vue carte-haut : /diagrams/methode-mega-city/carte-interactive.html
- vue dossier-skill : idem, après un clic sur la carte « ezk-sprint »

## Suite (hors POC)

- La ligne du fichier (pas seulement le fichier) et la provenance lien par lien.
- Sourcer ou retirer les éléments encore déduits ; un seuil de ratio en CI.
- Marquer en « lecture d'auteur » la page « le domaine » et son schéma dessiné à la main.
- Décision du PO sur « rangé par `taxonomie.yml` » : fichier-source ou lecture d'auteur ?
