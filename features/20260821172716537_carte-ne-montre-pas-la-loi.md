---
id: "20260821172716537"
title: La carte ne montre pas LA LOI de l'intérieur (règles, bundles, profils — et qui les lit)
type: feature
priority: P1
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---

# La carte cache la moitié la plus prouvable de la méthode

## En clair

Le 2026-08-21, le PO a cherché sur la carte un concept pourtant déjà décidé et rangé
dans les fichiers — « des règles activables, composées par le projet » — et ne l'a
**pas trouvé** : « je ne retrouve pas le concept dans la map et ça m'embête ».
Il a raison : la carte affiche LA LOI comme **un seul bloc opaque**, alors que tout
son intérieur est dans des fichiers lisibles.

## Contexte / Problème

Ce que la carte ne montre pas aujourd'hui :

- les **10 domaines de règles** (`rules/` : clean-code, testing, development…) ;
- les **12 bundles** (`bundles/*.yml` : des groupes de règles nommés) ;
- les **6 profils** (`profiles/*.yml` : qui active quoi, projet par projet) ;
- les liens **agents → règles** (champ `interactions:`, déjà déclaré sur 2 agents) ;
- (à venir) les liens **skills → règles** — voir la fiche « recette site produit ».

L'ironie : c'est la partie la **plus sourçable** de toute la carte. Ces fichiers sont
du YAML et du frontmatter purs — zéro interprétation nécessaire, contrairement aux
liens de prose qui ont causé le problème fondateur de l'épic.

## Proposition

À groomer. Direction :

1. **Ouvrir le bloc LA LOI** : afficher domaines de règles, bundles et profils comme
   des nœuds, **tirés des fichiers** (`bundles/*.yml`, `profiles/*.yml`) — jamais
   recopiés à la main.
2. **Afficher les liens déjà déclarés** : `interactions:` des agents (2 arêtes réelles).
3. **Préparer l'arête skills → règles** : dépend de la fiche recette (champ à trancher).
4. Chaque nœud de cette zone porte sa **provenance fichier** — cette zone peut être la
   première 100 % prouvée de la carte, et servir d'étalon aux autres.

## Critères d'acceptation

- [ ] Chercher « composition » ou « règles » sur la carte aboutit — le concept se voit.
- [ ] Bundles et profils affichés sont **générés** depuis les yml (sabotage : ajouter un
      bundle → il apparaît sans édition de la carte).
- [ ] Les arêtes agents→règles déclarées sont visibles et sourcées.
- [ ] Un lecteur peut répondre « qui active quoi ? » pour un profil donné, sans ouvrir un yml.

## Comment vérifier

```bash
pnpm ezk:map
```

Avant : chercher « bundle » ou « profil » sur la carte → introuvable (c'est le manque).
Après construction : le sabotage du critère 2, en moins d'une minute.

## Notes

- Symptôme fondateur : la question « recette site produit » du 2026-08-21 — le concept
  existait, la carte ne le montrait pas.
- Épic parent : fidélité de la carte (`20260821163346487`).
