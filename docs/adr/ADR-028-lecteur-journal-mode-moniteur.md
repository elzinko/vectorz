# ADR-028 — Lecteur de journal `.supervision/runs/` en mode moniteur : projection serveur

**Statut :** **Accepté** (2026-07-28 — erratum tampon : shippé en prod via fiches 0031 /
mission-control Moniteur ; le statut « Proposé » du 2026-07-14 est caduc).
Issu d'une session `/architecture`, cadre la fiche **0031**
(lecteur de journal dans la mission-control, mode moniteur D13).
**Opérationnalise :** contrat **cop1/supervisability@0.1** (fiche 0027, package `journal-validator`)
côté *lecture live* ; verrous **DP2** + décisions **D8/D9** de la fiche 0031.
**S'appuie sur :** [ADR-022](ADR-022-control-plane-ontology.md) (brique **(1) Superviseur** — surface
d'observation), [ADR-026](ADR-026-agent-executor-seam.md) (le moniteur observe un run **non piloté**
par cop1, donc hors seam exécuteur). Voisin de la fiche 0030 (épic démo, étape 4).

## Contexte

La mission-control diffuse aujourd'hui les runs que cop1 pilote lui-même : `EventBus.emit` →
`HttpServer.setEventBus` monkey-patche `emit` → SSE `/events` (frames `{eventType, timestamp,
payload}`, le front filtre par `payload.runId`). En mode moniteur, cop1 doit afficher un run qu'il n'a
**pas** lancé : une session Claude Desktop écrit `events.jsonl` (enveloppe v0.1) dans
`<projet>/.supervision/runs/<run_id>/`. cop1 lit ces journaux sur des watch-roots configurés, rejoue la
machine à états et affiche live, **read-only**.

Deux faits du code cadrent la décision. (1) Le package `journal-validator` (zéro dépendance cop1)
**rejoue déjà** la machine à états depuis le disque en batch : `validateRun(runDir)` retourne
`{ state, violations, notices }` via un `replayEvents` tolérant (`launched → running ⇄ at_gate →
finished | finished_at_gate | aborted`), avec les violations DP2 déjà typées
(`state.activity_while_gate_open`, `envelope.seq_gap`, …) et **aucun mapping gate→phase** — le verrou
DP2 est déjà tenu là. (2) Le SSE **ne rejoue pas le passé** : un run déjà sur disque au montage du
front ne recevra aucune frame tant qu'aucune ligne n'est ajoutée.

## Décision

1. **Projection côté serveur, source unique de vérité (point 1).** Un `JournalWatcherAdapter`
   (`fs.watch` sur `<root>/.supervision/runs/*`) **re-projette le run entier** à chaque changement en
   appelant `journal-validator`, maintient une `Map<runId, RunSnapshot>` dans un `SupervisionService`,
   et émet `EventBus.emit('supervision.run.updated', snapshot)` → SSE existant, **sans nouvelle
   plomberie**. Le front est **passif** : il affiche des snapshots indexés par `runId`, il **ne
   rejoue rien**. Re-lire le fichier entier à chaque `fs.watch` est trivial au POC (fixtures
   minuscules) — **pas de replay incrémental à offset** (YAGNI ; à introduire si un journal réel
   devient volumineux). Écarté : replay côté front (dupliquerait la machine à états en TS, exigerait
   que le front lise les journaux bruts — impossible via SSE seul — et disperserait le verrou DP2).

2. **Endpoint REST d'état initial : OUI (point 2).** `GET /api/supervision/runs` renvoie
   `Object.values(map)` (les snapshots courants). Nécessaire parce que le SSE ne rejoue pas le passé :
   au montage, le front **hydrate** via le REST, puis **applique** les deltas `supervision.run.updated`
   du SSE (upsert par `runId`). Même patron que `GET /api/sprint/status` déjà en place ; câblé par un
   `setSupervisionProvider(() => service.getSnapshots())` sur `HttpServer` (miroir de
   `SprintStatusProvider`, garde `HttpServer` sans dépendance concrète à la feature).

3. **Réutilisation 0027 : projection dans le package zéro-dep, machine à états non dupliquée
   (point 3).** `journal-validator` gagne **`projectRun(runDir): RunProjection`** (nouveau fichier
   `src/projectRun.ts`) qui produit le read-model d'affichage (`runId` camelCase, `state`, `gates`,
   `lastEventTs`, origine de chaque reprise via présence/absence de `gate.resumed.payload.command_ref`,
   provenance tokens `mesurés | absents-et-dits-absents`, `violations`, `notices`) en réutilisant
   `readEnvelopes`/`readLines`/`parseLines`. La logique de **transition d'état est factorisée** en une
   fonction pure partagée par `validateRun` et `projectRun` (le **seul** refactor toléré de 0027) :
   ainsi la machine à états — et le verrou DP2 « zéro gate→phase » — reste en **un seul endroit testé
   contre les 16 fixtures**. `readLines`/`parseLines` sont re-exportés depuis `index.ts`. Le package
   **reste zéro-dépendance cop1** (n'importe que `node:*`) ; la dépendance va `app → journal-validator`
   (feuille). Écarté : re-exporter seulement les lecteurs et réimplémenter la machine à états côté
   cop1 (duplication + risque de ré-introduire une sémantique de phase).

4. **Nommage & payload (point 4).** Un seul type d'événement bus/SSE : **`supervision.run.updated`**,
   payload = le `RunSnapshot` **entier** portant `runId` (camelCase, mappé depuis `run_id` à la
   frontière) → compatible tel quel avec le filtre `payload.runId` du front. Pas de
   `supervision.run.removed` au POC (un run ne disparaît pas). `contract.violation` voyage **dans** le
   snapshot (`violations[]`), pas comme événement séparé — le run reste lisible ligne invalide comprise.

5. **Emplacement (point 5).** Nouvelle feature `products/cop1/packages/app/src/features/supervision/`
   (convention `domain/application/infrastructure`) : `domain/RunSnapshot` (overlay `liveness` + type
   re-exporté de `journal-validator`), `application/SupervisionService` (Map, timer, provider),
   `infrastructure/JournalWatcherAdapter` (`fs.watch`). Web : **nouveau composant** `SupervisionView.tsx`
   + **nouvel onglet** `moniteur` dans `App.tsx` (`Tab = 'run' | 'rules' | 'connexion' | 'moniteur'`).

6. **Config (point 6).** Bloc `supervision` (Zod `ConfigSchema` + miroir `Cop1Config`) :
   `watch_roots: string[]` **défaut `[]`** (feature dormante, aucun `fs.watch` surprise sur `cwd`) et
   `presumed_dead_after_min: number` **défaut `5`**. `DaemonService` ne charge pas `ConfigLoader`
   aujourd'hui → on ajoute un `ConfigLoader.load(projectPath)` **one-shot** au démarrage pour lire ce
   bloc. **Hot-reload différé** (YAGNI POC) : changer les watch-roots demande un redémarrage du daemon.

7. **Timer `presumed_dead` côté serveur (point 7).** Il vit dans `SupervisionService` (a besoin de
   l'horloge murale + de l'état courant), défaut **N = 5 min**, configurable
   (`supervision.presumed_dead_after_min`). `liveness` (`live | presumed_dead`) est un **overlay
   serveur** distinct du `state` de contrat (que `journal-validator` calcule sans horloge, donc pur) :
   le timer n'est (ré)armé **que** quand `state === 'running'`, **jamais** en `at_gate` (D8 — le silence
   au jalon est le comportement exigé) ; il est purgé dès `at_gate`/`finished`. À l'expiration :
   `liveness = 'presumed_dead'` puis `supervision.run.updated` ré-émis.

**Verrous DP2/D8/D9 (non négociables, tenus par construction) :** panneau **read-only** (aucune route
d'écriture ajoutée) ; `report_ref` rendu **inerte** côté `SupervisionView` (échappé, confiné `realpath`
sous la racine projet, **jamais** de fetch/lien cliquable) ; **zéro mapping gate→phase** (le read-model
n'expose pas de phase — la phase se lit dans les rapports de la méthode) ; `presumed_dead` jamais armé
en `at_gate` ; tokens **jamais auto-déclarés** (provenance affichée) ; badge **« classe B —
best-effort »** visible dans `SupervisionView`.

## Options considérées

| Point | Retenu | Écarté (raison) |
|---|---|---|
| Replay | Projection **serveur**, front passif | Front rejoue les enveloppes brutes (dup. machine à états, SSE ne rejoue pas le passé, verrou DP2 dispersé) |
| État initial | `GET /api/supervision/runs` + deltas SSE | SSE seul (n'affiche pas un run déjà sur disque au montage) |
| Réutilisation | `projectRun` **dans** `journal-validator` + reducer partagé | Réimplémenter la machine à états côté cop1 (duplication, risque phase) ; dupliquer les lecteurs |
| Incrémental | Re-projection du fichier entier | Suivi d'offset par fichier (YAGNI au POC) |
| Timer | `SupervisionService` (serveur) | Timer côté front (deux sources de vérité, ne survit pas au démontage) |

## Conséquences

- ✅ **Source unique de vérité** : la sémantique du contrat v0.1 (machine à états + verrou DP2) reste
  dans `journal-validator`, testée contre 16 fixtures ; le front ne connaît aucune règle métier.
- ✅ **Coût minimal de plomberie** : réutilise le bus + SSE + le patron `provider` existants ; une seule
  route GET ajoutée, un seul type d'événement.
- ✅ **Verrous DP2 par construction** : read-only (aucune route d'écriture), `presumed_dead` séparé du
  `state` de contrat, zéro phase dans le read-model.
- ⚠️ **Touche 0027** (borné) : `journal-validator` gagne `projectRun` + un reducer d'état partagé + deux
  re-exports ; `validateRun` doit rester à comportement **identique** (mêmes 16 fixtures vertes).
- ⚠️ **`DaemonService` charge désormais la config** (one-shot) — nouveau lien app → config au démarrage.
- 🔁 **Différés (YAGNI)** : replay incrémental à offset, hot-reload des watch-roots,
  `supervision.run.removed`, pagination des runs.

## Fichiers à créer / modifier (guide TDD)

**Créer**
- `products/cop1/packages/journal-validator/src/projectRun.ts` — `projectRun(runDir): RunProjection`
  (read-model : `runId`, `state`, `gates`, `lastEventTs`, origine des reprises, provenance tokens,
  `violations`, `notices`) ; + `src/reduceState.ts` (transition pure factorisée).
- `products/cop1/packages/app/src/features/supervision/domain/RunSnapshot.ts` — snapshot + overlay
  `liveness`.
- `products/cop1/packages/app/src/features/supervision/application/SupervisionService.ts` — `Map<runId,
  snapshot>`, timer `presumed_dead`, `getSnapshots()`, câblage watcher→bus.
- `products/cop1/packages/app/src/features/supervision/infrastructure/JournalWatcherAdapter.ts` —
  `fs.watch` sur les watch-roots → `projectRun` → `emit('supervision.run.updated', snapshot)`.
- `products/cop1/packages/web/src/SupervisionView.tsx` — hydrate via `GET /api/supervision/runs`,
  applique les deltas SSE, rendu read-only + `report_ref` inerte + badge classe B.

**Modifier**
- `products/cop1/packages/journal-validator/src/index.ts` — re-exporter `readLines`, `parseLines`,
  `projectRun`, type `RunProjection` ; `src/validateRun.ts` — dériver du reducer partagé (comportement
  inchangé).
- `products/cop1/packages/app/src/features/config/domain/ConfigSchema.ts` +
  `products/cop1/packages/shared-kernel/src/features/config/domain/Cop1Config.ts` — bloc `supervision`
  (`watch_roots: []`, `presumed_dead_after_min: 5`).
- `products/cop1/packages/app/src/features/daemon/application/DaemonService.ts` — charger la config
  (one-shot), instancier `SupervisionService`, `setSupervisionProvider`, démarrer le watcher.
- `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts` — route
  `GET /api/supervision/runs` + `setSupervisionProvider(provider)` (miroir `SprintStatusProvider`).
- `products/cop1/packages/web/src/App.tsx` — onglet `moniteur` → `SupervisionView`.
