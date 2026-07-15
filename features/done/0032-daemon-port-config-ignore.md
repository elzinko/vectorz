---
id: 0032
title: cop1 start ignore daemon.port de cop1.config.yaml (seul --port compte)
type: bug
priority: P1
status: shipped
pr: "#15"
created: 2026-07-15
---

# 0032 — `cop1 start` ignore `daemon.port` de la config

## Contexte / Problème

Découvert au replay de la checklist démo (étape 0 de la fiche 0030, PR #3) : le champ
`daemon.port` existe dans `cop1.config.example.yaml` et dans `ConfigSchema`, mais
`cop1 start` ne le lit pas — le port vient uniquement de l'option `--port` (défaut 4242).
Une config qui déclare un port a donc raison de croire qu'il sera utilisé, et il ne l'est
pas : incohérence config déclarée vs comportement, piégeuse en démo (documentée en
contournement dans `docs/demo-desktop-checklist.md` §4).

## Proposition

`cop1 start` résout le port avec la priorité : `--port` explicite > `daemon.port` de
`cop1.config.yaml` (lu depuis le cwd, comme le reste) > défaut 4242. Documenter la
priorité dans le help de la commande.

## Critères d'acceptation

- [x] `cop1.config.yaml` avec `daemon.port: 5555`, `cop1 start` sans `--port` ⇒ le daemon
      écoute 5555 (health check vert sur 5555).
- [x] `--port 6666` prime sur la config.
- [x] Sans config ni option : défaut 4242 inchangé.
- [x] L'encadré « piège » correspondant de `docs/demo-desktop-checklist.md` est mis à jour
      (le contournement devient la règle documentée).

## Notes / décisions

- Origine : replay d'intégration étape 0 (2026-07-15), sprint fiche 0030. Priorité P2
  fixée par le PO au checkpoint du 2026-07-15.

**2026-07-15** : promue P2 → P1 (panel de merge PR #10) — lot L1 de 0034, chemin critique de la démo 0030 (P1) : les fixes de fiabilité passent avant de rejouer la démo.
