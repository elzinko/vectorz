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

Aujourd'hui, en regardant la carte, **rien ne dit si un élément vient d'un fichier ou de
la déduction d'un LLM**. C'est le piège central : une carte crédible mais partiellement
inventée oriente les décisions dans le vide.

## Contexte / Problème

Mesure du 2026-08-20 : la carte dessinait ~40 liens, le graphe déclaré en comptait 7.
Les 33 autres étaient de l'interprétation — dont un lien franchement **faux** (un
orchestrateur présenté comme appelant un outil que son propre playbook dit ne jamais
appeler).

Depuis, les liens de composition sont adossés au graphe généré et un contrôle refuse
qu'ils divergent. **Mais c'est la seule partie prouvée.** Les rôles, les regroupements en
bandes, les descriptions, la colonne d'assemblage : tout cela reste de la rédaction.

## Proposition

À groomer. L'idée directrice : **la carte n'affiche rien qu'elle ne puisse sourcer**.

- Chaque nœud et chaque lien porte sa **provenance** (fichier, et si possible la ligne).
- Ce qui n'a **pas** de source est marqué explicitement — grisé, pointillé, ou rangé dans
  une zone « lecture d'auteur », mais **jamais présenté à égalité** avec du prouvé.
- Idéalement, la provenance est **cliquable** : on ouvre le fichier qui justifie.
- Corollaire : les parties non sourçables sont soit à sourcer (annoter le fichier), soit à
  retirer de la carte.

## Critères d'acceptation

- [ ] Chaque élément affiché est soit **sourcé**, soit **visiblement marqué comme déduit**.
- [ ] La proportion prouvé / déduit est **affichée** : on sait à quel point on peut se fier.
- [ ] Un élément sourcé pointe vers un fichier qui existe (contrôle mécanique).
- [ ] Ajouter un élément non sourcé à la carte **échoue** ou l'affiche comme déduit — jamais
      en silence.

## Comment vérifier

Prendre trois éléments au hasard sur la carte ouverte et remonter à leur source.
Et saboter : ajouter un lien inventé, vérifier qu'il ressort comme déduit, pas comme fait.


## 🔄 Rescope — 2026-09-30 (audit de rationalisation du backlog)

> **Fiche EVOLVE** : partiellement livrée ou cadrage périmé — à rescoper au reliquat réel avant de la tirer.
>
> **Constat de l'audit** : Liens inventés résolus par graphe compilé ; reste UI provenance cliquable + ratio prouvé/déduit.
>
> **Action** : au moment de groomer, réécrire l'« En clair » et les critères sur ce qui RESTE ;
> ne pas reconstruire ce qui est déjà livré. Note issue de la passe du 2026-09-30 (PR #263).
