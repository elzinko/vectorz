---
type: retro
date: 2026-10-04
theme: "fin de la V0.5 : ce que la dernière fiche et le mode local ont appris (rétro légère)"
scope: "run ezk-product-build --once du 2026-10-04 (fiche 20261003105820077, merge local 527868b7), clôture de la V0.5, et les quatre notes du carnet déposées depuis la rétro du 2026-10-03"
participants: [pilote, po]
actions:
  - proposition: "Le test de « ezk retro note » écrit dans le vrai dépôt vectorz quand il tourne sous pnpm : le corriger, renforcer son contrôle, et retirer les deux notes parasites"
    kind: feature
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : fiche 20261004181110120 (bug, P1 proposé) ; notes parasites retirées"
    date: 2026-10-04
  - proposition: "Le journal de sprint (SPRINT.md) quitte le worktree et se range par branche, comme la note de passation : un worktree recyclé n'hérite plus du sprint d'une autre session"
    kind: feature
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : fiche 20261004181110201 (feature, P1 proposé)"
    date: 2026-10-04
  - proposition: "Une fiche qui vise les projets hôtes se prouve sur le banc cop1-cobaye avant d'être livrée, et la fiche le dit en une ligne datée"
    kind: regle
    target: skill:ezk-sprint
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : règle development/host-project-proof-before-ship (SHOULD), bundle development, liée à ezk-sprint (applies + DoD)"
    date: 2026-10-04
  - proposition: "Ajouter le cas du jour à la fiche « Les portiers laissent tranquilles les copies de réserve propres » : 4 worktrees propres ont arrêté un run autonome"
    kind: action
    by: [pilote]
    status: ✅
    decision: "Faite, retenue par le PO : cas du 2026-10-04 ajouté à la fiche 20261003011750521"
    date: 2026-10-04
  - proposition: "Ajouter à la fiche « Sans PR, intégrer par push en avance rapide » le cas d'un changement de fiches seul, refusé au push faute de chemin de revue"
    kind: action
    by: [pilote]
    status: ✅
    decision: "Faite, retenue par le PO : cas du 2026-10-03 ajouté à la fiche 20261004083838687"
    date: 2026-10-04
---

**En clair :** la V0.5 est livrée et étiquetée, mais sa dernière fiche a laissé deux traces. Le
test de la nouvelle commande `ezk retro note` écrit dans le vrai dépôt quand il tourne sous `pnpm`.
Et le journal de sprint resté dans un worktree recyclé a mordu une troisième fois. Cinq
propositions attendent ta décision : deux fiches, une règle et deux ajouts à des fiches existantes.

## 1 · Les faits de départ

- **Un test écrit dans le vrai dépôt.** En lisant le carnet pour cette rétro, deux notes « Depuis la
  commande ezk » sont apparues dans `vectorz/.git/ezk/retro-notes/` (19 h 41 et 19 h 53 le
  2026-10-04). Elles viennent du cas N5 de `skills/ezk-retro/scripts/test-note.sh`, lancé par
  `pnpm test:scripts`. Sous `pnpm`, la variable `INIT_CWD` désigne le dossier d'où `pnpm` a été lancé,
  dans vectorz : `ezk` vise alors ce dépôt, et non le dépôt jetable du test. Lancé hors `pnpm`, le même cas écrit au bon
  endroit (reproduit pendant cette rétro). Le contrôle du cas ne regardait que le nom du fichier,
  pas son dossier : il est passé au vert.
- **Le journal de sprint périmé, troisième fois.** Le 2026-10-04, `sprint.sh start` a ouvert le
  « Sprint 2 » dans ce worktree. Le `SPRINT.md` trouvé là portait le sprint 1 et les notes du
  2026-10-02, d'une autre session. Même cause que les deux notes du carnet :
  `docs/retro-notes/traitees/20261003205239634-sprint-md-reste-dans-worktree-recycle.md` (vectorz, 2026-10-03)
  et `docs/retro-notes/traitees/20261004101755894-sprint-md-perime-recidive-muti.md` (muti, 2026-10-04).
- **Le portier a arrêté un run autonome.** `sprint.sh start --dry-run` a rendu `ALERT` pour 4
  worktrees voisins, tous propres et sans lien avec la fiche. Le run `--once`, en mode auto, a dû
  demander au PO de passer outre (raison journalisée dans `SPRINT.md`).
- **Livré, jamais éprouvé chez un hôte.** Note
  `docs/retro-notes/traitees/20261003202803825-livre-jamais-eprouve-projet-hote.md` : le mode local, livré par
  quatre PR aux tests verts, a montré 16 gênes, dont 4 bloquantes, à son premier usage dans le banc
  cop1-cobaye. La fiche livrée aujourd'hui vise aussi muti, et n'a été prouvée que dans vectorz et des
  dépôts jetables : sa preuve chez l'hôte est renvoyée à une « Mesure de suivi ».
- **Un changement de fiches n'a pas de chemin de revue en mode local.** Note
  `docs/retro-notes/traitees/20261003202803910-revue-backlog-mode-local.md` : le push d'un squash qui ne
  contenait que des fiches, le plan et une ligne de config a été refusé par le garde-fou de Claude
  Code, au motif d'un « merge sans revue ».
- **Coût.** Le run d'une fiche a coûté environ 300k jetons, dont environ 160k pour deux passages du
  relecteur (NO-GO puis GO). La cible est 200k par fiche. Le premier passage a trouvé un vrai P0 :
  une boucle sans fin dans `note.sh`.

## 2 · Tour 1 — chaque lentille propose

Rétro **légère**, à la demande du PO : pas de tour d'agents. Le pilote du run a rassemblé les faits
et formulé les propositions ; le PO tranche.

- Corriger le test qui fuit vers le vrai dépôt (bug de la fiche livrée aujourd'hui).
- Ranger `SPRINT.md` hors du worktree, par branche, dans le dossier git commun déjà utilisé par la
  note de passation.
- Une règle : prouver chez un hôte ce qui vise les hôtes, avant le ship.
- Deux ajouts de cas à des fiches existantes (portier, intégration sans PR).

## 3 · Tour 2 — confrontation et convergence

Sans tour d'agents, le pilote a écarté lui-même trois idées :

- Une règle « ne jamais donner de commande git brute au PO » : déjà corrigée en mémoire après la
  remarque du PO, un seul cas. À ressortir si elle revient.
- Faire pousser l'étiquette par `version close` : la publication reste un geste du PO, par conception.
- Une fiche sur le coût de la revue : la fiche « fenêtre de contexte » porte déjà les mesures par
  appel d'agent (rétro du 2026-10-03). Le NO-GO d'aujourd'hui a payé : il a trouvé un P0.

## 4 · Le juge de cohérence

Avis du pilote, en l'absence de juge (rétro légère) :

- **Test qui fuit** : cohérent. Voisin de la fiche « les tests qui lisent le vrai dépôt vérifient une
  invariante » (20261003201035080), qui traite la lecture ; ici, c'est une écriture. Pas un doublon.
- **SPRINT.md hors worktree** : cohérent avec la fiche livrée aujourd'hui (même lieu commun). Voisin
  de la fiche parkée « regrouper les artefacts de méthode » (20261001192624192), plus large et sans
  version : pas un doublon.
- **Règle « prouver chez un hôte »** : aucune règle de `rules/` ne la couvre (recherche sur « projet
  hôte » et « cobaye »). Pas de contradiction. Elle touche l'étape « Validation » d'`ezk-sprint`.
- **Les deux ajouts** : enrichissent des fiches existantes, rien à juger.

## 5 · Ce qui est proposé au PO

1. **Test de `ezk retro note` corrigé** (fiche bug).
   - Fait vécu : deux notes parasites dans `vectorz/.git/ezk/retro-notes/`.
   - Proposition : le cas N5 neutralise `INIT_CWD` et vérifie que la note atterrit dans le dépôt du
     test ; les deux notes parasites sont retirées.
   - Mesure : après `pnpm test:scripts`, `note.sh list` dans vectorz ne change pas.
2. **`SPRINT.md` rangé par branche, hors du worktree** (fiche feature).
   - Fait vécu : trois sessions en deux jours ont hérité du journal d'une autre.
   - Proposition : `sprint.sh` range le journal sous `<git-common-dir>/ezk/sprints/<branche>.md`.
   - Mesure : un worktree neuf ouvre « Sprint 1 », sans notes héritées ; 0 journal étranger dans les
     5 prochaines clôtures `ezk-archive`.
3. **Règle « prouver chez un hôte avant de livrer »** (cible `skill:ezk-sprint`, niveau SHOULD).
   - Fait vécu : 16 gênes au premier usage réel du mode local.
   - Proposition : une fiche qui vise les projets hôtes porte une ligne datée « éprouvée sur
     cop1-cobaye le AAAA-MM-JJ » avant son ship.
   - Mesure : les 3 prochaines fiches qui visent un hôte portent la ligne ; 0 gêne bloquante trouvée
     chez l'hôte après leur ship.
4. **Ajout de cas** à la fiche « Les portiers laissent tranquilles les copies de réserve propres ».
5. **Ajout de cas** à la fiche « Sans PR, intégrer par push en avance rapide ».

## 6 · Suivi des décisions de la rétro précédente

Rétro du 2026-10-03 (`docs/captures/2026-10-03-retro-iteration-v0-5.md`) :

- **Rétro due proposée comme un choix chiffré** (règle `token-economy/retro-due-choix-chiffre`) :
  elle a tenu. Cette rétro a été proposée « légère ou complète », avec son coût, et le PO a choisi.
- **Dire quand le dossier principal est en retard** (fiche 20261003201034897, `idea`) : trop tôt.
  Aujourd'hui, `origin/main` a avancé pendant le run (une fiche ajoutée par une autre session). Le
  pilote l'a vu en lisant l'état du dossier principal et l'a rattrapé à la main avant le merge local.
  Un cas de plus pour la fiche.
- **Voir les branches parallèles avant un lot** (fiche 20261003201034990, `idea`) : trop tôt, pas de
  nouveau cas.
- **Section en double et tests à donnée figée** (fiche 20261003201035080, `idea`) : trop tôt ; voir la
  proposition 1, voisine.
- **Portier d'ezk-archive contre origin/main, points 3 et 4** (fiche 20261003201035168, `idea`) :
  trop tôt, pas de clôture d'archive dans ce run.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1 · Test de `ezk retro note` corrigé | ✅ Retenue par le PO : fiche « Le test de ezk retro note n'écrit plus dans le vrai dépôt » (20261004181110120, bug, P1 proposé) ; notes parasites retirées | 2026-10-04 |
| 2 · `SPRINT.md` rangé par branche | ✅ Retenue par le PO : fiche « Le journal de sprint se range par branche, hors du worktree » (20261004181110201, feature, P1 proposé) | 2026-10-04 |
| 3 · Règle « prouver chez un hôte » | ✅ Retenue par le PO : règle development/host-project-proof-before-ship (SHOULD), bundle development, liée à ezk-sprint (applies + DoD) | 2026-10-04 |
| 4 · Cas ajouté à la fiche du portier | ✅ Faite, retenue par le PO : cas du 2026-10-04 ajouté à la fiche « Les portiers laissent tranquilles les copies de réserve propres » (20261003011750521) | 2026-10-04 |
| 5 · Cas ajouté à la fiche « intégrer sans PR » | ✅ Faite, retenue par le PO : cas du 2026-10-03 ajouté à la fiche « Sans PR, intégrer par push en avance rapide » (20261004083838687) | 2026-10-04 |

**Notes du carnet lues**, rangées dans `docs/retro-notes/traitees/` :
`20261003202803825-livre-jamais-eprouve-projet-hote.md` (→ proposition 3),
`20261003202803910-revue-backlog-mode-local.md` (→ proposition 5),
`20261003205239634-sprint-md-reste-dans-worktree-recycle.md` et
`20261004101755894-sprint-md-perime-recidive-muti.md` (→ proposition 2). Les deux notes hors git
« Depuis la commande ezk » sont des parasites de test (→ proposition 1) : supprimées le 2026-10-04,
pas versées.

## 8 · Glossaire

- **Worktree** : un dossier de travail séparé sur le même dépôt git ; l'app Claude en crée un par session.
- **Dossier git commun** (`git-common-dir`) : le dossier `.git` que tous les worktrees d'un dépôt partagent.
- **`INIT_CWD`** : variable que `pnpm` pose avec le dossier d'où il a été lancé.
- **Banc cop1-cobaye** : un projet hôte d'essai, gardé vierge, où l'on éprouve la méthode.
- **Ship** : le geste qui range une fiche livrée dans `features/done/`.
