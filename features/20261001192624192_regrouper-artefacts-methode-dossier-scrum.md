---
id: "20261001192624192"
title: "Regrouper les artefacts de méthode hors de docs/ — un dossier agnostique (ex. scrum/) + skills à jour"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.5
labels: [convention, arborescence]
status: idea
pr:
evidence: none # refactor d'arborescence/outillage, pas d'UI
created: 2026-10-01
---

# 20261001192624192 — Regrouper les artefacts de méthode hors de docs/

**En clair.** Les artefacts de **process** de la méthode (snapshots de session, notes de rétro,
captures, `SPRINT.md`) sont aujourd'hui dispersés dans `docs/`, qui mélange ainsi de la **vraie
doc produit** (articles, design, marketing, support) et de la **continuité de méthode**. On les
regroupe dans un dossier **agnostique et visible** (proposé : `scrum/`), on met à jour les skills
ezk qui y écrivent, et on fournit une migration pour les projets consommateurs. Effet : `docs/`
redevient de la doc, et tout le « process » est au même endroit, versionné (il survit au clone).

**Si tu arrives frais.** ezk/vectorz, c'est la méthode agile outillée par des skills. Certains
skills écrivent des **artefacts de continuité** entre sessions : `ezk-archive` un *snapshot de
session*, `ezk-retro` des *notes de rétro* et des *captures*, `ezk-sprint` un *brouillon de sprint*
(`SPRINT.md`). Aujourd'hui ils atterrissent sous `docs/`.

## Contexte / Problème

Relevé en session muti le 2026-10-01 (clôture `ezk-archive`) : le snapshot de session a atterri
dans `docs/sessions/`, ce qui a fait réagir le PO — « ce n'est pas de la doc, c'est une archive
de méthode ». Trois constats :

- **`docs/` est un fourre-tout.** Il contient de la doc produit (`articles/`, `design/`,
  `marketing/`, `support/`, `beta/`…) **et** des artefacts de méthode (`sessions/`,
  `retro-notes/`, `captures/`, `adr/`).
- **Les chemins sont codés en dur dans les skills** : `ezk-archive` écrit `docs/sessions/`,
  `ezk-retro` écrit `docs/retro-notes/` + `docs/captures/`, `ezk-sprint` gère `SPRINT.md` (à la
  racine). Changer la convention dans UN projet seul le désynchronise des skills.
- **`SPRINT.md` est SUIVI par git** alors que la méthode le décrit « éphémère, non commité » —
  tension déjà repérée (les notes de sprint fuient dans l'historique, PR muti #258). Et le
  snapshot de session est une **copie quasi verbatim** de `SPRINT.md` : redondance.

## Proposition

POC d'abord (décider + bouger), polish ensuite (nettoyage fin).

1. **Un dossier process agnostique et VISIBLE.** Proposé : `scrum/` (le PO le trouve agnostique).
   Alternatives à arbitrer en rétro : `agile/`, `method/`, `process/`. Pas un dotdir : on veut
   **feuilleter** sessions et rétros. Le **tool-config** (`.vectorz/`, `.rules/`) reste caché, lui
   — séparation par audience (humain lisible vs infra).
2. **Ce qui déménage** (process/continuité) : `sessions/`, `retro-notes/`, `captures/`, et
   `SPRINT.md`. **Ce qui reste doc** : `articles/`, `design/`, `marketing/`, `support/`…
3. **Cas limites à trancher** : les **ADR** (vraie doc d'archi — plutôt garder `docs/adr/`) et le
   **backlog `features/`** (c'est du process, mais lourd et très installé — garder ou passer sous
   le dossier process ?).
4. **Mettre à jour les skills ezk** (`ezk-archive`, `ezk-retro`, `ezk-sprint`) : les chemins
   d'écriture + leurs READMEs/gabarits. Un chemin configurable (plutôt qu'en dur) serait un plus.
5. **Note de migration** pour les projets consommateurs (muti et les autres) : comment déplacer
   leurs dossiers existants sans perdre l'historique (`git mv`), et que faire du `SPRINT.md` suivi.
6. **Trancher `SPRINT.md`** : soit l'ignorer (`.gitignore`) et ne garder que le snapshot scellé,
   soit faire du snapshot le seul fichier (sceller = renommer/commiter à la clôture) pour **tuer
   la redondance** brouillon↔snapshot.

## Critères d'acceptation

- [ ] Le **nom** du dossier process est décidé et consigné dans un **ADR** (avec le périmètre :
      ce qui bouge, ce qui reste).
- [ ] Les skills `ezk-archive` / `ezk-retro` / `ezk-sprint` écrivent dans le nouveau dossier
      (idéalement via un chemin **configurable**, pas codé en dur).
- [ ] Une **note de migration** existe pour un projet consommateur (déplacer `sessions/` +
      `retro-notes/` + `captures/` + `SPRINT.md`, préserver l'historique).
- [ ] Décision prise sur **`SPRINT.md`** : plus de fichier « suivi par git mais déclaré
      éphémère » ; la redondance brouillon↔snapshot est tranchée.
- [ ] `docs/` ne contient plus que de la doc produit (± les ADR, selon l'arbitrage).
- [ ] **Rétrocompat** : un projet déjà outillé migre sans perdre son historique de sessions/rétros.

## Comment vérifier

```bash
# 1. Plus aucun skill n'écrit en dur dans docs/sessions|retro-notes|captures.
#    Les skills vivent sous products/mega-city/skills/ (PAS skills/ à la racine), et un chemin
#    absent ne doit JAMAIS passer pour « OK » — on distingue les 3 codes de sortie de grep.
#    Le sous-shell sort en échec sur KO comme sur erreur, sans fermer ton terminal.
( grep -rnE "docs/(sessions|retro-notes|captures)" products/mega-city/skills/; rc=$?
  case $rc in
    0) echo "KO — occurrences en dur ci-dessus"; exit 1 ;;
    1) echo "OK — plus aucune occurrence" ;;
    *) echo "ERREUR grep (rc=$rc) — mauvais chemin ?"; exit 2 ;;   # chemin absent ≠ OK
  esac )
# 2. Les tests des skills touchés passent — Vitest ET les suites SHELL qui exercent les chemins :
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts   # test-handoff.sh + test-sprint-lifecycle.sh (chemins de session)
# 3. Un clone frais d'un projet migré montre le dossier process au bon endroit (pas dans docs/) :
#    git clone <projet> /tmp/x && ls /tmp/x/scrum/ && ls /tmp/x/docs/
```

## Glossaire

- **snapshot de session** : copie figée, à la clôture, du brouillon de sprint — l'archive de ce
  qui a été fait dans la session (écrite par `ezk-archive`).
- **note de rétro / capture** : entrées du carnet lu par `ezk-retro` au prochain cérémonial.
- **dossier process** : le dossier agnostique proposé (`scrum/`) regroupant ces artefacts.

## Notes / décisions

- **Origine** : session muti 2026-10-01 (clôture `ezk-archive` du sprint smoothing/send-threshold),
  discussion PO sur « pourquoi `docs/` pour une archive de méthode ». Une note de rétro a été
  déposée côté muti (`docs/retro-notes/`) pointant vers cette fiche.
- **À trancher en rétro** (`/ezk-retro`, côté vectorz) : le **nom** (`scrum/` vs `agile/`/`method/`),
  le sort des **ADR** et du **backlog `features/`**, et la décision **`SPRINT.md`**.
- **Priorité P2** : hygiène de méthode, rien n'est cassé ; mais cross-cutting (touche tous les
  projets ezk via les skills). **version prévue V0.5** (prochaine release après V0.4) — à
  confirmer au grooming.
