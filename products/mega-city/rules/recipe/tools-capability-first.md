---
id: recipe/tools-capability-first
kind: disposition
level: SHOULD
title: Ustensiles capacité-d'abord (MCP local préféré, script sinon)
enforcements:
  - type: agent-check
    agent: ezk-chef
---

La section **« Ustensiles »** d'une recette nomme une **capacité** (un verbe : « poser un
enregistrement DNS », « déposer un binaire »), puis l'outil qui la réalise, dans cet ordre de
préférence ([ADR-0067](../../docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md)) :

1. **Un MCP qui existe déjà**, de préférence **local et installable** (Claude Desktop/Code) —
   on dit lequel et quels verbes ;
2. **sinon un CLI / une API REST / un script** local — « pour le moment » est assumé ;
3. **si l'outil manque**, la recette le **note comme outil à créer**.

Un outil qui est un **connecteur cloud à OAuth de session** (se re-autorise à chaque session,
inutilisable hors session) est **signalé** comme confort non portable, pas comme base. Un MCP
par **token** (pas d'OAuth interactif), comme `dns-ionos-mcp`, est un cas **sain** : c'est même
l'outil préféré.

Relève du jugement d'`ezk-chef` : une recette qui cite un outil sans nommer la capacité, ou qui
dépend d'un connecteur OAuth de session sans le signaler, reste indexée et utilisable — moins
mûre, signalée, pas bloquée.

Origine : [ADR-0067](../../docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md)
(ratifié PO 2026-10-07), fiche d'application `20261007213357925`.
