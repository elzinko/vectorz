---
id: 0190
title: composes — tier « delegates: » (composition optionnelle, jamais warnée)
type: feature
priority: P2
product: mega-city
labels: [enabler]
status: todo
ready:
pr:
created: 2026-08-10
---

## Contexte / Problème

La fiche [[0149]] a rendu la composition inter-skills mécanique : `composes:` (requis) déclenche
un warning au bind si un composant est absent. Mais `composes:` n'a **qu'un tier** : tout est
traité comme **requis**. Or beaucoup de collaborateurs sont **délégués-si-présent** — ezk-sprint
délègue à ezk-codex (handling Codex, étape 10), ezk-preview, et aux agents de rôle
(architect/qa/tdd/reviewer), et **dégrade** explicitement si absent (« Si un sous-agent n'est pas
installé, porte la casquette toi-même »). Les lister en `composes:` requis produit un **faux
warning** sur les profils qui les omettent légitimement (ex. `daily`).

Constaté à la revue Codex de la PR #121 (fiche 0149) : Codex a **oscillé** — round 3 « retire
ezk-preview » (optionnel), round 4 « ajoute ezk-codex » (même cas) — faute d'un tier optionnel.
Panel archi+dev+PM (2026-08-10) : décliner, `composes:` reste requis-seulement, et créer ce tier.

## Proposition

- Nouveau champ frontmatter **`delegates:`** (nom qui dit la relation ; proposé par l'architecte) —
  déclaré, tracé dans le graphe, mais **jamais warné** si absent. Frère de `composes:` (requis) et
  distinct de `composes-external:` (hors-catalogue).
- Le checker `checkComposition` ne warne **que** les `composes:` requis ; il **ignore** les
  `delegates:` côté warning (mais peut les inclure côté graphe).
- Le graphe Mermaid (`composes:graph`) : arête **pointillée** (« délégué-si-présent ») pour les
  `delegates:`, pleine pour les `composes:`.
- Migrer vers `delegates:` : ezk-sprint → ezk-codex, ezk-preview ; et les agents de rôle si pertinent.

## Critères d'acceptation

- [ ] un skill avec `delegates: [X]`, X absent du profil bindé → **AUCUN warning** (ni bind global ni par-projet)
- [ ] un skill avec `composes: [Y]`, Y absent → warning toujours émis (comportement 0149 inchangé)
- [ ] le graphe distingue visuellement `composes:` (plein) et `delegates:` (pointillé), régénéré par script et à jour
- [ ] ezk-sprint déclare ezk-codex + ezk-preview en `delegates:` → plus de faux warning au bind de `daily`

## Notes

- Suite directe de [[0149]] (shippée #121). Réversibilité : le tier réintègre ezk-preview + ezk-codex
  sans toucher au checker « requis ».
- Décision panel journalisée (SPRINT.md 2026-08-10) : option A + follow-up P2. Voir aussi [ADR-036](../docs/adr/ADR-036-transport-emission-separable-du-runtime.md) (couture, non lié mais même session de grooming).
