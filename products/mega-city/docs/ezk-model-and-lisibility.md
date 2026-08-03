# Méthode ezk — modèles & restitutions lisibles (0181)

Politique courte pour les **skills / agents mega-city** (hôte natif = **Claude Code**).
Cursor n'est qu'un hôte de délégation éventuel.

## Modèles

| Rôle | Agents | `model` | `model_spare` |
|---|---|---|---|
| Jugement / restitution PO | `ezk-architect`, `ezk-reviewer`, `ezk-pm`, `ezk-archive` | `opus` (famille Opus 4.8 côté Claude Code — **pas** pin Opus 5) | `sonnet` |
| Mécanique / exécution | `ezk-tdd`, `ezk-qa`, `ezk-steward` | `sonnet` | — (pas de spare obligatoire) |

Quand l'appelant délègue :

1. Préférer `model` du frontmatter.
2. Si l'hôte refuse opus → `model_spare` (`sonnet`) + le dire en une ligne.
3. **Cursor Task** : mappe `opus` → slug Claude Opus **4.8** du catalogue Cursor ;
   sinon spare → Sonnet. **Grok / autres familles** uniquement sur demande humaine
   explicite.

## Lisibilité (« En clair »)

Toute restitution à un humain (checkpoint sprint, backlog `list`/`next`/`review`,
archive, plan PR, product-builder, harvest ezk-ezk…) ouvre par **« En clair »**
(≤ 3 phrases : fait / à faire / suite) avant tableaux et jargon.

Règle MUST :
[`rules/documentation-guidelines/human-facing-lisibility.md`](../rules/documentation-guidelines/human-facing-lisibility.md).

## Skills POC couverts (0181)

| Skill | En clair | Note |
|---|---|---|
| `ezk-archive` | oui (gabarit + skill) | amorce #91 |
| `ezk-sprint` | oui (checkpoint) | + délégation modèles |
| `ezk-backlog` | oui | section Restitution |
| `ezk-product-builder` | oui | checkpoints |
| `ezk-pr-pilot` | oui | plan/run/report |
| `ezk-retro` | oui | déjà |
| `ezk-ezk` | oui | harvest/create/deploy |

## Hors scope / suite

Balayer d'éventuels skills satellites non listés ; ADR formel de versionnage modèle
si le pin Opus 4.8 vs « famille opus » doit être gelé côté Claude Code.
