---
name: ezk-npm-scripts
argument-hint: "[help|audit|fix|init|convention]"
description: >-
  Garantit que les scripts npm/pnpm/turbo d'un monorepo sont cohérents : chaque
  package enfant possède ses commandes, et le package.json RACINE les CENTRALISE
  sous des noms hiérarchiques clairs (verbe:cible[:sous-cible]) qui délèguent via
  --filter / turbo, pour qu'on lance tous les cas d'usage depuis la racine sans
  retaper --filter. A utiliser quand l'utilisateur veut « centraliser/nettoyer/
  harmoniser les scripts », demande « pourquoi je dois taper --filter @scope/pkg »,
  veut « toutes les commandes accessibles depuis le root », auditer/vérifier que
  les scripts du monorepo sont cohérents, ou s'assurer qu'un cas d'usage
  (dev:mobile:android, build:desktop, ci:local…) est piloté depuis la racine.
  Pilotable par sous-commandes : help, audit, fix, init, convention. AUDIT d'abord
  (rapport, ne modifie rien), fix opt-in (diff + confirmation). Référence de
  convention : le monorepo `muti`. NE force PAS le même set sur chaque package
  (une crate Rust ≠ une app Vite ≠ des docs) : vocabulaire partagé appliqué là où
  ça a du sens. Respecte le runner en place (turbo vs pnpm -r). Une seule
  responsabilité (hygiène des scripts) : s'intègre à ezk-ci et ezk-commits sans
  déborder sur CI/release/versioning.
---

# ezk-npm-scripts

Tu maintiens l'**hygiène des scripts d'un monorepo** : chaque **package enfant** possède
ses commandes, et le **`package.json` racine les expose toutes** sous des noms
**hiérarchiques cohérents** (`verbe:cible[:sous-cible]`) qui **délèguent** — pour qu'on
lance **tous les cas d'usage depuis la racine**, sans jamais avoir à connaître le nom du
package ni retaper `pnpm --filter @scope/pkg run …`.

## Usage (sous-commandes)

`/ezk-npm-scripts [sous-commande]` — ou en langage naturel (« centralise mes scripts »,
« pourquoi je dois taper --filter ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau + un résumé d'audit si un monorepo est détecté |
| `audit` | **Rapport seul** (ne modifie rien) : écarts root↔enfants, alias cassés, dérives de nommage |
| `fix` | Applique les corrections proposées (ajout d'alias root, renommages) — **diff + confirmation** |
| `init` | Monorepo vierge : scaffolde le vocabulaire racine + une note de convention |
| `convention` | Affiche la convention de référence (le pattern `muti`) |

> Sans sous-commande reconnue → traite la demande en prose (la skill reste pilotable naturellement).

## La convention (référence : `muti`)

> `muti` = un de mes monorepos, pris comme **exemple de référence** (son root
> `package.json` est exemplaire) — pas une dépendance ni un repo à cloner. La
> sous-commande `convention` ré-explique le pattern en clair, sans y accéder.

1. **Noms hiérarchiques** `verbe:cible[:sous-cible]` :
   `dev`, `dev:web`, `dev:desktop:electron`, `build:desktop:mac`, `ci:local:verify`…
   Lecture immédiate, complétion shell naturelle, regroupement visuel.
2. **Le root CENTRALISE** chaque commande courante et **délègue** à l'enfant :
   `pnpm --filter @scope/pkg run <script>` ou `turbo <task> --filter=@scope/pkg`.
   → On lance tout depuis la racine ; `--filter` ne se tape jamais à la main.
3. **L'enfant POSSÈDE** la vraie commande (sa logique, ses outils) ; le root ne fait que
   **surfacer / agréger** (`turbo build`, `pnpm -r test`…).
4. **Vocabulaire commun** : `dev` · `build` · `test` · `lint` · `typecheck` · `clean`,
   + variantes par cible, + tâches **non-package** (release, checks, bump) en
   **`scripts/*.sh` dédiés** appelés par un script racine.
5. **Une responsabilité par script**, **aucun alias mort**, **pas de double-saisie**.

## `audit` — le rapport (ne modifie rien)

1. **Détecter le monorepo + le runner** : `package.json` racine (`workspaces`), 
   `pnpm-workspace.yaml`, présence de `turbo.json`. Si pas un monorepo → le dire, stop.
2. Lancer le helper déterministe : `node <skill>/scripts/audit.mjs [racine-du-repo]`.
   Il liste les scripts **racine** et **par package**, et repère :
   - **Scripts enfants non exposés** au root (aucun alias ne les délègue) ;
   - **Alias root cassés** : `--filter <pkg>` vers un package/script **inexistant** ;
   - les packages **sans** verbe standard (`dev`/`build`/`test`/`lint`/`typecheck`).
3. **Ajouter le jugement** (ce que le helper ne tranche pas) :
   - **Nommage** hors `verbe:cible[:sous]` ou incohérent entre frères → proposer le bon ;
   - verbe manquant **pertinent** vs non-pertinent (⚠️ ne pas réclamer `build` sur un
     package docs, ni `dev` sur une lib pure) ;
   - **double logique** (chaînes `--filter` dupliquées là où un délégué existe).
4. **Rendre un rapport priorisé** : *cassé* (alias morts) > *invisible* (cas d'usage non
   surfacé) > *incohérent* (nommage) > *cosmétique*. Proposer les correctifs **sans les
   appliquer**.

## `fix` — appliquer (opt-in)

1. **Toujours après un `audit`** et avec l'accord de l'utilisateur ; montrer le **diff**.
2. Corrections typiques :
   - **Ajouter** au root les alias manquants qui délèguent à un script enfant existant
     (nom hiérarchique cohérent) ;
   - **Renommer** un alias root incohérent (⚠️ voir garde-fous : ne pas casser un script
     **public** référencé par la CI, un hook, un README) ;
   - **Supprimer / réparer** un alias mort.
3. **Ne réécris pas** la logique d'un script enfant (ce n'est pas le rôle de cette skill).
4. Commit `chore(scripts): …` (cf. `ezk-commits`), une PR par lot.

## `init` — monorepo vierge

1. Détecter une **convention déjà en place** (turbo, scripts racine existants) → l'**épouser**.
2. Sinon, scaffolder à la racine le **vocabulaire de base** (`dev`/`build`/`test`/`lint`/
   `typecheck`/`clean` agrégés via le runner détecté) + une courte note de convention
   (`docs/SCRIPTS.md` ou section README), puis surfacer les scripts enfants existants.
3. Commit `chore(scripts): centralize root scripts`.

## Garde-fous

- **NE PAS** réclamer le même set de commandes sur **chaque** package — vocabulaire
  partagé **là où c'est pertinent** (une crate Rust ≠ une app Vite ≠ des docs).
- **Respecter le runner** existant : si le repo utilise `turbo`, déléguer en `turbo` ;
  s'il fait `pnpm -r`, ne pas imposer `turbo`.
- **Ne jamais casser un script public** sans le signaler : un `lint`/`build`/`test`/
  `eas-build-post-install`… peut être appelé par la **CI**, un **hook**, **EAS**, un README.
  Préférer **ajouter** un alias clair plutôt que renommer un existant ; si renommage,
  garder un alias de compat ou prévenir explicitement.
- **`audit` ne modifie rien** ; `fix` n'agit qu'après diff + confirmation.
- **Une seule responsabilité** : hygiène des scripts. Ne pas réécrire la CI/le release/le
  versioning (ça reste à `ezk-ci` et aux `scripts/*.sh` métier).

## Intégration

- **ezk-ci** : surface les `ci:local*` au root, mais leur **logique** appartient à `ezk-ci`.
- **ezk-commits** : modifs en `chore(scripts): …`, une PR par lot.
- Référence de convention : le monorepo **`muti`** (root `package.json` exemplaire).
