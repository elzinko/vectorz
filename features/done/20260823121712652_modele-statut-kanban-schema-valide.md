---
id: "20260823121712652"
title: "Valider les statuts des fiches par un schéma (fin des fautes de frappe)"
type: feature
priority: P0
product: mega-city
labels: [socle]
status: shipped
pr: "#267"
created: 2026-08-23
milestone: fondation
version: v0.1.0
---

# Modèle de statut kanban — des colonnes contrôlées, pas un champ date bancal

> **MAJ 2026-09-30 — groom du sprint « le verrou » (V0.1).** Déjà livré et vérifié : le validateur
> `fiches:check --strict` bloque la CI (PR #233) ; le modèle à deux axes est en place — `merged` et
> `split` terminaux avec provenance validée, `blocked` en drapeau orthogonal (PR #235) ; les listes
> d'énumérations sont centralisées dans `avancement-data.ts`. **Reste** : le champ date `ready:` et la
> liste des statuts recopiée à la main dans les scripts.

## En clair

Une faute de frappe sur un statut est déjà arrêtée par la CI, et `ready` est déjà une colonne du board.
Il reste un vieux champ date, `ready: 2026-08-21`, présent dans 219 fiches et lu par plusieurs scripts.
C'est lui qui prête à confusion : on le retire. La date de chaque DoR passée n'est pas perdue. Elle est
recopiée dans une ligne de note datée au bas de la fiche. La liste des statuts, elle, vit en un seul
endroit, un schéma, au lieu d'être recopiée à la main dans le validateur, le board et les scripts.

## Contexte / Problème

- **La liste des statuts dérive.** Le validateur et le board la lisent dans `avancement-data.ts`. Mais
  `regen-backlog.sh` (2 copies), `portfolio.sh`, les 3 gabarits de fiche et le skill la recopient à la
  main. Elles ont déjà dérivé : `merged` et `split` s'affichent `❓` dans l'index, et `blocked` (qui
  n'est plus un statut) y figure encore.
- **Le champ `ready:` n'a plus d'effet, mais il traîne.** Le tirage lit `status: ready`. Pourtant le
  champ reste dans 219 fiches (81 avec une vraie date, 138 vides), dans le loader, le board,
  `plan:head`, l'index `BACKLOG.md`, `PORTFOLIO.md`, le gate `ready` du skill `ezk-backlog` et les
  gabarits. Source d'incompréhension PO du 2026-08-23 : « pourquoi une date, on ne passe pas juste le
  statut à *ready* ? ».
- **Ligne de crête inchangée** : schéma léger + validateur + vues générées, jamais un moteur de workflow.

## Proposition (décisions du grooming)

1. **Deux axes** (livré, #235). La *colonne* est le champ `status` : `idea → ready → shipped`, plus les
   terminaux `superseded`, `merged`, `split`. Les *drapeaux* se posent par-dessus la colonne : `blocked:`
   avec sa raison. Une fiche peut donc être `ready` ET bloquée (cas `0102`, retour Codex #164).
2. **Un schéma unique des statuts** : `FICHE_SCHEMA`, dans `src/core/fiche-schema.ts`. Il dit, pour
   chaque statut, son libellé et s'il est terminal. Le validateur, le board et les vues en dérivent.
   Les scripts bash ne portent qu'un habillage (l'emoji) qu'un **test de contrat** compare au schéma :
   plus de dérive silencieuse. **Pas de YAML par repo** : c'est l'ADR-0040 D2 (« schéma dérivé du code
   typé, pas de schéma parallèle ») et l'arbitrage PO du 2026-09-12 (« refus schéma statuts par repo »).
3. **Retrait du champ `ready:`** par la migration Skema **005** (dry-run ou `--apply`, idempotente).
   Pour chaque fiche qui porte une vraie date, la migration ajoute une ligne de note datée au bas de la
   fiche, puis supprime la ligne `ready:`. **Refus de dériver la date de git** : le squash-merge ment
   (ex. `20260812134515706` porte `ready: 2026-08-21`, mais son commit de livraison est du 2026-08-22,
   retour Codex #164). `layout_version` passe de 4 à 5.
4. **Garde contre le retour du champ** : le validateur signale `ready:` comme champ retiré, et les
   gabarits ne le créent plus.
5. **Consommateurs passés sur `status: ready`** : loader `fiches.ts`, board, plan-view, `plan:head`,
   `regen-backlog.sh` (2 copies byte-identiques) et `portfolio.sh`, gate `ready` du skill, `next --ready-only`,
   `check-fiches`, gabarits, doc.

## Critères d'acceptation

- [x] Un validateur **rejette** un `status` hors-liste (testé rouge→vert) — PR #233, `fiches:check --strict`
      en gate bloquante.
- [x] `blocked` et `ready` cohabitent sans perte : `blocked` est un **drapeau orthogonal**, pas une
      colonne (cas `0102`) — PR #235. Statuts terminaux `merged` / `split` + provenance validée — PR #235.
- [x] Markdown reste la **source** ; aucun moteur de workflow introduit.
- [x] (a) La liste des statuts vit en **un seul schéma** (`FICHE_SCHEMA`) ; validateur, board et vues
      en dérivent ; les scripts bash et les gabarits sont gardés par un test de contrat (un statut
      ajouté au schéma sans son habillage fait échouer la suite).
- [x] (b) `ready` est une **colonne** (`status: ready`, déjà vrai) **et** le champ date `ready:` n'existe
      plus : aucune fiche ne le porte, le validateur le rejette, les gabarits ne le créent plus.
- [x] (c) Migration **005** sans perte sur les fiches actives et `done/` : chaque date `ready:` réelle
      (81 fiches) est recopiée en note datée avant la suppression de la ligne ; une 2e exécution ne
      change rien ; `layout_version` 5.
- [x] (d) Les consommateurs listés en Proposition 5 passent sur `status: ready` ; `BACKLOG.md` /
      `PORTFOLIO.md` restent fidèles (mêmes lignes qu'avant, `merged` / `split` enfin libellés).

**Preuves (PR #267).** (a) `src/core/fiche-schema.ts` et `src/__tests__/fiche-schema-contract.test.ts`.
(b) `fiche-validator.ts` (règle « champ retiré ») et les trois gabarits. (c) `apply-005-retrait-champ-ready.sh`
et `test-apply-005.sh` : 219 fiches migrées, 81 dates préservées en note, 0 perdue, vérifié par un second
calcul indépendant contre `HEAD` (324 fiches sur 325 égales octet pour octet, la 325e étant cette fiche
groomée). (d) `BACKLOG.md` régénéré : une seule ligne change, la légende ; `PORTFOLIO.md` identique ;
gate verte (848 tests, 23 suites bash, lint, `check-links` 0 cassé). Revue adverse `ezk-reviewer` : GO.

## Comment vérifier

```bash
pnpm --dir products/mega-city fiches:check --strict       # 0 anomalie — plus aucun champ ready:
grep -l '^ready:' features/*.md features/done/*.md         # aucune sortie
bash products/mega-city/skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh .   # dry-run : rien à migrer
pnpm --dir products/mega-city test && pnpm --dir products/mega-city test:scripts
```

Sabotage : remettre `ready: 2026-01-01` dans une fiche → `fiches:check --strict` échoue avec « champ retiré ».
Introduire `status: to-do` → il échoue aussi (déjà le cas depuis #233).

## Suite (reliquat hors POC)

- **Surcharge du schéma par repo** (un YAML éditable par projet) : refusée tant qu'aucun second repo
  ne demande d'autres colonnes (YAGNI, PO 2026-09-12). À rouvrir sur ce signal.
- **Fiche 20260823121712716** (board en colonnes + historique git) : sa prémisse « la date vient de
  git » ne tient plus pour les DoR historiques, conservées ici en note. À re-scoper en « vue git bonus »
  (arbitrage PO).
- `portfolio.sh` lit encore `status: blocked` (section « Actionnable », compteur `⛔`) : depuis #235,
  `blocked` est un drapeau. La branche est morte (elle ne correspond plus à rien). À passer sur le
  champ `blocked:`. Relevé par la revue adverse, non bloquant.
- **La file tirable ignore le drapeau `blocked:`** : `plan:head`, `next --ready-only` et le compteur
  `tirables` du board lisent le statut seul, donc une fiche `ready` ET bloquée reste « tirable ». Trou
  du modèle à deux axes (#235), relevé par Codex sur cette PR. La migration 005 l'évite : elle ne
  promeut jamais une fiche bloquée en `ready`. À trancher : faire ignorer le drapeau par la file, ou non.
- Les quatre « métas » (`schema`, `generated_by`, `version`, sprint) restent hors périmètre (ADR-0040 D4).

## Notes / voisins

- Voisins : [[0186]] (validateur de conformité d'artefacts, Skema), [[20260815080414006]] (manifeste de
  slots par repo), [[20260823121712716]] (les vues générées : board + historique git).
- Issu de l'échange PO du 2026-08-23 (le champ `ready:` daté jugé bancal ; préférence pour des colonnes
  validées).
- **2026-09-30 — DoR concourue par `ezk-pm` : GO.** Les dates `ready:` historiques vont en note datée
  au bas de la fiche, jamais dérivées de git. Le critère « schéma éditable » est lu comme un schéma
  typé unique gardé par un test de contrat, sans YAML par repo (ADR-0040 D2, arbitrage PO 2026-09-12).
- **Autres sprints en vol** : après un `merge origin/main`, relancer
  `apply-005-retrait-champ-ready.sh --apply` si une de leurs fiches porte encore `ready:` ; le
  validateur la rejette sinon.
- **Statuts `merged` / `split`** (échange PO 2026-08-25) : fusionner ou splitter des fiches produit des
  états **terminaux** ; les fiches absorbées passent `merged` / `split`, avec back-références vers la
  résultante. Geste porté par [[20260812104022240]].
- **Quatre « métas » à ne pas fondre** (échange PO 2026-08-25) : `schema` (version du **format** de la
  fiche) · `generated_by` (le **producteur** : skill, version, modèle, effort) · `version` (la
  version/tag **visée**) · sprint / milestone (la **boîte de temps**, séparée de la version). Export
  GitHub : voir [[0171]]. Piège : `schema` (format) ≠ `generated_by` (producteur).
