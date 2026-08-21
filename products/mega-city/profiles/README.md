# Profils — `profiles/`

Un **Profile** (keystone du domaine, ADR-0001) décrit **« comment ce (sous-)projet travaille »** :
il compose la LOI (`bundles` → règles), l'ÉQUIPE (`agents`) et les COMPÉTENCES (`skills`), et
hérite d'autres profils via `extends`. Il est **host-agnostique** : le [cap](../caps/) de l'hôte
le matérialise (`bind <profil> <projet> <host>`) dans la forme native (Claude Code, Claude
Desktop, cop1…). `expand` résout `extends`, agrège et déduplique — **et TOLÈRE une référence
pendante** (id absent du catalogue = silencieusement ignoré). D'où la **garde anti-désync**
(`src/__tests__/profiles-sync.test.ts`) : chaque id référencé DOIT exister au catalogue.

## Les profils

| Profil | Rôle | Équipe / skills | Hôte typique |
|---|---|---|---|
| **base** | socle hérité (`extends: [base]`) | LOI socle (clean-code, conventional-commits) + `ezk-archive` + `ezk-start` | — (jamais bindé seul) |
| **mobile** | cible app mobile | reviewer + commits (+ règles mobile) | claude-code |
| **daily** | daily-driver **curated** (throughput solo) | 7 agents + boucle produit/sprint/ci — **sans** apk/device/preview/article/pr-pilot | `bind-global daily --link` → `~/.claude` **(recommandé)** |
| **global** | daily-driver **exhaustif** (tout le toolbox) | les 7 agents + tous les skills ezk-* | `bind-global global --link` → `~/.claude` |
| **cop1-target** | un projet que **cop1 pilote** | équipe FEUILLE + `ezk-pm` + skills feuilles, **sans orchestrateur** | claude-code (pass-through) |
| **desktop** | session **Claude Desktop** pure | `ezk-pm` + builder + backlog + skills de rédaction/orga, **sans env d'exécution** | claude-desktop |

### `daily` vs `global`

- **`daily`** = chemin nominal solo (programme refonte phase 2) : moins de surface
  d'appel → moins de tokens brûlés à « choisir le mauvais skill ».
- **`global`** = catalogue complet quand tu as besoin d'apk / device / preview /
  article / pr-pilot. Ne plus le binder par défaut.

### `cop1-target` — pourquoi « sans orchestrateur »
cop1 (orchestrateur de dev autonome) a **déjà sa propre boucle** (Supervisor). Lui binder
`ezk-product-builder` / `ezk-sprint` / `ezk-pr` mettrait **deux chefs dans la même
session**. On lui donne donc l'équipe feuille (`architect`, `tdd`/dev, `qa`, `reviewer`) + le
décideur `ezk-pm` + la LOI de dev + les skills feuilles (commits, ci, backlog, design-system,
npm-scripts, preview, diagram). Les agents atteignent cop1 par pass-through
`settingSources:['project']` du cap claude-code (fiche 0041, ADR-0011 §2).

### `desktop` — pourquoi « sans environnement d'exécution »
Une session Claude Desktop **pense / cadre / organise / rédige** ; elle n'exécute ni
`act`+Docker (ezk-ci), ni EAS (ezk-apk), ni device (ezk-device). On garde le **product builder**
(décider quoi & quand), le **backlog**, le décideur **ezk-pm**, et les skills de
rédaction/organisation (diagram, ezk-ezk). Le cadrage/brainstorm n'est pas bindable : il arrive
par composition externe de `product-management:product-brainstorming` (ADR-0012).

## Ajouter / modifier un profil
1. Éditer/créer `profiles/<id>.yml` (mêmes champs : `id`, `extends`, `bundles`, `agents`, `skills`, `interactions`).
2. `npm test -- profiles-sync` : la garde anti-désync refuse toute référence pendante.
3. Vérifier le rendu : `npm run lawgiver -- bind <id> <dir> <host>` puis inspecter la sortie.
