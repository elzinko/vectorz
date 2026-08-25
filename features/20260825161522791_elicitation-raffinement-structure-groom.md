---
id: "20260825161522791"
title: "Elicitation — boucle de raffinement structurée dans groom (à la BMAD advanced-elicitation)"
type: feature
priority: P2
product: mega-city
labels: [bmad, elicitation]
epic:
status: idea
ready:
pr:
created: 2026-08-25
---

# 20260825161522791 — Elicitation structurée dans `groom`

**En clair.** Quand on affine une fiche (`groom`), ezk part en **brainstorm libre**. BMAD, lui, a une
**boucle outillée** : après chaque bout écrit, l'agent propose des façons concrètes de l'améliorer, tu
en choisis une, il l'applique, il te remontre le résultat, puis il re-propose — jusqu'à ce que tu sortes.
C'est le mécanisme que le benchmark a désigné comme **le vrai trésor de BMAD**. L'idée : transposer cette
boucle au `groom` d'ezk, pour un raffinement guidé et répétable au lieu d'une discussion à main levée.

**Si tu arrives frais.** *elicitation* = « faire émerger » ; ici, une boucle « propose → tu choisis →
applique → re-propose » pour muscler un document. *groom* = l'étape ezk qui fait mûrir une fiche vers la
Definition of Ready (problème / valeur / critères).

## Contexte / Problème

Le benchmark BMAD vs ezk (2026-08-25, voir le rapport lié) a comparé les deux mécanismes de raffinement :

- **BMAD** : `advanced-elicitation` — **50 méthodes** cataloguées (`methods.csv`), l'agent en **choisit 5**
  selon le contenu, en applique une, montre la version améliorée, demande validation, puis **re-propose**
  la même liste (menu 1-5 + reshuffle / all / proceed). Offert automatiquement après chaque section écrite.
- **ezk** : `groom` délègue à `product-management:product-brainstorming` — un échange **libre**, sans menu
  numéroté, sans boucle répétable, sans catalogue de techniques. Efficace mais non structuré, non reproductible.

Le trou : ezk n'a **aucune boucle d'elicitation** — le seul affichage d'options structuré est une table
à 2 lignes pour un seul gate d'alerte de sprint. C'est un manque de **qualité de raffinement**, pas de découvrabilité.

## Proposition

**MVP resserré** (garde-fou ADR-0013 — pas de moteur générique) :

1. Un **petit catalogue** de techniques de raffinement adaptées aux fiches ezk (ex. « retourne la prémisse »,
   « critères testables ? », « quelle dépendance externe non constatée ? », « un tiers reformule le besoin ? »).
   Pas 50 — commencer avec ~6-8 pertinentes pour la DoR.
2. Dans `groom`, après une passe, **proposer 3-4 techniques** (menu court), en appliquer une, **remontrer**
   la section améliorée, demander validation, **re-proposer** — jusqu'à sortie explicite.
3. Rester **composable** : le catalogue est une donnée (liste), la boucle une convention de `groom` ; le
   panel de challenge existant (fiche [[0161]]) peut être une technique parmi d'autres.

Frontière (ADR-0001) : le LLM rédige/juge dans la boucle ; aucun script load-bearing. C'est une **convention
de raffinement**, pas un nouvel outil.

## Critères d'acceptation

- [ ] `groom <id>` propose un **menu court** de techniques de raffinement (pas un brainstorm ouvert par défaut)
- [ ] la boucle **applique → remontre → re-propose** jusqu'à sortie explicite de l'opérateur
- [ ] un **petit catalogue** de techniques (donnée éditable) existe, orienté DoR (problème / valeur / critères / dépendances)
- [ ] respecte le cœur déterministe (ADR-0001) : aucune décision de rangement dans un prompt
- [ ] une note relie le mécanisme au prior-art BMAD (`advanced-elicitation`, `methods.csv`) — via le rapport de benchmark

## Comment vérifier

<à groomer> Ex. : lancer `/ezk-backlog groom <id>` et constater un menu de raffinement + une boucle
itérative, au lieu d'un unique échange libre. Sabotage : sortir au 1er tour ne doit pas forcer de passe.

## Glossaire

- `elicitation` — boucle de raffinement guidée : l'agent propose des améliorations, tu choisis, il applique, il re-propose.
- `advanced-elicitation` (BMAD) — l'implémentation BMAD : 50 méthodes, 5 proposées à la fois, boucle jusqu'à « proceed ».

## Notes / décisions

- **Source** : benchmark BMAD vs ezk du 2026-08-25 — voir
  [le rapport](../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md) (Dim 2). Désigné comme la reco n°2.
- **Voisines** : [[20260817113353538]] (étude prior-art templates + elicitation — dont ce build est la suite
  actionnable), [[20260825160456259]] (affordance next-step, reco n°1), [[0161]] (panel de challenge, technique candidate).
- **P2 = proposition** ; à confirmer/ajuster au grooming (choix du catalogue, où brancher exactement dans `groom`).
- `status: idea` : direction issue du benchmark, à groomer avant build (choix de portée MVP).
