---
id: "20260826112620281"
title: Schéma markdown déclaratif + validateur mécanique — format de fiche/recette vérifiable et versionnable
type: feature
priority: P3
product: mega-city
version:
epic:
depends: []
labels: [format, validation, methode, outillage]
status: idea
ready:
pr:
created: 2026-08-26
---

## En clair

Tu veux **améliorer le format d'une recette au fil du temps sans rien casser**. Pour ça il
faut un **point de vérité** : un schéma qui dit « une recette bien formée a tel front-matter
et telles rubriques », versionné comme le reste du dépôt.

Aujourd'hui ce contrôle existe **à moitié** : le gardien `ezk-chef` juge à l'œil, un script
vérifie la **présence** des champs. Personne ne **déclare** un schéma que la machine peut
vérifier seule. Cette fiche propose ce chaînon manquant : un **schéma markdown déclaré** + un
**validateur mécanique**, réutilisable **au-delà des recettes** (fiches backlog, ADR).

> Née `idea` (digression PO) — on la groome si on la tire.

## Pourquoi

- Le format **doit évoluer par itérations**. Sans schéma déclaré, chaque évolution se
  re-vérifie à la main ou au jugement du LLM — coûteux et non reproductible.
- Un schéma **versionné** donne un **diff lisible** quand le format change, et une **gate
  déterministe** (ADR-0001 : le LLM ne range/valide jamais ce qu'un script peut trancher).
- Le besoin **dépasse la recette** : fiches backlog, ADR, handoffs ont tous un front-matter
  + un corps attendu. Un seul mécanisme les couvre tous.

## Piste (à groomer)

- **Un schéma déclaré** : JSON/YAML Schema pour le front-matter ; règles simples pour le
  corps (titres attendus, ordre, présence d'une section « En clair »).
- **Un validateur CLI** : `validate <fichier> --schema <famille>` → rapport pass/fail par
  champ et par rubrique.
- **Versionner le schéma par famille** (`recipe`, `feature`, `adr`) : un champ `schema:` ou
  une convention de dossier.
- **Se brancher sur les gardiens existants** : `ezk-chef` (recettes), `ezk-steward` (skills),
  la gate backlog. Le gardien garde le **jugement** ; le validateur prend le **mécanique**.

## Frontière (anti-doublon)

- **Distinct de** la rule `recipe/valid-frontmatter` du chapeau
  [`20260824185422122`](done/20260824185422122_recette-artefact-premier-rang-et-gardien.md) :
  celle-ci vérifie **une** recette, jugée par le gardien. Ici = le **mécanisme générique**
  (schéma déclaré + validateur), transverse aux familles.
- **⚠ Recouvre** le **sliver « validateur de conformité »** que
  [`0186`](0186-skema-versioning-migrations-skills-deployees.md) demande explicitement de
  **scinder en fiche dédiée**, et la validation de statut de
  [`20260823121712652`](20260823121712652_modele-statut-kanban-schema-valide.md). Cette fiche
  est probablement **ce** sliver — à **fusionner / positionner** au cadrage de la fondation
  « formats + moteur ezk » : **cadrée par la fiche-chapeau
  [`20260826122532943`](20260826122532943_fondation-modele-fichiers-ezk-avant-recettes.md)**
  et l'[ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md)
  (D2), qui prévoit de l'**absorber** (note du 2026-08-26).
- **Voisin de** [`20260825182327490`](20260825182327490_pattern-livrable-lisible-template-extracteur-rendu.md)
  « livrable lisible » (template + extracteur scripté) : même famille d'outillage « format
  vérifiable », angle complémentaire — là **produire/rendre**, ici **valider**.
- **Compose** ADR-0001 (frontière déterministe : le script tranche, pas le LLM).

## Origine

Digression PO de la session **2026-08-26**, en cadrant le format des recettes (cas
R2 / Vercel / domaines). Notée comme idée à instruire, **pas urgente** (P3).
