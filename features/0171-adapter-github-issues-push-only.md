---
id: 0171
title: Adapter GitHub Issues (push-only, config-gated) — projection du backlog md, pas SoT
type: feature
product: mega-city
priority: P2
epic:
depends: [0170]
status: idea
ready:
pr:
created: 2026-07-30
---

# 0171 — Adapter GitHub Issues (plugin / skill opt-in)

## Contexte / Problème

Les contributeurs externes et les Project boards GitHub sont utiles pour la **visibilité**,
mais le backlog mega-city / ezk-backlog doit rester **agnostique** : source de vérité =
fiches markdown versionnées sur `main` (ADR-0016 / ADR-0017). Créer les issues *avant*
les fiches, ou laisser les critères d'acceptation vivre dans GitHub, produit une double
SoT (déjà observé hors monorepo).

On veut donc un **adaptateur optionnel** : le backlog local reste maître ; GitHub Issues /
Project = **export** (projection), jamais l'inverse — sauf import d'idées (`idea`) depuis
l'extérieur, sans écraser statut/critères locaux.

Ce n'est **pas** :
- le packaging de la méthode ([0087](0087-plugin-claude-code-distribution.md)) ;
- un BacklogStore hexagonal ([0093](0093-backlogstore-port-agnostique.md)
  — YAGNI jusqu'au trigger « 2ᵉ consommateur Issues/Jira only »).

## Proposition

Implémenter l'adaptateur **selon le modèle tranché par [0170](0170-modele-extension-plugin-mega-city.md)**
(dépendance bloquante — panel + ADR d'abord).

Comportement cible (à confirmer / affiner dans l'ADR 0170) :

1. **Push-only** : fiche `ready` / `in-progress` / `shipped` → create / update / close issue
2. **Config-gated** : désactivé par défaut ; activation par config projet
3. Champ optionnel `github:` (ou équivalent) sur la fiche — lien, pas maître
4. Critères d'acceptation **toujours** dans le markdown ; l'issue peut les *répéter* pour
   les humains, jamais les remplacer
5. Réutiliser l'esprit de `ezk-backlog reconcile` (propose, ne mute pas en silence)

Références d'extension (à lire au design, via 0170) :

- BMAD : overlay `customize.yaml` / modules — injection sans forker le core
- Plugin Claude Code officiel **GitHub** :
  [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)
  (plugin `github` = MCP repo/issues/PR — **exemple de forme plugin**, pas le modèle de
  backlog à copier)

## Critères d'acceptation

- [ ] [0170](0170-modele-extension-plugin-mega-city.md) shipped (ADR d'extension disponible)
- [ ] Core ezk-backlog (`add` / `ready` / `ship` / `regen`) **zéro** import/`gh` obligatoire
- [ ] Activation opt-in documentée ; projet sans config = comportement inchangé
- [ ] Sens de sync = local → GH ; pas d'écrasement silencieux du front-matter local
- [ ] Au moins un parcours dogfood : fiche → issue créée → `ship` ferme/annote l'issue
- [ ] Doc : SoT = fiche ; issue = projection ; lien vers 0170 / 0087 / 0093 pour les frontières
- [ ] Gate locale verte

## Notes / décisions

- `depends: [0170]` — ne pas coder tant que le modèle d'extension n'est pas tranché.
- `product: mega-city` — liste unique livrée (0064 / #66).
- Si le trigger de 0093 est atteint plus tard, cet adaptateur devient un *candidat* de
  second backend — pas une raison de construire 0093 maintenant.
