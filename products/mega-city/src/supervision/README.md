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

```json
{
  "mcpServers": {
    "supervision": {
      "command": "pnpm",
      "args": ["exec", "tsx", "/chemin/vers/mega-city/bin/supervision-mcp.ts"],
      "env": { "SUPERVISION_PROJECT_ROOT": "/chemin/absolu/du/projet/supervisé" }
    }
  }
}
```

`SUPERVISION_PROJECT_ROOT` doit être **absolu et exister** (fail-fast sinon).
Autoriser les 5 outils en « toujours autoriser » pour éviter la fatigue de popups.
Pour tester sans toucher aux méthodes de prod : skill **`supervision-demo`** (méthode
jouet 2 gates).

## Template de consignes d'émission (à intégrer dans une skill de méthode)

L'intégration dans une méthode réelle (ezk-product-builder, ezk-sprint…) est un
**choix du propriétaire de la méthode** — coller/adapter ce bloc dans la SKILL.md :

```markdown
## Émission de supervisabilité (contrat v0.1 — best-effort, classe B)

Si les outils MCP d'émission (`run_start`, `gate_reached`, `gate_resumed`,
`escalate`, `run_finished`) sont disponibles dans le contexte — sinon saute
cette section sans bruit :

- **Au lancement** : `run_start {method_name: "<ta-méthode>", seat: "human"}`.
- **À chaque point d'arrêt de ta méthode** (checkpoint, fin d'étape) :
  `gate_reached {gate_id: <nom-du-point>, outcome: ok|attention|failed,
  report_markdown: <ton résumé>}` **avant** de poser la question — puis
  arrête-toi et attends la réponse.
- **À la reprise** : `gate_resumed` (le `gate_event_id` vient du résultat d'outil).
- **Signal non-bloquant** : `escalate {type, detail}` — jamais un arrêt.
- **À la clôture** : `run_finished {status}`.

Tu n'écris jamais les champs d'enveloppe (le serveur les calcule) et tu ne
forces jamais `upgrade_ok` (au mieux un veto). Vocabulaire : tes checkpoints
restent des checkpoints ; le gate est leur trace contractuelle.
```
