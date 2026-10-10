---
type: retro
date: 2026-10-10
theme: "Sprint vue process + fix 404 cockpit : frictions worktree↔principal et commandes qui échouent en silence"
scope: "Le sprint qui vient de finir (2 stories livrées en local) + 6 notes de carnet accumulées"
participants: [architecture, qualite, produit, juge, po]
actions:
  - proposition: "Après un ship local, réconcilier le worktree avec le main du principal (et refuser d'écraser un champ qu'un script vient d'écrire)"
    kind: feature
    by: [architecture, qualite, produit]
    status: ⏳
  - proposition: "Une commande ezk qui MUTE ne doit jamais échouer en silence : un no-op inattendu sort en erreur ou en WARN visible, jamais en succès muet"
    kind: regle
    target: global
    by: [qualite, architecture, produit]
    status: ⏳
  - proposition: "Ajouter à la fiche ship existante (20261004211037977) le cas vécu : ship a barré 0 entrée de PLAN en silence pour une fiche pourtant présente"
    kind: feature
    by: [qualite, architecture]
    status: ⏳
  - proposition: "Ouvrir board check (et le reste de la surface ezk) au --root — enrichir la fiche outils-depuis-projet-hôte (20261004083344960), pas une fiche neuve"
    kind: feature
    by: [architecture, qualite, produit]
    status: ⏳
  - proposition: "Un allocateur d'id ADR unique qui scanne les DEUX dossiers (fin des collisions type ADR-039) + un ADR qui tranche où vivent les ADR dans un repo multi-projets"
    kind: feature
    by: [architecture, produit]
    status: ⏳
  - proposition: "Tout critère de fiche touchant une liste plafonnée/tronquée porte un scénario « élément au-delà du cap retrouvé par filtre/recherche »"
    kind: regle
    target: agent:ezk-qa
    by: [qualite]
    status: ⏳
  - proposition: "Une fonction de sécurité/confinement (chemin, accès) reçoit des tests de contrat négatifs à la FRONTIÈRE RÉELLE (point d'entrée), pas seulement sur la fonction"
    kind: regle
    target: agent:ezk-reviewer
    by: [qualite]
    status: ⏳
  - proposition: "Flux sans PR : une story = un commit distinct (clause réduite par le juge ; la moitié « critère coché » double development/acceptance-criteria-before-merge)"
    kind: regle
    target: skill:ezk-sprint
    by: [produit]
    status: ⏳
  - proposition: "Au grooming/ready : tout ajout de comportement en cours de sprint est une story ou reçoit un critère (ferme le cas « enrichissement filtres sans critère », renvoyé là par le juge)"
    kind: action
    by: [produit, juge]
    status: ⏳
  - proposition: "registry-add préserve les commentaires d'en-tête du registre (aujourd'hui effacés, waiver POC)"
    kind: feature
    by: [produit]
    status: ⏳
  - proposition: "Le cockpit liste le projet de lancement une seule fois (bug UI, aujourd'hui listé deux fois)"
    kind: feature
    by: [qualite, architecture, produit]
    status: ⏳
  - proposition: "Écarter « parler en langage nu au checkpoint » comme règle neuve — déjà couvert par human-facing-lisibility (au plus : ajouter le checkpoint product-build à ses « leviers » si le symptôme persiste)"
    kind: action
    by: [architecture, produit]
    status: ⏳
---

**En clair :** Ce sprint a livré deux choses (la vue process, le fix 404 cockpit), mais il a buté sur deux familles de frictions. D'abord, travailler depuis un worktree en livrant sur le `main` du principal : le hook bloque l'édition, le worktree reste en retard, on écrase du travail en recopiant. Ensuite, des commandes qui **échouent en silence** : `ship` a laissé une fiche livrée affichée « à faire » sans rien dire. Tu dois trancher onze propositions — trois sont P1 (réconcilier le worktree, interdire les mutations muettes, ouvrir `--root`).

## 1 · Les faits de départ

- `ezk backlog ship` a barré **0 entrée** de `PLAN.md` pour la fiche `20261002115451315`, pourtant listée — sans avertir. Repéré en lisant la sortie à l'œil, barré à la main.
- Le **hook de sécurité worktree** a bloqué l'édition de `PLAN.md` (checkout de base) depuis la session → contournement au `perl` côté principal.
- Le merge/ship local s'est fait sur le `main` du **principal** (`git -C`, `ezk --root`) → le worktree de session reste en retard.
- **Numérotation d'ADR** : deux dossiers (`docs/adr/` → 038, `products/mega-city/docs/adr/` → 0069). ADR-039 écrit → collision → refait en 0069.
- La revue adverse a attrapé 6 P1 que ni les tests ni la gate n'ont vus — dont un filtre qui ratait les livrées au-delà du cap, et une fonction de confinement dont la doc promettait plus que le code.
- Carnet (sessions passées) : `registry-add` efface les commentaires du registre ; le cockpit liste 2× le projet de lancement ; copier worktree→principal écrase ; tester dans un worktree en retard = faux rouges ; « langage nu au checkpoint ».

## 2 · Tour 1 — chaque lentille propose

- **Architecte** : un seul défaut structurel décliné en 4 symptômes — *les outils ezk supposent « là où je tourne = là où j'écris »*. Phare : `--root` uniforme sur toute la surface. Plus : ship avec postcondition, allocateur d'id ADR (+ ADR de décision), réconciliation worktree.
- **QA** : la méthode laisse passer des ratés **en silence** ; seule la revue adverse les voit. Phare : ship qui échoue fort ; filet cohérence pointable (`board check --root`). Plus : règle « cap × filtre », règle « test de contrat à la frontière réelle », garde « worktree en retard ».
- **Produit** : le va-et-vient worktree↔principal est récurrent (6+ notes) → outil, pas règle. Deux trous dangereux car silencieux. Plus : règle « une story = un commit » en flux local. « Langage nu » déjà en loi.

## 3 · Tour 2 — confrontation et convergence

- **Forte convergence (3/3)** : réconcilier le worktree après ship (P1) ; `ship` ne doit pas échouer en silence (P1) ; ouvrir `--root` sur la surface ezk (P1, dont `board check`).
- **Anti-doublon** : deux propositions **enrichissent des fiches existantes** plutôt que d'en créer — `ship` → fiche `20261004211037977` (qui couvre « ship dit ce qu'il touche » mais pas le cas « 0 barré en silence ») ; `--root` → fiche `20261004083344960` (déjà enrichie sur `aggregate --root`).
- **Fil rouge archi** : P1-root, P1-ship, P2-worktree sont trois faces d'un même invariant cassé — *toute écriture d'état passe par une commande racine-paramétrée, et toute mutation prouve son effet*.
- **Écartés** : « langage nu au checkpoint » (déjà dans `human-facing-lisibility`) ; la croissance de périmètre elle-même (décision PO légitime, seule la traçabilité est à border → règle story=commit) ; note « la clôture committe l'archive » (déjà livrée, fiche `20261005100026946`).

## 4 · Le juge de cohérence

`ezk-steward` a lu `products/mega-city/rules/` — **aucune contradiction** trouvée. Verdicts :

- **R1 (mutation muette, global)** — REFORMULER puis GARDER. Pas un doublon de `human-facing-lisibility` (qui porte sur les **comptes** « X of Y shown ») : R1 porte sur une **commande qui écrit** et rend « succès » sans rien écrire. Correctif de forme : retirer l'exemple de comptes (`branch_absorbed=26`, déjà couvert ailleurs), borner le critère à « attendait d'écrire, n'a rien écrit » (une assertion du nombre d'écritures, échec si 0 alors qu'≥1 attendue).
- **R2 (cap × filtre, agent:ezk-qa)** — GARDER. Aucune règle de `testing/` ne la couvre. Garder **une seule source** (l'agent ezk-qa) et faire pointer l'étape BDD d'`ezk-sprint` vers elle, sans la recopier.
- **R3 (confinement à la frontière réelle, agent:ezk-reviewer + ezk-dev)** — GARDER. Pas un doublon d'`adversarial-review-before-merge` (générale) : R3 impose un contenu précis (≥3 tests négatifs au point d'entrée). Ajout : la doc de la fonction cite sa frontière réelle. À vérifier que `development/test-philosophy` ne dit pas déjà « tester à la frontière ».
- **R4 (une story = un commit, skill:ezk-sprint)** — REFUSER en l'état, SCINDER. La moitié « chaque enrichissement a ≥1 critère coché » **double** `development/acceptance-criteria-before-merge`. Ne garder que la clause neuve « flux sans PR : une story = un commit » (compense le 1:1 que « une PR par feature » imposait). Le vrai défaut (l'enrichissement « filtres » pas traité comme une story) relève du **grooming**, pas du ship → action séparée au gate `ready`/`groom`.

Avis **consultatif** — le PO tranche au temps 7.

## 5 · Ce qui est proposé au PO

| # | Fait vécu | Proposition | Mesure |
|---|---|---|---|
| 1 | Worktree en retard après ship ; cp qui écrase | **feature** — réconcilier le worktree au ship local | 0 worktree en retard / 0 champ écrasé sur 5 ships |
| 2 | ship barre 0 en silence ; registry-add efface | **règle global** — une mutation ne finit jamais en succès muet | test ligne mal formée → exit≠0/WARN ; 0 fiche shippée « à faire » muette / 5 sprints |
| 3 | le cas précis du ship | **feature** (enrichit `20261004211037977`) | le cas « 0 barré » est un critère testé de la fiche |
| 4 | board check sans --root | **feature** (enrichit `20261004083344960`) | `board check --root <principal>` rend un verdict sur le bon dépôt |
| 5 | deux dossiers d'ADR, collision | **feature** — allocateur d'id unique + ADR de décision | 0 collision / 5 prochains ADR |
| 6 | filtre rate les livrées hors cap | **règle agent:ezk-qa** — scénario « cap × filtre » | 100 % des fiches à cap le citent ; 0 défaut vu seulement en revue / 3 sprints |
| 7 | doc > comportement d'une fonction de confinement | **règle agent:ezk-reviewer + ezk-dev** — test de contrat à la frontière réelle | ≥3 tests négatifs au point d'entrée ; 0 écart doc/code / 3 sprints |
| 8 | 2 stories / 1 commit squashé | **règle skill:ezk-sprint** — flux sans PR : une story = un commit (clause réduite par le juge) | ≥1 commit distinct / story en flux local |
| 9 | registry-add efface les commentaires | **feature** (bug) — l'en-tête survit | test de non-régression vert |
| 10 | cockpit liste 2× le lancement | **feature** (bug UI) — une seule fois | test de rendu : 1 occurrence |
| 11 | « langage nu au checkpoint » | **action** — écarter (déjà couvert) | — |
| 12 | enrichissement « filtres » sans critère | **action** — au grooming : tout ajout de comportement = une story ou un critère | 0 enrichissement livré sans critère / 3 sprints |

## 6 · Suivi des décisions de la rétro précédente

Pas de capture de rétro antérieure trouvée dans `docs/captures/` à relier ici — **sans objet** pour ce tour. Les notes de carnet traitées/écartées sont déplacées vers `docs/retro-notes/traitees/` sous feu vert PO.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1 · réconcilier le worktree au ship local | | |
| 2 · mutation ezk jamais muette (règle global) | | |
| 3 · cas « ship 0 barré » (enrichit 20261004211037977) | | |
| 4 · board check --root (enrichit 20261004083344960) | | |
| 5 · allocateur d'id ADR + ADR de décision | | |
| 6 · scénario cap × filtre (règle ezk-qa) | | |
| 7 · test de contrat frontière réelle (règle ezk-reviewer) | | |
| 8 · une story = un commit en flux local (règle ezk-sprint, clause réduite) | | |
| 9 · registry-add préserve l'en-tête | | |
| 10 · cockpit liste le lancement une fois | | |
| 11 · écarter « langage nu » (déjà couvert) | | |
| 12 · au grooming : un ajout de comportement = une story ou un critère | | |

## 8 · Glossaire

- **worktree / principal** : la session travaille dans une copie isolée (`worktree`) ; `main` n'est checké-out que dans le dépôt d'origine (`principal`).
- **ship** : la transaction qui passe une fiche à « livrée » (la range dans `done/`, régénère l'index, barre son entrée du plan).
- **mutation muette** : une commande qui devait écrire, n'écrit rien, et rend quand même « succès ».
- **cap** : une limite d'affichage (ex. « 20 dernières livrées »).
- **frontière réelle** : le point d'entrée effectif (le serveur HTTP), par opposition à la fonction interne qu'il appelle.
