---
id: 0066
title: Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0066 — Tester un skill/agent avant merge

## Contexte / Problème

Née du **premier self-host** (2026-07-16) et d'une question PO : *« comment tester un skill
avant de le merger ? »*. Aujourd'hui, un seul niveau existe côté maison : l'**audit statique**
`ezk-steward`. Or le **dry-run** d'`ezk-retro` a immédiatement prouvé sa valeur : il a capté un
bug (`ezk-reviewer` non disponible comme agent) que l'audit statique avait **manqué**. Un skill
ne se valide vraiment qu'en l'**exerçant**.

> **Proposition produite par la cérémonie `ezk-retro`** (dry-run 2026-07-16, lentilles QA + PM)
> — première capture auto-générée par le skill lui-même.

## Proposition

Trois niveaux, à documenter comme **process de validation d'un skill de méthode** :

1. **Statique** — `ezk-steward` (conventions, déclenchement, références). *Déjà là.*
2. **Exercice end-to-end** — le skill `verify` : le **lancer** sur un cas réel et observer. *Manque comme étape obligatoire.*
3. **Éval** — le harnais d'évals de `skill-creator` (cas de test + « la description se déclenche-t-elle ? » + variance).

Livrables candidats :
- **Template `skills/<skill>/tests/`** : ≥1 **cas golden** par sous-commande (`input → transcript
  attendu → events.jsonl attendu`), exécutable en dry-run.
- **DoR d'un skill** = liste de **déclencheurs** (phrases qui doivent / ne doivent PAS matcher) +
  ≥1 scénario **Gherkin** par sous-commande. **DoD** = scénarios verts + audit `ezk-steward` vert.
- **Gate** : toute PR touchant un skill **référence un dry-run documenté** avant merge.

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- Un skill **de méthode** a un critère en plus : **émet-il les events du contrat ?** → voir
  0067 (test « golden events ») et l'ADR-032 (émission séparable).
- Compose : `ezk-steward`, `verify`, `skill-creator`. Origine : cérémonie `ezk-retro`
  (dry-run 2026-07-16). Priorité P2 à confirmer.
