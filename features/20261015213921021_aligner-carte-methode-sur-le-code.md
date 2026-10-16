---
id: "20261015213921021"
title: "Aligner la carte de la méthode sur le code (épic retiré, statut todo, DoD livrée, moments orphelin)"
type: chore
priority: P2
product: mega-city
milestone: rationalisation
version:
labels: [methode, carte, dette]
status: idea
pr:
evidence: none # alignement de données/doc de méthode, pas d'écran
created: 2026-10-15
---

# 20261015213921021 — Aligner la carte de la méthode sur le code

**En clair.** La méthode se décrit elle-même dans des fichiers de données (la carte des cérémonies,
le diagramme vivant) et dans la prose des skills. Plusieurs de ces descriptions ont pris du retard sur
le code et **mentent** aujourd'hui : l'« épic » a été retiré du modèle mais le tirage le route encore,
la DoD est livrée mais la carte la dit « chantier », le statut `todo` a disparu mais le diagramme
l'affiche, et `moments.yml` désigne un client (`ezk-forge`) qui n'existe pas. On remet ces surfaces
d'accord avec le code.

**Si tu arrives frais.** La *carte des cérémonies* (`products/mega-city/method/ceremonies.yml`) est
l'auto-évaluation scrum de la méthode, validée en CI. Le *diagramme vivant*
(`products/mega-city/docs/method-map.md`) est le schéma du flux de travail. L'*épic* était un ancien
type de fiche, retiré du schéma le 2026-09-15 (amendement A16, ADR-0017).

## Contexte / Problème

Relevé par l'audit adverse du découpage de la méthode (2026-10-15, lentilles scrum master + architecte).
Quatre dérives, toutes du même genre : une copie de modèle qui n'a pas suivi le code.

- **Épic mort, encore routé.** `type: epic` est retiré de l'enum (`src/core/fiche-schema.ts`, grep
  vide), mais le point d'entrée du tirage décrit toujours « une fiche `type: epic` n'est jamais
  tirable, descends sur son enfant ready » (`skills/ezk-backlog/SKILL.md:432-433`, `:112` ;
  `skills/ezk-sprint/SKILL.md:251`). La skill se contredit : sa liste de types (`ezk-backlog:170`) n'a
  plus d'épic. Le `aggregate --scope epic:` (`ezk-backlog:524`) est orphelin lui aussi.
- **DoD périmée dans la carte.** `method/ceremonies.yml:137-146` présente la DoD comme « deux sens
  mélangés, non résolu », alors qu'ADR-0071 l'a tranchée et livrée en `bundles/dod.yml`.
- **Statut `todo` fantôme.** `docs/method-map.md:24` montre `idea → todo → in-progress → shipped` ;
  `todo` a été retiré (migration Skema) et `in-progress` est calculé, non écrit (ADR-0077).
- **`moments.yml` orphelin.** Son validateur ne contrôle que la forme ; `clients: [ezk-forge]`
  (`moments.yml:55`) pointe un skill qui n'existe pas, et rien ne le signale.
- **Liens d'ADR périmés.** Ex. `products/mega-city/docs/adr/0077-…:7` pointe
  `0055-board-fonction-pure-des-fichiers.md`, alors que le vrai 0055 est
  `0055-artefacts-generes-hors-versionnage.md`. `ezk docs check-links` sur le dossier ADR de la méthode
  le signale (constaté 2026-10-16).

Pourquoi ça compte : la carte est le référentiel que l'auto-amélioration est censée pouvoir auditer.
Une carte qui ment oriente mal la prochaine itération.

## Proposition

Un balayage « la carte dit la vérité du code », sans nouveau mécanisme (POC = alignement) :

- Purger les références à l'épic mort dans les skills et la carte (remplacer la navigation épic par
  `labels: theme:` + `milestone:`, le modèle réellement en vigueur).
- Re-dater l'élément `dod` de `ceremonies.yml` (livré, ADR-0071).
- Corriger le lifecycle dans `method-map.md` (retirer `todo`, montrer `in-progress` comme calculé).
- Décider le sort de `moments.yml` orphelin : brancher son client, ou retirer le client fantôme.

Hors périmètre : la parade de **fond** à la dérive (un graphe compilé qui porte la dimension process,
dont ces fichiers ne seraient plus que des projections) est une autre fiche — voir le brainstorm DSL.
Ici, c'est du nettoyage immédiat, indépendant de ce moteur.

## Critères d'acceptation

- [ ] Aucune référence à `type: epic` ni au champ `epic:` ne subsiste dans les skills ni la carte.
- [ ] `ceremonies.yml` décrit la DoD comme livrée (`bundles/dod.yml`), plus comme un chantier.
- [ ] `method-map.md` montre le lifecycle réel (`idea → ready → [in-progress calculé] → shipped`).
- [ ] `moments.yml` n'a plus de client inexistant (ou le client existe).

## Comment vérifier

```bash
cd products/mega-city
rg -n "type:\s*epic|epic:" skills/ method/ docs/method-map.md   # attendu : vide
rg -n "todo" docs/method-map.md                                  # attendu : plus de statut todo
pnpm test:scripts                                                # si un test fige la carte
```

## Notes / décisions

- Provenance : rapport d'audit du découpage de la méthode, 2026-10-15 (famille « dette de modèle
  recopié qui dérive »).
- Nettoyage à valeur immédiate et indépendant : il rend la carte de nouveau fiable, ce dont dépend
  tout le reste de l'audit. Lié au brainstorm DSL (surface CLI) et au futur moteur de process (la
  vraie parade de fond), mais ne les attend pas.
- **Donnée d'audit versée (rétro v0.17, 2026-10-16).** Deuxième instance de la même dérive, au
  niveau des fiches produit cette fois : les fiches sœurs 242 et 451 (config des modèles cop1),
  issues d'un même design, ont employé la clé `modeles:` avec **deux sens différents** (tier-par-rôle
  d'un côté, tier→modèle de l'autre). La revue l'a rattrapé en cours de build, pas au grooming. Le
  schéma de config vivait dans la **prose des deux fiches**, sans source unique, donc il a divergé —
  exactement l'argument pour la parade de fond (un graphe compilé qui porte le schéma, dont les
  fiches ne seraient que des projections). Versé ici plutôt qu'érigé en règle (cas unique, déjà
  attrapé par la revue). Provenance :
  [rétro v0.17](../docs/captures/2026-10-16-retro-v017-board-unifie-light.md).
