---
id: "20260917221003631"
title: "Câbler ezk-pr sur les capacités GitHub (mode github off même avec remote)"
type: feature # feature | bug | refactor | chore | epic
priority: P1 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [github-optionnel, plugin]
status: ready # idea | ready | in-progress | blocked | shipped
ready: 2026-09-17 # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète)
pr:
evidence: none # câblage skill, pas d'écran
created: 2026-09-17
---

# 20260917221003631 — Câbler ezk-pr sur les capacités GitHub

## En clair

`ezk-pr` sait déjà travailler sans PR GitHub — mais seulement quand le dépôt **n'a pas de
remote**. Or on veut couper GitHub **par choix** (`github: false`), même quand un remote
existe. Ce cran apprend à `ezk-pr` à lire la config du projet et à basculer en local sur ce
choix, comme `ezk-sprint` le fait déjà.

## Contexte / Problème

`ezk-pr` (le chef d'orchestre du test-puis-merge d'un stock de PR) décide « distant vs local »
d'après la **présence d'un remote** :

- `plan` fait `gh pr list` si un remote existe, sinon liste les branches locales ;
- `ship` fait `gh pr merge --squash` avec remote, sinon un squash local (`ship-merge.sh`).

Il ignore la config `.vectorz/config.yml`. Conséquence : un projet **avec** remote mais réglé
`github: false` verrait quand même `ezk-pr` appeler `gh` — l'inverse du mode voulu. Le cran
mince (fiche [[20260916225506856]]) a posé le lecteur `ezk:config` et câblé `ezk-sprint` ; il
restait à câbler `ezk-pr`, le second skill qui parle GitHub en dur.

## Proposition

**Câblage documentaire, parallèle exact d'ezk-sprint** (le mécanisme sous-jacent existe déjà —
`ship-merge.sh` gère `--local`, `plan` a le repli branches) :

1. **Section « Capacités GitHub »** dans `ezk-pr/SKILL.md` : à l'intake, lire
   `pnpm --dir products/mega-city ezk:config` avant tout `gh`. `pr: false` → mode 100 % local
   **même avec un remote** ; `ci: false` → pas d'attente CI cloud ; `codex-review: false` →
   revue `ezk-reviewer`.
2. **`plan`** : `gh pr list` seulement si `pr: on` ; sinon (sans remote **ou** `pr: false`) le
   stock = les branches locales `feat/{id}-{slug}`.
3. **`ship`** : le chemin distant (`gh pr merge`) exige `pr: on` **et** un remote ; sinon squash
   **local** (`ship-merge.sh --local`) + `ezk-backlog ship <id> local (<sha>)`.

**Compose, ne réimplémente pas** : réutilise le lecteur `ezk:config` [[20260916225506856]], le
merge-local-first `ship-merge.sh` [[20260911213014783]], l'émetteur de corps de PR local
[[20260917214300145]]. Le corps de la revue reste `review:emit`.

**Hors scope** : matérialiser le garde-fou dans `ship-merge.sh` (refuser `--remote` en lisant la
config) — le script reste autonome en mode copy, la lecture YAML en bash est renvoyée à un cran
suivant. Ici, le SKILL décide, `ship-merge.sh --local` exécute (comme pour `ezk-sprint`).

## Critères d'acceptation

*(Ce qui doit être VRAI pour accepter. Coché = prouvé par le panel, pas auto-déclaré.)*

- [x] `ezk-pr` lit les capacités GitHub (`ezk:config`) à l'intake, **avant** tout appel `gh`.
- [x] En `pr: false`, `plan` n'appelle **aucun** `gh pr list` — le stock = les branches locales
      **réelles** (`feat/…`, `fix/…`, classifieur `ezk-archive`) — **même si un remote existe**.
- [x] En `pr: false`, `ship` fait un **squash local** (`ship-merge.sh --local`) et clôt en
      `ezk-backlog ship <id> local (<sha>)` : **aucun** `gh pr merge`, **aucun** `#PR` inventé.
- [x] En `pr: false`, `report` ne poste **aucun** commentaire GitHub.
- [x] Non-régression : sans config (donc `pr: on`) **et** avec un remote, le flux GitHub est inchangé.
- [x] Non-régression : **sans remote** (config absente comprise), `plan` liste les branches locales
      et ne tente pas `gh pr list`.

*Cochés le 2026-09-18 par le panel adverse `ezk-reviewer` (verdict GO) — rejeu des « Comment vérifier »
+ parité `ezk-sprint` + chasse au trou (aucune fuite `gh`/`#PR` en `pr: false`).*

## Comment vérifier

*(La procédure que le panel adverse REJOUE pour cocher ci-dessus — pas une recopie des critères.)*
Se lance **depuis la racine d'un clone frais de vectorz** ; le point d'entrée portable `ezk <cmd>`,
lançable de n'importe quel terminal, est fiché à part ([[20260903134906920]]).

Contrôles **documentaires** (le câblage vit dans le prompt du skill, pas dans un binaire) :

```bash
grep -n "Capacités GitHub — config projet" products/mega-city/skills/ezk-pr/SKILL.md  # section présente
grep -n "ET un remote existe" products/mega-city/skills/ezk-pr/SKILL.md               # plan durci (pr:on ET remote)
grep -n "aucune cible GitHub" products/mega-city/skills/ezk-pr/SKILL.md               # report/ship conditionnés
bash products/mega-city/bin/test-links-repo.sh                                        # liens valides (gate CI)
```

Contrôle de **cohérence** : lire la section et vérifier la **parité** avec celle d'`ezk-sprint`
(même lecteur, même sémantique des trois capacités), sans contradiction avec `ship` merge-local-first.

Contrôle **runtime déjà acquis** : le geste sous-jacent — squash local sans aucun `gh` — est prouvé
par le dogfooding d'`ezk-sprint` ([[20260916225506856]]) ; ce cran route `ezk-pr` dessus, il ne le refait pas.

## Notes / décisions

- **Demande PO** (Thomas, 2026-09-17) : « câble ezk-pr », après le dogfooding réussi du mode off
  et l'émetteur de corps de PR local.
- **Parallèle d'ezk-sprint** : même patron de section « Capacités GitHub », même lecteur.
- **Distinction** : `ezk-sprint` PRODUIT une feature (une PR) ; `ezk-pr` CONSOMME un stock de PR.
  En mode off, le « stock » devient les branches locales + leurs fichiers de corps de PR locaux.
