---
name: ezk-release
description: >-
  Passe qualité d'une VERSION entière avant son tag — une gate composable (GO/NO-GO) qui
  enchaîne des passes bloquantes déclarées (DoD mécanique + chasse aux bugs adverse au départ,
  revue design-system et autres en plus). Un NO-GO bloque `ezk backlog version close --tag`.
  À jouer en FIN D'ITÉRATION (le lot de features d'une version), pas par feature. Désactivable
  par `.vectorz/config.yml → release.gate: off`.
argument-hint: "<vX.Y.Z>"
---

# ezk-release — la gate de version

> **Pas `ezk-reviewer`.** `ezk-reviewer` juge **une feature** (par PR, GO/NO-GO sur le code).
> `ezk-release` juge **une version entière** avant son tag, en **composant** des passes — dont
> la chasse aux bugs qui peut appeler `ezk-reviewer` en mode adverse. Niveaux différents.

## En clair

Avant de taguer une version, on veut une **passe ultime** qui verrouille la qualité et **bloque
le tag** tant que ce n'est pas GO. `ezk release <vX.Y.Z>` enchaîne des **passes bloquantes
déclarées** (GO/NO-GO) ; le verdict global est GO seulement si **toutes** les passes sont GO.
Un NO-GO **refuse** `ezk backlog version close --tag`. Capacité **méthode**, réutilisable par
tous les projets, **désactivable** par config.

## Usage

```bash
ezk release <vX.Y.Z>        # joue les passes, écrit le verdict, exit 0 si GO / 1 si NO-GO
```

Le verdict est écrit sous `.vectorz/release/<version>.json` (transitoire, gitignoré). C'est lui
que `ezk backlog version close <version> --tag` relit : il **refuse** le tag si le verdict est
absent, NO-GO, ou **périmé** (établi sur un autre commit que HEAD). Soupape PO **journalisée** :
`ezk backlog version close <version> --tag --release-ok "<raison>"`.

## Composable — les passes sont des DONNÉES

Les passes vivent dans `.vectorz/release-passes.yml` (ou, absent, les **deux passes du socle**).
Chaque passe est `{ id, title, command }` ; `{root}` et `{version}` sont substitués dans la
commande ; **GO si la commande rend le code 0**. Ajouter une passe = **une ligne de plus**, jamais
une réécriture.

```yaml
passes:
  - id: dod-mecanique
    title: Definition of Done mécanique — la version est cohérente et complète
    command: ezk --root {root} backlog version check {version}
  - id: chasse-aux-bugs
    title: Chasse aux bugs adverse — verdict ezk-reviewer requis
    command: test -f {root}/.vectorz/release/{version}.bughunt-go
  # Passe ajoutée sans toucher au skill (fiche sœur 20261011153019643) — une ligne de plus :
  # - id: design-system
  #   title: Revue design-system — l'UI livrée respecte le référentiel du projet
  #   command: ezk --root {root} design-system check {version}
```

**Les deux passes du socle** (v0.11) :

1. **`dod-mecanique`** — la version est cohérente (`ezk backlog version check`). Déterministe.
2. **`chasse-aux-bugs`** — un agent adverse (`ezk-reviewer` en mode adverse) rejoue les parcours
   réels du lot au-delà des tests unitaires. Le skill ne juge pas lui-même : la passe exige un
   **feu vert enregistré** par la revue, le fichier `.vectorz/release/<version>.bughunt-go`
   (créé une fois la chasse aux bugs faite et GO). Tant qu'il manque, la passe est NO-GO.

## La passe design-system (opt-in, fiche 20261011153019643)

Une passe prête à déclarer, pour verrouiller que l'**UI livrée respecte le référentiel de design**
du projet (le « verrou moche » de muti, découvert trop tard). Elle n'est pas dans le socle : on
l'**ajoute en donnée** quand le projet a un design-system (preuve de la composition).

```yaml
  - id: design-system
    title: Revue design-system — l'UI livrée respecte le référentiel du projet
    command: ezk --root {root} design-system check {version}
```

`ezk design-system check <vX.Y>` se comporte comme la chasse aux bugs — **il ne juge pas lui-même** :

- **Référentiel absent** (défaut `.rules/design-system.md`, surchargé par
  `.vectorz/config.yml → release.design_system.reference`) → passe **sautée proprement** (GO).
- **Référentiel présent, aucun verdict** → **NO-GO** : un agent (ex. `ezk-ux`) fait la revue puis
  enregistre `.vectorz/release/<version>.design-system.json` (`{ version, verdict, gaps, at, head }`).
- **Verdict GO** → GO. **Verdict NO-GO** → NO-GO en **nommant les écarts**.

## Désactivation

`.vectorz/config.yml → release.gate: off` (ou projet sans version taguée) → `ezk release` se
**saute proprement** (GO, exit 0) et `version close --tag` ne consulte aucun verdict.

## Frontière — compose, ne réimplémente rien

- La **DoD mécanique** réutilise `ezk backlog version check` (le cœur `versions.ts`).
- La **chasse aux bugs** délègue à `ezk-reviewer` (modèle adverse) ; le skill ne refait pas la revue.
- Le **blocage du tag** vit dans `ezk backlog version close --tag`, pas dupliqué ici.

## Garde-fous

- Un NO-GO **bloque le tag** ; seule la **soupape PO journalisée** (`--release-ok "<raison>"`) passe outre.
- Un verdict **périmé** (commit ≠ HEAD) est traité comme absent : rejoue `ezk release`.
- Les passes sont des **données** : jamais de logique de passe codée en dur dans le skill.
