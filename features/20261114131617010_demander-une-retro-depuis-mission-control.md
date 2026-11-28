---
id: "20261114131617010"
title: "Demander une rétro sur des sprints cochés depuis mission control"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control, sprint]
status: ready
blocked:
pr:
evidence: before-after
created: 2026-11-14
---

# 20261114131617010 — Demander une rétro sur des sprints cochés depuis mission control

**En clair.** La page Rétros de la maquette a un bouton « Lancer la rétro sur les sprints cochés »,
dessiné en gris : rien ne le branche. Une rétro a besoin d'une session Claude, que la méthode ne
lance jamais. Le bouton va déposer une demande de rétro, visible dans la cloche, et la prochaine
session la jouera : tu coches, tu demandes, et la rétro suivante relit ces sprints sans que tu aies
à les lui redire.

**Si tu arrives frais.** `/ezk-retro run` est la cérémonie de rétro, une compétence (skill) jouée par
une session Claude Code. `ezk retro note` dépose une note au carnet de rétro, hors de git, que la
rétro lit en ouverture. Mission control (cop1) n'écrit dans un projet que par une commande `ezk` (ADR-086).

## Contexte / Problème

Ce que l'écran attend. La page Rétros de la maquette du 11 novembre : des sprints à cocher, les
déjà relus grisés, un bouton « Lancer la rétro ». Le PO a accepté un bouton gris en attendant.

Ce qui existe aujourd'hui.

- `/ezk-retro run` est une compétence Claude Code, pas un verbe de la CLI. `ezk help retro` connaît
  `captures`, `reports` et `note`. Aucun verbe du manifeste ne lance une compétence ni une session.
  `products/mega-city/skills/ezk-retro/SKILL.md:5`, `products/mega-city/ezk-manifest.yml:353-368`
- L'ADR-086 fixe le cadre : seules les commandes `ezk` écrivent dans un projet (point 4) ; la
  méthode ne connaît pas cop1 et ne le lance jamais (point 5).
  `docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md:58-60`
- Le seul chemin d'écriture depuis l'écran est le pouce de revue : le daemon lance
  `ezk --root <projet> review verdict <id> <pouce>`.
  `products/cop1/packages/app/src/features/board/verdictWriter.ts:46-64`,
  `products/cop1/packages/app/src/features/daemon/application/DaemonService.ts:119-129`,
  lanceur `products/cop1/packages/app/src/features/board/ezkExec.ts`
- Le précédent asynchrone : `ezk retro note` dépose une note dans `<git-common-dir>/ezk/retro-notes/`,
  sans commit ; la rétro la lit à son temps 1. Les types admis sont `friction`, `idée`, `problème`.
  `products/mega-city/skills/ezk-retro/scripts/note.sh:1-24` et `:58`, `skills/ezk-retro/SKILL.md:76-81`
- La vue Développement porte un configurateur « Lancer la réalisation », avec un réglage
  « Rétrospective » et un bouton « ▸ Lancer le run » qui affiche « Lancement simulé … (maquette) ».
  Rien ne part.
  `products/cop1/packages/web/src/board/DevView.tsx:7` et `:110-144` ; un test le clique,
  `products/cop1/packages/web/src/board/board198.test.tsx:98`
- Le déclencheur réel d'une rétro aujourd'hui est le pilote du lancement autonome
  (`ezk-product-build --retro`), pas l'écran :
  [Rétro systématique en fin d'itération](done/20260911224102584_retro-systematique-fin-iteration-multi-sprint.md).

## Proposition

Patron « la commande, puis le bouton », comme
[Mission control pose le pouce de revue](done/20261102151630248_mission-control-pose-le-pouce-de-revue.md).

1. Côté méthode (mega-city), le minimum : un type `demande` s'ajoute à `ezk retro note`.
   `ezk --root <projet> retro note "Rétro demandée : <sprints>" --type demande`, corps = un slug de
   compte rendu par ligne. La commande refuse un slug sans compte rendu. Elle refuse un sprint déjà
   relu dès que
   [Une rétro relit une liste de sprints nommés](20261114131614801_retro-relit-une-liste-de-sprints-nommes.md)
   est livrée. Elle imprime le chemin de la demande. Pas de nouveau verbe `retro request` tant que
   `retro note` suffit.
2. La demande se publie une seule fois : un type d'alerte `retro-demandee` dans `ezk now --json`
   ([`ezk now --json` publie les alertes de la cloche](done/20261114131612944_ezk-now-json-alertes-de-la-cloche.md)).
   Pas de doublon dans `board show`.
3. La prochaine rétro la joue : `/ezk-retro run` sans option prend d'abord les demandes en attente
   comme périmètre, avant le défaut de la fiche sur les sprints nommés (les comptes rendus qu'aucune
   capture ne cite), et les verse dans sa capture ; `ezk-product-build --retro` les respecte.
4. Côté cop1 : la page Rétros coche des sprints, les relus grisés ; « Lancer la rétro » appelle le
   verbe par le daemon, sur le même chemin que le pouce ; la page affiche « rétro demandée, en
   attente d'une session » et nomme les sprints.
5. Aucun processus Claude n'est lancé par mission control. L'écran le dit en mots. Un test le
   prouve : le daemon ne lance que `ezk`.
6. Le configurateur simulé de la vue Développement : la fiche propose de le retirer. Un lancement
   simulé dans l'app réelle est une interface morte (règle `clean-code/no-dead-code`). Le PO peut
   préférer le brancher plus tard sur un vrai lanceur.

Hors périmètre : lancer une vraie session depuis l'écran. Cela change l'ADR-086 point 5 et rejoint
[Un siège automatique qui joue une vraie session](20260821210633457_explorateur-llm-pilote-siege-exploration-pr.md),
différée.

## Critères d'acceptation

- [ ] `ezk retro note --type demande` dépose une demande hors git, à côté des notes du carnet, avec
  les slugs en corps ; un slug sans compte rendu est refusé ; un sprint déjà relu est refusé une
  fois la fiche sur les sprints nommés livrée.
- [ ] La demande apparaît dans `ezk now --json` comme une alerte `retro-demandee`, avec ses sprints ;
  elle n'apparaît dans aucun autre contrat.
- [ ] `/ezk-retro run` sans option prend les demandes en attente comme périmètre, avant le défaut
  des comptes rendus non cités ; la capture produite les cite et la demande sort de la cloche.
- [ ] Sur la page Rétros, cocher des sprints puis « Lancer la rétro » dépose la demande par le
  daemon ; la page affiche « rétro demandée, en attente d'une session » et nomme les sprints ; un
  sprint déjà relu ne se coche pas.
- [ ] Mission control ne lance aucun processus autre que `ezk` ; un test du daemon le prouve ;
  l'écran dit qu'une session jouera la rétro.
- [ ] Le configurateur simulé de la vue Développement est retiré, ou branché si le PO le décide ;
  aucun « lancement simulé » ne reste dans l'app.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
# déposer une demande : le chemin imprimé est hors du worktree ; la demande est une alerte
printf '%s\n' <slug-1> <slug-2> | ezk --root "$ROOT" retro note "Rétro demandée : <slug-1>, <slug-2>" --type demande
bash products/mega-city/skills/ezk-retro/scripts/note.sh --root "$ROOT" list
ezk --root "$ROOT" now --json | jq '.alertes[] | select(.type=="retro-demandee")'
# un sprint déjà relu est refusé (après la fiche sur les sprints nommés)
printf '%s\n' <slug-deja-relu> | ezk --root "$ROOT" retro note "Rétro demandée" --type demande ; echo "EXIT=$?"
```

- Dans une session, rejouer `/ezk-retro run` sans option : la cérémonie annonce les sprints demandés.
- Tests :

```bash
bash products/mega-city/skills/ezk-retro/scripts/test-note.sh
pnpm --dir products/cop1/packages/app test -- src/features/board/
pnpm --dir products/cop1/packages/web test -- src/board/
```

- Preuve d'écran dans `docs/pr-evidence/20261114131617010/` : avant, le bouton gris ; après, la
  demande affichée avec ses sprints, puis la capture qui la reprend.

## Glossaire

- carnet de rétro — les notes déposées par `ezk retro note` dans `<git-common-dir>/ezk/retro-notes/`,
  le dossier `.git` partagé par tous les worktrees ; la rétro suivante les lit.
- daemon — le service de cop1 qui lance les commandes `ezk` pour l'écran.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart F3. État corrigé à la contestation : « absent » devient « partiel », car une demande est déjà
  faisable avec `ezk retro note --type idée` ; il manque le typage, la publication, le bouton et le
  sort du lanceur simulé.
- Dépend de :
  [`ezk now --json` publie les alertes de la cloche](done/20261114131612944_ezk-now-json-alertes-de-la-cloche.md),
  le canal d'alerte ;
  [Une rétro relit une liste de sprints nommés](20261114131614801_retro-relit-une-liste-de-sprints-nommes.md),
  les slugs et les sprints déjà relus.
- Décisions à prendre par le PO : une demande déposée suffit-elle, ou veut-il un vrai lancement de
  session (changement de l'ADR-086 point 5) ? Le verbe mega-city et le bouton cop1 : une fiche ou
  deux fiches sœurs, comme pour le pouce ? Le lanceur simulé de la vue Développement : retirer ou
  brancher ?
- Fiches voisines : [Carnet de préparation de rétro](done/0081-carnet-preparation-retro.md), le canal
  « déposer, la rétro lit » ;
  [La note de passation et le carnet survivent à la suppression d'un worktree](done/20261003105820077_handoff-carnet-hors-worktree-app.md),
  le dossier hors git ;
  [Board : vue Cadrage et vue Développement](done/20261012231419198_board-cadrage-developpement.md), le configurateur simulé.
- Risque : la note vit hors git et ne survit pas à un nouveau clone, revers accepté du carnet. Une
  demande doit donc rester rejouable depuis l'écran.
- Références : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), les points 4 et 5 ;
  [ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md), le pouce de revue, seule écriture depuis l'écran aujourd'hui.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Une demande déposée suffit ; mission control ne lance pas la cérémonie. Le configurateur simulé est retiré. À tirer après la fiche des sprints nommés.
