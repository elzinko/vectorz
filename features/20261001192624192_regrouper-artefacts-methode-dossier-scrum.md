---
id: "20261001192624192"
title: "Regrouper les artefacts de méthode hors de docs/ — un dossier agnostique (ex. scrum/) + skills à jour"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
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
  projets ezk via les skills).
- **Sortie de la V0.5 le 2026-10-03** (choix délégué par le PO). Elle est hors du thème de la V0.5
  (« le sprint au lot ») et porte des décisions lourdes. La garder aurait bloqué le cockpit (V0.6)
  derrière elle. Elle reste au jalon `rationalisation`, sans version, à reprendre avec l'architecte.
- **Déjà tranché ailleurs, à retirer du périmètre au prochain grooming.** Le sort de `SPRINT.md` :
  l'[ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) le dit
  ignoré par git, et vectorz l'ignore déjà (`.gitignore`). Le cas muti, qui l'a commité, est porté
  par la fiche
  [sprint.sh distingue un sprint ouvert d'un SPRINT.md commité](20261003011750433_portier-sprint-md-commite.md).
- **Périmètre à élargir au prochain grooming** (constaté le 2026-10-03) : `docs/` de vectorz contient
  aussi `journal/`, `archive/`, `audits/` et `pr-evidence/`, qui relèvent peut-être de la méthode.

### Revue PO du 2026-10-06 (vectorz) — décisions et classement

Le PO a passé `docs/` en revue dossier par dossier. Tri arrêté :

- **Déménage dans le dossier process** (continuité de méthode) : `sessions/` (renommé **`sprints/`**,
  cf. ci-dessous), `retro-notes/`, `captures/`, `journal/`, `pr-evidence/`, snapshot `SPRINT.md`.
- **Reste de la doc produit** dans `docs/` : `articles/`, `audits/`, `adr/`.
- **À supprimer** (pas à archiver) : `archive/` (BMAD époque-1 + pré-phase-A). Pure paléontologie,
  git garde l'historique — cohérent avec `clean-code/no-dead-code`. Décision à confirmer.
- **À requalifier** : `e2e/` n'est pas du process mais de la **doc de test** (checklists manuelles,
  fiches 0041/0003) ; vérifier qu'elle est encore exacte, sinon supprimer, sinon `docs/tests/`.

**`sessions/` → `sprints/`.** Le PO tranche le nom : le dossier des snapshots s'appelle **`sprints/`**,
pas `sessions/`. Raison : « session » est une notion de l'outil (Claude), pas du domaine agile. Le
dossier ne contient que ce que **la méthode scelle** à la clôture d'un sprint. Une tâche lancée hors
ezk ne produit pas de snapshot, donc ne pollue pas la convention. Fiche sœur :
[Les récits de session reviennent sur main](20261003201035260_recits-de-session-de-retour-sur-main.md).

**Groupé par type, PAS par sprint.** Le PO a proposé « un dossier par sprint contenant tout ». Écarté :
les artefacts n'ont pas la même maille. `pr-evidence` est **par fiche**, `journal` couvre **tout le
dépôt**, `retro-notes` s'étale sur **plusieurs sprints**, le snapshot est **par session**. Un
découpage par sprint forcerait à couper ou dupliquer. On garde donc des **sous-dossiers par type**
sous le dossier process (`sprints/`, `retro-notes/`, `captures/`, `journal/`, `pr-evidence/`).

**capture ↔ retro-notes = deux bouts de la même cérémonie.** `retro-notes/` est l'entrée (frictions
déposées pendant les sprints via `ezk retro note`), `captures/` est la sortie (l'arbitrage de la
rétro). Cycles de vie distincts (une note part dans `traitees/`, une capture est permanente) : on ne
fusionne pas les dossiers, on les **déménage ensemble**.

**Hors périmètre — config runtime de produit.** `cop1.config.example.yaml`,
`supervision.registry.example.yaml` et `supervision.registry.yaml`, aujourd'hui à la **racine du
monorepo**, ne sont pas du process : ce sont des configs d'exécution du produit cop1 (qui vit sous
`products/cop1/`). Elles descendent sous `products/cop1/` avec correction des liens dans les docs.
Concern distinct → **fiche dédiée** (ne pas gonfler celle-ci).

**CLAUDE.md = proxy, pas porteur de règles.** Constat PO connexe : le CLAUDE.md projet redit les
règles de clarté en dur au lieu de pointer vers la loi compilée (`lawgiver bind`). Noté pour une
fiche séparée, hors de ce périmètre.

### Décisions du 2026-10-07 (lotissement V0.9)

- **Version : V0.9 « Ranger la maison ».** Vérifié avec la session *supervision* : V0.7
  (observabilité) et V0.8 (métriques) sont prises mais pas encore dans `PLAN.md` ; V0.9 est libre,
  aucune collision. Cette fiche quitte « sans version » et devient la tête de la V0.9.
- **`captures/` et `retro-notes/` déménagent sous un foyer commun `retro/`** (sous-dossiers
  `notes/` = entrée, `captures/` = sortie). Même cérémonie, même endroit ; on garde la distinction
  entrée/sortie mais plus deux dossiers éloignés.
- **`pr-evidence/` → `evidence/`** (terme raccourci). Reste un **sous-dossier distinct**, pas
  fusionné dans `retro/` : ce sont des images liées à une PR/fiche, pas à la rétro.
- **`archive/` : suppression confirmée par le PO** (BMAD époque-1 + pré-phase-A). Git garde
  l'historique. Critère : nettoyer les liens dans `docs/index.md`.
- **`e2e/` : vérifier puis supprimer.** S'assurer que `pnpm cobaye:smoke` couvre les checklists
  manuelles (fiches 0041/0003), puis supprimer ; en cas de doute, requalifier en `docs/tests/`
  (jamais process). Priorité basse.
- **La fiche récits de session (`20261003201035260`) N'est PAS dans cette V0.9** : elle relève de
  la V0.7 observabilité (bug de confiance). Le renommage `sessions/` → `sprints/` reste porté ici.
- **Deux fiches sœurs créées pour la V0.9** : (1) descendre `cop1.config.example.yaml` +
  `supervision.*.yaml` sous `products/cop1/` ; (2) CLAUDE.md-proxy + loi bindée par projet
  (`.iamthelaw/` visible dans le dépôt plutôt que `~/.claude/` global).

### Critères d'acceptation ajoutés (2026-10-07)

- [ ] `captures/` + `retro-notes/` regroupés sous `retro/{notes,captures}/`, skills `ezk-retro`
      mis à jour.
- [ ] `pr-evidence/` renommé `evidence/`, références mises à jour.
- [ ] `docs/archive/` supprimé, liens `docs/index.md` nettoyés.
- [ ] `docs/e2e/` : couverture smoke vérifiée, puis supprimé ou requalifié `docs/tests/`.
