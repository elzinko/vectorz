# ADR 0058 — Les outils entrent dans le graphe : un 6ᵉ type de nœud, un 5ᵉ verbe

**Statut :** Accepté
**Date :** 2026-10-01
**Deciders :** PO (retour du 2026-09-17 : « on ne voit pas les outils de la méthode dans la map ») ; sprint du run V0.1 → V0.4 (le choix du verbe)
**Fiche :** [`20260917123943914`](../../../../features/20260917123943914_outils-dans-la-carte-methode.md)
**Amende :** [ADR-0040](0040-modele-fichiers-ezk-compile-schema-valide.md) D1 — le jeu fermé de quatre verbes passe à cinq.
**S'appuie sur :** [ADR-0046](0046-cli-ezk-point-d-entree-mince-manifeste.md) — le manifeste de la commande `ezk` dit déjà quelle commande lance quel script.

## En clair

La carte de la méthode montre les skills, les agents, les règles, les bundles et les profils. Elle
ne montre pas les **outils** que les skills lancent : les scripts de `bin/` et les `scripts/` de
chaque skill. On ajoute un 6ᵉ type de nœud, `tool`, relié aux skills qui le citent par un lien
`uses` et un nouveau verbe, `utilise`. Le lien se **calcule** depuis les fichiers : personne n'a de
liste à tenir à jour.

## Contexte

- Le graphe compilé modélisait cinq types de nœuds. Un script n'était nulle part sur la carte, et
  `ezk-help` liste les commandes sans dire quel skill lance quel outil.
- Le jeu de verbes est **fermé** (ADR-0040 D1) : « un cinquième verbe est une décision de conception,
  pas un ajout en passant », et le test `graph-vocabulary` fige le jeu. Cette fiche prend cette
  décision ; ce document la trace.
- Une relation écrite à la main (un champ `tools:` dans chaque skill) ajouterait une liste à
  maintenir. La carte de la méthode se veut compilée des fichiers, pas saisie.

## Décision

**1. Un outil, c'est quoi.** Un fichier script de `products/mega-city/bin/` ou du dossier `scripts/`
d'un skill (`.sh`, `.ts`, `.mjs`, `.js`, ou, dans `scripts/`, un fichier sans extension qui est
exécutable ou commence par `#!`, comme le hook `commit-msg`, que git garde en mode 644). Les
`test-*` et `*.test.*` sont des tests, pas des outils. L'id d'un outil est son chemin depuis
`products/mega-city` : `bin/regen-backlog.sh`, `skills/ezk-pr/scripts/ship-merge.sh`.

**2. Le lien est calculé.** Un skill *utilise* un outil quand son `SKILL.md`, ou un fichier markdown
de son dossier, cite le chemin de l'outil. On reconnaît : le chemin depuis la racine du produit ou du
dépôt, `<skill>/scripts/x`, et `scripts/x` pour les propres scripts du skill, écrit nu ou noté par un
gabarit (`<skill>/scripts/x`, `$VAR/scripts/x`, `../scripts/x`). Un **nom seul** (`check.sh`) ne
compte pas : plusieurs skills ont un `check.sh`. Un lien faux sur la carte est pire qu'un lien absent.

**3. Le vocabulaire.** Nouveau type de nœud `tool`, nouveau lien `uses` (skill vers outil), nouveau
verbe `utilise` : « le skill X lance l'outil Y ». Aucun des quatre verbes ne le dit sans tordre son
sens : `compose` veut dire « X est fait de Y », `convoque` désigne un rôle, `applique` une règle,
`est-verifie-par` un contrôle. Le test `graph-vocabulary` fige désormais cinq verbes et le couple
`skill>tool`.

**4. Un outil est justifié, ou orphelin.** Il est justifié par un skill qui le cite, par une commande
du manifeste `ezk` (ou une commande installée par le champ `bin` de `package.json`), ou par une
raison `internal` du manifeste. Sinon il est **orphelin** : le rapport du graphe
(`pnpm ezk graph check`) et « le bruit restant » de la carte le signalent. Il n'est jamais masqué.

**5. Où ça vit.** `core/tools.ts` calcule (pur). `loaders/tools.ts` liste les fichiers et lit le
manifeste. Le catalogue porte un champ **optionnel** `tools` : absent quand la racine n'a aucun
script, si bien que le bind et les écritures ne changent pas.

## Conséquences

- La carte gagne une section « Les outils », le dossier d'un skill liste ses outils, et le dossier
  d'un outil donne sa source, ses commandes et ses skills. Les données de la carte (committées dans
  `carte-interactive.html`) changent : `pnpm --dir products/mega-city map:data` les régénère.
- La provenance compte les outils comme **prouvés** : leur fichier existe.
- Le calcul peut se tromper par omission, pas par invention : un skill qui désigne son script par un
  nom nu reste sans lien, et l'outil apparaît orphelin. C'est le signal voulu : citer le chemin.
- Le choix est **réversible** : retirer `utilise`, `uses` et le type `tool` remet le graphe à cinq
  types et quatre verbes ; le test de vocabulaire dit exactement quoi retirer.

## Alternatives écartées

- **Un champ déclaré `tools:` dans le front-matter des skills.** Une liste de plus à maintenir à la
  main, qui dérive. Le calcul depuis la doc dit vrai sans saisie.
- **S'adosser au seul manifeste.** Il dit quelle commande lance quel script, pas quel skill s'en sert.
  On le **lit** pour les commandes et les raisons `internal`, on ne le change pas.
- **Réutiliser `compose`.** Sens tordu : un skill n'est pas « fait de » chaque script qu'il lance.
- **Compter le nom seul.** Trop de faux liens : `check.sh` existe dans plusieurs skills.

## Suite

- Les liens `agent → tool`, quand des agents citent des outils.
- Les liens `outil → outil` : un script lancé par un autre script. Ils expliqueraient la plupart des
  orphelins de `bin/` qui restent (`fiche-rows.ts`, `recipe-frontmatter.ts`…).
- Les commandes `package.json` sans script propre dans `bin/`.
