---
id: 0077
title: Kit émetteur — hooks Claude Code classe A (émission déterministe)
type: feature
priority: P1
epic:
status: todo
ready:
pr:
created: 2026-07-18
---

## Contexte / Problème

Suite de la fiche 0050 (kit émetteur de supervisabilité, 1ʳᵉ PR livrée en classe B :
lib append + serveur MCP 5 outils + consignes de skill). En classe B, l'émission repose
sur la discipline du LLM — il peut « oublier » d'émettre. La proposition d'origine
(fiche 0050, point 3) prévoyait des **hooks Claude Code en renfort** (~20 l.) pour une
émission **déterministe** (classe de conformité A) : le hook émet, le LLM ne peut pas
l'omettre. Sortie de la 1ʳᵉ PR par décision journalisée du 2026-07-14 (« hors 1ʳᵉ PR »).

## Proposition

- Hooks Claude Code (config `settings.json` du projet supervisé) qui émettent les
  événements du contrat v0.1 aux moments mécaniques (fin de tour au gate, reprise).
- Réutilise la lib `src/supervision/journal.ts` (aucune logique dupliquée) ;
  matérialisation vers les projets via cap/bind comme le reste du kit.
- Documenter la complémentarité classe A (hooks) / classe B (MCP + consignes) dans
  `src/supervision/README.md`.

## Critères d'acceptation

- [ ] Un hook émet sans intervention du LLM (démonstration sur un événement au choix).
- [ ] Zéro duplication de la logique d'enveloppe (la lib reste l'unique émetteur).
- [ ] README du kit : classes A/B expliquées avec quand choisir quoi.

## Notes

- Priorité **héritée de la fiche mère 0050 (P1)** — à re-prioriser au prochain review si
  la classe B suffit en pratique.
- Réfs : fiche 0050 (Notes 2026-07-14 et 2026-07-17), capture cop1
  `docs/captures/2026-07-13-contrat-methode-et-versions.md` §7 (classes de conformité).
