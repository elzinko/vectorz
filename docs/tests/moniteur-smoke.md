# E2E manuel — Moniteur cobaye (Pareto)

Fiche backlog **0041**. Validation visuelle en **moins de 2 minutes**, sans BMAD.

> Scénario dark-mode → fiche **0017** (hors scope 0041).
> Auth API → `docs/e2e/auth-panel.md`.

## Pré-requis

Depuis la racine `vectorz` :

```sh
pnpm install && pnpm build && pnpm --filter @cop1/web build
```

Aucun token Claude requis pour ce parcours (lecture seule + seed fixtures).

## Reset + seed

```sh
bash cobaye/reset.sh
mkdir -p cobaye/.supervision/runs/cobaye-seed-run
cp cobaye/fixtures/seed-run/events.jsonl cobaye/.supervision/runs/cobaye-seed-run/events.jsonl
```

## Lancer la stack

Dans un répertoire temporaire (évite d'écraser ton `cop1.config.yaml` local) :

```sh
SMOKE="$(mktemp -d)"
COBAYE="$(pwd)/cobaye"
cat >"$SMOKE/cop1.config.yaml" <<EOF
daemon:
  port: 4242
supervision:
  watch_roots:
    - $COBAYE
EOF
(cd "$SMOKE" && node products/cop1/packages/app/dist/cli/index.js start --port 4242)
```

Puis le Moniteur :

```sh
cd products/cop1/packages/web && pnpm dev
# → http://localhost:5173
```

## Checklist clic (< 2 min)

1. Ouvrir http://localhost:5173 — titre **cop1 · Moniteur**.
2. Onglets **Projets** et **Activité** visibles.
3. Cliquer **Activité** — au moins un run (carte live et/ou historique) lié au cobaye.
4. Revenir sur **Projets** — page stable, pas d'écran blanc.

## Automatisé

```sh
pnpm cobaye:smoke
```

Inclut : dogfood mécanique, preuve de porte (URL morte), daemon isolé, Playwright.

## Nettoyage

```sh
# depuis $SMOKE
node /chemin/vers/vectorz/products/cop1/packages/app/dist/cli/index.js stop
bash cobaye/reset.sh
```
