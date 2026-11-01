---
id: "20261031160441267"
title: "Le détail d'une fiche calculé par la méthode (`ezk backlog show <id> --json`)"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [board, contrat, json]
status: idea
pr:
evidence: none # contrat en ligne de commande, sans écran ; preuve = tests de contrat
created: 2026-10-31
---

## En clair

Quand on clique une fiche dans mission control, une fenêtre montre son « en clair », son contexte, ses
critères et la façon de la vérifier. Aujourd'hui, seul cop1 sait découper une fiche en ces sections.
Cette fiche donne ce découpage à la méthode, par `ezk backlog show --json`. Mission control pourra
alors supprimer sa copie, comme pour le board.

**Si tu arrives frais.** Une *fiche* est un fichier markdown du backlog. *Mission control* est le
tableau de bord du produit cop1. Le *contrat JSON* est le format versionné que la méthode publie pour
les autres programmes ; le premier, celui du board, est livré dans
`products/mega-city/contracts/board-show/`.

## Contexte / Problème

Mission control découpe lui-même les fiches, dans
`products/cop1/packages/app/src/features/board/ficheDetail.ts`. Ce découpeur lit le front-matter en
YAML strict, comme l'ancien lecteur du board : un titre qui contient « : » y perd ses champs. Il ne
garde pas l'état coché des critères.

La méthode, elle, a déjà un lecteur de sections plus solide. Il gère les blocs de code et les niveaux
de titre. Mais il est caché dans le contrôle de la définition de prêt (`sectionLines`, privé, dans
`products/mega-city/src/core/dor-manifest.ts:177`). Le board de la méthode, lui, sert la fiche brute
(`products/mega-city/bin/ezk-map.ts:310`).

Un fait change la forme de la commande : mission control charge le détail de **toutes** les fiches
actives d'un coup (`readFicheDetails`), pour ouvrir la fenêtre sans attendre. Un appel `ezk` coûte
environ une seconde. Une commande qui ne sort qu'une fiche l'obligerait à lancer `ezk` une fois par
fiche.

Décision : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
Enquête : [les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md), constat 1.

## Valeur

Pour qui : mission control d'abord, puis tout script ou LLM qui veut lire une fiche sans réécrire un
découpeur de markdown.

Mission control peut supprimer `ficheDetail.ts`. Les deux lecteurs de sections de la méthode n'en
font plus qu'un. C'est la deuxième pièce dont dépend
[mission control lit le board de la méthode par `ezk`](20261031160441412_mission-control-consomme-ezk.md).

## Proposition

Une commande, deux usages :

- `ezk backlog show <id> --json` sort le détail d'une fiche ;
- `ezk backlog show --json`, sans id, sort le détail de toutes les fiches actives, en un appel :
  `{ "schema_version": 1, "fiches": [ … ] }`, triées par id.

Le détail d'une fiche porte :

1. `schema_version` : `1`, avec les mêmes règles que le contrat du board ;
2. son identité, lue par le lecteur de la méthode : id, titre, statut, priorité, version, milestone,
   produit, raison de blocage, drapeau « en cours », pr, chemin ;
3. ses sections : `enClair` (section `## En clair` ou forme en ligne `**En clair.**`), `contexte`,
   `criteres` (chaque critère avec son texte et son état coché), `commentVerifier`.

Sans `--json`, la commande affiche un résumé lisible : titre, statut, « en clair », critères.

Pour le code :

- le lecteur de sections sort de `dor-manifest.ts` dans un module pur partagé ; le contrôle de prêt
  l'utilise sans changer de comportement ;
- un cœur pur construit le détail ; la commande en est le bord ;
- le format se décrit en zod, et son schéma et son exemple se rangent dans
  `products/mega-city/contracts/backlog-show/v1/`, générés par la même commande que ceux du board
  (`pnpm --dir products/mega-city board:contract --write`).

Hors périmètre : brancher mission control (fiche sœur) ; les fiches livrées dans la liste sans id
(seulement les actives, comme aujourd'hui chez cop1).

## Critères d'acceptation

- [ ] `ezk backlog show <id> --json` sort `schema_version: 1`, l'identité et les quatre sections de la
      fiche, critères avec leur état coché ; la sortie respecte le schéma rangé (test de contrat).
- [ ] `ezk backlog show --json` sans id sort le détail de toutes les fiches actives en un seul appel.
- [ ] Les cas testés chez cop1 (`ficheDetail.test.ts`) passent côté méthode, plus le titre qui
      contient « : » : section coupée par un `##` dans un bloc de code, « en clair » en ligne, id de
      17 chiffres intact, id tiré du nom de fichier, fins de ligne CRLF.
- [ ] Un id inconnu donne le code de sortie 1 et un message qui le nomme, jamais un JSON vide.
- [ ] La méthode n'a plus qu'un lecteur de sections : le contrôle de prêt l'utilise, et ses tests
      restent verts sans modification.
- [ ] Le schéma et l'exemple sont rangés et régénérés par `board:contract --write` ; le test échoue
      s'ils ne correspondent plus ; la gate reste verte (`pnpm test` et `pnpm test:scripts`).

## Comment vérifier

```bash
ezk backlog show 20261031160441412 --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['schema_version'], d['title'], len(d['criteres']))"
```

```bash
ezk --root /Users/elzinko/git/bacasable/muti backlog show --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['schema_version'], len(d['fiches']))"
```

```bash
cd products/mega-city && pnpm test && pnpm test:scripts
```

## Notes

- Fiche sœur du milestone `board`, découpée le 2026-10-31 (ADR-086, section « Le découpage »).
- Débloque [mission control lit le board de la méthode par `ezk`](20261031160441412_mission-control-consomme-ezk.md).
- Groomée le 2026-11-01 pendant le run autonome, après la livraison du
  [contrat JSON du board](done/20261029112813308_contrat-json-methode-board-show.md). Deux faits
  trouvés au grooming : la méthode a déjà un lecteur de sections (`sectionLines`), et mission control
  charge tous les détails d'un coup. D'où la forme sans id et le lecteur partagé.
- Taille : six critères, trois surfaces proches (une commande, un module pur, les fichiers du
  contrat). Elle tient dans un sprint : le patron du contrat du board se réutilise tel quel.
- Forme de la liste sans id, tranchée au grooming : une liste `fiches`, triée par id. Une liste se
  parcourt et se compare plus simplement qu'un objet par id.
