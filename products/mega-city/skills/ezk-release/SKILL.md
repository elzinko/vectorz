---
name: ezk-release
description: >-
  Passe qualité d'une VERSION entière avant son tag — une gate composable (GO/NO-GO) qui
  enchaîne des passes bloquantes déclarées (DoD mécanique + chasse aux bugs adverse au départ,
  revue design-system et autres en plus). Un NO-GO bloque `ezk backlog version tag`.
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
Un NO-GO **refuse** `ezk backlog version tag`. Capacité **méthode**, réutilisable par
tous les projets, **désactivable** par config.

## Usage

```bash
ezk release <vX.Y.Z>        # joue les passes, écrit le verdict, exit 0 si GO / 1 si NO-GO
```

Le verdict est écrit sous `.vectorz/release/<version>.json` (transitoire, gitignoré). C'est lui
que `ezk backlog version tag` relit : il **refuse** la coupe si le verdict est
absent, NO-GO, ou **périmé** (établi sur un autre commit que HEAD). Soupape PO **journalisée** :
`ezk backlog version tag <version> --release-ok "<raison>"`.

Le geste complet tient en trois commandes :

```bash
ezk release <vX.Y.Z>                          # la gate : GO ou NO-GO
ezk backlog version tag <vX.Y.Z> --dry-run    # à blanc : voir la coupe et le numéro, rien n'est écrit
ezk backlog version tag <vX.Y.Z>              # la coupe : étiquette locale, jamais poussée
```

Le `git push origin <étiquette>` reste au PO.

## Composable — les passes sont des DONNÉES

Les passes vivent dans `.vectorz/release-passes.yml` (ou, absent, les **deux passes du socle**).
Chaque passe est `{ id, title, command }` ; `{root}` et `{version}` sont substitués dans la
commande ; **GO si la commande rend le code 0**. Ajouter une passe = **une ligne de plus**, jamais
une réécriture.

```yaml
passes:
  - id: dod-mecanique
    title: Definition of Done mécanique — la coupe de la version est possible (dry-run de `version tag`)
    command: ezk --root {root} backlog version tag {version} --dry-run
  - id: chasse-aux-bugs
    title: Chasse aux bugs adverse — verdict posé par ezk release verdict
    command: ezk --root {root} release verdict-check chasse-aux-bugs {version}
  # Passe ajoutée sans toucher au skill (fiche sœur 20261011153019643) — une ligne de plus :
  # - id: design-system
  #   title: Revue design-system — l'UI livrée respecte le référentiel du projet
  #   command: ezk --root {root} design check {version}
```

**Les deux passes du socle** (v0.11) :

1. **`dod-mecanique`** — la coupe est possible (`ezk backlog version tag <v> --dry-run`). Déterministe.
   Le dry-run rend le code 1 quand il refuse : numéro qui ne dépasse pas la dernière étiquette,
   patch qui couperait une fiche hors bug, ou **rien à couper** (aucune fiche livrée depuis la
   dernière étiquette). Cette passe lit ces refus comme un **NO-GO** : une coupe vide n'a rien à
   étiqueter, et la vraie coupe la refuserait aussi.
2. **`chasse-aux-bugs`** — un agent adverse (`ezk-reviewer` en mode adverse) rejoue les parcours
   réels du lot au-delà des tests unitaires. Le skill ne juge pas lui-même : la revue POSE un
   **verdict** par commande — `ezk release verdict chasse-aux-bugs <version> go|no-go "<motif>"` —
   avec son motif, son auteur et le commit. La passe le relit : GO seulement si le verdict est GO
   et posé sur HEAD ; un verdict posé sur un autre commit est **périmé** (NO-GO) ; sans verdict, NO-GO.

## Composer les passes : le projet complète le socle (ou le remplace)

Un projet déclare ses passes dans `.vectorz/release-passes.yml`. Par défaut, elles **complètent** le
socle : `ezk release` joue d'abord `dod-mecanique`, `chasse-aux-bugs`, la passe `tests`, puis les
passes du projet. Pour **remplacer** le socle plutôt que le compléter, le fichier pose `replace: true`
en tête. En mode « complète », un id de passe projet qui réutilise un id du socle est **refusé**
(jamais deux passes homonymes).

`ezk release passes list` affiche les passes effectives dans l'ordre joué, chacune avec sa **source**
(`socle` ou `projet`). La passe `tests` vient du réglage `release.tests` ; sans la clé, elle est
**sautée** (dite, jamais un GO muet).

Trois commandes règlent les passes sans éditer le YAML à la main :

- `ezk release passes add <id> --title "<titre>" --command "<cmd>"` ajoute une passe projet (un id
  déjà pris, du socle ou du projet, est refusé avant écriture) ; `--type agent <nom>` crée à la place
  une passe qui lit le **verdict** d'un agent (`ezk release verdict <id> <version> go|no-go "<motif>"`) ;
  `--type rules <paquet>` attend son lecteur de loi (fiche `20261114131615350`) et est refusé pour l'instant.
- `ezk release passes remove <id>` retire une passe projet ; une passe du **socle** ne se retire pas
  une à une — on pose `replace: true` pour déclarer ses propres passes.

## La passe design-system (opt-in, fiche 20261011153019643)

Une passe prête à déclarer, pour verrouiller que l'**UI livrée respecte le référentiel de design**
du projet (le « verrou moche » de muti, découvert trop tard). Elle n'est pas dans le socle : on
l'**ajoute en donnée** quand le projet a un design-system (preuve de la composition).

```yaml
  - id: design-system
    title: Revue design-system — l'UI livrée respecte le référentiel du projet
    command: ezk --root {root} design check {version}
```

`ezk design check <vX.Y>` se comporte comme la chasse aux bugs — **il ne juge pas lui-même** :

- **Référentiel absent** (défaut `.rules/design-system.md`, surchargé par
  `.vectorz/config.yml → release.design_system.reference`) → passe **sautée proprement** (GO).
- **Référentiel présent, aucun verdict** → **NO-GO** : un agent (ex. `ezk-ux`) fait la revue puis
  enregistre `.vectorz/release/<version>.design-system.json` (`{ version, verdict, gaps, at, head }`).
- **Verdict GO** → GO. **Verdict NO-GO** → NO-GO en **nommant les écarts**.

## Désactivation

`.vectorz/config.yml → release.gate: off` (ou projet sans version taguée) → `ezk release` se
**saute proprement** (GO, exit 0) et `version tag` ne consulte aucun verdict.

## Frontière — compose, ne réimplémente rien

- La **DoD mécanique** réutilise `ezk backlog version tag --dry-run` (le cœur de coupe `coupe*.ts`).
- La **chasse aux bugs** délègue à `ezk-reviewer` (modèle adverse) ; le skill ne refait pas la revue.
- Le **blocage du tag** vit dans `ezk backlog version tag`, pas dupliqué ici.

## Garde-fous

- Un NO-GO **bloque le tag** ; seule la **soupape PO journalisée** (`--release-ok "<raison>"`) passe outre.
- Un verdict **périmé** (commit ≠ HEAD) est traité comme absent : rejoue `ezk release`.
- Les passes sont des **données** : jamais de logique de passe codée en dur dans le skill.
