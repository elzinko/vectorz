---
id: 0075
title: Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

## Contexte / Problème

Compagnon de [`0049 ezk-article`](0049-ezk-article-vulgarisation-panel-relecture.md).
À l'usage (session samplerz 2026-07-16, écriture de l'article de positionnement), le
besoin a émergé : on démarre sur une **persona de base** fournie, puis on veut
**y ajouter progressivement sa touche d'originalité** — des spécificités à la
persona OU au format attendu — sans tout réécrire ni perdre la cohérence.

Aujourd'hui la persona est un brief jetable, re-tapé à chaque article. Ce qui
manque : un **corpus de règles DURABLE, lisible à la fois par l'humain et par le
LLM**, et un **agent qui le fait évoluer avec moi**.

## Proposition (à groomer)

Un agent (ou une capacité d'`ezk-article`) qui :

- détient un jeu de **règles de persona/format** versionné et lisible (voix,
  niveau, audience, tics à éviter, structure attendue, exemples/anti-exemples) ;
- **comprend une demande d'évolution** en langage naturel (« rends la voix plus
  malicieuse », « ajoute une règle sur les gloses de références ») et met à jour
  les règles **de façon cohérente**, dans le sens voulu ;
- ne modifie pas en aveugle : il **propose des extraits ciblés** — un NOUVEL
  extrait de règle, ou le REMPLACEMENT d'un extrait existant — que l'humain
  **valide** (diff lisible) avant application ;
- garde les règles **réutilisables** d'un article à l'autre (la persona de base +
  les surcouches d'originalité accumulées).

## Deux niveaux de customisation (retour user 2026-07-16)

Les règles doivent se customiser à **deux portées**, avec héritage :

1. **Global** — un jeu de règles **partagé par TOUS les projets** qui utilisent le
   skill/agent (la persona de base + les conventions durables). Home probable :
   à côté du skill dans mega-city (ou un dossier de config utilisateur global).
2. **Par projet** — un **override/extension local** quand un projet a besoin de sa
   propre voix, audience ou format, **sans** toucher au global. Répertoire à
   **définir** au grooming (piste : `.articles/` à la racine du projet, ou
   `docs/articles/.rules`, ou un champ dédié). Le local **surcharge/complète** le
   global (règles de fusion à trancher : override total vs merge additif ?).

L'agent de curation opère sur la bonne portée selon la demande (« pour ce projet »
vs « partout »), et le diff proposé indique clairement **quelle portée** il modifie.

## Notes

- Distinct d'`ezk-article` (0049) qui ORCHESTRE l'écriture + le panel ; ici on
  gère la MATIÈRE (les règles de persona/format) et son évolution assistée.
- **À groomer avec un architecte** (frontière : nouvelle capacité d'`ezk-article`
  vs skill/agent séparé ? format des règles ? mécanisme de proposition-validation
  d'extraits ?) et un product-brainstormer (cadrer le vrai besoin).
- Origine : session samplerz 2026-07-16, retour user pendant le party mode article.
