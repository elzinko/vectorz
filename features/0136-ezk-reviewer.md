---
id: 0136
title: ezk-reviewer — rôle Reviewer composant code-review + coordination reviewers externes (cumulables)
type: feature
priority: P2
product: mega-city
status: idea
pr:
created: 2026-07-12
---

## Contexte / Problème

Le rôle **Reviewer** de l'organigramme (cf. 0028) n'existe pas en propre — juste le skill
`code-review`. Or un **reviewer externe automatique** peut coexister (ex. Codex qui revoit
chaque PR). Aujourd'hui rien ne coordonne les deux → risque de **double-revue** ou de
revues qui s'ignorent.

## Proposition

Un `ezk-reviewer` (agent/skill) qui **compose** `code-review` avec des ajustements perso
(conventions repo). Principe posé au grooming : les reviewers sont **cumulables** (pas
incompatibles). Une **option projet** — fichier `.megacity` ? — déclare **comment** gérer
les cas :

- reviewer externe présent → **cumuler** / **compléter** (ne faire que ce que l'externe
  rate) / **attendre** sa revue puis réconcilier ;
- conventions repo-spécifiques à appliquer.

## Question ouverte (à groomer)
- Comment **détecter** la présence d'un reviewer externe (Codex…) ?
- **Schéma** du fichier `.megacity` (où vivent ces options projet).
- **Cumul vs complément vs attente** : quelle politique par défaut ?

## Critères d'acceptation
- [ ] Rôle Reviewer nommé (`ezk-reviewer`) qui compose `code-review` sans le réimplémenter.
- [ ] Comportement piloté par une **config projet** (`.megacity`).
- [ ] Pas de double-revue non voulue quand un reviewer externe est branché.

## Notes

Dépend de 0028. Le fichier `.megacity` est un candidat de config projet transverse
(pourrait aussi porter d'autres options mega-city). Issu du grooming session 2026-07-12.
