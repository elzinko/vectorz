---
id: 0170
title: Concevoir le modèle d'extension / plugin mega-city (panel architecte) — avant tout adaptateur outillage
type: feature
product: mega-city
priority: P1
epic:
depends: []
status: idea
ready:
pr:
created: 2026-07-30
---

# 0170 — Modèle d'extension mega-city (ADR préalable)

## Contexte / Problème

On veut brancher des capacités **optionnelles** (ex. projection GitHub Issues, sync
outillage externe) **sans coupler le core** ezk-backlog / mega-city à GitHub, Jira, etc.
Aujourd'hui il n'existe pas de **contrat d'extension** explicite : ni « où s'injecte un
adaptateur », ni « ce qui reste agnostique », ni la frontière avec le **packaging**
(fiche [0087](0087-plugin-claude-code-distribution.md) —
distribuer le catalogue en plugin Claude Code).

Sans ADR, on risque soit un BacklogStore hexagonal prématuré
([0093](0093-backlogstore-port-agnostique.md) — **YAGNI**,
panel 2026-07-25), soit des hooks collés au hasard dans les skills.

## Proposition

**Panel `ezk-architect` (+ juge)** avant tout code. Produire un ADR qui tranche le modèle
d'extension **le plus adapté à mega-city**, en s'inspirant (sans copier) de :

1. **BMAD v6 — prises natives / overlay** — `_bmad/_config/agents/*.customize.yaml`
   (memories, critical_actions, menu…) ; modules installables ; échelle
   adaptateur → overlay → fork jetable (cf. fiche
   [0162](0162-bmad-contrat-supervisabilite.md)).
2. **Plugin Claude Code officiel GitHub** — référence concrète de packaging / slots :
   - marketplace : [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)
   - plugin `github` : `.claude-plugin/plugin.json` + `.mcp.json` (MCP server, pas backlog)
   - cache local typique : `~/.claude/plugins/cache/claude-plugins-official/github/`
   - **Faux ami** déjà noté en 0087 : `hooks/hooks.json` d'un plugin = événements
     **harness** (SessionStart…), **pas** hooks git.

Questions à trancher dans l'ADR (non exhaustif) :

- Qu'est-ce qu'un « plugin » mega-city : skill conditionnelle ? cap `bind` ? module config
  projet ? hook SessionStart déterministe ?
- Sens de sync autorisé (local→externe only vs bidirectionnel) pour les adaptateurs backlog
- Activation : config projet (`features/.backlog.yaml` ou équivalent) vs toujours-on
- Frontière nette avec **0087** (distribution de la *méthode*) vs **adaptateurs outillage**
  (ex. Issues) vs **0093** (store interchangeable — hors scope jusqu'au trigger)

## Critères d'acceptation

- [ ] Panel architecte tenu ; ADR commité (décision + alternatives rejetées + triggers)
- [ ] L'ADR cite explicitement BMAD (customize/overlay) **et** le plugin officiel GitHub
      comme références, avec ce qui est repris / écarté pour mega-city
- [ ] Frontière 0087 / adaptateur outillage / 0093 écrite en une page max
- [ ] Aucune implémentation d'adaptateur GitHub **avant** cet ADR (dépendance bloquante
      pour 0171)
- [ ] Gate locale verte si l'ADR touche des scripts/tests ; sinon revue doc seule

## Notes / décisions

- `product: mega-city` — liste unique livrée ([0064](done/0064-liste-unique-features-champ-product.md) / #66) ;
  champ supporté par template + `regen-backlog.sh` + skill ezk-backlog.
- Ids **0170+** (post-0064 ; max main était 0167).
- BMAD supervisabilité : fiche renumérotée **0162** (ex-0058).
- Statut `idea` : grooming + panel avant `ready`.
- Doublon possible avec la PR ouverte [#71](https://github.com/elzinko/vectorz/pull/71) — à rebaser / alléger une fois ce commit sur main.
