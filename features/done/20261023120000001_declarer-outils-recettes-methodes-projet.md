---
id: "20261023120000001"
title: "Découvrir les recettes applicables depuis un projet hôte (ezk recipes)"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, cli]
depends: ["20261023120000002"]
status: shipped
pr: "local (34b1251a)"
evidence: none # capacité de méthode (commande de découverte) ; preuve = tests + rejeu du cas muti
created: 2026-10-23
---

# 20261023120000001 — Découvrir les recettes et outils d'un projet (`ezk recipes`)

## En clair

Une recette de méthode existe déjà comme objet (`recipes/<nom>.md`, catalogue `recipes/RECIPES.md`,
skill `ezk-chef`), et depuis la sœur [002](20261023120000002_contrat-recette-autodeclaree.md) un
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
  livré par la sœur [002](20261023120000002_contrat-recette-autodeclaree.md) (le marcheur de
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

> Livré par le POC `ezk recipes` (2026-10-28). Chaque critère porte une preuve rejouable.

- [x] `ezk recipes [--root <projet>]` liste, en **lecture seule**, les recettes de la méthode
      (`recipes/*.md`) ET les dossiers du projet portant un `RECIPE.md`, via la primitive de la fiche
      002 — **aucun nouveau format de catalogue**. Tout ce qui a un `id` est listé (parité avec le livre
      `regen-recipes.sh`, vérifiée par test) ; une déclaration incomplète est marquée `[incomplète]`,
      jamais cachée.
- [x] La commande nomme ce que chaque recette **fabrique** (`makes`) : c'est par là que `ezk-secret` se
      découvre (recette `secrets-trousseau`), **sans deviner**. Correction du cadrage : pas via
      `tools.ts` (qui ne liste que les bin/scripts de la méthode) — c'est le `makes` de la recette qui
      porte l'outil. Preuve : rejeu du cas muti, `ezk-secret` apparaît.
- [x] La commande est **strictement en lecture seule** : `git status` propre après exécution (test D).
- [x] Gate locale verte (typecheck + 2278 tests + 45 suites de scripts), revue adverse `ezk-reviewer` GO.

## Comment vérifier

```bash
# Depuis un projet-fixture portant un dossier avec RECIPE.md et un outil global applicable :
ezk recipes --root <projet-fixture>
# → liste la recette déclarée ET nomme ezk-secret, sans rien deviner.
git -C <projet-fixture> status --porcelain   # vide : la commande n'a rien écrit (lecture seule)
```

## Suite (hors de ce POC)

- **Garde-fou de dérive** (« déclaré X absent » / « installé Y non déclaré »), extension de
  `ezk-chef check` / `ezk law doctor` → fiche de suite
  [Garde-fou de dérive des recettes](../20261028130229418_garde-fou-derive-recettes.md) (ex-critère 5).
- **Section « outils » distincte** des recettes : non livrée — le besoin prouvé (`ezk-secret`) passe
  déjà par le `makes` des recettes. À rouvrir seulement si un outil non porté par une recette doit être
  découvert (ex-critère 4).

## Notes / décisions

- **Origine** : rédigée dans le projet **muti** le 2026-10-18 (fiche `muti:features/20261018084803445_declarer-outils-recettes-methodes-projet.md`),
  mais c'est de la **méthode (vectorz)**. Rapatriée ici le 2026-10-23 pour la milestone `recettes`. La
  fiche muti reste le constat d'origine côté hôte ; **ne pas** la déplacer ni la modifier (des sessions
  muti y travaillent).
- Milestone `recettes` (découvrabilité), sœur de [Contrat de recette auto-déclarée](20261023120000002_contrat-recette-autodeclaree.md).
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
  périmètre. Preuve mince assumée (règle [`agent-ops/preuve-mince-question-pas-veto`](../../products/mega-city/rules/agent-ops/preuve-mince-question-pas-veto.md)) :
  le besoin « découvrir sans deviner » est prouvé par le cas muti, le PO tranche d'avancer.
- **2026-10-28 — buildée + shippée (local).** POC `ezk recipes` livré : cœur pur
  [`recipe-discovery.ts`](../../products/mega-city/src/core/recipe-discovery.ts) + bin
  [`ezk-recipes.ts`](../../products/mega-city/bin/ezk-recipes.ts), réutilise la primitive 002. Revue
  adverse `ezk-reviewer` = GO, après avoir attrapé **deux trous de découverte silencieux** (brouillons
  sans `source`, puis une recette au YAML non strict) : corrigés en séparant **découvrabilité** (un
  `id` suffit, parité avec le livre) de **validité** (les cinq champs, marqués `[incomplète]` sinon).
  Garde-fou de dérive (critère 5) et section outils (critère 4) → `## Suite`.
