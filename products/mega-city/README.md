# mega-city — méthode ezk-* (Judge Dredd)

> **Mega-City One** : des **Juges** (agents) qui appliquent **la loi** (rules) pour des **projets**,
> sur **n'importe quel LLM** (Claude Code, Claude Desktop, Cursor…). « I AM THE LAW » → `iamthelaw`.
>
> **État époque 2 (vectorz)** : méthode **opérationnelle** pour le dogfood de ce monorepo.
> Skills `ezk-*`, profils `lawgiver`, backlog racine `features/` (champ `product: mega-city`).
> Le Moniteur (cop1, ADR-028) observe les runs via `.supervision/runs/` — pas BMAD.

## Chemin nominal (dogfood vectorz)

1. Binder un profil : `pnpm lawgiver bind-global daily --link` (curated) ou `global` (exhaustif)
2. Travailler : `ezk-product-builder` → `ezk-sprint` (3 chemins : trivial / standard / lourd)
3. Superviser : `pnpm supervision:link .` puis Moniteur cop1
4. Clôturer : `/ezk-archive` (défaut = `check`)

Voir aussi [`docs/GETTING_STARTED.md`](../../docs/GETTING_STARTED.md) et le
[programme de refonte](../../docs/PROGRAMME-REFONTE.md).

## Le modèle en une image

```
CATALOGUE 1 — LA LOI            CATALOGUE 2 — L'ÉQUIPE
  rules/    (markdown)            agents/  (markdown + competences[]/interactions[])
  bundles/  (yaml, extends)       skills/  (markdown)
                  \                   /
                   \                 /
                 profiles/  (yaml) ← KEYSTONE : compose tout
                          |
                   bin/ bind  (DÉTERMINISTE)
                          |
                 caps/<host>/  → forme native de chaque LLM
```

## La règle d'or (leçon `lifefindsaway`)

| | qui | déterministe ? |
|---|---|---|
| **rédige / juge** (contenu, avis) | agent/skill (LLM) | non — et c'est OK, c'est consultatif |
| **range** (append, journal, commit, bind) | script | **oui** — toujours pareil, testable |

Le LLM ne **range** jamais. C'est la frontière que `lifefindsaway` a franchie en passant
ses transitions d'état au LLM → instable. Ici : le LLM rédige et conseille, le script range.

## Layout

| dossier | quoi | format |
|---|---|---|
| `rules/` | règles minimales et composables | markdown + frontmatter |
| `bundles/` | groupes de règles (`extends`) | yaml |
| `agents/` | rôles + `competences[]` + `interactions[]` | markdown + frontmatter |
| `skills/` | playbooks (host-agnostiques) | markdown |
| `profiles/` | **keystone** : compose bundles+agents+skills+interactions | yaml |
| `caps/<host>/` | adaptateurs par LLM (matérialisation native) | — |
| `bin/` | moteur déterministe (`bind`, `capture`, `regen-backlog`, …) | script |
| `journal/` | mémoire append-only du flywheel | markdown |
| `docs/` | `domain.ts` (schema-as-code), ADR, diagrammes | — |
| `features/` | **stub** — backlog vivant = racine `features/` (fiche 0064) | README + mapping |

## Nommage

Univers **Judge Dredd** (« I AM THE LAW » → `iamthelaw`). Produits/commandes = noms Dredd,
dossiers techniques = noms fonctionnels. Convention complète : [`docs/naming.md`](docs/naming.md).

## Par où commencer

1. `docs/domain.ts` — le modèle DDD
2. `docs/adr/0001-*.md` — choix fondateurs mega-city
3. `profiles/daily.yml` — profil curated époque 2 (sans apk/device/preview)
4. `profiles/global.yml` — profil exhaustif

Migration depuis l'existant : `claude-skills` (agents+skills) et `iamthelaw` (rules) viennent
ici **à ton rythme**, en greenfield, sans rien casser.
