# mega-city — _starter_ (univers Judge Dredd)

> **Mega-City One** : des **Juges** (agents) qui appliquent **la loi** (rules) pour des **projets**,
> sur **n'importe quel LLM** (Claude Code, Claude Desktop, Cursor, cop1…). « I AM THE LAW » → `iamthelaw`.
>
> État : **starter à triturer**. Rien n'est branché. Tes `claude-skills` actuels continuent de
> marcher inchangés — voir `caps/claude-desktop/`.

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
| `bin/` | moteur déterministe (`bind`, `capture`) | script |
| `journal/` | mémoire append-only du flywheel | markdown |
| `docs/` | `domain.ts` (schema-as-code), ADR, diagrammes | — |

## Nommage

Univers **Judge Dredd** (« I AM THE LAW » → `iamthelaw`). Produits/commandes = noms Dredd,
dossiers techniques = noms fonctionnels. Convention complète : [`docs/naming.md`](docs/naming.md).

## Par où commencer à triturer

1. `docs/domain.ts` — le modèle DDD. C'est LE fichier à challenger.
2. `docs/adr/0001-*.md` — pourquoi ces choix.
3. `docs/diagrams/capture-loop.svg` — la boucle `capture`.
4. `profiles/mobile.yml` — un profil d'exemple qui tire `bundles/`, `agents/`, `skills/`.

Migration depuis l'existant : `claude-skills` (agents+skills) et `iamthelaw` (rules) viennent
ici **à ton rythme**, en greenfield, sans rien casser.
