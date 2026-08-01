---
id: 0177
title: Pack de pratiques projet — capacités portables indépendantes du skill/LLM driver
type: feature
priority: P2
product: mega-city
status: idea
ready:
pr:
created: 2026-08-01
---

# 0177 — Pack de pratiques projet (capacités portables)

## Contexte / Problème

Quand on applique une **méthode** sur un projet, l'utilisateur veut parfois que
**seulement certaines pratiques** s'appliquent — et ce, **indépendamment** de
quel LLM / skill / commande pilote le travail.

Aujourd'hui les pratiques vivent surtout dans le matériel *bindé* (profils
`.claude`, caps, rules lawgiver) ou dans les skills elles-mêmes. Dès qu'un autre
driver prend le volant (autre skill, autre harness, autre session), le contrat
de pratiques du *projet* n'est pas un premier citoyen portable : il n'y a pas
de **point d'ancrage projet** stable que tout LLM soit invité à lire.

## Proposition

Direction LLM-native (à raffiner au grooming) :

1. Chaque skill pertinente expose une commande / option pour **déployer dans le
   README du projet** un **lien indirect** (consigne courte) : « lis ce
   répertoire — il gouverne les pratiques de ce projet ».
2. Ce **répertoire déporté** (hors skill globale) contient :
   - un **front-matter** avec une **version** du contrat de capacités à
     intégrer systématiquement ;
   - une **liste de capacités / pratiques** (et artefacts associés) vivant
     dans ce répertoire.
3. Objectif : **binding de pratiques au niveau projet**, qui survit quel que
   soit le skill/commande/LLM qui conduit la session.

Complémentaire de **[0175 — Skema](0175-article-skema-skill-schema-migrations.md)**
(*Skill Schema Migrations*) : Skema = comment une *skill* migre **son propre**
layout ; cette fiche = comment un *projet* ancre un **jeu portable** de
pratiques/capacités pour **n'importe quel** driver. Ne pas fusionner les deux
scopes.

## Critères d'acceptation

- [ ] Le pattern est nommé (arbitrage PO parmi les propositions en Notes) et
      distinct de Skema.
- [ ] Mécanisme README → répertoire déporté décrit (emplacement, format FM
      versionné, liste des capacités).
- [ ] Frontière écrite vs `caps/` / `bind` / lawgiver / profils `.claude`
      (ce qui est réutilisé vs ce qui est nouveau).
- [ ] Lien explicite avec [0175](0175-article-skema-skill-schema-migrations.md)
      (complémentaire, pas doublon) — et éventuelle fiche voisine si grooming
      révèle un chevauchement.
- [ ] Au moins un scénario cobaye : « skill A puis skill B sur le même projet
      → mêmes pratiques projet lues ».

## Notes / décisions

- **P2, `idea`** — exploration de pattern / design ; pas encore DoR. Aligné
  sur 0175 (P2 idea) et les fiches « direction méthode » (0150, 0068).
- **Paire Skema (0175)** : 0175 vit pour l'instant sur
  `feat/0175-skema-layout-v2` (PR Skema) — path cible
  `features/0175-article-skema-skill-schema-migrations.md` une fois mergé.
  Id **0177** choisi pour ne pas collisionner avec 0175 ni avec le WIP 0176
  (interdit gitconfig) sur la même branche.
- **Anti-doublon** (par intention) — *pas* de doublon trouvé :
  - [0106](done/0106-lawgiver-bind-cap-claude-code.md) / [0115](done/0115-bind-merge-au-lieu-decraser.md) /
    [0122](done/0122-cap-global-home-claude.md) — *matérialisent* agents/skills/rules
    dans un harness ; ici = contrat de *pratiques projet* lisible par tout LLM.
  - [0150](0150-ezk-dev-methode-tdd-en-rules.md) — méthode TDD en *rule de profil*
    (composition mega-city), pas un pack projet déporté.
  - [0170](0170-modele-extension-plugin-mega-city.md) — modèle d'extension /
    plugin (ADR), pas le binding de pratiques.
  - [0173](done/0173-ezk-methode-trois-bandes-naming.md) — naming méthode /
    caps / archive ; orthogonal.
  - [0175](0175-article-skema-skill-schema-migrations.md) — migrations de
    *layout de skill* ; complémentaire (voir Proposition).
- **Noms de travail du pattern** (arbitrage PO) :
  1. **Praxis** — pack de pratiques projet (court, distinct de Skema).
  2. **Méthode portable** / *portable practice pack*.
  3. **Capacity bind** (projet) — risque de confusion avec lawgiver `bind`.
  4. **Canon projet** — le répertoire = source de vérité des pratiques.
  5. **Lex** (*project law set*) — voisin de lawgiver, à valider (faux ami ?).
- **Questions ouvertes** : emplacement du dir (`docs/praxis/`, `.methode/`,
  autre) ; relation exacte aux artefacts déjà produits par `bind` ; qui
  « déploie » le lien README (chaque skill ? un meta-skill ? cap dédié ?) ;
  versioning du contrat vs Skema `layout_version`.
