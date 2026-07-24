# Kit émetteur de supervisabilité (contrat v0.1)

Implémentation de référence de l'émission du contrat de supervisabilité v0.1
(spec normative : capture cop1 `docs/captures/2026-07-13-contrat-methode-et-versions.md` §7).
Fiche : `features/0050-kit-emetteur-supervisabilite.md`.

- `journal.ts` — append JSONL par run (`<projet>/.supervision/runs/<run_id>/events.jsonl`),
  enveloppe calculée par la lib, seq relu du disque, lecteur tolérant.
- `upgrade-ok.ts` — quiescence mécanique (git propre + zéro worktree) ; veto → false only.
- `runtime.ts` — machine à états stateless (replay disque à chaque appel).
- `mcp-server.ts` + `bin/supervision-mcp.ts` — serveur MCP stdio, **5 outils étroits**
  (chemin nominal Claude Desktop, classe de conformité B).

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

Autoriser les 5 outils en « toujours autoriser » pour éviter la fatigue de popups.
Pour tester sans toucher aux méthodes de prod : skill **`supervision-demo`** (méthode
jouet 2 gates).

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
`escalate`, `run_finished`) sont disponibles dans le contexte — sinon saute
cette section sans bruit :

- **Au lancement** : `run_start {method_name: "<ta-méthode>",
  method_version: "<sa-version>", seat: "human"}` (`method_version` est
  **requis** ; `seat` est optionnel, défaut `human`).
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

**Méthodes réelles intégrées** : `ezk-sprint` (2026-07-17 — `run_start` à l'intake,
`gate_reached`/`gate_resumed` au checkpoint ⛳, `escalate` sur stop&ask, `run_finished` à
la clôture). À suivre : `ezk-product-builder`, hooks classe A (suite de fiche 0050).
