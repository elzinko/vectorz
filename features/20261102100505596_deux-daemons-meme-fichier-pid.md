---
id: "20261102100505596"
title: "Deux daemons de mission control lancés du même dossier se partagent un seul fichier de pid"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: ready
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

Décision du groom : **un fichier de pid par port**, `.cop1/daemon-<port>.pid`. Refuser le second
daemon casserait ton propre usage : `.claude/launch.json` lance volontairement deux instances du même
dossier, `mission-control` et `mission-control-verif`.

- Le daemon écrit le fichier de son port, et n'efface que celui-là en s'arrêtant.
- `cop1 start` refuse seulement un port déjà tenu par une instance vivante du dossier.
- `cop1 status` liste chaque instance du dossier, avec son port et son pid. Un fichier dont le
  processus est mort est retiré, et la ligne le dit.
- `cop1 stop` arrête l'instance quand il n'y en a qu'une. S'il y en a plusieurs, il refuse, liste les
  ports et demande `--port`. `cop1 stop --port N` arrête celle-là.
- Un ancien fichier `daemon.pid`, écrit avant ce changement, reste lu par `status` et `stop`, comme
  une instance au port inconnu.

## Critères d'acceptation

- [ ] Deux daemons lancés du même dossier sur deux ports écrivent deux fichiers, `daemon-<port>.pid`.
- [ ] Arrêter l'un n'efface que son fichier : `cop1 status` montre encore l'autre, avec son port et
      son pid.
- [ ] `cop1 stop` sans port, face à deux instances, refuse et liste les ports ; `cop1 stop --port N`
      arrête la bonne.
- [ ] `cop1 start` refuse un port déjà tenu par une instance vivante du dossier, et en accepte un
      autre.
- [ ] Un ancien `daemon.pid` reste lu par `status` et `stop`.

## Comment vérifier

1. Les tests du daemon et des commandes passent :
   `pnpm exec vitest run products/cop1/packages/app/src/features/daemon products/cop1/packages/app/src/cli`.
2. Rejouer la reproduction de la fiche, puis lancer `cop1 status` depuis le dossier `$D` après
   l'étape 4 : le daemon A est listé, avec son port 4354 et son pid.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B2), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/daemon/application/DaemonService.ts:256`.
- **Groomée le 2026-11-03** (run autonome) : le fichier unique vient de
  `PidFileManager.ts` (`.cop1/daemon.pid`), lu par `start`, `status`, `stop` et le daemon. Aucun écran
  ne change.
