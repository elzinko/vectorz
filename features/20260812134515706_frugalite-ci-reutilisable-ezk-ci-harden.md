---
id: "20260812134515706"
title: Frugalité CI réutilisable — étendre ezk-ci d'un `harden`/`apply` (recettes appliquées par repo)
type: feature
priority: P1
product: mega-city
labels: [enabler, ci, cost]
status: todo
ready: 2026-08-21
pr:
created: 2026-08-12
---

# 20260812134515706 — Frugalité CI réutilisable (ezk-ci `harden`) — suite de #0159

## Contexte / Problème

**En clair.** vectorz (privé, GitHub Free) a tapé **92 % du quota Actions** (1 847 / 2 000 min).
Correctif appliqué sur son `ci.yml` (skip `**/*.md`, `push:main`+PR gatés non-`.md`, `cobaye-smoke`
gaté). Mais le problème **n'est pas propre à vectorz** : un audit lecture-seule de 12 autres repos
privés montre un coût **ultra-concentré**, sur des stacks **totalement différentes** :

| Repo | Runs (~30j) | Stack | Frugalité actuelle |
|---|---:|---|---|
| city-guided | **351** | Render + AWS | concurrency ✅, paths-ignore ✅, **e2e non gaté** + double-run push/PR |
| samplerz | **347** | app desktop + e2e | déjà frugal (PR-only, paths-ignore, `changes`, e2e gaté) → burn = **vélocité** |
| muti | 144 | pnpm monorepo | PR-only ✅ mais **sans `paths-ignore` `.md`** (la référence ezk-ci elle-même !) |

`0159` (shipped, PR #34) a livré le volet **mesurer + proposer** (`conso` / `frugal`). Il **s'arrête
à proposer des diffs** — il ne configure pas les repos. Le manque restant : un chemin qui **applique**
les patterns manquants, **par repo**, de façon réutilisable et prouvée.

## Valeur

Le coût CI est **concentré et récurrent** : chaque repo privé re-paie la même poignée de réglages
manquants, à la main, quand quelqu'un y pense. `0159` a rendu le diagnostic automatique mais laisse
l'application manuelle. Ce chaînon **applique** la recette, par repo, de façon idempotente et prouvée —
on cesse de re-bricoler les mêmes `paths-ignore` / gates sur chaque projet, et on arrête de découvrir
l'épuisement du quota après coup.

## Proposition

**Décision tranchée par l'audit — les recettes se généralisent, pas le workflow.** Les workflows sont
structurellement irréductibles (release desktop vs deploy AWS vs upload-videos Vercel) : impossible de
les factoriser en un `workflow_call` partagé. Mais ils partagent tous **les 4-5 mêmes patterns**
(skip-docs, PR-only vs push, `concurrency`, gate-du-lourd, `workflow_dispatch` pour le deploy).

- **Option A — reusable workflow / composite action mega-city partagé** : *rejetée* comme forme
  générale (ne rentre que sur une sous-famille même-stack). **Différée** tant que < 2 repos
  même-stack le réclament.
- **Option B — étendre `ezk-ci` d'un `harden`/`apply`** *(retenue)* : une sous-commande interactive
  qui audite (réutilise `frugal`), **pose les bonnes questions**, puis **applique** un template
  paramétré selon les patterns manquants du repo. `ezk-ci` a déjà `conso`/`frugal`/`bootstrap` — on
  ajoute le bras qui *pose*, pas un nouvel objet.

**Frontière (ADR-0001).** Le **script** fait le déterministe (poser `paths-ignore`, gater un job,
déposer le template, mesurer via `gh`) ; le **LLM** ne fait que le **jugement** (quels patterns
collent à CE repo, quelles questions). Coût LLM **plat**, pas exponentiel. Les recettes vivent en
`.md` **mais exécutables** (template paramétré + script qui l'applique) — pas de prose que rien ne
compile (leçon panels-adverses).

## Critères d'acceptation

- [ ] `ezk-ci harden <repo>` : audite → propose → **applique** les patterns manquants après confirmation.
- [ ] Recettes versionnées comme **templates paramétrés testables** (pas prose seule).
- [ ] **Idempotent** : un re-run ne casse pas une conf déjà frugale.
- [ ] Reste **lecture-seule** en mode audit (aucune écriture sans confirmation).
- [ ] Prouvé sur **≥ 2 repos réels** : candidats `muti` (ajouter `paths-ignore` `.md`) et
      `city-guided` (gater `e2e`).
- [ ] **Différé explicite** : le workflow réutilisable partagé (Option A) reste hors scope tant
      que < 2 repos même-stack le réclament.

## Comment vérifier

1. **Idempotence** : sur un repo déjà frugal (ex. `samplerz`), `ezk-ci harden` en mode audit ne
   propose rien et n'écrit rien ; un second run ne casse pas la conf.
2. **Application prouvée** : sur `muti`, `harden` ajoute le `paths-ignore` `.md` manquant ; sur
   `city-guided`, il gate le job `e2e`. Vérifier le diff produit **après confirmation** uniquement.
3. **Lecture seule en audit** : le mode audit n'écrit aucun fichier (`git status` propre après un audit).
4. **Recettes testables** : les templates paramétrés ont une DoD exécutable (pas de prose seule).
5. Gate locale verte (tests du skill + lint).

## Notes

- **Suite de #0159** (mesurer/proposer, shipped) → cette fiche = **appliquer/généraliser**.
- Preuve d'audit conservée ci-dessus (runs ~30j, hétérogénéité des stacks) = la donnée qui tranche A vs B.
- Le pattern **skip-docs** est agnostique à la stack (généralise trivialement) ; **gate-du-lourd** et
  **workflow partagé** sont stack-spécifiques → c'est ce qui condamne A comme forme générale.
- **Dépendances externes (constatées).** La preuve « ≥ 2 repos réels » vise deux repos hors monorepo,
  tous deux présents localement : dépendance `muti` — accès constaté le 2026-08-21
  (`/Users/elzinko/git/bacasable/muti`) ; dépendance `city-guided` — accès constaté le 2026-08-21
  (`/Users/elzinko/git/bacasable/city-guided`). Repli si un repo devient inaccessible au build :
  prouver le mécanisme sur des **fixtures de workflow internes** au monorepo, la preuve sur repos réels
  passant en recette manuelle différée (ne bloque pas la DoR).
- **Groom 2026-08-21** : DoR complétée — valeur explicitée, section « Comment vérifier » ajoutée,
  slot **dépendances externes** traité (accès muti/city-guided constaté ce jour + repli fixtures).
  Statut/`ready:` inchangés (gate au PO).
