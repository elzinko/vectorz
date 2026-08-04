---
skill: ezk-backlog
layout_version: 2
---

# Features — backlog monorepo vectorz

Une **seule** liste pour tout le monorepo (ADR-0017 A14 / fiche 0064). Le produit
n'est plus l'emplacement : c'est le champ front-matter **`product:`**
(`vectorz` | `mega-city` | …). Ce dossier vit sur `main`, commité — la référence
ne se perd pas entre worktrees ni entre sessions.

## Contenu

| Fichier / dossier | Rôle |
|---|---|
| `[NNNN]-slug.md` | Fiches **actives** (`idea` / `todo` / `in-progress` / `blocked`) |
| [`BACKLOG.md`](BACKLOG.md) | **Index généré** (`regen`) — ne pas éditer à la main |
| [`PLAN.md`](PLAN.md) | Séquence décidée (curée) — horizon **NOW** = prochaines N cartes |
| [`done/`](done/) | Fiches **livrées** (`status: shipped`) |
| [`feature-template.md`](feature-template.md) | Gabarit pour une nouvelle fiche |
| [`../docs/backlog-carte.md`](../docs/backlog-carte.md) | **Carte lisible** — état du stock en ≤ 2 min (PR, plan, compteurs) |
| [`../docs/glossaire-jargon-ezk.md`](../docs/glossaire-jargon-ezk.md) | **Glossaire** — jargon interne traduit + verdict garder/traduire/supprimer |

## Comment travailler

1. **Capturer** — `/ezk-backlog add …` (anti-doublon, priorité demandée, `idea` si non mûr).
2. **Séquencer** — buckets `priority` (P0→P3) + `PLAN.md` pour l'ordre réel.
3. **Groomer / ready** — `groom <id>` puis gate `ready <id>` (DoR) avant tirage.
4. **Tirer** — `next --ready-only` (point d'entrée d'ezk-sprint / product-builder).
5. **Livrer** — `ship <id> #PR` → déplacement vers `done/` + regen.
6. **Régénérer l'index** — `/ezk-backlog regen` (écrit uniquement `BACKLOG.md`).

```bash
bash products/mega-city/bin/regen-backlog.sh . "Backlog features & bugs — vectorz"
```

Source de vérité du **statut** = le front-matter YAML de chaque fiche.
`BACKLOG.md` en est un **miroir** — jamais l'inverse.

## Layout version (Skema)

Le front-matter `layout_version` marque le contrat de dossier installé. Si la
skill `ezk-backlog` est en avance, elle **proposera** les migrations pending
(`migrations/` de la skill) — pas d'auto-mutation sans accord.
