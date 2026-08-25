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

Implémenter l'adaptateur **selon le modèle tranché par [0170](done/0170-modele-extension-plugin-mega-city.md)**
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

- [ ] [0170](done/0170-modele-extension-plugin-mega-city.md) shipped (ADR d'extension disponible)
- [ ] Core ezk-backlog (`add` / `ready` / `ship` / `regen`) **zéro** import/`gh` obligatoire
- [ ] Activation opt-in documentée ; projet sans config = comportement inchangé
- [ ] Sens de sync = local → GH ; pas d'écrasement silencieux du front-matter local
- [ ] Au moins un parcours dogfood : fiche → issue créée → `ship` ferme/annote l'issue
- [ ] Doc : SoT = fiche ; issue = projection ; lien vers 0170 / 0087 / 0093 pour les frontières
- [ ] Gate locale verte

## Vocabulaire & affichage (échange PO 2026-08-25)

Le plugin doit **afficher** trois objets, avec le mapping ezk ↔ GitHub ↔ scrum :

| ezk (SoT locale) | GitHub | scrum |
|---|---|---|
| **sprint** | milestone | sprint |
| **feature** (fiche) | issue | user story |
| **version / tag** | Release (tag) | version |

- ⚠️ **Renommage à considérer (refacto, plus tard)** : « feature » ↔ « user story ». Le terme scrum est
  « user story » ; `type: feature` pourrait devenir ambigu. À trancher plus tard — touche tout le backlog.
- **Synchro bidirectionnelle = le risque** (soulevé PO) : c'est précisément ce que cette fiche **évite**.
  **Push-only**, local → GitHub, jamais l'inverse ; le champ `github:` lie la fiche à son issue (lien, pas maître).
- **Statuts `merged`/`split`** ([[20260812104022240]]) : à projeter aussi (issue fermée « fusionnée dans #X »).
- Métas de la fiche à exporter (`schema`, `generated_by`, `version` cible, sprint) : voir [[20260823121712652]].

## Notes / décisions

- `depends: [0170]` — ne pas coder tant que le modèle d'extension n'est pas tranché.
- `product: mega-city` — liste unique livrée (0064 / #66).
- Si le trigger de 0093 est atteint plus tard, cet adaptateur devient un *candidat* de
  second backend — pas une raison de construire 0093 maintenant.


> **Doctrine SoT actée (paquet 2, 2026-08-24)** : la fiche `0172` est fermée — son contenu
> (markdown maître, GitHub en simple export, sync local→externe only) est ACTÉ par l'ADR-0039.
> Cette fiche implémente cette doctrine, elle ne la re-décide pas.
