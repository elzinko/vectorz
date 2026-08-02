---
id: 0175
title: article — Skema : versionner une skill LLM avec des migrations markdown
type: feature
priority: P2
product: mega-city
status: idea
pr:
created: 2026-08-01
---

# 0175 — article « Skema : versionner une skill LLM avec des migrations markdown »

## Contexte / Problème

Les skills LLM (markdown + helpers) évoluent de layout : un projet déjà intégré
reste coincé sur l'ancienne convention tant qu'un humain ne rescane pas chaque
repo. Il manque un **vocabulaire** et un **mécanisme** pour : versionner le
contrat de layout d'une skill, lister des migrations ordonnées en markdown, et
**proposer** (pas auto-muter) l'upgrade quand une commande skill tourne.

Premier cas concret : `ezk-backlog` layout v1 (README = index généré) → v2
(README curé + `BACKLOG.md` généré), avec check `layout_version` +
`migrations/002-…`.

## Proposition

Article technique vulgarisé (via `ezk-article` / 0153) qui :

1. Nomme le pattern **Skema** (*Skill Schema Migrations*) — contrat de layout
   versionné + migrations markdown + gate propose-then-apply.
2. Montre le cycle : skill déclare `layout_version` → projet marque la sienne →
   commande détecte `behind` → propose les pending → helper mécanique + LLM.
3. Positionne Skema comme candidat de **standard** pour d'autres skills
   LLM-opérées (pas seulement ezk-backlog).

## Critères d'acceptation

- [ ] Brief persona/audience demandé au PO (pas de défaut silencieux).
- [ ] Le nom **Skema** (ou successeur arbitragé) est introduit clairement.
- [ ] Exemple concret tiré d'ezk-backlog v1→v2 (README vs BACKLOG).
- [ ] Panel de relecture (ezk-article) ; emplacement de publication tranché.

## Notes / décisions

- **P2, idea** — aligné sur les autres fiches article (0166, 0049, 0073).
- Anti-doublon : voisin de 0047 (migration réflexive produit) et 0172 (SoT
  backlog) — angle distinct : **versionner la skill**, pas le produit ni le SoT GH.
- Dépendance souple : 0153 (ezk-article) — non bloquant.
