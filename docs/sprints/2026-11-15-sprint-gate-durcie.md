# Compte rendu de sprint — « La gate de release se durcit » (2026-11-15, nuit)

## En clair

La session pilote a construit, relu et intégré deux stories cohérentes sur la **gate de release**,
pendant que la session autonome `q` était à l'arrêt. Les deux sont dans **main local** (rien poussé).
La gate joue maintenant les tests du projet, et elle **compose** ses contrôles au lieu de les remplacer
en silence. Une story est entièrement faite ; l'autre est un POC partiel dont la suite dépend de fiches
non livrées.

## Le lot livré (main local, rien poussé)

| Fiche | Story | Commit | État |
|---|---|---|---|
| [20261114131613314](../../features/done/20261114131613314_gate-de-release-joue-les-tests.md) | La gate de release joue les tests du projet | `52dafa7f` | **fait** (tous les critères) |
| [20261114131616085](../../features/20261114131616085_ezk-release-passes-list-add-remove.md) | Composer les passes de la gate et les lister | `89f7f9de` | **POC partiel** : compose + `passes list` faits ; `add`/`remove` et `--type` différés |

Statut backlog : les deux fiches restent `idea` dans `features/`. Le passage en `shipped`
(déplacement vers `done/`, régénération de l'index) n'a **pas** été fait — il demande de refaire les
liens croisés (la fiche 616085 pointe vers 613314) et, pour le chemin GitHub, une PR. C'est une étape
de backlog à faire par `q` (ou supervisée), pas seul en autonomie de nuit.

## Ce qui est dans le code

- **Passe `tests` à trois états** (GO / NO-GO / **sautée**) : la gate lit `release.tests` et joue les
  tests du projet ; sans la clé, la passe est sautée (dite, jamais un GO muet) ; une valeur mal typée
  est refusée en nommant la clé.
- **Composition des passes** : le projet **complète** le socle (`replace: true` le remplace), dans une
  seule fonction pure `effectivePasses`, partagée par la gate et par `list`.
- **`ezk release passes list`** : affiche les passes effectives, chacune avec sa source (socle / projet).

## Qualité

- Gate entière verte à chaque étape (typecheck + ~2340 tests + 48 suites de scripts).
- Revue adverse par `/code-review` (le persona `ezk-reviewer` n'est pas bindable en desktop — revue
  par l'outil, nommée). Elle a trouvé un **vrai défaut dans chaque story** : un crash de
  `backlog version close --tag` sur un `release.tests` mal typé, puis un drapeau `replace` non-booléen
  ignoré en silence. Les deux corrigés, re-gate verte.

## Rétro

- **Marché.** La composition dans une fonction pure unique ; la story 2 a **durci** la story 1 (fin du
  garde fragile par égalité de référence). La revue adverse paie à chaque story.
- **Coincé.** Deux murs d'environnement : personas de rôle non bindables en desktop, écriture limitée au
  worktree de la session. Build à la main, intégration par `ezk forge integrate` (squash local).
- **Reporté, assumé.** `passes add`/`remove` (écriture YAML) et `--type agent|rules` dépendent des
  fiches `20261114131615903` (verdict) et `20261114131615350` (law show) ; le contrat `config-show` v2
  (`20261114131613503`) touche l'écran cop1. Ces morceaux vont à `q` ou à une session supervisée.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" release passes list          # dod-mecanique, chasse-aux-bugs, tests (sautée) — source socle
pnpm --dir products/mega-city test -- src/__tests__/release-gate.test.ts
```
