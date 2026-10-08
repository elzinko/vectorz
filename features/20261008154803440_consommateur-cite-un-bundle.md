---
id: "20261008154803440"
title: Un consommateur (agent/skill) peut citer un bundle, pas seulement des règles unitaires
type: feature
priority: P0
product: mega-city
milestone:
version: v0.8.0
labels: [loi]
status: ready
pr:
evidence: none
created: 2026-10-08
---

# 20261008154803440 — Un consommateur peut citer un bundle

**En clair.** Aujourd'hui un agent ou un skill liste les règles qu'il suit **une par une**
(`applies:` / `interactions:`). Il ne peut pas citer un **groupe nommé** de règles (un bundle).
On veut qu'un consommateur écrive `bundle:<id>` en plus de règles unitaires ; la liste est
dépliée **au bind**, **par référence** (pas de recopie du texte), et une référence pendante
devient **rouge en CI**. C'est la brique qui débloque la DoD/DoR comme contrat partagé (fiche F2).

**Si tu arrives frais.** Une *règle* vit dans `rules/<thème>/<slug>.md`. Un *bundle*
(`bundles/<id>.yml`) est un pack curé de règles. Un consommateur (agent, skill) déclare ce qu'il
suit via `applies:` / `interactions:` (verbe `applique` dans le graphe, ADR-0040). `bind`
matérialise tout ça dans un projet.

## Contexte / Problème

- `applies` (skill→règle) et `interactions` (agent→règle) n'acceptent que des **ids de règles**.
  `skill.applies` est câblé et déjà utilisé (ex. `ezk-backlog` cite
  `development/acceptance-criteria-before-merge`).
- `expand` ne déplie un bundle que pour les **profils** (`collectBundleRuleIds` appelé sur
  `p.bundles` seulement, `src/core/expand.ts`). Un id de bundle dans `applies` serait cherché
  comme une règle → introuvable.
- Résultat : pour faire suivre un **lot** de règles à un agent, on recopie chaque id à la main.
  La branche DoR en cours bute précisément là-dessus.

## Proposition

1. Ajouter **une seule arête typée** consommateur→bundle (verbe `applique`, `toKind: 'bundle'`)
   à `EDGE_SOURCES` (`src/core/graph.ts`). Précédent exact : l'ajout de `utilise`/`tool`
   (ADR-0058).
2. Réutiliser `collectBundleRuleIds` (déjà pur) pour résoudre un bundle cité par un consommateur.
3. Résoudre **au bind**, **par référence** : la liste des ids atterrit, le **texte** ne se
   duplique pas dans chaque `ENTRY.md` (budget tokens). Séparer « agrégation de profil » et
   « résolution de contrat ».
4. Trancher la redondance `applique`↔`enforces` : la **règle possède sa garantie**
   (`enforcements[].agent`), le **consommateur possède sa participation** (`applies`). Là où ça
   se recouvre, **un seul côté écrit, l'autre dérivé** ; interdire le double-write, le valider
   par `graph:check`.

## Critères d'acceptation

- [ ] Un `applies:` / `interactions:` accepte un id de **bundle** ; `expand` le déplie en ses
      règles (test).
- [ ] Un id de bundle **inconnu** cité par un consommateur → `graph:check` **rouge** (pas
      d'ignore silencieux).
- [ ] Le bind n'**injecte pas** le texte des règles d'un bundle de contrat dans chaque
      `ENTRY.md` (référence, pas recopie).
- [ ] Le test `graph-vocabulary` est mis à jour **délibérément** (une arête de plus, vocabulaire
      fermé).
- [ ] Pas de double-write `applique` / `enforces` : le recouvrement est dérivé, non re-listé à la
      main.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city graph:check
```

## Glossaire

- `bundle` — un pack curé de règles (`bundles/<id>.yml`), par opposition au thème (le dossier).
- `EDGE_SOURCES` — la table du vocabulaire fermé des liens du graphe (`src/core/graph.ts`).
- `applique` / `enforces` — consommateur→règle (participation) vs règle→agent (garantie, dérivée
  de `enforcements[].agent`).

## Notes / décisions

- **Amende ADR-0040** (nouvelle arête dans le vocabulaire fermé). Avis `ezk-architect` :
  GO-avec-réserves (exactement cette arête ; résolution par référence, pas par recopie ; trancher
  la redondance). Avis `ezk-pm` : **P0, à faire en premier** — prérequis de F2.
- Brique habilitante de **F2 — DoD/DoR, listes de règles/bundles (contrat partagé)**
  (20261008154804532_dod-dor-contrat-partage.md) et de **F3 — vue de projection**
  (20261008154805639_vue-projection-regles-par-agent.md).
