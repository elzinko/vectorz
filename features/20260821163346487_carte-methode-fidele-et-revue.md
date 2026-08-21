---
id: "20260821163346487"
title: Épic — La carte de la méthode : fidèle aux fichiers, et revue morceau par morceau
type: epic
priority: P1
product: mega-city
version:
epic: 
status: idea
ready:
pr:
created: 2026-08-21
---
# La carte de la méthode : fidèle, et revue morceau par morceau

## En clair

On a maintenant une carte de la méthode qu'on peut ouvrir (`pnpm ezk:map`). Le
problème, c'est qu'**on ne sait pas ce qui, dedans, vient vraiment des fichiers, et ce
qu'un LLM a déduit**. Tant qu'on ne le sait pas, la carte est jolie mais on ne peut pas
s'y fier — et une carte à laquelle on se fie à tort est **pire qu'une carte absente**.

Cet épic couvre : prouver la provenance de chaque élément, se donner un moyen de valider
la carte **par morceaux**, montrer visuellement ce qui a été revu, et pouvoir corriger un
lien faux sans repasser par un humain qui relit tout.

## Contexte / Problème

Le symptôme est daté et mesuré. Le 2026-08-20, la première version de cette carte
dessinait **une quarantaine de liens**. Le graphe réellement déclaré dans les fichiers en
comptait **7**. Le reste venait de la lecture de la prose par un LLM — c'est-à-dire d'une
opinion présentée comme un fait.

Depuis, les liens de composition sont devenus le **miroir vérifié** du graphe généré
(21 arêtes, contrôlées par comparaison automatique). Mais tout le reste de la carte —
les rôles, les regroupements, la colonne d'assemblage, les descriptions — reste
**non prouvé**. Personne ne sait, en la regardant, quelle partie est adossée à un fichier.

Retour PO du 2026-08-21, en ouvrant la carte : *« on mélange un peu tout ici et on ne
visualise pas vraiment les liens de composition ; des blocs mis les uns à côté des autres
avec des flèches n'est pas très parlant »*.

## Proposition

Un épic qui **grandit au fil de l'eau** : chaque passage sur la carte peut y ajouter une
fille. Quatre directions, une fille chacune :

1. **Provenance** — chaque élément affiché cite le fichier d'où il sort ; ce qui n'a pas
   de source est marqué comme tel, jamais présenté à égalité.
2. **Unités de revue** — décider *ce qu'on valide* (un lien ? une carte ? une bande ?) et
   dans quel ordre, pour que la revue soit finie un jour.
3. **État de revue visible** — une convention pour dire « en cours de revue » et
   « validé le … », lisible d'un coup d'œil.
4. **Correction** — pouvoir dire « ce lien est faux » et que ça se répercute dans les
   fichiers, pas seulement dans le dessin.

Plus une cinquième, plus lointaine : **la méthode s'auto-évalue** — elle mesure sa propre
cohérence et la fidélité de sa représentation.

## Critères d'acceptation

- [ ] En ouvrant la carte, on distingue **sans effort** ce qui est prouvé de ce qui est déduit.
- [ ] Il existe une **unité de revue** nommée, et un ordre de passage.
- [ ] L'état de revue d'un élément est **visible sur la carte** et **daté**.
- [ ] Un lien faux se corrige **par les fichiers**, et la carte suit sans intervention manuelle.
- [ ] Le retour PO du 2026-08-21 sur la ligne d'assemblage est traité.

## Comment vérifier

```bash
pnpm ezk:map
```

Puis, sur la carte ouverte : prendre trois éléments au hasard et retrouver leur source.
Si l'un des trois n'est pas traçable, l'épic n'est pas fini.

## Notes

- **Frère, pas doublon** de l'épic *Rationalisation & cohérence de la méthode*
  (`20260813131737959`) : celui-là porte sur **la méthode**, celui-ci sur **la fidélité
  de sa représentation**. Se lisent ensemble, ne se fusionnent pas.
- **Rattachée le 2026-08-21 (décision PO)** : la fiche `0068` (« la carte à jour à chaque
  modif de méthode ») — la **fraîcheur** est une facette de la fiabilité.
- **Pièce d'audit rattachée (2026-08-21)** : [l'audit complet de la méthode du
  2026-08-20](../docs/audits/2026-08-20-audit-methode-mega-city.html) — 29 décisions
  d'architecture passées au crible, 11 contradictions, sécurité, historique. Versionné
  dans le repo (l'artefact claude.ai reste la vue publiée privée). Lisible en local :
  `pnpm ezk:map` puis ouvrir `/docs/audits/2026-08-20-audit-methode-mega-city.html`.
- **MAJ 2026-08-21** : 2 filles ajoutées après la première lecture PO — `0068` (ci-dessus)
  et « la carte ne montre pas LA LOI de l'intérieur » (symptôme : le PO a cherché le
  concept de composition/règles activables sur la carte et ne l'a pas trouvé).
- Outil d'ouverture livré le 2026-08-21 : `pnpm ezk:map` (racine ou `products/mega-city`).
