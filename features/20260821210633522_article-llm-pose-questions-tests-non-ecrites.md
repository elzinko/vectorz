---
id: "20260821210633522"
title: "Article — les tests vérifient des réponses déjà posées, le LLM pose les questions"
type: feature
priority: P2
product: mega-city
epic:
labels: [article, supervision, dogfood]
status: idea
ready:
pr:
created: 2026-08-21
---

# Article — le LLM pose les questions que les tests n'avaient pas écrites

## En clair

Article technique vulgarisé, **scindé de [[0169]]** le 2026-08-21. L'histoire est déjà écrite par les
faits : *une suite de tests verte, un produit inutilisable, et trois défauts trouvés en une session par
un agent qui se contentait d'utiliser l'application.*

## Angle

**Les tests vérifient des réponses à des questions déjà posées ; le LLM pose les questions que personne
n'avait écrites.** Une fixture contient ce que son auteur a imaginé — personne n'écrit la fixture « run
laissé ouvert parce que la session est morte ». C'est pour ça que 0105 et 0168 ont échappé à toute la
suite existante.

Avec la nuance honnête qui évite l'article de hype : non-déterminisme, absence de localisation, l'agent
juge et partie, et **la règle de conversion en test déterministe** sans laquelle rien ne tient
économiquement.

## Matériau disponible

- Fiches [[0105]] (Moniteur « silence » à tort) et [[0168]] (run orphelin = verrou sans clé).
- Journal `2026-07-30T13-20-55-013Z-615bcd81` et son rapport `analyze`.
- L'oracle [[0169]] (`analyze --expect`) comme illustration de la conversion défaut → test déterministe.

## Critères d'acceptation (à groomer)

- [ ] Article écrit via `ezk-article` (persona + panel de relecteurs frais).
- [ ] L'angle « le LLM pose les questions » est porté par les 3 cas réels, pas par de l'abstraction.
- [ ] Les 4 nuances honnêtes (non-déterminisme, localisation, juge-et-partie, conversion en test) sont
      présentes — pas d'article de hype.

## Notes

- `idea` : capturé pour ne rien perdre au scindage de 0169 ; à groomer si/quand on le tire.
- Convention du repo : les articles sont des fiches séparées ([[0069]], [[0043]], [[0049]]).
