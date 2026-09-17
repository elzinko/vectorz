---
id: "20260917214300145"
title: "Émetteur automatique du corps de PR local (rendu de la fiche) en mode github off"
type: feature # feature | bug | refactor | chore | epic
priority: P1 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [github-optionnel, plugin]
status: shipped # idea | ready | in-progress | blocked | shipped
ready: 2026-09-17 # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète)
pr: "#252"
evidence: none # outil CLI + câblage skill, pas d'écran
created: 2026-09-17
---

# 20260917214300145 — Émetteur automatique du corps de PR local

## En clair

Quand GitHub est coupé (`github: false`), on n'ouvre pas de PR — mais chaque feature doit
quand même laisser **un fichier qui contient ce qu'une PR contiendrait** : le rendu de la
fiche, le même texte qu'un corps de PR GitHub. Aujourd'hui ce fichier n'est pas produit
automatiquement, et le seul émetteur en place (`review:emit`) écrit **autre chose** — le
compte-rendu de la revue, pas le corps de PR. Ce cran ajoute l'émetteur qui manquait et le
branche pour qu'il tourne tout seul en fin de sprint.

## Contexte / Problème

Le cran mince du mode off (fiche [[20260916225506856]]) a câblé `ezk-sprint` pour émettre,
en `pr: false`, un `review:emit` → `REVIEW.md`. Or `REVIEW.md` suit le schéma
`method-review` (résumé + matrice + à tester) : c'est le **compte-rendu de la revue adverse**,
pas le **corps de PR**.

Le corps de PR, lui, est défini par [ADR-0029](../../products/mega-city/docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md) :
« la fiche est le document, la PR en est le rendu ». Sur GitHub, à l'ouverture de la PR, on
recopie la fiche dans le corps. Sans GitHub, ce rendu n'était produit **nulle part** de façon
systématique. Résultat : en mode off, on ne retrouve pas le lendemain « la PR qu'on aurait
ouverte » — juste un compte-rendu de revue, plus maigre que la description de la feature.

Il manquait aussi un **moteur de rendu** : ADR-0029 (option C) l'avait écarté comme
sur-outillage, laissant la recopie « à la main ». En mode off automatique, la recopie à la
main n'a pas lieu — il faut donc l'outiller.

## Proposition

Un émetteur dédié, **distinct** du pack de revue :

1. **Cœur pur** `src/pr-body/render.ts` — `renderPrBody({ ficheText, fichePath, validation })`
   rend : ligne de provenance (`> 🗎 Rendu de la fiche <path>`) + prose de la fiche (sans
   front-matter) + matrice `## Validation`. Aucune I/O (ADR-0003). La matrice par défaut nomme
   les **gates locales** (pas la CI cloud), puisqu'on est en mode off.
2. **Bin CLI** `bin/pr-emit-local.ts` (`pnpm … pr:emit-local --fiche <chemin>`) — lit la fiche,
   écrit `features/pr-local/{id}_{slug}.md`. Chemins résolus contre `INIT_CWD` (le projet
   cible), même correctif que `ezk-config.ts` / `review-emit.ts`. Nom de sortie = celui de la
   fiche : `{id}_{slug}.md`.
3. **Câblage `ezk-sprint`** — en `pr: false`, émettre **systématiquement** le corps de PR local
   via `pr:emit-local` (le livrable durable de la feature) ; `review:emit` reste le compte-rendu
   de revue, comme un commentaire de PR.

**Conforme par construction** : le rendu vise le garde-fou existant
`skills/ezk-pr/scripts/check-pr-body.sh` ; un test exécute ce script sur un rendu complet.

**Compose, ne réimplémente pas** : réutilise le loader de fiches (extraction du corps) et le
contrat `check-pr-body`. Ne touche pas au mode GitHub allumé (le corps de PR y reste recopié à
l'ouverture de la vraie PR ; générer ce corps via le même moteur est une extension possible,
hors de ce cran).

## Critères d'acceptation

- [ ] `pr:emit-local --fiche <fiche>` écrit `features/pr-local/{id}_{slug}.md` = provenance +
      rendu de la fiche + matrice Validation.
- [ ] Le chemin de sortie est résolu contre le **projet cible** (`INIT_CWD`), pas le monorepo.
- [ ] Le rendu d'une fiche complète **passe** `check-pr-body.sh`.
- [ ] `ezk-sprint` en `pr: false` prescrit cette émission **systématique** (fin de sprint).
- [ ] Gate mega-city verte (`pnpm test` + `typecheck`).

## Comment vérifier

- [ ] `pnpm --dir products/mega-city exec vitest run src/pr-body` — vert (dont le contrôle
      « le rendu passe check-pr-body.sh »).
- [ ] Depuis un projet cible sans remote : `pnpm --dir <vectorz>/products/mega-city pr:emit-local
      --fiche features/{id}_{slug}.md` → fichier écrit **dans le projet**, lisible seul.
- [ ] `bash products/mega-city/skills/ezk-pr/scripts/check-pr-body.sh features/pr-local/{id}_{slug}.md`
      → OK (sur une fiche complète).

## Notes / décisions

- **Précision PO** (Thomas, 2026-09-17) : le fichier local doit contenir « ce qu'une PR
      contiendrait en texte — le même texte qui serait copié sur la PR GitHub ». D'où le rendu
      de la fiche (ADR-0029), pas le compte-rendu de revue.
- **Distinct de [[20260916225506856]]** : 856 a posé le mode off (lecteur config + squash local
      + émission review). Ce cran ajoute le **corps de PR local** systématique, qui manquait.
- **Trou corrigé en amont** : `review:emit` résolvait mal son dossier de sortie (PR #251) ; le
      même correctif `INIT_CWD` est appliqué au nouvel émetteur.
