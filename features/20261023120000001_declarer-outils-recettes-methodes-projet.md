---
id: "20261023120000001"
title: "Découvrir les recettes et outils applicables depuis un projet hôte (ezk recipes)"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, cli]
depends: ["20261023120000002"]
status: ready
pr:
evidence: none # capacité de méthode (commande de découverte) ; preuve = tests + rejeu du cas muti
created: 2026-10-23
---

# 20261023120000001 — Découvrir les recettes et outils d'un projet (`ezk recipes`)

## En clair

Une recette de méthode existe déjà comme objet (`recipes/<nom>.md`, catalogue `recipes/RECIPES.md`,
skill `ezk-chef`), et depuis la sœur [002](done/20261023120000002_contrat-recette-autodeclaree.md) un
**dossier** se déclare recette en portant un `RECIPE.md`. Le trou qui reste n'est **pas** « déclarer »,
c'est **découvrir** : depuis l'intérieur d'un projet hôte, quelles recettes et quels outils globaux
(`ezk-secret`…) s'appliquent ici, **sans deviner**. On construit pour ça une commande terminal en
lecture seule, `ezk recipes`. **Pas de nouveau manifeste** : on réutilise la primitive recette.

## Si tu arrives frais

Un **outil** = du code déjà fait, à **intégrer** (ex. `ezk-secret`). Une **recette** = une procédure à
**lancer** (un skill, un runbook). Les deux manquent d'un point de **découverte** au niveau du projet
hôte : aujourd'hui une session doit les deviner.

## Contexte / Problème

- **Symptôme vécu (2026-10-18, projet muti)** : pour notariser un build beta, une session a dû deviner
  l'existence de `ezk-secret` (via les commentaires de `secrets.yaml` et `ezk help`), faute de point de
  découverte dans le projet. Elle a même commencé par inventer un `.env.beta.local` hors convention
  avant d'être recadrée.
- **Ce qui existe** : `ezk` est une CLI de méthode liée **globalement** ; les skills `ezk-*` sont
  globaux ; un projet hôte porte des déclarations partielles et éparses (`CLAUDE.md`, mémoire,
  `secrets.yaml`, `.rules/`, `ezk help`). La sœur 002 ajoute le contrat `RECIPE.md` par dossier.
- **Le manque** : aucune surface ne répond, depuis la racine d'un projet, « quelles recettes et quels
  outils puis-je utiliser ici ? ». La découverte repose sur la convention et la mémoire.

## Proposition

**Ce qu'on construit.** Une commande terminal **`ezk recipes`**, en **lecture seule**, qui depuis la
racine d'un projet hôte nomme :

- ses **recettes déclarées** — les dossiers portant un `RECIPE.md`, via le scan `scanDeclaredRecipes`
  livré par la sœur [002](done/20261023120000002_contrat-recette-autodeclaree.md) (le marcheur de
  dossiers sur disque est le **bord I/O** que 002 a laissé dehors, à écrire ici) ;
- les **outils globaux pertinents** (`ezk-secret`…), dérivés du réel par `src/loaders/tools.ts`
  (ADR-0058), pas d'une liste tenue à la main.

Puis un **garde-fou de dérive**, en **extension** de `ezk-chef check` / `ezk law doctor` (pas un
vérificateur neuf) : « déclaré X, absent » / « installé Y, non déclaré ». « Installé » se mesure par
**présence de fichier sous une racine injectée** (jamais via le `PATH` — sinon test flaky).

**Pourquoi cette voie (panel adverse du 2026-10-27).** Pas de nouveau manifeste ni de 2ᵉ catalogue : la
primitive recette existe déjà et est réutilisée. L'incident fondateur (muti, deviner `ezk-secret`)
portait sur une recette **qui existait** (`recipes/secrets-trousseau.md`, `ready` depuis le 2026-10-03)
— un trou de **découverte**, pas une primitive manquante. La voie « manifeste `.vectorz/recipes.yml` »
est écartée (2ᵉ surface de listing, fichier statique qui pourrit) ; la voie « étendre `config.yml` »
aussi (une porte de **comportement**, pas un catalogue).

**POC d'abord** : la commande de découverte (la douleur prouvée). Le garde-fou de dérive vient ensuite,
dans le même lot ou juste après.

## Critères d'acceptation

> POC d'abord : la commande de découverte. Chaque critère porte une preuve rejouable.

- [ ] `ezk recipes --root <projet>` liste, en **lecture seule**, les dossiers du projet portant un
      `RECIPE.md`, via `scanDeclaredRecipes` (fiche 002) — **aucun nouveau format de catalogue**.
      Preuve : un projet-fixture avec un `RECIPE.md` est listé ; un dossier sans déclaration ne l'est pas.
- [ ] La même commande nomme les **outils globaux pertinents** (`ezk-secret`…) via `tools.ts`, sans
      deviner. Preuve : rejeu du cas muti — `ezk-secret` apparaît sans qu'on invente de `.env*`.
- [ ] La commande est **strictement en lecture seule** : HEAD et arbre de travail inchangés après
      exécution (un test le constate).
- [ ] La distinction **outil** (à intégrer) vs **recette** (à lancer) est portée par la primitive
      existante (Ustensiles vs dossier `RECIPE.md`), pas par un schéma concurrent.
- [ ] Garde-fou de dérive = **extension** de `ezk-chef check` / `ezk law doctor` (« déclaré X, absent »
      / « installé Y, non déclaré »), « installé » = présence de fichier sous une racine injectée. Un
      cas de chaque, testé.
- [ ] Gate locale verte (typecheck + tests + suites de scripts).

## Comment vérifier

```bash
# Depuis un projet-fixture portant un dossier avec RECIPE.md et un outil global applicable :
ezk recipes --root <projet-fixture>
# → liste la recette déclarée ET nomme ezk-secret, sans rien deviner.
git -C <projet-fixture> status --porcelain   # vide : la commande n'a rien écrit (lecture seule)
```

## Notes / décisions

- **Origine** : rédigée dans le projet **muti** le 2026-10-18 (fiche `muti:features/20261018084803445_declarer-outils-recettes-methodes-projet.md`),
  mais c'est de la **méthode (vectorz)**. Rapatriée ici le 2026-10-23 pour la milestone `recettes`. La
  fiche muti reste le constat d'origine côté hôte ; **ne pas** la déplacer ni la modifier (des sessions
  muti y travaillent).
- Milestone `recettes` (découvrabilité), sœur de [Contrat de recette auto-déclarée](done/20261023120000002_contrat-recette-autodeclaree.md).
- **Dépendance constatée le 2026-10-28** : la sœur 002 est **livrée** (cœur pur `src/core/recipe-contract.ts`,
  `scanDeclaredRecipes` disponible) ; `src/loaders/tools.ts` (ADR-0058), le skill `ezk-chef` et
  `ezk law doctor` existent. La commande réutilise ces briques, elle n'en crée pas.
- **2026-10-27 : panel adverse (3 voix) → NO-GO sur un manifeste neuf.** Fait décisif : la primitive
  recette existe (`recipes/` + `ezk-chef` + `tools.ts`), et l'incident muti portait sur une recette
  déjà `ready`. Le trou est la **découverte depuis un projet hôte**. Voie retenue : réutiliser la
  primitive + la commande `ezk recipes` + étendre `ezk-chef check` / `law doctor` pour la dérive.
  Dépendance inversée en `001 depends: 002` (l'auto-déclaration passe avant).
- **2026-10-28 — groomée et tirée (`ready`) sur décision PO.** 002 livrée → la dépendance est
  satisfaite ; le re-cadrage du panel (réutiliser la primitive, découverte terminal) devient le
  périmètre. Preuve mince assumée (règle [`agent-ops/preuve-mince-question-pas-veto`](../products/mega-city/rules/agent-ops/preuve-mince-question-pas-veto.md)) :
  le besoin « découvrir sans deviner » est prouvé par le cas muti, le PO tranche d'avancer.
