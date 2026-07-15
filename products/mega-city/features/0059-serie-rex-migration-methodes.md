---
id: 0059
title: série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité
type: feature
priority: P2
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Analyser la **migration de méthodes de dev existantes** vers le contrat de supervisabilité
est un cadre éditorial riche : ce qui fonctionne, ce qui casse, les limites du contrat — et
l'anticipation des problèmes *avant* qu'un adopteur externe ne les découvre. Personne
d'autre ne peut écrire « on a rendu une méthode open-source connue supervisable, voici les
~85 lignes réelles, voici où le contrat a craqué ». La lignée existe déjà : l'article
« contrat de supervisabilité » (cop1 0025, PR cop1#57) — celui-là même qui a fondé
`ezk-article` (0049).

L'utilisateur avance lui-même sur la **normalisation** (le contrat) ; cette fiche capture le
volet **documentation/REX des migrations**, en série.

## Proposition (à cadrer)

Une **série** d'articles, un par méthode migrée :

- **Article #1 : la migration BMAD** (fiche 0058) — le journal de migration tenu pendant
  l'expérience en est le squelette. Angle candidat : l'échelle adaptateur→overlay→fork et
  ce que chaque cran révèle du contrat.
- **Rédaction via `ezk-article` (0049)** : brief de persona demandé, panel de relecteurs
  frais, lentille « fidélité aux sources » obligatoire (un REX qui déforme ne vaut rien).
- **Boucle de retour** : chaque friction racontée dans un article est aussi un finding v0.2
  (cop1 0029) — l'article n'est pas que de la comm, c'est l'anticipation des problèmes.

À groomer avant de tirer : l'angle éditorial de la série (technique ? récit d'expérience ?),
l'audience (devs outillant des agents ? adopteurs potentiels du contrat ?), le canal de
publication.

## Critères d'acceptation (esquisse)

- [ ] Cadre de série défini (angle, audience, canal) — via grooming
- [ ] Article #1 (migration BMAD) écrit après la clôture de 0058, via ezk-article (0049)
- [ ] Chaque limite/friction publiée est tracée vers un finding v0.2 (pas d'affirmation sans source)
- [ ] La série est ouverte : une méthode migrée = un article candidat

## Notes

- Décision de regroupement (2026-07-15) : fiche **séparée** de 0058 (choix utilisateur) —
  0058 produit la matière (journal de migration), 0058 porte le cadre éditorial.
- Liens : 0058 (1ʳᵉ migration), 0049 (ezk-article, l'outil), cop1 0025 (article fondateur),
  cop1 0029 (différés v0.2).
