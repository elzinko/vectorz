---
id: 0103
title: "Les méthodes envoient un heartbeat — le Moniteur ne crie plus « silence » à tort"
type: feature
priority: P1
epic:
depends: []
labels: [method, supervision, ux]
status: todo
ready:
pr:
created: 2026-07-29
product: mega-city
---

# 0103 — Heartbeat des méthodes (signe de vie pendant un run)

## En une phrase

Quand Claude Code travaille longtemps **sans jalon** (gate), le Moniteur doit encore
voir que le run est vivant — aujourd’hui une seule ligne `run.started` puis plus rien
fait basculer « Silence prolongé » dès qu’on met la session en pause.

## Contexte / Problème

Dogfood 2026-07-29 (vectorz) :

1. Claude Code a appelé **une seule fois** `mcp__supervision__run_start` (`ezk-sprint`).
2. Le journal `.supervision/runs/…/events.jsonl` ne contient que cet événement.
3. Ensuite : `/ezk-archive check`, standby, etc. → **aucune** nouvelle ligne journal.
4. Le Moniteur (comportement prévu, ADR-028) passe en `presumed_dead` / « Silence
   prolongé » après un seuil de silence **en état `running`**.

Ce n’est pas un bug du Moniteur : il n’a rien reçu. C’est un trou d’**émission** côté
méthode. Le contrat v0.1 prévoit déjà `heartbeat {note?}` (docs/articles,
docs/brancher-une-methode-existante.md) ; `ezk-sprint` ne l’émet **pas** (SKILL.md :
seulement start / gates / escalate / finished).

Effet produit : l’humain croit que « le Moniteur n’est pas synchro avec Claude Code »,
alors qu’il ne voit que les **jalons contractuels**, pas chaque outil Bash/Read.

## Proposition

1. **Ajouter** l’outil MCP `heartbeat` — aujourd’hui le serveur n’expose que 5 outils
   (`run_start`, `gate_reached`, `gate_resumed`, `escalate`, `run_finished`) alors que
   le contrat v0.1 documente déjà `heartbeat`. Brancher `runtime` + journal + tests.
2. Dans `ezk-sprint` (et éventuellement `ezk-product-builder`) : émettre un heartbeat
   périodique **best-effort** pendant le travail long (ex. après chaque étape 1–8, ou
   toutes les N minutes / N outils), avec une `note` courte optionnelle.
3. Moniteur : garder la règle actuelle (silence → presumed_dead en `running`) — le
   heartbeat **réarme** le timer via `lastAbsorbedAt`. En `at_gate`, pas de heartbeat
   obligatoire (le silence y est voulu).
4. Doc Moniteur / DOGFOOD : une phrase « tu ne vois pas chaque action Claude, seulement
   start / heartbeat / gates / fin ».

Hors scope : tracer chaque outil Claude Code dans le journal (ce serait une autre
classe d’observabilité, trop bruyante pour le contrat B).

## Critères d'acceptation

- [ ] Pendant un `ezk-sprint` réel > seuil de silence, le journal contient ≥1
      `heartbeat` **ou** un `gate.reached` avant expiration du timer Moniteur.
- [ ] Standby Claude **sans** heartbeat → toujours « Silence prolongé » (comportement
      voulu, documenté).
- [ ] Standby Claude **avec** heartbeats récents → reste « En cours » / alive.
- [ ] `at_gate` : silence prolongé ne passe **pas** presumed_dead (déjà vrai — ne pas
      régresser).
- [ ] Phrase UX dans le Moniteur ou la doc dogfood : ce que signifie chaque badge.

## Notes / décisions

- Preuve session : transcript CC
  `~/.claude/projects/…/2809b04c-….jsonl` → 1× `mcp__supervision__run_start` seulement.
- Journal : `.supervision/runs/2026-07-29T12-48-47-648Z-2a4f2f22/events.jsonl` (1 ligne).
- Lié : ADR-028 (lecteur), ADR-032 (émission), fiche 2094/0094 (émetteur CC).
- Distinct de **0104** (kit d’analyse post-mortem) et de **2103** (harness E2E-LLM).
