---
type: retro
date: 2026-11-02
theme: "Run autonome, sprint 7 : la garde du daemon et les tuiles de la vue d'ensemble"
scope: "sprint 7 du 2026-11-02 (deux stories, milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Un worktree neuf se prépare en une commande : installer les dépendances, compiler mission control, régénérer l'index des fiches. Ensuite, les tests de mission control et la gate de la méthode passent du premier coup."
    kind: feature
    by: [dev, qualite]
    status: ⏳
  - proposition: "La commande ezk dit quel code de la méthode elle exécute, et un aperçu lancé pour un worktree exécute le code de ce worktree, jamais celui du dossier d'où pnpm est parti."
    kind: spike
    by: [architecture, qualite]
    status: ⏳
  - proposition: "Les tests serveur de mission control écoutent sur un port choisi par le système, plus sur un port fixe : deux fichiers de tests ne peuvent plus se marcher dessus."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "Une config de mission control incomplète ou invalide le dit, en nommant le champ fautif, au lieu de retomber en silence sur les valeurs par défaut."
    kind: feature
    by: [produit, dev]
    status: ⏳
---

**En clair :** le sprint 7 a livré en local la garde du daemon de mission control et les vraies
tuiles de la vue d'ensemble, avec deux revues GO. Le travail a buté quatre fois sur l'outillage,
jamais sur le code : un worktree neuf qui ne se teste pas tel quel, une commande `ezk` qui exécute le
code d'un autre dossier, deux tests sur le même port, et une config rejetée sans un mot. Quatre
propositions attendent la décision du PO ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : la garde du daemon (`bd1cd7f5`) et les tuiles sprints et rétros
  (`2e341e5f`). Une seule revue adverse pour les deux patchs (mode économe) : GO et GO, quatre
  remarques non bloquantes notées dans les fiches.
- Dans les deux worktrees neufs, les tests ont d'abord échoué sans rapport avec le code. Cinq tests de
  la méthode lisaient `features/BACKLOG.md`, absent tant qu'on ne le régénère pas. Les tests de mission
  control ne trouvaient pas ses paquets, tant qu'on ne les compilait pas. Une note du carnet du
  2026-10-14 décrit déjà ce second cas.
- Le nouveau test de la garde écoutait sur le port 14244, que le test du daemon utilisait déjà. Les
  deux ne se gênaient pas encore, mais se seraient marché dessus au hasard une fois fusionnés.
  L'échec passager d'un autre test sur ce même port a révélé le conflit.
- Pour la capture « après » des tuiles, la copie de mission control montrait encore l'ancien
  comportement. Cause : lancée par `pnpm --dir` depuis le dossier principal, la commande `ezk`
  exécutait le code du dossier principal, pas celui du worktree. Une heure de recherche, pour un
  comportement que rien n'annonce.
- Une config de mission control réduite à la seule commande `ezk` a été rejetée en silence : le
  daemon est retombé sur ses valeurs par défaut sans le dire.
- Le compte rendu du sprint 7 se trompe : il annonce « 0 fiche livrée » et 306 millions de jetons,
  pour deux fiches livrées. Ce cas a été ajouté à la fiche existante
  [un compte rendu de sprint non daté le dit d'emblée](../../features/20261101131506082_compte-rendu-de-sprint-non-date-sans-faux-zero.md) :
  un enrichissement, pas une nouvelle décision.
- Ce qui a marché : le décideur a confirmé chaque porte « prête » en un appel court ; la capture
  « avant » a été prise avant de toucher au code, comme il l'avait demandé.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Architecture** : la commande `ezk` doit dire quel code elle exécute (P2).
- **Qualité** : préparer un worktree neuf en une commande (P1) ; des ports choisis par le système
  pour les tests serveur (P3) ; P2.
- **Dev** : P1, P3, et une config fautive qui le dit (P4).
- **Produit** : P4 ; le compte rendu de sprint qui ment sur les fiches livrées, déjà couvert par une
  fiche existante, enrichie.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 recoupe la fiche [la gate ne dépend ni de l'index généré ni du retard sur GitHub](../../features/20261101131505997_gate-independante-de-l-etat-local.md),
  qui supprime la dépendance à l'index. P1 reste distincte : elle traite aussi la compilation de
  mission control, et vise un seul geste pour un worktree neuf.
- P2 devient une exploration plutôt qu'une fiche : il faut d'abord comprendre comment le lanceur
  choisit son code, avant de décider ce qu'il doit faire.
- P3 et P4 sont gardées telles quelles : chacune a un symptôme vécu et une mesure simple.
- Aucune règle n'est proposée : chaque symptôme se corrige dans l'outil, pas par une discipline.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : dans un worktree neuf, une commande, puis `pnpm test` et la gate de la méthode passent du
  premier coup.
- P2 : un aperçu lancé pour un worktree montre le comportement de son code ; `ezk` dit sur sa sortie
  d'erreur quel dossier de code il exécute.
- P3 : aucun test de mission control n'écoute sur un port fixe.
- P4 : une config incomplète produit une ligne d'avertissement qui nomme le champ fautif.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer ces propositions : elles attendent ta décision.
