# ADR-0042 — Concurrence inter-sessions : visibilité (advisory), pas de verrou exclusif

- Statut : **Proposé** (2026-08-28) — ratification possible via panel adverse
- Date : 2026-08-28
- Fiche : `20260825141012293_ezk-sessions-cockpit.md` (absorbe `20260812104022237_owner-session-responsable-pr.md`)
- Contexte amont : ADR-018 (isolation worktree), ADR-019 (emplacement worktree), fiche 0180 (id horodaté = fin des collisions d'id), STAND-DOWN d'`ezk-codex`

## En clair

Quand **plusieurs sessions Claude Code** tournent en parallèle sur un même projet, comment
éviter qu'elles se marchent dessus ? Décision : par la **visibilité**, pas par des **verrous**.
On **montre** l'état et on **alerte** ; on n'interdit pas.

Un **seul détecteur** porte cette sécurité : l'**intersection des fichiers touchés**. Deux
sessions ne se gênent que si elles visent le **même fichier**. Ce détecteur sert
d'**avertissement** pour les sessions qu'un humain supervise, et de **blocage** pour les runs
autonomes (là, aucun humain n'est dans la boucle au moment de démarrer).

## Contexte

Un opérateur solo pilote plusieurs sessions à la fois : une pour exécuter des sprints, d'autres
pour le métier (idéation, grooming, planification). Pièges récurrents, tous vécus : regen
concurrente qui capture un état incohérent, worktree resetté après reconnexion, double-mint
d'ids par deux sessions, « deux sessions, même objet, sans le savoir ».

La fiche `20260812104022237` (owner d'une PR) posait la question ouverte : **exclusif** (une PR
= une seule session, bloquant) **ou advisory** (on signale, l'humain arbitre) ? Le brainstorm
PO du 2026-08-28 la tranche.

## Décision

### D1 — Visibilité plutôt qu'interdiction

Pour un opérateur **solo**, un verrou dur est un mécanisme de concurrence à construire, tester,
maintenir — et à contourner dès qu'il gêne. Ses exceptions prolifèrent (« sauf pour la fiche
qu'on vient de créer… »). On **préfère montrer** (le cockpit de sessions) et laisser l'humain
trancher. On n'est pas un système multi-utilisateurs qui a besoin de verrous ; on est un pilote
qui a besoin d'un tableau de bord.

### D2 — Un seul détecteur : l'intersection des fichiers touchés

Deux sessions ne se gênent que si elles touchent le **même fichier**. Le détecteur croise les
fichiers **non commités** de chaque worktree (`git status` par worktree) ; intersection non
vide = collision imminente. Les fichiers **chauds** (index du backlog, `PLAN.md`, une fiche en
cours) sont surveillés en priorité. Cas physique : deux sessions dans le **même répertoire**
(même working tree) = tout est en collision.

Corollaire : le **type** d'une session (sprint vs métier) n'est **pas** l'axe de sécurité —
c'est une simple **étiquette d'affichage** (dérivée du préfixe de branche, enrichie par un
marqueur `.ezk-session` optionnel). La sécurité repose sur l'intersection, pas sur le type.

### D3 — Advisory pour les sessions supervisées, blocage pour les runs autonomes

Même détecteur, deux réactions selon le contexte :

- **Session supervisée par un humain** → le cockpit **avertit**, l'humain décide.
- **Run autonome** (`ezk-product-build` en mode auto, cop1) → avant de démarrer un sprint, la
  skill **vérifie l'intersection** et **s'arrête** (ou délègue à `ezk-pm`) si collision. C'est
  le **seul** endroit où le garde-fou est bloquant, parce qu'aucun humain n'est là pour
  trancher.

### D4 — Pas d'ordonnanceur de sprints

Le séquencement automatique des sprints **existe déjà** : `ezk-product-build` les enchaîne un
par un. « Un sprint actif à la fois » est une **règle de confort de pilotage** (la charge
cognitive de l'opérateur), rendue **visible** par le cockpit — **pas** un mécanisme de mise en
file d'attente à construire.

## Alternatives écartées

- **Verrou exclusif (une PR = une session, bloquant)** — hypothèse initiale de la fiche
  owner-PR. Écartée : cher, contourné, et il vise le mauvais objet (le danger est le fichier
  partagé, pas la PR).
- **Classifieur « intelligent » sprint vs métier** — écarté : cher et faux. Le type est
  déclaré/dérivé, jamais deviné, et il ne porte pas la sécurité.
- **Ordonnanceur / file d'attente de sprints** — écarté : infra lourde pour un besoin déjà
  couvert par `ezk-product-build` + la visibilité.

## Conséquences

**Positives**
- **Zéro nouveau mécanisme de concurrence** : on réutilise git (`worktree list`, `status`).
- Le cockpit de sessions devient la **surface « Observe »** du pilotage — son job est de
  raccourcir le temps entre « quelque chose a dérivé » et « j'agis ».
- Unifie plusieurs besoins épars (owner-PR, hygiène worktree, collision) derrière **un seul
  détecteur**.

**Négatives / dette assumée**
- Le détecteur ne voit que ce qui est **déjà modifié** sur disque, pas les intentions futures
  (deux sessions qui *vont* toucher le même fichier sans l'avoir encore fait).
- Un marqueur `.ezk-session` **périmé** peut mentir — rattrapé par le **croisement** avec
  « une session vit-elle réellement dans ce worktree ? ».
- Le mode bloquant (D3) doit être implémenté **dans** les skills autonomes ; il n'est pas
  imposé par le détecteur lui-même.
