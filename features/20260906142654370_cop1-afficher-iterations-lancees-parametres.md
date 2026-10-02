---
id: "20260906142654370"
title: cop1 — afficher les itérations lancées (ezk-product-build) avec leurs paramètres retenus
type: feature
priority: P2
product: cop1
version:
epic:
status: idea
pr:
created: 2026-09-06
---

# 20260906142654370 — cop1 affiche les itérations lancées + leurs paramètres

## En clair

Quand un run `ezk-product-build` tourne (surtout la nuit, en `auto`/`yolo`), on ne voit pas
facilement **ce qui a été lancé ni avec quels réglages**. cop1 (le plan de contrôle /
Moniteur) devrait **afficher la liste des itérations lancées** — quelle commande, quels
paramètres retenus (`--mode`, `--check-ready`, `--delivery`, `--max-sprints`, `--tokens`) —
pour qu'au retour on sache d'un coup d'œil ce qui a tourné et comment.

## Contexte / Problème

Demande PO (2026-09-06). Aujourd'hui, un run autonome se pilote et se journalise
(`SPRINT.md`, émission de supervisabilité), mais **cop1 n'expose pas une vue « itérations
lancées »** lisible : le PO absent ne voit pas, à son retour, la **liste des runs** et
**les paramètres effectivement retenus** pour chacun.

C'est un besoin de **visibilité**, distinct de la vivacité live (heartbeat/gates) : ici on
veut l'**inventaire des lancements** et leur **configuration**, consultable après coup.

## Proposition (compose, ne réimplémente rien)

- **Source** : l'émission de supervisabilité existante. À l'ouverture d'un run,
  `ezk-product-build` émet déjà `run_start {method_name, method_version, seat}` — **enrichir
  l'enveloppe (ou un event dédié) avec les paramètres retenus** (`--mode`, `--check-ready`,
  `--delivery`, `--max-sprints`, `--tokens`).
- **Affichage** : cop1 / le Moniteur liste les runs (méthode, date, seat, **paramètres**,
  statut : en cours / terminé / abandonné) et pointe vers leur trace (`SPRINT.md` /
  `REVIEW.md` du run).
- **Frontière** : cop1 reste **aveugle au métier** (ADR-0011/ADR-022) — il **affiche** ce que
  la méthode émet, il ne décide rien.

## Critères d'acceptation (à groomer avant `ready`)

- [ ] `run_start` (ou un event dédié) **transporte les paramètres retenus** du run.
- [ ] cop1 / le Moniteur affiche une **liste des itérations** avec, par run : méthode +
      version, date, seat, **paramètres**, statut, lien vers la trace.
- [ ] Fonctionne pour un run **nocturne** (`auto`/`yolo`) consulté **au retour** du PO.
- [ ] Aucune logique de méthode dans cop1 (il lit/affiche, il ne décide pas).

## Provenance

Session vectorz 2026-09-06 (discussion ADR-0050 + permissions). Voisin du besoin
**« consulter les rapports à la fin »** de l'option `--retro` proposée dans la session
`google-mcp-multi-account` (à capturer aussi au backlog vectorz — même famille : rendre
visibles, au retour, les décisions/rapports d'un run autonome). Compose : l'émission de
supervisabilité (`products/mega-city/src/supervision/`), le Moniteur, ADR-0011 (cop1 = plan
de contrôle aveugle au métier).

**Dédoublonnage (2026-09-06)** — pas un doublon, mais **voisines** à ne pas re-créer :
[0030](done/0030-mvp-demo-desktop.md) (Moniteur bout-en-bout, mode moniteur pur) et
[20260826173005368](done/20260826173005368_renommer-ezk-map.md) (ezk:map = site de monitoring de la
méthode). Cette fiche est vraisemblablement **une capacité D'affichage DE cette surface**
(lister les runs + paramètres), **pas une nouvelle surface** — à trancher au grooming.

**Sauvetage (2026-10-02)** — fiche créée le 2026-09-06 sur une branche locale jamais ouverte en PR
(`claude/ezk-product-build-sprints-91ceaa`), retrouvée au ménage des branches. Remise telle quelle,
sauf le champ `ready:` (retiré par la migration 005) et deux liens recalés vers `done/`. Les
réglages cités plus haut datent d'avant : `yolo` n'a jamais été adopté, et `--check-ready` est
devenu `--review` (ADR-0053). Aujourd'hui, un run se règle par `--mode manuel|auto`.
