---
id: "20260917123943914"
title: "Montrer sur la carte les scripts et commandes de la méthode"
type: feature
priority: P3
product: mega-city
version: V0.3
milestone: fondation
labels: [carte]
status: idea
pr:
created: 2026-09-17
---

# Outils dans la carte méthode — un nœud `tool` relié aux skills

## En clair

La carte méthode (`pnpm ezk dashboard`) montre les skills, les agents, les règles, les bundles
et les profils. Elle ne montre pas les **outils** que ces skills lancent : les scripts de
`bin/` et les `scripts/` de chaque skill. Le PO l'a relevé le 2026-09-17.

Ce lot ajoute un 6ᵉ type de nœud, `tool`, relié aux skills qui le citent. Le lien se **calcule**
depuis les fichiers : rien à saisir, rien à tenir à jour à la main.

## Contexte / Problème

Le graphe compilé (`products/mega-city/src/core/graph.ts`) modélise cinq types de nœuds :
`rule`, `agent`, `skill`, `bundle`, `profile`. Un script de `bin/` ou un `.sh` n'est nulle part
sur la carte. `ezk-help` liste les commandes, mais ne dit pas quel skill lance quel outil.
Analogie : on a le plan des pièces et qui communique avec qui, pas les appareils branchés dans
chaque pièce.

## Proposition (le cadrage)

1. **Un outil, c'est quoi.** Un fichier script de `products/mega-city/bin/` ou de
   `skills/<skill>/scripts/`. Les scripts `test-*` sont des tests, pas des outils. L'id de
   l'outil est son chemin depuis `products/mega-city` (par exemple `bin/regen-backlog.sh`).
2. **D'où vient le lien.** Il est calculé. Un skill *utilise* un outil quand son `SKILL.md`
   (ou un `.md` de son dossier) cite le chemin de l'outil. Les écritures qui comptent : le
   chemin complet, `<skill>/scripts/x` avec un vrai nom de skill, et `scripts/x` pour les
   propres scripts du skill, nu ou noté par un gabarit (`<skill>/scripts/x`, `$VAR/scripts/x`,
   `../scripts/x`). Un nom nu comme `check.sh` ne compte pas : il est ambigu.
3. **Le vocabulaire.** Nouveau nœud `tool`, nouveau lien `uses` (skill vers outil), nouveau
   verbe `utilise`. L'ADR-0040 (D1) ferme le jeu de verbes : « un cinquième verbe est une décision
   de conception, pas un ajout en passant », et le test `graph-vocabulary` fige ce jeu. Aucun des
   quatre verbes ne dit « lance cet outil » sans tordre son sens. Ce lot prend donc la décision,
   et la trace dans un ADR court qui amende l'ADR-0040 (statut *proposé*). Le PO la valide en
   mergeant la PR. Elle est réversible : retirer `utilise` et `uses` suffit.
4. **Les commandes.** Le manifeste de la commande `ezk` (`ezk-manifest.yml`) dit déjà quelle
   commande lance quel script. Chaque outil en reprend ses commandes (`ezk dashboard`…), sans
   nouvelle liste à maintenir.
5. **Orphelin.** Un outil est justifié par un skill qui le cite, par une commande du manifeste
   (ou installée par le champ `bin` de `package.json`, comme le lanceur `ezk`), ou par une
   raison `internal` du manifeste. Sinon il est **orphelin** : il est signalé, jamais
   masqué. Chaque orphelin est listé avec sa raison. Aucun *faux* orphelin n'est toléré sur les
   cas connus (voir les critères).
6. **Le rendu.** Une section « Les outils » dans la carte méthode, chaque outil relié aux
   skills qui le citent. Le dossier d'un skill liste ses outils. Les orphelins rejoignent le
   « bruit restant » de la carte.

Hors lot : les agents qui utilisent un outil (`agent → tool`) et les commandes de `package.json`
(le manifeste couvre déjà les commandes utiles). Voir « Suite ».

## Critères d'acceptation

- [x] Le graphe compilé porte des nœuds `tool` (scripts de `bin/` et de `skills/*/scripts/`,
      hors `test-*`) et des liens `uses` skill vers outil, **calculés** depuis les fichiers.
      La sortie reste déterministe.
- [x] Le jeu de verbes passe à cinq (`utilise`). Le test de vocabulaire fige le nouveau couple
      `skill>tool`. Un ADR court amende l'ADR-0040.
- [x] Chaque outil porte ses commandes `ezk …` (manifeste) et, s'il y en a une, sa raison
      `internal`.
- [x] Un outil sans skill, sans commande et sans raison `internal` est **signalé** : dans le
      rapport du graphe (`pnpm ezk graph check`) et dans le « bruit restant » de la carte,
      chacun avec sa raison.
- [x] **Zéro faux orphelin sur les cas connus**, vérifié par un test sur le dépôt réel :
      `bin/regen-backlog.sh` est relié à `ezk-backlog`, et chaque script de `skills/*/scripts/`
      cité par le `SKILL.md` de son propre skill est relié à ce skill.
- [x] La carte méthode a une section « Les outils » : chaque outil relié à ses skills (puces
      cliquables). Le dossier d'un skill liste « Utilise → (outils) ». Le dossier d'un outil donne
      sa source, ses commandes et ses skills.
- [x] La provenance compte les outils comme **prouvés** (leur fichier existe). Régénérer la
      carte (`map:data`) est idempotent ; le test « carte à jour » passe.
- [x] Preuve avant/après en PR : une capture de la carte (`pr-evidence.sh` : section « Les
      outils » absente avant, présente après) et le diff du bloc de données de la carte
      (`map:data`).
- [x] Gate locale verte et liens markdown OK.

**Preuves.** Tests : `tools.test.ts` (chaque règle du calcul du lien), `tools-loader.test.ts`
(ce qui est listé, ce que le manifeste dit, ce qui ne jette jamais), `graph-tools.test.ts`
(nœuds, liens, orphelins), `tools-real-repo.test.ts` (le dépôt réel : cas connus reliés, zéro faux
orphelin, source de chaque outil) et `graph-vocabulary.test.ts` (cinq verbes). Sur le dépôt réel :
71 outils, 37 cités par une commande, 4 orphelins (`bin/build-mcpb.sh`, `bin/fiche-rows.ts`,
`bin/recipe-frontmatter.ts`, `bin/supervision-demo-run.ts`). Avant/après : voir la PR.

## Comment vérifier

```bash
pnpm ezk graph check      # nombre de nœuds par type, dont les outils, et les orphelins
pnpm ezk dashboard        # ouvrir la carte méthode : section « Les outils »
```

1. Dans la carte, ouvrir un outil cité (`bin/regen-backlog.sh`) : sa source, ses skills
   (`ezk-backlog`…) et ses commandes s'affichent.
2. Ouvrir le skill `ezk-backlog` : son dossier liste ses outils.
3. Le « bruit restant » nomme les orphelins, chacun avec sa raison.
4. Retirer une mention d'outil dans un `SKILL.md`, régénérer (`map:data`) : le lien disparaît.

## Anti-doublon

- **≠ `ezk-help`** : il *liste* les commandes. Ici on les *pose sur la carte* et on les relie
  aux skills (un mécanisme du graphe, pas un index).
- **≠ CLI `ezk`** (20260903134906920) : le CLI est le point d'entrée d'exécution. Cette fiche
  est une facette de visualisation de la carte. Elle *lit* son manifeste, elle ne le change pas.
- **S'adosse** au graphe compilé et à son validateur (ADR-0040) : un 6ᵉ type de nœud, pas un
  nouveau système.

## Suite (hors lot)

- Liens `agent → tool` quand les agents citent des outils.
- Liens `outil → outil` : un script lancé par un autre script. Ils expliqueraient sans doute
  les orphelins de `bin/` qui restent (`fiche-rows.ts`, `recipe-frontmatter.ts`…).
- Outils décrits par une commande `package.json` sans script `bin/` propre.
- Une carte dédiée « outils » si la section devient trop dense.

## Notes

- **Origine** : retour du PO le 2026-09-17 en testant la carte (« on ne voit pas les outils de
  la méthode dans la map »). Confirmé dans le code : `NodeKind` n'avait pas de `tool`
  (`products/mega-city/src/core/graph.ts`).
- **Product `mega-city`** : là où vivent le graphe, la carte et les outils `bin/`.
