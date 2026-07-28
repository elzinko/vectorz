# Dogfood époque 2 — avant merge PR #62

Recette **pratique** pour valider la chaîne méthode → émission → Moniteur
**sans merger**. Préférer un **projet cobaye temporaire** (ou worktree) pour
tout ce qui écrit sous `.supervision/` / `.mcp.json` ; le bind-global `daily`
touche `~/.claude` (réversible en rebindant `global`).

Réf. programme : [`PROGRAMME-REFONTE.md`](./PROGRAMME-REFONTE.md) · fiches
[2094](../features/2094-emetteur-branche-sur-claude-code.md) /
[2095](../features/2095-ezk-product-builder-n-emet-pas.md) /
[2088](../features/2088-ezk-archive-cout-cloture-session-disciplinee.md).

---

## A. Smoke mécanique (sans session Claude) — ~5 min

Depuis la racine du clone sur `refactor/epoch-2-harden-method` :

```bash
pnpm install && pnpm build
bash scripts/dogfood-smoke.sh
```

Couvre : bind projet jetable · `supervision:link` + `probe` · run démo journal ·
validateur cop1 · portier archive `--gate`. **Ne prouve pas** qu’un vrai skill
émet depuis Claude Code, ni l’UI Moniteur live.

---

## B. Setup Moniteur (daemon + web)

```bash
# 1. Config locale (gitignorée) — watch le cobaye OU vectorz
cp cop1.config.example.yaml cop1.config.yaml
# éditer supervision.watch_roots: ["/chemin/absolu/du/projet-supervisé"]

# 2. Daemon
node products/cop1/packages/app/dist/cli/index.js start
node products/cop1/packages/app/dist/cli/index.js status   # doit répondre

# 3. UI
pnpm --filter @cop1/web dev   # → http://localhost:5173 (proxy → :4242)
```

Onglet **Moniteur** : runs sous `.supervision/runs/` du projet watché.

---

## C. Cobaye temporaire (recommandé pour 2094/2095)

```bash
# Worktree optionnel de la PR (isole le checkout)
git worktree add /tmp/vectorz-epoch2 refactor/epoch-2-harden-method

# Cobaye jetable (écritures supervision isolées)
COBAYE=/tmp/vectorz-cobaye-$$
mkdir -p "$COBAYE" && git -C "$COBAYE" init -q
git -C "$COBAYE" commit -q --allow-empty -m init

# Depuis le clone/worktree vectorz :
ROOT=/Users/elzinko/git/bacasable/vectorz   # ou /tmp/vectorz-epoch2
pnpm --dir "$ROOT/products/mega-city" supervision:link "$COBAYE"
pnpm --dir "$ROOT/products/mega-city" supervision:probe "$COBAYE"
# Ajouter $COBAYE à supervision.watch_roots, relancer daemon
```

Pour tester la **méthode** (skills) : binder le profil sur le poste, puis ouvrir
Claude Code **dans le dépôt vectorz** (ou un worktree de la branche) — c’est là
que les skills `ezk-*` vivent après `bind-global`.

```bash
pnpm --dir products/mega-city exec tsx bin/lawgiver.ts bind-global daily --link
# Revenir en arrière : bind-global global --link
```

---

## D. Checklist humaine 30–45 min (vrai dogfood AC)

| # | Action | Critère de succès | Fiche |
|---|---|---|---|
| 1 | Claude Code ouvert sur vectorz (branche PR) ; MCP `supervision` connecté (5 outils) | Tools visibles ; `supervision:probe .` vert | 2094 |
| 2 | Moniteur up (daemon + web) ; `watch_roots` = racine vectorz (arbre principal) | Onglet Moniteur charge | — |
| 3 | `/supervision-demo` **ou** sprint **trivial** (`ezk-sprint` chemin trivial) | Nouveau dossier `.supervision/runs/<id>/events.jsonl` ; carte run dans Moniteur | 2094 |
| 4 | (idéal) `/ezk-product-builder` court → 1 sprint trivial dedans | **Un** run `method_name: ezk-product-builder` ; sprint **n’ouvre pas** de 2ᵉ run ; gate checkpoint si arrêt | 2095 |
| 5 | `/ezk-archive` (défaut = `check`) après session propre | Portier `VERDICT: CLEAN` **sans** gros sous-agent ; noter tokens neufs si possible | 2088 |
| 6 | Optionnel : même sprint depuis un **worktree** | Journal dans l’**arbre principal** (normalisation ADR-019) | 2094 |

**Automatisable (déjà / smoke) :** link, probe, demo-run, validateur, tests
`test:scripts` archive, CI lint/build/test.

**Humain obligatoire :** session LLM qui **appelle** les outils MCP selon les
consignes des skills + jugement fidélité/lisibilité dans l’UI Moniteur + mesure
tokens archive CLEAN.

**Futur (fiche [2103](../features/2103-ezk-testbed-llm-dogfood-harness.md)) :** harness
E2E-LLM (acteur Claude Code headless + assertions déterministes, cadence nightly /
label `dogfood`) pour rejouer le chemin 2094 sans monopoliser l’opérateur — **pas
encore livré** ; le smoke §A et la checklist §D restent la référence.

---

## E. Après dogfood réussi

1. Cocher AC restants dans fiches 2094 / 2095 / 2088 → `ship` ou laisser `blocked`
   si mesure tokens archive encore manquante.
2. Noter mesures dans le Journal de [`PROGRAMME-REFONTE.md`](./PROGRAMME-REFONTE.md).
3. **Ne pas merger** depuis ce guide — décision opérateur / CI verte PR #62.
