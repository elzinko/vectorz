# Spike — format natif Cursor pour le cap `cursor` (2026-09-03)

Repérage demandé par l'ADR-0047 avant d'écrire le cap `cursor`. Deux questions :
sous quelle forme Cursor lit un agent/skill, et comment y installer ezk **sans dupliquer**.

## En clair

Cursor parle **presque la même langue** que Claude Code. Il lit les skills au **format ouvert
d'Anthropic** (le tien, tel quel) et il a des **subagents** dont le frontmatter **porte le
modèle et l'effort**. Donc le cap `cursor` n'est pas une réécriture : c'est **du placement +
une traduction du modèle** vers un identifiant que Cursor connaît. Et Opus 4.8 **est** au
catalogue Cursor, donc ton choix Claude se recopie à l'identique.

Correction importante : je t'avais dit « Cursor ne peut pas fixer le modèle par fichier, donc
juste une note ». **C'est faux pour les subagents** — ils portent le modèle. La note ne sert
plus que de repli.

## Ce que lit Cursor (les formes natives)

| Artefact ezk | Forme native Cursor | Porte le modèle ? | Anti-duplication |
|---|---|---|---|
| **skill** (`SKILL.md`) | `.cursor/skills/<id>/SKILL.md` — **même format ouvert** (Agent Skills d'Anthropic, adopté par Cursor) | — | **lien** vers la source unique (comme le `--link` actuel) |
| **agent** (rôle + modèle) | `.cursor/agents/<id>.md` — **subagent** (markdown + frontmatter) | **oui** : `model` + effort | petit fichier par hôte (le rôle est court ; le modèle diffère par client) |
| **LOI** (règles compilées) | `.cursor/rules/*.mdc` (`alwaysApply`) | non | généré (texte compilé, court) |
| commande utilisateur (option) | `.cursor/commands/*.md` (slash `/`) | non | pointeur, optionnel |

Détails de format vérifiés dans la doc Cursor :

- **Subagent** `.cursor/agents/<id>.md` : frontmatter `name`, `description`, `model`,
  `readonly`, `is_background`. Le champ `model` veut un **slug Cursor exact**, avec l'effort
  **encodé dans le nom** : `model: "claude-opus-4-8-thinking-high"` (vérifié au POC — la syntaxe
  `[effort=high]` n'est **pas** acceptée ; un slug faux **retombe en silence** sur le parent).
  Versionné dans le repo. Cursor lit aussi `.claude/agents/` (interop — voir le piège plus bas).
- **Skill** `.cursor/skills/<nom>/SKILL.md` : frontmatter YAML + corps markdown ; le nom doit
  matcher le dossier. Cursor lit aussi `~/.cursor/skills/` et `~/.agents/skills/`.
- **Règle** `.cursor/rules/*.mdc` : frontmatter à **3 champs seulement** — `description`,
  `globs`, `alwaysApply`. **Aucun champ modèle.** Peut référencer un fichier via `@fichier`.
- **Catalogue modèles** : Cursor liste **Claude Opus 4.8** (et Sonnet, Opus 5, Fable 5…). Le
  slug exact d'Opus 4.8 est à confirmer dans Cursor au build ; le modèle est bien offert.

## Comment on évite la duplication

Le principe : **le contenu lourd (les skills) vit à un seul endroit ; les clients y renvoient.**

- **Skills = source unique, liée.** Le format est le même des deux côtés. On **lie** la source
  partagée dans `.cursor/skills/` (ou on s'appuie sur `~/.cursor/skills/` global), exactement
  comme `~/.claude/skills` est déjà un lien vers le checkout. **Zéro copie**, mise à jour vivante.
- **Agents = petit fichier par hôte.** Le rôle d'un agent est **court**. Ce qui diffère par
  client, c'est le **modèle** (slug Cursor `claude-opus-4-8-thinking-high` vs `claude-opus-4-8` +
  champ `effort:` côté Claude). Générer ce petit fichier n'est **pas** « dupliquer les
  skills » — c'est justement la config par client que tu veux. Le contenu lourd reste lié.
- **LOI = généré.** Texte compilé, court, propre à chaque client.

BMAD, pour comparaison, fait autrement : il écrit dans `.cursor/commands/*.md` un **pointeur
mince** (~600 octets) qui dit « charge le vrai fichier depuis `_bmad/…` ». Pas de symlink, pas
de copie. C'est une 3ᵉ voie valable pour les agents si on ne veut pas les lier : un pointeur qui
**porte le modèle** en frontmatter et renvoie au rôle partagé pour le corps.

## Recommandation pour le cap `cursor`

- **skills** → lien vers la source unique dans `.cursor/skills/` (réutilise le mécanisme
  `--link`). Rien à réécrire.
- **agents** → `.cursor/agents/<id>.md` (subagent) avec `model: "<slug Cursor exact>"` (ex.
  `claude-opus-4-8-thinking-high`, effort dans le nom) **résolu par la table `models.cursor.yml`**.
  Défaut auto : Opus 4.8 pour les agents lourds, Sonnet-classe pour les mécaniques — au plus près
  de ta config Claude, prudent côté coût.
- **LOI** → `.cursor/rules/*.mdc` en `alwaysApply`.
- La **note générée** (« règle ton modèle dans l'UI ») ne sert plus que de **repli**, si un
  agent devait passer par une règle/commande (sans champ modèle).

## Pièges et points à confirmer au build

- **Interop `.claude/agents` — CONFIRMÉ réel au POC.** Cursor lit aussi `.claude/agents/`, et
  comme ezk y est installé **globalement** (`~/.claude/agents`), Cursor voit ces agents partout,
  avec un slug `claude-opus-4-8` invalide → repli silencieux. À **trancher** : l'install Cursor
  doit prendre la précédence (émettre `.cursor/agents` avec slugs valides).
- **Slug exact d'Opus 4.8 — RELEVÉ au POC** : `claude-opus-4-8-thinking-high` (effort dans le nom).
- **Lien vs pointeur pour les agents** : le symlink de skill est **suivi** (POC) — les skills se
  lient. Pour les agents, le petit fichier généré porte le slug ; lien ou pointeur = choix d'impl.
- **Format mouvant** : Cursor bouge (BMAD a migré `.mdc` v4 → `.cursor/commands` v6). Figé
  pour maintenant ; garder une veille.

## POC — résultats (2026-09-03, complété le 2026-09-04)

POC jetable joué dans un vrai Cursor (dossier `~/ezk-cursor-poc`). Cinq réponses :

- **Modèle par agent : HONORÉ ✅ — avec le slug exact ET sur le chemin Task.** Lancé **comme
  subagent (outil Task)** avec `model: "claude-opus-4-8-thinking-high"`, il tourne bien sur
  **Opus 4.8**. Deux ratés **silencieux** : (a) **slug invalide** (`claude-opus-4-8[effort=high]`)
  → repli sur le parent ; (b) invocation **`@agent` en ligne** dans le chat → tourne sur le modèle
  du parent (le frontmatter `model` ne s'applique pas). ⇒ ezk invoque ses agents **via Task**
  (bon chemin) ; le résolveur émet des **slugs valides** (liste blanche) et un slug hors liste
  **fait échouer le build**.
- **Effort : dans le nom du slug** (`-thinking-high`), pas en paramètre `[effort=…]`.
- **Interop `.claude/agents` : RÉELLE ⚠️.** Cursor liste les **deux** agents homonymes (`.claude`
  et `.cursor`). L'invocation testée a pris la version `.cursor`, mais les deux coexistent. Comme
  ezk est global dans `~/.claude/agents`, Cursor les voit **partout** (slug invalide → repli). ⇒
  **à trancher** : précédence de l'install Cursor.
- **Symlink de skill : SUIVI ✅.** Cursor charge une skill liée (symlink) comme une copiée. ⇒
  **skills liées = zéro copie**, confirmé.
- **Pointeur vers `.vectorz/mega-city` : SUIVI ✅ (Q5, 2026-09-04).** Un `.cursor/agents/*.md`
  dont le corps dit « charge `.vectorz/mega-city/agents/<id>` » **charge et joue** le rôle partagé
  (réponse « RÔLE PARTAGÉ CHARGÉ depuis .vectorz/mega-city »). ⇒ le **mono-source par pointeur est
  viable**. (Le modèle affiché était le parent, car invoqué en ligne — cf. nuance Task ci-dessus ;
  à re-confirmer via Task pour voir pointeur + modèle ensemble.)

## Sources

- Cursor — Subagents : https://cursor.com/docs/subagents
- Cursor — Rules (.mdc) : https://cursor.com/docs/context/rules
- Cursor — Agent Skills : https://cursor.com/docs/skills
- Cursor — Commands : https://cursor.com/changelog/1-6
- Cursor — Models (catalogue) : https://cursor.com/docs/models
- BMAD (local) : `~/.npm/_npx/2d6bcd63982e6f85/node_modules/bmad-method/tools/cli/installers/lib/ide/` — `platform-codes.yaml` (cursor → `.cursor/commands`, template `default`), `templates/combined/default-agent.md` (pointeur mince), `_config-driven.js` / `_base-ide.js` (write = `fs.writeFile`, pas de symlink, pas de modèle).
