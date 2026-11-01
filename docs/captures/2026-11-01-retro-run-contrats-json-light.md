---
type: retro
date: 2026-11-01
theme: "Run autonome : les deux premiers contrats JSON de la méthode (board show, backlog show)"
scope: "sprints 2 et 3 du 2026-11-01 : contrat de ezk board show --json, détail de fiche ezk backlog show --json, correctif de sortie coupée à 64 Ko ; mode léger : tour 1 porté par l'orchestrateur, tour 2 et juge en un seul appel (ezk-steward) ; hors carnet inter-sessions (16 notes, passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "Quand la session tourne dans le dossier principal partagé, la story se construit dans un worktree dédié, jamais en changeant la branche du dossier partagé ; avant de committer, git status ne liste que des fichiers de la story."
    kind: regle
    target: skill:ezk-sprint
    by: [architecture, dev]
    status: ⏳
  - proposition: "Une commande dont le code de sortie compte (git add, tests, gate) ne se pipe jamais vers tail ou grep sans garder son statut : set -o pipefail, ou && avant le pipe."
    kind: regle
    target: global
    by: [dev, qualite]
    status: ⏳
  - proposition: "La gate ne dépend ni de l'index features/BACKLOG.md (non versionné) ni du retard de la branche sur origin/main."
    kind: feature
    by: [qualite]
    status: ⏳
  - proposition: "Une commande --json, ou lue par un autre programme, se vérifie en vrai avant livraison : par un tuyau, sur le plus gros projet du registre."
    kind: regle
    target: skill:ezk-sprint
    by: [qualite, produit]
    status: ⏳
  - proposition: "Un compte rendu de sprint non daté le dit dès sa première phrase (durée et jetons non mesurés), jamais par un zéro ; et le run autonome pose le point de passage qui date le sprint."
    kind: feature
    by: [produit]
    status: ⏳
  - proposition: "Trouver le test qui laisse un serveur ezk-map orphelin (dossier temporaire ezk-ailleurs-*) et l'arrêter dans son afterAll, même sur délai dépassé."
    kind: action
    by: [qualite]
    status: ⏳
  - proposition: "Après un découpage de fiche, l'outil propose d'inscrire les fiches sœurs au PLAN dans la même passe, avec l'accord du PO."
    kind: feature
    by: [produit, dev]
    status: ⏳
  - proposition: "Avant de pousser main, ou de proposer le push, lister git log origin/main..main et nommer au PO les commits qu'on n'a pas faits soi-même, y compris ceux d'une autre session."
    kind: regle
    target: global
    by: [produit, architecture]
    status: ⏳
  - proposition: "Recette « publier un contrat JSON versionné » : format décrit en zod (strict pour le producteur), schéma publié tolérant, exemples générés sur une fixture, test de contrat."
    kind: recette
    by: [architecture]
    status: ⏳
---

**En clair :** ce run a livré en local les deux premiers contrats JSON de la méthode. Mission control
pourra donc lire le board et le détail des fiches sans les recopier. Cinq frictions reviennent : une
autre session écrivait et poussait dans le même dossier ; un `git add` a raté trois fois sans bruit ;
la gate dépend de l'état local du dépôt ; un bug de sortie n'a été trouvé qu'en vrai ; et les comptes
rendus annoncent « 0 min, 0 jeton ». Neuf propositions attendent ta décision.

## 1 · Les faits de départ

- Une autre session écrivait dans le dossier principal pendant le build du sprint 2. Elle a ensuite
  poussé `main` sur GitHub deux fois (11 h 44 et 13 h 27), en emportant des commits locaux de ce run.
  Le second push contenait une version avec le bug de sortie ; son correctif est resté local.
  Journal : `docs/journal/2026-11-01-main.md`.
- Trois fois (dont deux aujourd'hui), un `git add` de plusieurs chemins a échoué en entier sur un
  chemin déjà renommé. Le tuyau vers `tail` a masqué l'échec, et le commit est parti incomplet.
  Rattrapé par une relecture de `git status`, puis un `--amend` sur la branche locale.
- Dans un worktree neuf, la gate était rouge : deux fichiers de tests lisent `features/BACKLOG.md`, que
  git ne suit plus. Deux autres tests échouaient quand la branche avait du retard sur `origin/main`.
- `ezk backlog show --json` sortait coupé à 64 Ko quand on le lisait par un tuyau, et `board show`
  avait le même défaut, encore latent. Ni les tests, sur une petite fixture, ni la revue adverse ne
  l'avaient vu. Seule la vérification sur muti, le plus gros projet, l'a trouvé. Correctif `f13f1491`.
- Les deux comptes rendus de sprint (`docs/sprints/2026-11-01-sprint-*.md`) commencent par « a duré
  0 min et consommé 0 tokens ». La vraie raison, aucun point de passage de sprint posé par le run
  autonome, n'arrive qu'entre parenthèses.
- Un serveur `ezk-map` de test tournait seul depuis 1 h 30, dans un dossier temporaire, sur le port
  30072. Il a fait échouer une fois un test du lanceur.
- La fiche du contrat, une fois découpée en quatre sœurs, n'était pas dans le plan. L'outil de tirage
  l'a déclarée « hors plan » ; il a fallu l'inscrire à la main.
- Ce qui a marché : la revue adverse a rendu un NO-GO utile au sprint 2 (test lent sous charge,
  schéma trop strict, test qui ne pouvait pas échouer). Les remarques mineures sont parties dans la
  fiche sœur, au lieu d'être perdues.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger choisi par le PO).

- **Architecture** : construire dans un worktree dédié (P1) ; nommer au PO les commits d'autrui avant
  un push (P8) ; capitaliser le patron du contrat JSON en recette (P9).
- **Qualité** : ne jamais piper un code de sortie qui compte (P2) ; une gate indépendante de l'état
  local (P3) ; vérifier en vrai une sortie lue par une machine (P4) ; arrêter le serveur de test qui
  fuit (P6).
- **Dev** : P1, P2, et un découpage qui n'oublie pas le plan (P7).
- **Produit** : un compte rendu qui ne ment pas par un zéro (P5) ; P4, P7, P8.

## 3 · Tour 2 — confrontation et convergence

Un seul appel (agent `ezk-steward`), qui a réagi à chaque proposition à travers les lentilles.

- Gardées telles quelles : P3, P5, P6.
- Reformulées : P1 gagne le contrôle de `git status` avant commit ; P4 est restreinte aux sorties lues
  par une machine, avec le geste de code associé (`process.exitCode` plutôt que `process.exit`) ; P8
  devient un geste de l'agent avant tout push ou proposition de push.
- P2 et P4 sont sœurs : l'une parle du code de retour d'un tuyau, l'autre de la sortie lue par un
  programme. Elles restent deux propositions.
- P7 passe de la règle à la correction d'outil : le plan est tenu à la main, donc l'outil doit
  **proposer** l'inscription, pas l'écrire en silence.
- Rien n'est écarté : chaque proposition a un symptôme vécu et une mesure.

## 4 · Le juge de cohérence

- P1, P2, P4, P8 : neuves, aucun doublon dans `rules/` ni dans les skills ciblés. P1 et P8 recoupent des
  mémoires de l'assistant, pas des règles.
- P7 : neuve. Une légère tension avec le plan « tenu à la main », levée par la reformulation.
- P5 : contredit une promesse déjà écrite (`ezk-sprint`, « jamais un faux zéro ») que l'outil ne tient
  pas. C'est un bug, pas une règle de plus.
- P1 et P8 n'ont qu'un incident chacune : à poser en `SHOULD`, décision du PO journalisée (règle
  « preuve mince : une question, pas un veto »).

## 5 · Ce qui est proposé au PO

- **P1 · construire à part.** *Fait :* le build a démarré dans le dossier partagé où une autre session
  écrivait. *Proposition :* un worktree dédié dès qu'on est dans le dossier principal. *Mesure :* 0
  branche de story créée dans le dossier principal sur 5 runs.
- **P2 · ne pas masquer un échec.** *Fait :* trois commits incomplets à cause d'un `| tail`.
  *Proposition :* garder le statut d'une commande pipée. *Mesure :* 0 commit partiel, 0 gate lue
  verte à tort sur 5 runs.
- **P3 · une gate qui ne dépend pas du poste.** *Fait :* gate rouge dans un worktree neuf, et quand la
  branche retarde. *Proposition :* corriger les tests concernés. *Mesure :* gate verte dans un worktree
  neuf, sans régénération, branche en retard.
- **P4 · vérifier en vrai une sortie machine.** *Fait :* sortie coupée à 64 Ko, vue seulement sur muti.
  *Proposition :* tuyau et plus gros projet du registre avant livraison. *Mesure :* 0 bug de sortie
  après livraison sur les 5 prochaines commandes de ce type.
- **P5 · un compte rendu qui ne ment pas.** *Fait :* « 0 min, 0 jeton » en première phrase.
  *Proposition :* dire « non mesuré » d'emblée, et dater le sprint en mode autonome. *Mesure :* au
  prochain run autonome, chaque compte rendu porte une durée, ou dit « non mesuré » dans sa première
  phrase.
- **P6 · le serveur de test qui fuit.** *Fait :* un `ezk-map` orphelin sur un port. *Proposition :*
  trouver le test et l'arrêter proprement. *Mesure :* 0 serveur orphelin après une gate complète.
- **P7 · un découpage qui n'oublie pas le plan.** *Fait :* fiche prête « hors plan ». *Proposition :*
  l'outil propose l'inscription des sœurs. *Mesure :* 0 fiche prête « hors plan » juste après un
  découpage, sur 5.
- **P8 · nommer ce qu'un push emporte.** *Fait :* deux pushes d'une autre session ont emporté nos
  commits. *Proposition :* lister et nommer les commits d'autrui avant un push. *Mesure :* 0 push qui
  emporte des commits d'une autre session sans les nommer.
- **P9 · la recette du contrat JSON.** *Fait :* le même patron a servi deux fois le même jour, et la
  fiche de mission control va le consommer. *Proposition :* une fiche « créer la recette ». *Mesure :*
  le prochain contrat JSON se construit depuis la recette, sans relire les deux premiers. L'outil de
  détection des recettes (`ezk-chef suggest`) n'a pas pu tourner : le rapport de sprint ne se date pas
  (voir P5). Ce candidat est jugé à la main.

## 6 · Suivi des décisions de la rétro précédente

Rétro du 2026-10-26 :

- Repli des agents de rôle en desktop, écrit dans les skills : a tenu. Ici, les agents de revue
  étaient disponibles et ont servi trois fois.
- Drapeau de réservation structuré (`blocked:`) : a tenu. Le tampon « prête » de ce run a levé un
  `blocked: panel` sans surprise.
- Enrichir le board avec les transitions et les jetons : trop tôt, la fiche attend toujours son panel.
- Arriéré du carnet inter-sessions : toujours en attente, et il grossit (10 notes le 26 octobre, 16
  aujourd'hui). La passe dédiée reste à planifier.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| P1 · construire à part | ⏳ | |
| P2 · ne pas masquer un échec | ⏳ | |
| P3 · une gate qui ne dépend pas du poste | ⏳ | |
| P4 · vérifier en vrai une sortie machine | ⏳ | |
| P5 · un compte rendu qui ne ment pas | ⏳ | |
| P6 · le serveur de test qui fuit | ⏳ | |
| P7 · un découpage qui n'oublie pas le plan | ⏳ | |
| P8 · nommer ce qu'un push emporte | ⏳ | |
| P9 · la recette du contrat JSON | ⏳ | |
