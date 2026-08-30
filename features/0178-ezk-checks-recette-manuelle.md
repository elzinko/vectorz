---
id: 0178
title: ezk-checks — recette manuelle déclenchable (Playwright → features/checks/)
type: feature
priority: P2
product: mega-city
depends: ["0102"]
version:
epic:
status: idea
ready:
pr:
created: 2026-08-01
---

# 0178 — ezk-checks (recette manuelle opt-in)

## Contexte / Problème

Après une preview locale (PR / tranche), l'humain ou l'agent fait une **recette manuelle**
(naviguer, cliquer, screenshots, noter pass/fail) — aujourd'hui ad hoc. On veut une
**capacité ezk déclenchable à la main** pour éprouver le pattern **avant** de l'intégrer
à un orchestrateur (ezk-sprint / ezk-pr).

Distinct de :
- **ezk-qa** (agent sprint : Gherkin + E2E DoD)
- **ezk-preview** (URL démo)
- **ezk-testbed** (0102, boot stack — blocked)

## Proposition

Skill **`ezk-checks`** dans le catalogue mega-city :

- `/ezk-checks check <url> [fiche-id]` → Playwright MCP → `features/checks/<id>-slug/CHECK.md` + images
- **Pas** câblé dans `ezk-sprint` tant que non prouvé
- Chaque ezk peut être mis en test avant intégration process (même idiome)

POC : skill déployé (2026-08-01) ; dogfood sur city-guided PR #91 / 0056-B
→ artefact `features/checks/0056-admin-pois-refonte-ux/`.

## Question ouverte (grooming) — où vit la capacité de validation ?

> Soulevée par le PO le 2026-08-24, au dédoublonnage du cluster « recette ».

La « recette de validation » suit le **même pattern à trois étages** que la recette de
démarrage (voir la fiche-chapeau
[`20260824185422122`](done/20260824185422122_recette-artefact-premier-rang-et-gardien.md), D3) :

- l'**artefact** produit (le `CHECK.md` rempli) = **donnée** → `features/checks/` ;
- l'**action de valider** (piloter Playwright, cliquer, screenshoter) = **outil** (ce skill) ;
- le **jugement** (pass/fail, « bon pour merger ») = **compétence d'un rôle** → `ezk-qa`.

Donc « la validation est-elle une compétence ou une action d'agent ? » n'est **pas binaire** :
c'est les deux, à deux étages. **Orientation proposée (à trancher au panel)** : garder
`ezk-checks` comme **skill-outil mince** (une responsabilité : produire le `CHECK.md`), et
**déclarer la validation en `competences:` de `ezk-qa`**, qui compose l'outil quand il le juge
utile. L'outil *fait*, le rôle *juge* — `ezk-checks` et `ezk-qa` ne sont pas concurrents.
S'inscrit dans le chantier « déclarer les compétences des agents » (reliquat trois-étages).

Alternative à peser : **fondre** `ezk-checks` dans `ezk-qa` (tout devient action de l'agent) —
plus simple, mais on perd le « déclenchable à la main, hors sprint » qui est la raison d'être
de cette fiche. Le panel tranche.

## Critères d'acceptation (brouillon)

- [ ] Skill listé dans `skills/README.md` catalogue mega-city
- [ ] `help` documente les sous-commandes et les frontières (qa / preview / testbed)
- [ ] Au moins 1 recette réelle écrite via le skill dans un repo produit
- [ ] Explicitement **hors** table de délégation ezk-sprint jusqu'à décision PO post-mesure
- [ ] Mesure rétro : % PRs feature avec dossier `features/checks/` avant merge (cible à fixer)

## Notes

- Déclenchement : `/ezk-checks` ou langage naturel (« fais une recette de … »)
- Reload : `/reload-skills` après deploy
- City-guided : convention documentée dans `features/CONVENTIONS.md`
- **2026-08-08** — Composé par le pack de review **0183** (section « À tester »
  pointe vers `features/checks/<id>/`). Checks ≠ REVIEW : recette vs manifeste
  agrégateur. Webapp reporting **0184** affiche cette section.
