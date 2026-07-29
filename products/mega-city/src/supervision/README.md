# Kit émetteur de supervisabilité (contrat v0.1)

Implémentation de référence de l'émission du contrat de supervisabilité v0.1
(spec normative : capture cop1 `docs/captures/2026-07-13-contrat-methode-et-versions.md` §7).
Fiche : `features/0050-kit-emetteur-supervisabilite.md`.

- `journal.ts` — append JSONL par run (`<projet>/.supervision/runs/<run_id>/events.jsonl`),
  enveloppe calculée par la lib, seq relu du disque, lecteur tolérant.
- `upgrade-ok.ts` — quiescence mécanique (git propre + **zéro sous-run dans le dossier
  dédié `.cop1/worktrees/`**, jamais « zéro worktree du dépôt » — décision produit PO
  2026-07-24, fiche 0085, modèle « MAJ Claude » : les worktrees de TRAVAIL de
  l'opérateur ne sont pas des sous-runs, un signal constamment faux est un signal qu'on
  apprend à ignorer) ; veto → false only ; le forçage humain « malgré l'activité »
  relève du flux d'adoption (fiche 0050), le signal ne ment jamais.
- `runtime.ts` — machine à états stateless (replay disque à chaque appel).
- `mcp-server.ts` + `bin/supervision-mcp.ts` — serveur MCP stdio, **6 outils étroits**
  (chemin nominal Claude Desktop, classe de conformité B ; `heartbeat` = fiche 0103).

## Configurer dans Claude Desktop

> **Chemin nominal : le paquet un-double-clic.** `bash bin/build-mcpb.sh` produit
> `dist/vectorz-supervision.mcpb` — serveur embarqué, aucun prérequis côté utilisateur
> (Claude Desktop fournit son propre Node), sélecteur de dossier à l'installation.
> Le câblage manuel ci-dessous est le **chemin de secours** : utile pour lancer le
> serveur depuis les sources, ou si l'installation par paquet n'est pas possible.

Prérequis du câblage manuel : Node ≥ 20 + pnpm ≥ 9 installés, et **`pnpm install`** lancé
une fois à la racine du dépôt (le serveur a besoin de `tsx` et du SDK MCP dans
`node_modules`).

```json
{
  "mcpServers": {
    "supervision": {
      "command": "/chemin/absolu/vers/pnpm",
      "args": [
        "--dir", "/chemin/absolu/vers/mega-city",
        "exec", "tsx",
        "/chemin/absolu/vers/mega-city/bin/supervision-mcp.ts"
      ],
      "env": { "SUPERVISION_PROJECT_ROOT": "/chemin/absolu/du/projet/supervisé" }
    }
  }
}
```

Deux pièges de lancement GUI (Claude Desktop n'hérite pas du shell), tous deux couverts
par le bloc ci-dessus :
- **`command` = chemin absolu de pnpm** (`which pnpm`), pas `"pnpm"` nu : une app lancée
  depuis l'interface démarre avec un PATH minimal (launchd) et ne trouverait pas un pnpm
  installé via nvm/corepack/Homebrew → `spawn pnpm ENOENT`.
- **`--dir <mega-city>`** : `pnpm exec` résout `tsx` depuis ce dossier ; `tsx` n'est pas
  hoisté à la racine du monorepo, donc sans `--dir` (cwd GUI = `/`) on obtient
  `ERR_PNPM_RECURSIVE_EXEC_NO_PACKAGE`.

`SUPERVISION_PROJECT_ROOT` doit être **absolu et exister** (fail-fast sinon).

**Racine normalisée vers l'arbre principal (ADR 0019, fiche 0086)** : si la racine
résolue (explicite ou cwd) pointe un **worktree git lié**, le journal est écrit dans
**l'arbre principal** du dépôt (même sous-chemin relatif) — fin de la perte silencieuse
quand un worktree est supprimé. Hors dépôt git / submodule / dépôt bare : racine
inchangée, aucun crash. Le serveur **annonce sur stderr** au démarrage la racine
effective et sa provenance (`[supervision] journal → … (racine …, normalisée depuis … |
telle quelle)`) — c'est la ligne à lire pour savoir où va le journal. Échappatoire
délibérée : `SUPERVISION_PER_WORKTREE=1` (ou `true`) rétablit un journal par worktree.

Autoriser les 6 outils en « toujours autoriser » pour éviter la fatigue de popups.
Pour tester sans toucher aux méthodes de prod : skill **`supervision-demo`** (méthode
jouet 2 gates).

## Brancher un projet Claude Code — une commande (fiche 0094)

Côté **Claude Code**, pas besoin d'éditer le `.mcp.json` à la main. Depuis la racine du
dépôt :

```bash
pnpm --dir products/mega-city supervision:link /chemin/absolu/du/projet
```

La commande écrit (ou **fusionne**, sans toucher aux autres serveurs MCP) le bloc
`supervision` dans le `.mcp.json` du projet, avec `SUPERVISION_PROJECT_ROOT` fixé à sa
racine, et ajoute `.supervision/` à son `.gitignore`. **Idempotente** : la rejouer met à
jour les chemins (utile après un changement de version de Node) sans rien casser.

Puis : rouvre Claude Code **dans ce projet** (le `.mcp.json` est chargé au démarrage),
autorise le serveur `supervision`, et lance ta méthode (`/ezk-sprint`, ou
`/supervision-demo` pour un essai). Le côté **lecture** (le Moniteur cop1) reste un
observateur externe : ajoute le projet aux `supervision.watch_roots` du daemon — modèle à
deux clés, fiche 0082.

> **Le `.mcp.json` est LOCAL, jamais versionné** (ADR-034). C'est un artefact
> d'**installation** : il contient des chemins absolus propres à la machine (nvm, `$HOME`).
> Commité, il serait cassé sur tout autre poste — `assertValidExplicitRoot` échoue
> immédiatement sur une racine inexistante — et il neutraliserait l'échappatoire
> `SUPERVISION_PER_WORKTREE` (ADR-019) en figeant la même racine dans tous les worktrees.
> `supervision:link` **est** l'étape d'installation : on la rejoue après un clone, après un
> changement de version de Node, et **dans chaque worktree** où l'on veut émettre.

### Vérifier que c'est vraiment branché — `supervision:probe`

```bash
pnpm --dir products/mega-city supervision:probe .
```

Le banc de preuve : il lit le `.mcp.json` du projet et **lance la commande telle qu'elle y
est déclarée**, puis fait un handshake MCP. Trois contrôles, dans cet ordre — l'entrée
`supervision` est exploitable · la racine **déclarée** est bien celle du projet sondé
(sinon les runs journaliseraient ailleurs, en silence) · le serveur expose **exactement**
les 6 outils. Vert/rouge net, exit code 0/1, quelques secondes : jouable à la main comme
dans un script, sur ce dépôt comme sur un projet cobaye.

Il comble un trou précis : les tests unitaires prouvent que **le serveur** marche quand le
harnais l'invoque lui-même — jamais que **le fichier généré** est exécutable (chemin
`pnpm`, `--dir`, entrée `tsx`). Il est **read-only** : il n'appelle aucun outil, donc
n'écrit rien sous `.supervision/` (invariant couvert par un test).

> **Frontière de confiance.** Le probe **exécute une commande lue dans un fichier**. Ne
> sonde donc qu'un projet dont tu assumes le `.mcp.json` — la commande est imprimée avant
> d'être lancée, lis-la. L'environnement transmis est volontairement **minimal**
> (l'allowlist par défaut du SDK MCP + le bloc `env` du fichier), jamais tout
> `process.env` : c'est une garde anti-exfiltration, mais surtout la seule façon de sonder
> dans un environnement **aussi pauvre** que celui du vrai client — sinon le banc raterait
> exactement la panne qu'il existe pour attraper (le `pnpm` nu qui résout dans un shell et
> échoue au PATH minimal d'une app GUI).

### Ne pas comprendre le Moniteur — `supervision:analyze` (fiche 0104)

Depuis la **racine du projet supervisé** (ex. vectorz) :

```bash
pnpm --dir products/mega-city supervision:analyze .
# ou chemin absolu — avec `pnpm --dir`, `.` / relatifs sont résolus via INIT_CWD
```

Croise le journal `.supervision/runs/` et les transcripts Claude Code
(`~/.claude/projects/<slug>/*.jsonl`) → rapport markdown + JSON sous
`docs/dogfood-reports/<stamp>/` (gitignored). Verdicts : `silence_explained`,
`emission_gap`, `orphan_run`, etc. **Lecture seule**, pas de LLM.

Options utiles : `--run <id>`, `--since 2h`, `--transcript <path>`, `--stdout`.
Exit code **1** si un verdict « problème » (`silence_explained`, `emission_gap`, …)
— pratique en script dogfood ; en interactif lire le rapport quand même.
## Conformité prouvée — déroulé méthode jouet → validateur (AC1, fiche 0050)

Le chemin nominal est la session Claude Desktop (skill `supervision-demo` + serveur MCP
ci-dessus). Le **déroulé reproductible sans client LLM** pilote le même runtime que le
serveur MCP, directement en script — joué en réel le 2026-07-18, validateur cop1 vert :

```bash
# 1. Un « projet supervisé » jetable (git init : upgrade_ok mesure la quiescence git).
mkdir -p /tmp/projet-jouet && git -C /tmp/projet-jouet init -q \
  && git -C /tmp/projet-jouet commit -q --allow-empty -m init

# 2. Jouer la méthode jouet 2 gates via le runtime — script commité bin/supervision-demo-run.ts
#    (runStart → escalate factice → gate 1 → resume → gate 2 → resume → runFinished) :
pnpm --dir <mega-city> exec tsx bin/supervision-demo-run.ts /tmp/projet-jouet

# 3. Valider le journal produit avec le validateur cop1 (fiche cop1 0027) :
pnpm --filter @cop1/journal-validator... build   # depuis la racine vectorz
node products/cop1/packages/journal-validator/dist/cli.js validate \
  /tmp/projet-jouet/.supervision/runs/<run_id>
```

Résultat observé (2026-07-18) : journal de **7 événements** (`run.started`, `escalation`,
2× `gate.reached` avec `upgrade_ok: true` sur arbre propre, 2× `gate.resumed`,
`run.finished`), verdict **« Aucune violation. État final : finished »**, exit 0.

> Volontairement un **déroulé documenté**, pas un test automatisé : l'automatiser dans la
> CI mega-city créerait une dépendance de test croisée mega-city→cop1 (à trancher côté
> cop1 — note de la fiche 0050). L'**ADR-021** l'interdit par principe (couplages
> interdits : « le cœur de mega-city qui dépend de cop1 » ; indépendance des produits,
> prouvée mécaniquement par les steps CI standalone).

## Template de consignes d'émission (à intégrer dans une skill de méthode)

L'intégration dans une méthode réelle (ezk-product-builder, ezk-sprint…) est un
**choix du propriétaire de la méthode** — coller/adapter ce bloc dans la SKILL.md :

```markdown
## Émission de supervisabilité (contrat v0.1 — best-effort, classe B)

Si les outils MCP d'émission (`run_start`, `gate_reached`, `gate_resumed`,
`escalate`, `heartbeat`, `run_finished`) sont disponibles dans le contexte — sinon saute
cette section sans bruit :

- **Au lancement** : `run_start {method_name: "<ta-méthode>",
  method_version: "<sa-version>", seat: "human"}` (`method_version` est
  **requis** ; `seat` est optionnel, défaut `human`).
- **Pendant le travail long (entre deux jalons)** — fiche 0103 : `heartbeat
  {note: "<une ligne>"}` au moins à chaque étape majeure, et **au plus toutes les
  ~2–3 min** (jamais ≥ le seuil Moniteur `presumed_dead_after_min`, défaut **5 min** —
  sinon faux « Silence prolongé »). Ce n'est **pas** un jalon : tu continues. Pas de
  heartbeat pendant un gate ouvert (silence voulu).
- **À chaque point d'arrêt de ta méthode** (checkpoint, fin d'étape) :
  `gate_reached {gate_id: <nom-du-point>, outcome: ok|attention|failed,
  report_markdown: <ton résumé>}` **avant** de poser la question — puis
  arrête-toi et attends la réponse.
- **À la reprise** : `gate_resumed {gate_event_id: <id>}` (l'id vient du
  résultat d'outil du `gate_reached`).
- **Signal non-bloquant** : `escalate {type: blocked|authority, detail: <texte>}`
  — jamais un arrêt.
- **À la clôture** : `run_finished {status: success|failure|abandoned}`.

Tu n'écris jamais les champs d'enveloppe (le serveur les calcule) et tu ne
forces jamais `upgrade_ok` (au mieux un veto). Vocabulaire : tes checkpoints
restent des checkpoints ; le gate est leur trace contractuelle.
```

**Méthodes réelles intégrées.** Ce tableau **fait foi** : le test
`src/supervision/__tests__/skill-emission-contract.test.ts` le croise avec la liste qu'il
porte **et** avec le contenu réel des skills — retirer une consigne d'émission sans
toucher ici (ou l'inverse) fait rougir la CI. Ajouter une skill émettrice **impose** de
l'inscrire ici.

| Skill | Depuis | Rôle dans la chaîne d'un run |
|---|---|---|
| `ezk-sprint` | 2026-07-17 | **s'absorbe** : si un run est déjà ouvert, il émet ses gates dedans et ne clôt pas le run |
| `ezk-product-builder` | 2026-07-26 | **ouvre le run** quand il est la tête de chaîne ; `run_finished` lui revient (fiche 0095) |
| `vz-product-builder` | 2026-07-18 | ouvre le run ; émission **obligatoire** (mode autonome — sans journal, c'est une boîte noire) |
| `supervision-demo` | 2026-07-18 | méthode **jouet** à plat, ne compose aucun émetteur (banc d'essai) |

À suivre : hooks classe A (fiche 0077, suite de fiche 0050).
