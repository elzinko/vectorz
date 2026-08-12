---
id: 0188
title: ADR lisibles comme des articles — format unique, article dérivé, ou règle ? (à groomer archi + brainstorm)
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-09
---

# 0188 — ADR lisibles comme des articles

## Contexte / Problème

Constat terrain (session gmail-cleanerz, 2026-08-09) : un ADR doit être
**compréhensible par n'importe quel développeur qui arrive sur le projet** —
concis, intéressant, et **aboutissant clairement à des choix** pour le projet.
Or la plupart des ADR sont écrits en style « registre de décision » sec, peu
engageant pour un lecteur neuf.

Intuition du PO : **tout ADR est potentiellement un bon article** (même effort de
clarté, même public « lecteur neuf »). D'où l'envie de faire d'une pierre deux
coups. Mais la bonne forme n'est pas tranchée — c'est **l'objet de cette fiche**,
à instruire, pas à décider ici.

## Question ouverte (à trancher au grooming)

Trois pistes, non exclusives :

- **A — Format unique** : tout ADR est **écrit en style article** (narratif,
  lisible, mène à la décision). Un seul document.
  - ➕ Rien à maintenir en double ; l'ADR *est* lisible.
  - ➖ Risque de diluer la fonction « registre » (statut, date, décideurs, options
    tranchées) sous la prose ; un ADR n'a pas de persona/audience comme un article.

- **B — ADR terse + article dérivé** : l'ADR reste un registre court ; les ADR
  « à forte valeur pédagogique » **débouchent sur un article séparé** via
  [`ezk-article`](../products/mega-city/skills/ezk-article/) (persona + panel).
  - ➕ Chaque artefact garde sa fonction ; l'article a son cadrage propre.
  - ➖ Deux docs à garder cohérents ; tous les ADR ne méritent pas un article.

- **C — Une règle, pas un format** : ajouter dans
  [`rules/documentation-guidelines/`](../products/mega-city/rules/documentation-guidelines/)
  une règle « ADR lisible » (lisible par un dev neuf, concis, intéressant, **conclut
  sur des choix**) — sans imposer le format article complet. Voisine de
  [`human-facing-lisibility.md`](../products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md).
  - ➕ Léger, exécutable, ne fige pas la forme.
  - ➖ Ne capture pas l'ambition « article » quand elle a du sens.

(Hybride plausible : **C** comme socle + **B** en option pour les ADR structurants.)

## À groomer (explicitement demandé par le PO)

Ne pas trancher en solo. Passer par :

1. `/product-brainstorming` — cadrer le **vrai besoin** (qui lit les ADR, quand,
   pour quoi ; où la prose aide vs nuit).
2. `/architecture` (sous-agent `ezk-architect`) — trancher la **structure** :
   un format vs deux artefacts vs règle, et l'impact sur le template d'ADR.

Sortie attendue du grooming : une **décision** (A / B / C / hybride) + la
Definition of Ready posée.

## Critères d'acceptation (préliminaires — à affiner au grooming)

- [ ] Décision A/B/C/hybride enregistrée (dans un ADR de la méthode — dogfood).
- [ ] Si règle → écrite dans `rules/documentation-guidelines/` (style `human-facing-lisibility`).
- [ ] Si article dérivé → chemin d'intégration avec `ezk-article` documenté.
- [ ] Le standard est **démontré sur un ADR réel** (candidat : l'ADR-0007 de gmail-cleanerz issu de la fiche 0009 — déploiement cloud).
- [ ] Le template d'ADR du repo est mis à jour en conséquence.

## Notes / décisions

- Déclencheur concret : besoin d'un **ADR-0007** lisible côté gmail-cleanerz
  (fiche 0009, déploiement cloud) — premier banc d'essai naturel du standard.
- Parenté : `rules/documentation-guidelines/human-facing-lisibility.md` (déjà la
  règle « tout artefact lu par un humain est lisible ») ; `ezk-article` (fabrique
  d'articles) ; `ezk-retro` (cérémonie qui grave une règle si on choisit C).
- Ne PAS confondre avec 0187 (article « LLM skills migration ») : 0187 est *un*
  article ; 0188 décide *si/comment* les ADR deviennent des articles.
