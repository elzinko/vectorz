---
id: "20261102100505596"
title: "Deux daemons de mission control lancés du même dossier se partagent un seul fichier de pid"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: none # fichier d'état du daemon ; pas d'écran
created: 2026-11-02
---

# Deux daemons lancés du même dossier se partagent un seul fichier de pid

**En clair.** `.claude/launch.json` prévoit deux instances de mission control lancées depuis la racine
de vectorz. Les deux écrivent le même fichier `.cop1/daemon.pid`. Le second écrase le numéro du
premier, et l'arrêt de l'un efface le fichier alors que l'autre tourne encore. `cop1 status` se trompe
alors d'instance, ou la croit arrêtée.

**Si tu arrives frais.** Le fichier de pid garde le numéro du processus du daemon. `cop1 status` et
`cop1 stop` le lisent pour savoir quelle instance tourne.

## Contexte / Problème

Gravité : **mineure**. Rien ne casse à l'usage normal, mais le statut affiché devient faux dès que
deux instances tournent.

Reproduction, constatée 2 fois sur 2 :

1. `D=$(mktemp -d); cp cop1.config.yaml supervision.registry.yaml $D/`
2. `COP1_PROJECT_PATH=$D node products/cop1/packages/app/dist/cli/daemon-entry.js --port 4354 &`
   lance le daemon A.
3. `COP1_PROJECT_PATH=$D node products/cop1/packages/app/dist/cli/daemon-entry.js --port 4355 &`
   lance le daemon B. `cat $D/.cop1/daemon.pid` affiche alors le pid de B.
4. `kill -TERM <pid de B>`, puis `ls $D/.cop1/daemon.pid` : le fichier a disparu, alors que
   `curl http://127.0.0.1:4354/health` répond toujours.

Attendu : un fichier de pid par instance, ou un refus du second daemon. Obtenu : un seul fichier,
écrasé puis effacé.

Les deux configurations concernées : `mission-control` et `mission-control-verif`.

## Proposition

Au choix, à trancher au groom : un fichier de pid par port, ou un refus du second daemon quand le
fichier désigne un processus vivant.

## Critères d'acceptation

- [ ] Avec deux instances lancées du même dossier, `cop1 status` décrit correctement chacune, ou le
  second lancement est refusé avec un message clair.
- [ ] L'arrêt d'une instance ne fait pas croire que l'autre est arrêtée.

## Comment vérifier

Rejouer la reproduction ci-dessus, puis lancer `cop1 status` après l'étape 4.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B2), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/daemon/application/DaemonService.ts:256`.
