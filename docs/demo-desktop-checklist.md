# Checklist démo Desktop — un manager supervisé de bout en bout

Fiche `features/0030-mvp-demo-desktop.md`, étape 0. Prépare et rejoue la démo
« mode moniteur pur » : un manager (ex. ezk-product-builder) tourne dans Claude
Desktop, émet le journal du contrat de supervisabilité v0.1
(`products/mega-city/src/supervision/`), cop1 le surveille en lecture seule
dans l'onglet Moniteur de sa web UI.

**Convention** : chaque étape est une case à cocher, avec la commande exacte à
copier-coller et le résultat observable attendu. Une étape non écrite ici est
réputée manquante — ne rien laisser à la mémoire du lecteur.

Cette checklist a été **rejouée intégralement en remplaçant Claude Desktop par
un client MCP stdio scripté** (pas une fixture) : chaque commande ci-dessous a
été exécutée telle quelle avant d'être figée dans ce document ; les écarts
rencontrés pendant le replay ont été corrigés dans le texte (voir encadrés
« ⚠️ piège rencontré au replay »).

---

## 1. Pré-requis

- [ ] **Repo `vectorz` cloné**, avec les sous-modules/subtree `products/cop1`
      et `products/mega-city` présents :
      ```bash
      ls products/cop1/packages/app products/mega-city/bin
      ```
      Résultat attendu : les deux dossiers existent, pas d'erreur `No such
      file or directory`.

- [ ] **Dépendances installées et build à jour** (racine du repo) :
      ```bash
      pnpm install && pnpm build
      ```
      Résultat attendu : `pnpm build` se termine sans erreur `tsc` ; en
      particulier `products/cop1/packages/app/dist/cli/index.js` et
      `products/cop1/packages/journal-validator/dist/cli.js` existent.

- [ ] **Versions** : Node ≥ 20 (`node -v`), pnpm ≥ 10 (`pnpm -v`). Le repo
      pointe déjà les versions exactes dans `package.json`/`.tool-versions` si
      présents — s'y aligner en cas de doute.

- [ ] **Claude Desktop installé**, avec accès aux fichiers de config MCP
      (`~/Library/Application Support/Claude/claude_desktop_config.json` sur
      macOS).

---

## 2. Côté projet supervisé (règle DP6)

Le journal de supervisabilité (`.supervision/`) vit **dans l'arbre principal**
du projet supervisé (jamais dans un worktree secondaire) et doit être
**gitignoré d'office** — sinon chaque run pollue `git status`.

- [ ] Choisir/créer le **projet supervisé** (le projet où tourne le manager
      Desktop — peut être `vectorz` lui-même ou tout autre projet). Noter son
      **chemin absolu** : `PROJET_SUPERVISE=/chemin/absolu/vers/le/projet`.

- [ ] Ajouter la règle DP6 à son `.gitignore` :
      ```bash
      echo ".supervision/" >> "$PROJET_SUPERVISE/.gitignore"
      ```
      Résultat attendu : `git -C "$PROJET_SUPERVISE" status` ne montrera
      jamais `.supervision/` une fois les runs créés à l'étape 5.

---

## 3. Config MCP Claude Desktop (par projet)

Le serveur MCP émetteur est un process stdio, **un par projet supervisé** —
`project_root` est fixé une seule fois, à l'**init du serveur**, via la
variable d'environnement `SUPERVISION_PROJECT_ROOT`. Ce n'est **jamais** un
paramètre passé par un outil : la méthode qui tourne dans Desktop ne peut pas
se désigner un autre projet à la volée (D12).

- [ ] Ouvrir la config MCP de Claude Desktop et ajouter une entrée
      `supervision` (bloc repris tel quel de
      `products/mega-city/src/supervision/README.md`) :
      ```json
      {
        "mcpServers": {
          "supervision": {
            "command": "pnpm",
            "args": ["exec", "tsx", "/chemin/absolu/vers/vectorz/products/mega-city/bin/supervision-mcp.ts"],
            "env": { "SUPERVISION_PROJECT_ROOT": "/chemin/absolu/du/projet/supervisé" }
          }
        }
      }
      ```
      - `args[1]` : chemin **absolu** vers `products/mega-city/bin/supervision-mcp.ts`
        dans le clone `vectorz`.
      - `env.SUPERVISION_PROJECT_ROOT` : chemin **absolu** vers
        `$PROJET_SUPERVISE` (celui de l'étape 2). Doit exister — sinon le
        serveur refuse de démarrer (fail-fast, message explicite).

- [ ] Redémarrer Claude Desktop pour charger la config.

- [ ] Dans Desktop, ouvrir les réglages de l'entrée MCP `supervision` et
      passer les **5 outils** en « toujours autoriser » (allow-list), pour
      éviter la fatigue de popups pendant la démo : `run_start`,
      `gate_reached`, `gate_resumed`, `escalate`, `run_finished`. Emplacement
      Desktop : icône outils (🔧) en bas de la fenêtre de conversation → nom
      du serveur `supervision` → bascule chaque outil sur « Always Allow ».

- [ ] **Vérification** : démarrer une conversation Desktop dans le projet
      supervisé et demander la liste des outils MCP disponibles. Résultat
      attendu : exactement `run_start`, `gate_reached`, `gate_resumed`,
      `escalate`, `run_finished` apparaissent — pas un de plus (le kit est
      volontairement à 5 outils étroits).

---

## 4. Côté cop1 (daemon + web UI)

Le daemon cop1 et le projet supervisé sont **deux dossiers distincts**. Le
daemon lit `cop1.config.yaml` dans le dossier **où il est démarré**
(`cop1 start` utilise `process.cwd()`, pas le projet supervisé) — c'est là,
et pas ailleurs, que `supervision.watch_roots` doit être configuré.

> ✅ **Règle (depuis la fiche 0032)** : `cop1 start` résout le port avec la
> priorité `--port` explicite > `daemon.port` de `cop1.config.yaml` (lu depuis
> le cwd) > défaut 4242. Une config qui déclare `daemon.port: <N>` est donc
> honorée sans option. Si vous changez de port (option ou config), pensez à
> `VITE_DAEMON_PORT=<N>` côté web UI (étape 4.4) — le proxy Vite reste sur
> 4242 par défaut. Une config invalide n'empêche pas le démarrage : warn
> visible + port par défaut.

> ✅ **Règle (depuis la fiche 0033)** : les **défauts** `ram_budget_*` sont
> clampés à la RAM détectée — une config vierge démarre sur n'importe quel
> poste, plus rien à ajuster pour la démo. Si vous **posez** vous-même une
> valeur qui excède la RAM physique, `cop1 start` échoue **immédiatement**
> avec un message nommant le champ, la valeur et la RAM détectée (plus de
> timeout muet de 30 s). En cas d'échec de démarrage pour une autre cause,
> la sortie du daemon est dans `.cop1/daemon.log` et les dernières lignes
> sont affichées par la commande.

- [ ] Choisir/créer le **dossier cop1** (là où tourne le daemon — peut être la
      racine du clone `vectorz`, ou un dossier dédié). S'y placer :
      ```bash
      cd /chemin/absolu/vers/le/dossier-cop1
      ```

- [ ] Créer `cop1.config.yaml` à cette racine avec `supervision.watch_roots`
      pointant sur le **chemin absolu** du projet supervisé (`$PROJET_SUPERVISE`,
      étape 2) :
      ```yaml
      project:
        name: demo-desktop
        path: "."

      resources:
        ram_budget_night_gb: 4
        ram_budget_day_gb: 4

      supervision:
        watch_roots:
          - "/chemin/absolu/du/projet/supervisé"
        presumed_dead_after_min: 5
      ```
      (Ajuster `ram_budget_*` à la hausse si la machine de démo a plus de RAM
      — le minimum accepté est 4.)

- [ ] Lancer le daemon depuis ce dossier :
      ```bash
      node /chemin/absolu/vers/vectorz/products/cop1/packages/app/dist/cli/index.js start
      ```
      Résultat attendu : `cop1 started (pid: <N>)` imprimé après un health
      check qui passe. Vérifier :
      ```bash
      curl -s http://127.0.0.1:4242/health
      ```
      → `{"status":"ok",...}`. Et que la supervision est bien armée :
      ```bash
      curl -s http://127.0.0.1:4242/api/supervision/runs
      ```
      → `[]` (aucun run pour l'instant, mais la route répond — si elle
      répondait `404`/vide sans provider, `watch_roots` n'a pas été pris en
      compte : relire la config).

- [ ] Lancer la web UI (depuis `products/cop1/packages/web` du clone
      `vectorz`) :
      ```bash
      cd /chemin/absolu/vers/vectorz/products/cop1/packages/web
      pnpm dev
      ```
      Résultat attendu : Vite annonce `Local: http://localhost:5173/`. Le
      proxy `/api` et `/events` vers `http://localhost:4242` est déjà
      configuré dans `vite.config.ts` (variable `VITE_DAEMON_PORT`,
      défaut `4242` — cohérent avec l'étape précédente tant que ni
      `--port` ni `daemon.port` en config n'ont changé le port du daemon).

- [ ] Ouvrir `http://localhost:5173` dans un navigateur, cliquer l'onglet
      **Moniteur**. Résultat attendu : `classe B — best-effort` et
      `Aucun run surveillé.` (aucun run tant que Desktop n'a rien émis).

---

## 5. Déroulé de démo (5 temps)

Toute étape non écrite ici est réputée manquante (fiche 0030). Chaque
« résultat observable » ci-dessous a été vérifié réellement au replay.

- [ ] **Temps 1 — le soir, lancement du manager dans Claude Desktop.**
      Dans une session Desktop du projet supervisé (config MCP de l'étape 3
      active), lancer le manager (ex. skill `supervision-demo` pour un run
      jouet, ou une méthode réelle instrumentée). Le premier outil émis est
      `run_start` :
      ```json
      { "method_name": "<ta-méthode>", "method_version": "<sa-version>", "seat": "human" }
      ```
      > ⚠️ **Piège rencontré au replay** : `method_version` est **requis**
      > par le schéma du serveur (`runtime.ts`), alors que le template de
      > consignes du README du kit (`src/supervision/README.md`) ne mentionne
      > que `method_name` et `seat`. Toujours passer les trois champs.

      Résultat observable : le retour de l'outil contient un `run_id`
      (horodaté) ; sur disque,
      `$PROJET_SUPERVISE/.supervision/runs/<run_id>/events.jsonl` apparaît
      avec une première ligne `"type":"run.started"`.

- [ ] **Temps 2 — le run apparaît live dans le Moniteur.**
      Rafraîchir (ou laisser le SSE pousser) l'onglet Moniteur.
      Résultat observable : une carte de run apparaît avec
      `classe B — best-effort`, `État : running`,
      `Tokens : absents-et-dits-absents` (aucune mesure runtime câblée dans ce
      POC — c'est le comportement attendu, pas un bug), et « Dernier
      événement il y a Xs » qui s'incrémente. Pas besoin de recharger la page
      pour la suite : les transitions suivantes arrivent en direct par SSE.

- [ ] **Temps 3 — checkpoint, gate atteint, run garé.**
      Le manager émet `escalate` (optionnel, signal non-bloquant — n'arrête
      jamais le run) puis `gate_reached` :
      ```json
      { "gate_id": "<ton-checkpoint>", "outcome": "ok", "report_markdown": "<résumé>" }
      ```
      Le résultat de l'outil contient `"message": "STOP — arrête-toi et
      attends la décision du siège avant de continuer."` et un
      `gate_event_id` — **le manager doit vraiment s'arrêter ici** (fin de
      tour, attente de l'humain).
      Résultat observable côté Moniteur : `État : at_gate`, une entrée sous
      « Gates » avec `gate_id` et un `report_ref` pointant vers
      `.supervision/runs/<run_id>/report-<gate_id>-<seq>.md` (rapport rendu
      inerte — un fichier markdown statique, jamais exécuté).

- [ ] **Temps 4 — le matin, reprise dans LA session Desktop (self-reported).**
      Toujours dans la **même session Desktop** (aucun bouton cop1, aucune
      action côté daemon), le manager émet `gate_resumed` avec le
      `gate_event_id` reçu au temps 3 :
      ```json
      { "gate_event_id": "<celui-du-gate_reached>" }
      ```
      Résultat observable : `État : running` à nouveau, et l'entrée du gate
      dans le Moniteur affiche désormais « — reprise self-reported en
      session » (origine `self_reported`, déduite de l'absence de
      `command_ref` dans l'événement — cohérent avec le mode moniteur pur,
      aucune commande cop1 n'a rouvert le run).

- [ ] **Temps 5 — clôture du run.**
      Le manager termine par `run_finished` :
      ```json
      { "status": "success" }
      ```
      Résultat observable : `État : finished` dans le Moniteur, toutes les
      gates listées avec leur origine de reprise.

---

## 6. Vérification finale — validateur 0027

- [ ] Repérer le dossier du run :
      ```bash
      RUNDIR=$(find "$PROJET_SUPERVISE/.supervision/runs" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)
      echo "$RUNDIR"
      ```

- [ ] Lancer le validateur :
      ```bash
      node /chemin/absolu/vers/vectorz/products/cop1/packages/journal-validator/dist/cli.js validate "$RUNDIR"
      ```
      **Résultat « vert » attendu (texte exact affiché)** :
      ```
      Aucune violation.
      État final de la machine à états : finished
      état final: finished — 0 violation(s), 0 notice(s)
      ```
      Code de sortie du process : `0`. Si une perte est détectée (journal
      tronqué, gate orphelin, séquence trouée…) le validateur liste les
      violations avec leur code et le run ne doit PAS être présenté comme
      réussi — « une perte détectée fait partie du script » (fiche 0030) : le
      montrer plutôt que le cacher.

- [ ] **Garde-fou mode moniteur pur** : vérifier qu'aucun `commands.jsonl` n'a
      été créé (cop1 n'a émis aucune commande, zéro executor touché) :
      ```bash
      find "$PROJET_SUPERVISE/.supervision" -iname "commands.jsonl"
      ```
      Résultat attendu : sortie vide.

---

## 7. Nettoyage après la démo

- [ ] Arrêter le daemon depuis le dossier cop1 :
      ```bash
      node /chemin/absolu/vers/vectorz/products/cop1/packages/app/dist/cli/index.js stop
      ```
- [ ] Arrêter la web UI (`Ctrl-C` sur le process `pnpm dev`).
- [ ] Le dossier `$PROJET_SUPERVISE/.supervision/runs/<run_id>/` reste sur
      disque (c'est la preuve de la démo) — gitignoré par la règle DP6 de
      l'étape 2, donc sans impact sur `git status`.
