# Skema — migrations de layout `ezk-backlog`

**Skema** (*Skill Schema Migrations*) : pattern pour versionner le **contrat de
layout** d'une skill LLM opérée en markdown, et proposer des upgrades mécaniques
aux projets déjà intégrés — sans rescanner chaque repo à la main.

## Contrat

| Élément | Où |
|---|---|
| Version **courante** de la skill | fichier `VERSION` (entier) + front-matter `layout_version` de `SKILL.md` |
| Version **installée** dans un projet | front-matter `layout_version` de `features/README.md` ; absent + « Index auto-généré » ⇒ **1** (legacy) ; sinon **0** (inconnu / curé / tombstone) → `STATUS=ok PENDING=none` — ne pas proposer 002 sans preuve d'index v1 |
| Étapes d'upgrade | `NNN-slug.md` ordonnés, + helpers shell optionnels |

> **001** = layout historique (README = index) : pas de fichier `001-*.md` —
> on démarre les migrations documentées à **002**.

## Règle d'or

Sur `list` / `next` / `add` / `regen` / `init` / … : si `projet < skill` →
**proposer** les migrations pending (ne jamais muter sans OK utilisateur, sauf
mode explicite `--apply` sur un helper purement mécanique).

## Migrations

| Id | Fichier | Effet |
|---|---|---|
| 002 | [`002-readme-vs-backlog.md`](002-readme-vs-backlog.md) | README curé + `BACKLOG.md` généré (layout v1 → v2) |
| 003 | [`003-statuts-colonnes.md`](003-statuts-colonnes.md) | retrait du statut `todo` → scindé en `idea` / `ready` (layout v2 → v3) |

Les fichiers `NNN-*.md` sont numérotés par la **version cible** (`002` ⇒ amène à
`layout_version: 2`). Pending = `NNN > INSTALLED` et `NNN <= CURRENT`.

## Helper

```bash
bash <skill>/scripts/check-layout-version.sh [racine-projet]
# → CURRENT=2 INSTALLED=1 PENDING=002-readme-vs-backlog STATUS=behind|ok|ahead|missing
```
