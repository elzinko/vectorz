---
id: "20260813131737971"
title: Carte des rôles d'analyse — documenter retro / steward / 0057 (+ trancher le juge unique) en un seul endroit
type: feature
priority: P2
product: mega-city
version:
epic: "20260813131737959"
status: idea
ready:
pr:
created: 2026-08-13
---

# Carte des rôles d'analyse de la méthode

## En clair

Aujourd'hui, comprendre **qui analyse la méthode** oblige à recouper une skill (`ezk-retro`), un
agent (`ezk-steward`) et une fiche parkée (0057) — et `ezk-retro` cite **deux noms** pour son juge
(`chief-judge` et `ezk-steward`). C'est précisément la confusion qui a déclenché la demande PO du
2026-08-13 (« une skill d'analyse ferait-elle doublon ? »). On la lève en posant la carte à un
seul endroit.

## Contexte / Problème (findings audit 2026-08-13)

- 🟡 **Triangle éclaté** : `ezk-retro` (symptôme, Sujet A), `ezk-steward` (librairie), fiche
  [0057](0057-agent-analyse-methode.md) (KPI, Sujet B) sont **3 rôles disjoints** — mais nulle part
  décrits ensemble, d'où le soupçon de doublon (qui est infondé, cf. épic parent).
- 🟡 **Juge à deux noms** : `skills/ezk-retro/SKILL.md:81,124` traitent « fiche 0008 chief-judge »
  et l'agent `ezk-steward` comme interchangeables pour le juge de cohérence. Or [0113](0113-chief-judge.md)
  (`chief-judge`) est un juge dédié **non construit** (absent de `agents/`) et `ezk-steward` audite
  la **librairie**, pas la rétro. « Qui juge ? » est ambigu.
- 🟡 `ezk-retro/SKILL.md:14,60,127` — `ezk-reviewer` est listé comme agent de cérémonie **et**
  déclaré « ne le référence pas tant qu'il n'est pas bindé » (l'agent existe pourtant). Incohérence interne.

## Proposition

1. **Une page + un diagramme** (via `ezk-diagram`, dans `diagrams/`) qui posent les 3 rôles :
   *retro = déclenché par un symptôme humain · steward = conformité de la librairie · 0057 = déclenché
   par des chiffres, alimente retro*. Réutilisable comme réponse canonique à « ça fait doublon ? ».
2. **Trancher le juge unique** : garder `ezk-steward` comme juge de cohérence de la rétro et
   réduire `chief-judge` (0113) à un alias/fiche, **ou** construire `chief-judge` — mais un seul
   porte le rôle. Corriger les réf périmées (0008 → 0113).
3. Aligner la description de `ezk-retro` sur les agents **réellement bindés** (retirer/confirmer `ezk-reviewer`).

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] La carte des 3 rôles existe en **un seul endroit** (doc + diagramme), liée depuis `ezk-retro`
      et l'agent `ezk-steward`.
- [ ] Un **seul** juge de cohérence nommé ; 0 réf « 0008 » périmée.
- [ ] La description de `ezk-retro` reflète les agents réellement bindés.

## Notes

- Rattache [0113](0113-chief-judge.md) (le juge) et référence [0057](0057-agent-analyse-methode.md) (le nord KPI).
- C'est la fille qui **répond directement** à la question d'origine de l'épic (pas de nouvelle skill,
  juste rendre la couture explicite).
