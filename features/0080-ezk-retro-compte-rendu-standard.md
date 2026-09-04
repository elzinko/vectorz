---
id: 0080
title: ezk-retro — compte rendu standard de cérémonie (capture versionnée ET extractible, décisions PO tracées, via PR)
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-07-18
---

# 0080 — ezk-retro consigne ses cérémonies

## En clair

Aujourd'hui, quand `ezk-retro` tient une rétro, **le débat s'évapore**. Le skill range
bien les *règles* décidées, mais pas le *compte-rendu* : qui a proposé quoi, ce qui a été
écarté, ce que tu as tranché. 0080 fait qu'**chaque rétro laisse un document**, rangé dans
`docs/captures/`. Et — nouveauté du grooming — ce document doit être **à double usage** :
lisible par toi, **et** lisible par un script, pour que la vue rétros [[20260826072532537]]
puisse en extraire la liste d'actions sans deviner.

> **Groomé le 2026-08-26.** Ajout clé : l'**extractibilité** (un en-tête structuré), pour
> que 0080 serve de source propre à la vue rétros. Statut laissé `todo` — le gate `ready`
> promeut, pas le grooming.

## Contexte / Problème

La première rétro réelle (2026-07-18) a montré que `ezk-retro` déroule bien sa cérémonie
(lentilles → convergence → juge → PO) mais **ne prévoit aucune trace versionnée du débat** :
le compte rendu a été rédigé à la main, après coup, sur demande du PO. Sans ce geste
manuel, les débats, les retraits d'auteurs et les verdicts du juge se seraient évaporés.

**Constat d'audit (2026-08-26)** : le skill range déjà les *règles* (temps 5, format
`rules/`) et les non-règles (via `ezk-backlog add`). Mais il **ne consigne pas** le
compte-rendu de la cérémonie elle-même. Le trou est réel et précis.

**Second constat** (grooming de la vue rétros) : `docs/captures/` ne contient
**qu'une seule** vraie capture de rétro (`2026-07-18-retro-cinq-sprints.md`). Les rétros
suivantes sont noyées en prose dans les comptes-rendus de session. Sans 0080, la vue rétros
n'aura **presque rien** à afficher — 0080 est son prérequis bloquant.

## Valeur

Chaque rétro laisse un **document relisible des mois plus tard** : qui a proposé quoi, ce
qui a été écarté et pourquoi, ce que le PO a décidé — la matière pour **mesurer ensuite si
les règles adoptées servent** (et les retirer sinon). En prime, ce document devient la
**source structurée** de la vue rétros — une seule normalisation sert les deux besoins.

## Proposition

Étendre le SKILL.md d'`ezk-retro` (temps 5, rangement) : la cérémonie **produit
systématiquement** une capture `docs/captures/AAAA-MM-JJ-retro-<slug>.md`, à **double
couche** :

1. **Le récit lisible** (le corps), avec les sections éprouvées le 2026-07-18 : faits de
   départ · propositions par lentille (tour 1) · débats et retraits (tour 2) · verdicts du
   juge · propositions finales en langage courant · **décisions du PO (tableau)** ·
   glossaire. Rédigé en **voix lisible PO** (compose [[0079]] — la voix).
2. **L'en-tête extractible** (nouveauté) : un **frontmatter structuré** portant la méta de
   la rétro (date · thème · périmètre) et la **liste des actions** — une entrée par
   décision : `proposition · décision/atterrissage · statut ✅|❌|⏳ · date`. C'est ce que la
   **vue rétros** lit, sans parser la prose.

Livrée **via PR** avec le rangement des règles adoptées (une PR par rétro). Modèle de
référence : `docs/captures/2026-07-18-retro-cinq-sprints.md` (la première, à faire évoluer
vers le format cible — son tableau `| Proposition | Décision | Date |` est déjà la bonne
matière).

## Périmètre

**Cœur (valeur propre, même sans la vue)** : la capture systématique lisible + son tableau
« Décisions du PO ».

**Ajout (pour servir la vue rétros)** : le frontmatter structuré des actions. Coût marginal
faible s'il est écrit **en même temps** que le récit — et il évite une double-normalisation
plus tard.

## Décision laissée à l'étape Archi (avec recommandation)

- **Forme de l'extractible** : **frontmatter structuré (recommandé)** — cohérent avec la
  doctrine repo « frontmatter = source de vérité » et avec le format visé pour les
  comptes-rendus de sprint (`ezk-archive`). Alternative écartée : parser le tableau markdown
  en prose (fragile).

## Dépendances

- **Interne** : le skill `ezk-retro` (à étendre), la convention `docs/captures/` (existante),
  le modèle `2026-07-18-retro-cinq-sprints.md`. **Pas** de dépendance externe (hors monorepo,
  service, secret) — slot DoR conditionnel non requis.
- **Prérequis de** : la vue rétros [[20260826072532537]] (elle lit ce format).
- **Compose** : [[0079]] (la voix lisible), [[0167]] (la cérémonie qui produit les actions).
  Voisine : [[0081]] (carnet de préparation de rétro).
- **Symétrie** : même patron « source normée + extractible » que le format de compte-rendu
  de sprint visé côté `ezk-archive` (fiche [[20260826072532452]]).

## Critères d'acceptation

- [ ] Le SKILL.md d'`ezk-retro` **exige** la capture en fin de cérémonie (temps 5), sections
      listées.
- [ ] La rétro suivante produit sa capture **sans demande du PO** (preuve : le fichier existe
      dans la PR de rangement).
- [ ] La capture porte un **frontmatter structuré** : méta (date · thème · périmètre) + la
      **liste des actions** (proposition · décision/atterrissage · statut ✅|❌|⏳ · date).
- [ ] Le tableau « Décisions du PO » (corps) reflète les décisions **réelles** — jamais
      pré-rempli (garde-fou : l'erreur commise puis corrigée le 2026-07-18).
- [ ] La capture est **liée depuis la PR** de rangement (traçabilité règle ↔ débat).
- [ ] Le modèle `2026-07-18-retro-cinq-sprints.md` est **mis au format cible** (sert
      d'exemple vérifiable du frontmatter).

## Comment vérifier

Tenir (ou rejouer) une cérémonie `ezk-retro run` → une capture apparaît dans `docs/captures/`
avec **son frontmatter structuré** (actions extractibles) **et** son récit lisible ; le
frontmatter se parse sans ambiguïté (c'est ce que consommera `pnpm ezk:map retros`).

## Notes

- **Priorité P2** (portée depuis 2026-07-18). Elle est le **prérequis bloquant** de la vue
  rétros (P2) — à **séquencer avant elle**. Si tu veux la tirer en premier, une montée en
  **P1** se justifierait (décision PO, non faite ici).
- Origine : rétro 2026-07-18, demande directe du PO. L'ajout « extractible » vient du
  grooming des sous-pages `ezk:map` du 2026-08-26.
