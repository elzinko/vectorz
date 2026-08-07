# Cobaye — banc de test rapide (fiche 0041)

Petit projet **vierge** versionné dans le monorepo. Sert de cible reproductible pour
sécuriser les devs (voie rapide Pareto) **sans** dépendre de BMAD ni du pilote natif
complet (0038).

## Contenu

| Chemin | Rôle |
|--------|------|
| `fixtures/seed-run/events.jsonl` | Journal de supervision nominal (seed Moniteur) |
| `reset.sh` | Remet le banc à l'état vierge (runtime seulement) |

Le runtime (`.supervision/`, `.claude/`, `.cop1/`) n'est **pas** commité — le smoke le
repose depuis les fixtures.

## Reset

Depuis la racine `vectorz` :

```bash
bash cobaye/reset.sh
# ou
pnpm cobaye:reset
```

## Smoke (mécanique + Moniteur)

```bash
pnpm install && pnpm build && pnpm --filter @cop1/web build
pnpm cobaye:smoke
```

Voir aussi `docs/e2e/moniteur-smoke.md` (checklist manuelle < 2 min).

## Hors scope (volontaire)

- Scénario dark-mode → fiche **0017** (scénario client, pas fondu dans 0041)
- Voie « cop1 construit la feature » → gated par **0038**
