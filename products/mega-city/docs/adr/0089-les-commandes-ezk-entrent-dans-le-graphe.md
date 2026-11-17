# ADR 0089 — Les commandes `ezk` entrent dans le graphe : un 7ᵉ type de nœud, un 6ᵉ verbe

**Statut :** Accepté
**Date :** 2026-11-17
**Deciders :** PO, par délégation pour le run autonome du 2026-11-17
**Fiche :** [`20261117114544666`](../../../../features/done/20261117114544666_graphe-publie-en-contrat-commandes-comprises.md)
**Amende :** [ADR-0040](0040-modele-fichiers-ezk-compile-schema-valide.md) D1 — les verbes passent à six, les sortes à sept.
**S'appuie sur :** [ADR-0058](0058-les-outils-entrent-dans-le-graphe.md) — même méthode : on calcule, on ne saisit rien.

## En clair

La carte de la méthode ne montrait pas les 75 commandes `ezk`. On les ajoute comme briques, avec un 7ᵉ
type de nœud, `command`, et un 6ᵉ verbe, `lance` : une commande *lance* l'outil qu'elle exécute. Une
compétence qui cite une commande dans sa doc l'*utilise*, avec le verbe qui existe déjà. Le graphe est
aussi publié dans un contrat versionné, `contracts/graph-check/v1/`, que mission control peut lire tel quel.

## Contexte

- Le manifeste `ezk-manifest.yml` sait déjà quelle commande exécute quel script. Le code le lisait pour
  justifier les outils (`tool.commands`, ADR-0058), mais la commande elle-même n'était pas une brique.
- Une compétence cite ses commandes dans sa doc (« lance `ezk forge integrate` »). Ce lien n'était écrit
  nulle part.
- `ezk graph check --json` n'avait ni liste de briques, ni schéma : l'écran devait deviner les briques
  depuis les liens, et une brique sans lien disparaissait.

## Décision

**1. Une commande, c'est quoi.** Une entrée du manifeste, hors anciens noms (`deprecated`). Son id est
`ezk <domaine> <verbe>`, ou `ezk <domaine>` quand le domaine est la commande. Son fichier est le manifeste.

**2. Le vocabulaire.** Nouveau type de nœud `command`. Deux nouveaux liens :

- `launches` : commande → outil, verbe **`lance`** (nouveau). L'outil est le script de `run`, au même
  format d'id que les outils (`bin/ezk-graph.ts`). Si ce script n'est pas un outil connu, aucune arête
  n'est émise : jamais un lien cassé de plus.
- `uses-command` : compétence → commande, verbe **`utilise`** (déjà là, ADR-0058). Pas de verbe neuf.

Le jeu passe à six verbes : `compose`, `convoque`, `applique`, `est-verifie-par`, `utilise`, `lance`.
Le test `graph-vocabulary` fige le jeu et le couple `command>tool`.

**3. Le lien compétence → commande est calculé.** Une compétence *utilise* une commande quand son
`SKILL.md`, ou un fichier markdown de son dossier, la cite **entre backticks** : `` `ezk <domaine> <verbe>` ``,
éventuellement suivie d'arguments. Une citation hors backticks ne compte pas, une commande plus longue non
plus (`ezk graph checkout` n'est pas `ezk graph check`). Un lien faux est pire qu'un lien absent.

**4. Une commande que personne ne cite est un orphelin d'information.** On la tape à la main : ce n'est
pas une faute, et elle ne fait jamais échouer `ezk graph check`.

**5. Le contrat.** `ezk graph check --json` ajoute `schema_version: 1` et `nodes[]` (`kind`, `id`,
`fichier`). Les champs existants restent. Schéma et exemple vivent dans `contracts/graph-check/v1/`,
générés par `pnpm board:contract --write`, sur le modèle de `contracts/process-show/`. La commande pose
son code de sortie par `process.exitCode` : le JSON dépasse 64 Ko et `process.exit` le coupait dans un tuyau.

**6. Où ça vit.** `core/cli-commands.ts` calcule (pur). `loaders/tools.ts` lit le manifeste.
`core/graph-check.ts` décrit le contrat. Le catalogue porte un champ **optionnel** `cliCommands`, distinct
de `commands` (les slash-commands de Claude Code).

## Conséquences

- Le graphe gagne 75 briques et 120 liens (75 `lance`, 45 `utilise` vers une commande), aucun cassé.
- La provenance compte les commandes comme **prouvées** : le manifeste les déclare.
- Le calcul peut se tromper par omission, pas par invention : une commande citée sans backticks reste sans lien.
- Le choix est **réversible** : retirer `lance`, `launches`, `uses-command` et le type `command` remet le
  graphe à six types et cinq verbes ; le test de vocabulaire dit quoi retirer.

## Alternatives écartées

- **Un verbe `cite` pour compétence → commande.** `utilise` dit déjà « ce skill s'appuie sur ceci » pour les outils.
- **Réutiliser `utilise` pour commande → outil.** Le sens s'inverse : une commande ne « se sert » pas de
  son script, elle l'exécute. `lance` le dit sans ambiguïté.
- **Lire aussi les blocs de code.** Trop de bruit (exemples, sorties collées) pour un gain faible.
