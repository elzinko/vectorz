---
id: "20261007213357925"
title: "Outils d'une recette : capacité d'abord, MCP local préféré, script sinon (ADR-0067)"
type: chore
priority: P3
product: mega-city
status: idea
labels: [recette, methode]
pr:
evidence: none # convention de gabarit + règle, pas d'écran
created: 2026-10-07
---

# 20261007213357925 — Outils d'une recette : capacité d'abord, MCP local préféré, script sinon

**En clair.** La section « Ustensiles » d'une recette doit nommer une **capacité**, puis dire avec quoi la faire : un MCP local s'il existe, un script sinon, et signaler les outils à OAuth de session qui vieillissent mal. [ADR-0067](../products/mega-city/docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md) tranche ; cette fiche en applique les quatre gestes.

**Si tu arrives frais.** Une *recette* vectorz est une procédure transférable (on l'adapte projet par projet). Ses *ustensiles* sont les outils qui exécutent. Un *MCP* est un outil branché à l'agent ; un *MCP local* s'installe une fois dans Claude Desktop/Code, sans ré-autorisation par session.

## Contexte / Problème

Le gabarit disait « Ustensiles (outils — CLI d'abord) », ce qui se lit « CLI seul » et laisse `dns-ionos-mcp` (outil = MCP) en exception muette. Le PO préfère un MCP local quand il existe, un script sinon. ADR-0067 pose la doctrine ; il reste à l'inscrire dans le gabarit et dans une règle jugée par `ezk-chef`.

## Proposition

Appliquer les quatre action items d'ADR-0067, sans moteur : une convention de gabarit et une règle SHOULD.

## Critères d'acceptation

- [ ] `recipes/RECIPE_TEMPLATE.md` : la section « Ustensiles » dit « capacité d'abord ; MCP local préféré, script sinon ; signaler un connecteur OAuth de session ».
- [ ] `rules/recipe/tools-capability-first.md` existe (SHOULD, `enforcements: agent-check / ezk-chef`) et est citée par le gardien.
- [ ] `recipes/lancement-app` est réécrite en capacité-d'abord et reste plus claire (témoin).
- [ ] `recipes/dns-ionos-mcp` note qu'elle est MCP-par-token (pas d'OAuth interactif) : cas sain.
- [ ] `ezk-chef check` passe GO sur les recettes touchées.

## Comment vérifier

```bash
# La règle est bien dans le bundle et citée par le gardien
ls products/mega-city/rules/recipe/tools-capability-first.md
# Le gardien juge les recettes touchées
# (via la skill : /ezk-chef check recipes/lancement-app.md)
```

## Notes / décisions

- Décision : [ADR-0067](../products/mega-city/docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md), ratifié PO 2026-10-07.
- Différé (hors de cette fiche) : Direction B (MCP comme nœud du graphe, extension d'ADR-0058) et le transport MCP de la méthode (mode dynamique d'ADR-0005).
