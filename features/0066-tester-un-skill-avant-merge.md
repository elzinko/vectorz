---
id: 0066
title: Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run)
type: feature
priority: P2
product: mega-city
epic: "20260813131737959"
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

### Deux cas mesurés — le niveau 1 ne rougit pas non plus (2026-07-26)

Audit à la main des skills et des agents du repo : **deux références mortes**, aucune
détectée par quoi que ce soit. La première est dans [`ezk-steward`](../products/mega-city/agents/ezk-steward.md)
**lui-même** — le niveau 1 censé attraper exactement ça.

| Ce que le texte affirmait | Le réel |
|---|---|
| [`ezk-steward`](../products/mega-city/agents/ezk-steward.md) ligne 15 + sa `description:` — « lance `./scripts/validate.sh` » | le script n'existe **nulle part** dans le repo ; héritage de l'ancien repo autonome `claude-skills`. Le gate réel est `pnpm --filter mega-city test` / `typecheck` + [`bin/check-links.sh`](../products/mega-city/bin/check-links.sh) |
| [`ezk-preview`](../products/mega-city/skills/ezk-preview/SKILL.md) ligne 136 — « c'est l'étape "1 lien de démo par PR" d'ezk-sprint » | [`ezk-sprint`](../products/mega-city/skills/ezk-sprint/SKILL.md) ne l'invoque **jamais** (son étape PR n'exige que le titre conventional-commit et le before/after). Le seul appelant câblé est [`ezk-pr`](../products/mega-city/skills/ezk-pr/SKILL.md) |

Les deux textes sont corrigés. Ce qui reste ouvert, c'est le **contrôle** : rien n'a rougi, et
rien ne rougirait à la prochaine dérive. Même motif que la fiche
[0095](done/0095-ezk-product-builder-n-emet-pas.md) (une consigne partie neuf jours en silence) et
que la fiche [0101](done/0101-cabler-check-links-ship-et-ci.md) (« un contrôle que personne ne lance
ne protège de rien »). Ça confirme la thèse de cette fiche par l'exemple : l'audit statique est
un **jugement d'agent**, pas une gate — il rate ce qu'il ne pense pas à regarder, y compris sur
lui-même.

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
- [ ] **Candidat déjà formulé (2026-07-26)** — introduire dans une `SKILL.md` ou un
      `agents/*.md` soit (a) un chemin de script / une commande qui n'existe pas, soit
      (b) une revendication de composition que la skill citée n'honore pas, **fait rougir**
      une gate. Prouvé par **sabotage**, pas par lecture.

## Notes / décisions

- **Mesure 2026-08-13 (audit de rationalisation)** : **3 skills sur 23** ont un test shell local
  (`scripts/test-*.sh` — `ezk-archive`, `ezk-backlog`, `ezk-sprint:check`) — dont **2/23 seulement câblés
  dans la gate** (`test:scripts` liste ezk-archive + ezk-backlog ; `ezk-sprint:check/scripts/test-check-gate.sh`
  existe mais **n'est pas câblé**), en plus du niveau 1 (audit statique `ezk-steward`) et de la gate
  de contrat (`src/…`). Ce qui
  **manque, c'est le niveau 2 « exercer le skill »** (golden / dry-run end-to-end) : **0/23** pour
  cette catégorie — ce que cette fiche porte. Rattachée à l'épic [20260813131737959](20260813131737959_rationalisation-coherence-methode-epic.md).
- Un skill **de méthode** a un critère en plus : **émet-il les events du contrat ?** → voir
  0067 (test « golden events ») et l'ADR-032 (émission séparable).
- Compose : `ezk-steward`, `verify`, `skill-creator`. Origine : cérémonie `ezk-retro`
  (dry-run 2026-07-16). Priorité P2 à confirmer.
- **Qui porte le contrôle.** Le critère d'acceptation ci-dessus (référence morte → gate
  rouge, prouvé par sabotage) appartient à **cette fiche 0066** — c'est elle le porteur, pour
  qu'il ne dépende d'aucun autre merge.
- **Réutiliser plutôt qu'un test ad hoc, si l'occasion se présente.** Une **extension de la
  fiche [0079](done/0079-restitutions-po-lisibles.md) encore en cours (branche non mergée, pas
  visible sur `main`)** propose un test de contrat sur le **texte** des skills, calqué sur
  [`skill-emission-contract.test.ts`](../products/mega-city/src/supervision/__tests__/skill-emission-contract.test.ts).
  Si elle atterrit, mutualiser : même mécanique (croiser le texte d'une skill avec le réel),
  périmètre à élargir de « SKILL.md ↔ règle ↔ asset » à « SKILL.md ↔ chemins et skills cités ».
  Si elle n'atterrit pas, 0066 implémente son propre test — la responsabilité reste ici.
