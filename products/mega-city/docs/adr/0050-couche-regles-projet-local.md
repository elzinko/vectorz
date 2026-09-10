# ADR-0050 : Couche de règles projet-local (`.vectorz/`) pour la méthode ezk

**Statut :** Proposé
**Date :** 2026-09-10
**Déciders :** PO (Thomas)
**Panel adverse :** ezk-reviewer (GO-SI), ezk-architect (GO-SI, confronté)
**Portée :** ce ADR ne traite QU'UN axe — le **scoping projet-local + la composition des
règles de CODAGE** (conformité). Il est **subordonné** au cadrage
[`fiche 20260910155608287`](../../../features/20260910155608287_problematique-regles-ezk-typologie-verification-mesure.md),
qui laisse ouvert notamment la **mesure d'efficacité des règles de RÉTRO** (monitoring
sur-sprints, ADR-030). À ne pas accepter isolément avant ce cadrage.

## En clair

Aujourd'hui les règles ezk sont **globales** : elles s'appliquent à tous les projets qui
utilisent vectorz. On veut qu'un projet (ex. samplerz) ait ses **propres** règles, qui ne
débordent pas sur les autres. La décision : **une seule couche projet-local**, où le champ
`enforcements[]` fait le tri entre une règle **garantie** (adossée à un vrai gate exécutable)
et une règle **advisory/générative** (composée dans le prompt, jamais étiquetée « garantie »).

## Contexte

Le mécanisme de règles ezk (`rules/` + `bundles/` ; front-matter `id/kind/level(MUST|SHOULD)/
enforcements[]` + critère mesurable ; **composées** dans les prompts d'agents/commandes) est
**global**. Un projet consommateur a besoin de règles **propres**, de **deux natures** :

- **(a) invariant vérifiable a posteriori** — « pas d'import `adapters/` dans `domain/` ». Un
  lint déterministe le vérifie.
- **(b) guidage génératif a priori** — « conçois ce projet en hexagonal », « préfère la
  composition à l'héritage ». Un lint ne PEUT PAS le produire : il attrape une violation après
  coup, il ne fait pas l'agent concevoir bien au départ. Ça vit dans la **composition du prompt**.

Les mémoires projet / `CLAUDE.md` ne suffisent pas : ni enforcement, ni audit mesurable, ni
composition ciblée par rôle d'agent, ni bundles, ni niveau/provenance. `CLAUDE.md` est un blob
plat — il ne porte pas (b) proprement.

## Décision

Ajouter une **couche de règles projet-local**, **UN seul mécanisme**, discriminé par
`enforcements[]` :

- **`.vectorz/` à la racine du projet = le CONTRAT** (écrit par le projet) : règles locales +
  manifeste sélectionnant les **bundles** globaux + un **binding par règle** (`gate: <cmd | job
  CI>` | `advisory`).
- **Honnêteté ternaire STRUCTURELLE** : un **méta-gate au load** refuse tout `MUST` sans
  `enforcements[]` résolvable → advisory plafonné à `SHOULD`/`GUIDE`. On sépare « règle
  **chargée** » (texte injecté, déterministe, dumpable) de « règle **appliquée** » (seulement si
  un gate exécutable rend un code de sortie).
- **4 responsabilités séparées** : **Découvrir** (loader) + **Composer** (injecter (b) + (a) en
  hint) + **Mesurer** (compteurs) → dans **vectorz** ; **Exécuter** (le gate : import-linter,
  ruff/AST, pytest) → dans le **projet**. Vectorz ne réimplémente aucun gate.
- **Couplage INVERSÉ (DIP)** : le projet **expose** ses gates via le manifeste ; vectorz dépend
  du **contrat** (abstraction stable), jamais du CI concret. Évite le fan-out `vectorz → N-CI`.
- **Audit** : chaque gate incrémente un compteur horodaté (chargé / violé / passé). « Retirer »
  une règle-gate = preuve sur la couche déterministe (« N runs, 0 violation bloquée sur M
  sprints → candidate au retrait »). Les règles **advisory** sont retirées **par décision**, pas
  par preuve — assumé, jamais prétendu mesuré.

## Options considérées

### Option A — Couche projet-local composée *(CHOISIE, raffinée par le panel)*
| Dimension | Évaluation |
|---|---|
| Complexité | Moyenne (loader + schéma manifeste + méta-gate) |
| Garantie | Honnête : dure pour (a) via gate, molle assumée pour (b) |
| Réutilisation | Bundles sélectionnables par projet |

**Pour :** sert (a) ET (b) ; scope local + trace d'audit ; réutilise `rules`+`bundles` ; ne ment
pas sur le niveau de garantie. **Contre :** un loader + un méta-gate à écrire ; risque de
dilution de tokens (à plafonner).

### Option B — Mémoires / `CLAUDE.md` projet uniquement *(REJETÉE)*
**Pour :** existe déjà, zéro build. **Contre :** ni enforcement, ni audit mesurable, ni
composition/bundles/niveau. Ne porte proprement ni (a) ni (b).

### Option C — Registre mince + gates CI seulement *(REJETÉE — position initiale du reviewer)*
**Pour :** honnête sur l'enforcement (le CI garantit) ; pas de moteur de composition. **Contre :**
**jette le guidage génératif (b)** — ampute la valeur unique du mécanisme règles+bundles.

## Trade-off central

Deux natures de règle, deux véhicules, deux garanties — mais **un seul mécanisme**, le
front-matter tranche. La garantie est **structurelle** (méta-gate au load), pas un label tenu par
la discipline. Ce que le mécanisme garantit VRAIMENT : qu'une règle est **chargée dans le bon
périmètre** (déterministe) ; qu'elle est **appliquée** uniquement pour les règles adossées à un
gate.

## Conséquences

- **Plus facile** : règles projet enforceables (via gate) ET génératives (via composition),
  scope propre au projet, audit sur la couche dure, réutilisation de bundles.
- **Plus dur** : écrire le loader (découverte ancrée sur `git rev-parse --show-toplevel`, chemin
  résolu + SHA **émis** dans le rapport) ; le méta-gate ; la détection de conflits **au load** ;
  la précédence (**le local peut AJOUTER et DURCIR, jamais DESSERRER un MUST global** → erreur au
  load, pas shadow silencieux) ; émettre le **jeu EFFECTIF** composé, pas le déclaré.
- **À revisiter** : plafond de règles composées par agent (dilution « lost in the middle »).

## Action items — les 6 conditions du GO-SI

1. [ ] **Méta-gate** : refuser `MUST` sans `enforcements[]` résolvable (erreur de build du jeu de règles).
2. [ ] **Garder COMPOSER** (ne pas réduire au registre nu) — c'est ce qui sert (b).
3. [ ] **Inverser le couplage** : binding gate déclaré dans le manifeste du projet ; vectorz consomme le contrat.
4. [ ] **Split** découvrir + composer + mesurer (vectorz) vs exécuter (projet).
5. [ ] **POC-first / YAGNI** : loader + schéma de manifeste + méta-lint. Pas de runtime de plugins par agent.
6. [ ] **Banc d'essai = vectorz utilisé PAR UN AUTRE projet** (samplerz) exerçant **une** règle-gate ET **une** règle advisory ; prouver l'étiquetage différencié de la garantie (rouge sans loader / vert avec + test de **scoping** négatif sur un 2ᵉ projet + garde de **précédence**).

**NO-GO** si : (2) sacrifiée (retour à `CLAUDE.md` nu) — ou (3) ignorée (couplage `vectorz → N-CI` ingérable).
