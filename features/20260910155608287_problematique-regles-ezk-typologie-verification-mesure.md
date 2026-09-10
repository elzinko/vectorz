---
id: "20260910155608287"
title: Problématique des règles ezk — typologie, régimes de vérification, mesure, scoping (CADRAGE avant solution)
type: epic # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: vectorz # obligatoire dans ce monorepo — vectorz | mega-city | …
epic:
status: idea # idea | ready | in-progress | blocked | shipped
ready:
pr:
evidence: none # cadrage méthode, pas d'écran
created: 2026-09-10
---

# 20260910155608287 — Problématique des règles ezk (cadrage)

## En clair

On a commencé à concevoir un mécanisme de règles projet-local (ADR-0050) — mais en le
faisant, on a réalisé que **le problème est plus large qu'un seul mécanisme**. Cette fiche
**cadre toutes les problématiques des règles ezk AVANT de figer une solution**, pour les
traiter délibérément avec la méthode/l'équipe ezk (retro/brainstorm), au lieu de solutionner
au fil de l'eau. **⚠️ NE PAS OUBLIER DE DÉVELOPPER LE MÉCANISME** : tant qu'il n'existe pas,
des leçons réelles restent en pis-aller (voir « État / pending » en bas).

## Le constat qui a ouvert le sujet

Deux natures de règle ont **des régimes de vérification différents** — les confondre mène à
un mécanisme qui ment sur sa garantie :

- **Règle de CODAGE (conformité)** — contrainte sur **l'artefact produit** (archi hexagonale,
  clean code, « pas d'import `adapters/` dans `domain/` »). Vérifiée **a posteriori, par PR** :
  « le code produit respecte-t-il le principe ? ». La règle **est** le but → on vérifie la
  **conformité**, pas l'efficacité. Sous-types : machine-vérifiable (lint/gate déterministe)
  vs jugement (revue LLM/humaine sur la PR — ex. « est-ce VRAIMENT hexagonal ? »).
- **Règle de RÉTRO (efficacité)** — contrainte sur le **process**, née d'un **symptôme**.
  Vérifiée **dans la durée, sur les sprints, par du monitoring** (installé ou à développer) :
  « la friction visée a-t-elle baissé ? ». La règle **sert** un but → on mesure son **EFFET**,
  et c'est ça qui la rend retirable. ⇒ C'est le **Sujet B / améliorabilité mesurée (ADR-030)**.

Différences : **quoi** (artefact vs process) · **quand** (par-PR vs sur-sprints) · **comment**
(conformité vs monitoring du symptôme) · **pourquoi** (le but vs sert-le-but).

## Les problématiques à résoudre (le cœur de cette fiche)

1. **Typologie** — combien de natures de règle, exactement ? (codage-conformité machine,
   codage-conformité jugement, rétro-efficacité, guidage génératif advisory…) Une taxonomie nette.
2. **Régime de vérification par nature** — a posteriori par-PR (conformité) vs monitoring
   sur-sprints (efficacité). Qui vérifie, quand, avec quelle donnée ?
3. **La mesure d'efficacité (règles de rétro)** — quel monitoring ? existant ou à développer ?
   comment attribuer un effet à une règle (causalité) sans A/B ingérable sur un seul projet ?
   Lien direct avec **ADR-030 (contrat d'améliorabilité)**.
4. **La vérification de conformité a posteriori (règles de codage-jugement)** — « la PR
   respecte-t-elle l'archi hexagonale ? » n'est pas un lint : c'est un verdict de revue. Comment
   le rendre systématique et traçable ?
5. **Un mécanisme ou plusieurs ?** — est-ce que codage-conformité et rétro-efficacité passent
   par le MÊME dispositif (front-matter + composition) ou par deux dispositifs distincts ?
6. **Scoping projet-local** — comment une règle s'applique à un projet et pas aux autres
   (contrôle visuel, bundles réutilisables). **← ADR-0050 est UN candidat de réponse à CE
   sous-problème seulement**, pas au reste.

## Ce qui est déjà défriché (à ne pas refaire)

- **Sous-problème 6 (scoping/composition + honnêteté de garantie)** : candidat conçu et passé
  au panel adverse → **[ADR-0050](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md)**
  + fiche fille [`20260910152227744`](20260910152227744_regles-projet-local-couche-vectorz.md).
  Verdict panel : GO-SI (séparer « chargée » de « appliquée », méta-gate anti-`MUST`-sans-gate,
  couplage inversé). **Reste ouvert** : les problématiques 1–5, surtout la **mesure d'efficacité**.

## État / pending — NE RIEN OUBLIER

- ⚠️ **Le mécanisme n'existe pas encore.** Des leçons de la rétro samplerz (2026-09-06) sont
  capturées **en mémoires samplerz** en attendant, en **pis-aller advisory** — **à MIGRER vers
  ce mécanisme** une fois livré (« bloqué se prouve », proportionnalité P3, réflexe zsh). Ne pas
  oublier de : (a) développer le mécanisme, (b) migrer ces leçons quand il existe.
- Test imposé (PO) : toute solution se valide **dans le cadre de vectorz utilisé par un AUTRE
  projet** (samplerz = banc d'essai), sur la couche déterministe — cf. la fiche fille.

## Prochaine étape suggérée

Une cérémonie ezk (brainstorm / retro dédiée) **dans le repo vectorz** sur les problématiques
1–5, avant d'accepter ADR-0050 et d'écrire les fiches filles de solution.
