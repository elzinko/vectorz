# ADR-0061 — Un seul guichet pour GitHub : chaque geste passe par `ezk forge`, qui lit la config

- Statut : **Proposé** (à ratifier par le PO).
- Date : 2026-10-04
- Compose / précise : [ADR-0003](0003-moteur-bind-plan-pur-coquille-io.md) (cœur pur, coquille d'I/O), [ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) §2 (GitHub est un module), [ADR-0050](0050-couche-regles-projet-local.md) (la couche `.vectorz/`), [ADR-0052](0052-merge-local-first-github-execute-le-squash-main-se-realigne.md) (le local décide, GitHub exécute), [ADR-0059](0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md) (la PR devient optionnelle par la config)
- Fiches : [20261004083838593](../../../../features/20261004083838593_guichet-unique-github-archive-reconcile.md) (le guichet), [20261004083838687](../../../../features/20261004083838687_integrer-sans-pr-par-avance-rapide.md) (intégrer sans PR), [20261004083838781](../../../../features/20261004083838781_ezk-config-help-lu-comme-un-chemin.md) (bug à part)

## En clair

Un projet peut couper GitHub dans `.vectorz/config.yml`. Mais chaque skill et chaque script doit
penser à lire ce fichier avant d'appeler `gh`. Trois l'oublient. Muti a coupé GitHub le
2026-10-03 et les a trouvés dès le lendemain.

On propose un **guichet unique** : `ezk forge`. Les skills et les scripts ne tapent plus `gh`
eux-mêmes. Ils demandent au guichet. Le guichet lit la config une seule fois. Puis il appelle
GitHub, ou il fait l'équivalent local, ou il répond « sans objet ».

Analogie : aujourd'hui, chacun va lui-même au bureau de poste et doit lire l'affiche « fermé » sur
la porte. Demain, tout le monde dépose son courrier à l'accueil. L'accueil connaît les horaires. Il
répond « fermé, voici la boîte locale ».

Ce que ça veut dire pour toi : un projet qui coupe GitHub n'a plus de trous à découvrir. Et un
oubli futur ne passe plus : un test refuse tout nouvel appel à `gh` hors du guichet.

```
aujourd'hui : chacun se contrôle                demain : un seul point de contrôle

ezk-sprint ──(lit la config)──── gh ─► GitHub   ezk-sprint ──┐
ezk-archive ──────────────────── gh ─► GitHub   ezk-archive ─┤
reconcile ────────────────────── gh ─► GitHub   reconcile ───┼─► ezk forge ── lit .vectorz/config.yml
ship-merge ──(option --local)─── git            ship-merge ──┘        ├─ GitHub ON  → adaptateur GitHub (gh)
                                                                      └─ GitHub OFF → adaptateur local
                                                                                      (git seul, ou « sans objet »)
```

## Contexte

**Ce qui existe.** Depuis la fiche 20260916225506856, un projet règle trois capacités dans
`.vectorz/config.yml` : `pr`, `ci`, `codex-review`. `github: false` coupe les trois. Le cœur
`resolveGithub` (`src/core/project-config.ts`) résout la config ; `ezk config show` l'affiche.

**Qui appelle GitHub.** Relevé sur `origin/main` (`e7b60e62`), hors tests et commentaires :

- 7 fichiers de code lancent `gh` : `skills/ezk-archive/scripts/check.sh`,
  `skills/ezk-pr/scripts/ship-merge.sh`, `bin/ci-conso.ts`, `bin/ezk-sessions.ts`,
  `bin/ezk-chef-extract.sh`, `src/io/run-facts.ts`, `src/sprint-metrics/adapters/repoSource.ts`.
- 9 textes de skills ou d'agents disent au modèle de taper `gh pr` ou `gh api`, 28 fois en tout.
- 2 textes seulement lisent la config avant : `ezk-sprint` et `ezk-pr`.

**Les trois trous vus par muti** le 2026-10-04 :

1. `ezk-archive` (`check.sh`) et `ezk-backlog reconcile` lancé seul appellent `gh pr list` sans
   lire la config. C'est une lecture sans effet. Mais elle contredit la promesse de
   `github: false` : « aucun appel GitHub ».
2. Sans PR, `ezk-sprint` intègre par un squash local (`ship-merge.sh --local`). Le squash se fait
   sur le `main` local, sans push. Il échoue dans un worktree, car `main` est déjà sorti dans le
   dossier principal. Et il ne colle pas au flux de muti : un push en avance rapide sur
   `origin/main`.
3. `ezk config --help` prend `--help` pour un chemin de projet. C'est un bug d'analyse des
   arguments, sans lien avec le motif. Il a sa propre fiche.

**La cause commune des trous 1 et 2.** Le contrôle est à la charge de l'appelant. Chaque nouveau
paragraphe de skill, chaque nouveau script peut l'oublier. Muti l'a refait une quatrième fois dans
sa propre gate (`ci:local:signal`, commit `c3a5d48b` de muti).

**Deux sortes d'appelants.** Les scripts sont déterministes. Les textes de skills, eux, font taper
au modèle ce qu'ils écrivent. Une solution doit couvrir les deux.

## Décision

### D1 — Un port « forge » et deux adaptateurs

La méthode décrit les gestes GitHub dont elle a besoin comme des **verbes d'un port**, pas comme
des commandes `gh`. C'est le motif « ports et adaptateurs » déjà en place pour la revue
(`src/review/ports.ts` et ses émetteurs) et pour les métriques de sprint
(`src/sprint-metrics/adapters/`). On ne crée que les verbes réellement utilisés.

| Verbe | Adaptateur GitHub | Adaptateur local |
|---|---|---|
| `ezk forge prs --open` | `gh pr list --state open` | « sans objet » |
| `ezk forge prs --merged` | `gh pr list --state merged` | « sans objet » |
| `ezk forge integrate --branch <b>` | `gh pr merge --squash` ([ADR-0052](0052-merge-local-first-github-execute-le-squash-main-se-realigne.md)) | la stratégie du projet (D3) |

Les autres verbes arrivent quand on touche leur appelant : ouvrir une PR, commenter, poster un
statut, lire les runs de CI.

### D2 — La config choisit l'adaptateur, une seule fois

`ezk forge` lit `.vectorz/config.yml` par le résolveur existant (`resolveGithub`). Les appelants ne
lisent plus jamais la config eux-mêmes.

Le guichet rend toujours un de **trois états distincts** :

- `ok` : GitHub a répondu ;
- `off` : la config coupe cette capacité, « sans objet » ;
- `unavailable` : la capacité est allumée, mais `gh` est absent, non authentifié ou hors ligne.

`off` n'est jamais une liste vide muette, qu'on confondrait avec « aucune PR ». `check.sh` distingue
déjà « je ne peux pas lire les PR » de « il n'y a rien à lire » : le guichet généralise cette
distinction. Les codes de sortie exacts se fixent au grooming de la fiche du guichet.

### D3 — Sans PR, l'intégration est une stratégie choisie par le projet

L'adaptateur local sait intégrer de deux façons :

- `local-squash` : le comportement actuel de `ship-merge.sh --local`, et le défaut. Il marche sans
  remote ([ADR-0052](0052-merge-local-first-github-execute-le-squash-main-se-realigne.md) D5).
- `push-ff` : vérifier que `origin/<base>` est un ancêtre de la branche, puis
  `git push origin HEAD:<base>`, puis réaligner le `main` local (ADR-0052 D2). Il marche depuis
  n'importe quel worktree, sans sortir `main`.

Le projet choisit dans `.vectorz/config.yml`. Le nom exact de la clé se fixe au grooming.

On précise aussi le sens de `github: false` : **aucun appel à l'API GitHub** (PR, CI, Codex,
statuts de commit). Un `git push` vers le remote n'est pas un appel d'API : c'est un choix de
stratégie d'intégration. Le commentaire de `.vectorz/config.example.yml` (« aucun appel GitHub »)
est reformulé dans ce sens.

### D4 — Un test à cliquet interdit `gh` hors du guichet

Un test de mega-city relève chaque appel à `gh` hors de l'adaptateur GitHub, dans le code **et**
dans les textes de skills. La liste d'aujourd'hui sert de base. Le test échoue si un appel nouveau
apparaît. La base ne fait que rétrécir, à mesure que les appelants passent par le guichet : c'est
un cliquet.

Un outil GitHub par nature, comme `ci-conso` (il mesure les minutes Actions), reste dans la base
avec sa raison écrite à côté.

C'est D4 qui rend l'oubli impossible à écrire. Sans lui, le guichet ne serait qu'une bonne
intention de plus.

## Options écartées

| | A. Garde répétée | **B. Guichet unique (retenue)** | C. Intercepteur sur `gh` |
|---|---|---|---|
| Principe | un appel `ezk config require pr` avant chaque `gh` | `ezk forge <verbe>`, qui lit la config | un faux `gh` sur le PATH, ou un hook Claude Code qui refuse `gh pr` |
| Coût | faible | moyen : une CLI, puis une migration progressive | faible |
| Empêche l'oubli ? | non : on peut oublier la garde, et aucun test ne voit une garde absente | oui, par le test à cliquet (D4) | oui, mais il refuse au lieu d'offrir l'équivalent local |
| Couvre le trou 2 (intégrer sans PR) ? | non | oui (D3) | non : aucun `gh` en jeu |
| Où ça vit | le dépôt | le dépôt | le poste de l'utilisateur, hors dépôt |

- **A. Garde répétée.** Elle garde la cause du problème : il faut penser à l'ajouter. C'est
  pourtant ce que muti a fait dans sa propre gate : c'est acceptable pour un script de projet
  isolé, pas pour une méthode partagée.
- **C. Intercepteur.** Il casse le skill en plein milieu, au lieu de lui donner le chemin local. On
  le garde comme filet si un oubli passe malgré D4. La règle maison reste : un outillage de type
  hook seulement après au moins deux récidives.
- **Une forge générique, pour GitHub, GitLab ou Gitea.** Personne n'en a besoin. Les verbes portent
  le nom du travail, pas celui d'une API neutre. La fiche 0093 (le backlog stocké ailleurs que dans
  git) a rendu le même verdict pour le stockage.

## Conséquences

- **Plus simple.** Un projet coupe GitHub, et tous les skills suivent. Un nouveau skill ne peut plus
  oublier la config. L'adaptateur local se teste sans réseau, avec un faux adaptateur.
- **Plus lourd.** Une surface de CLI de plus, à documenter dans `ezk help`. La migration des 7
  fichiers et des 9 textes prend plusieurs sprints. La base du cliquet rend cette dette visible.
- **À revoir.** ADR-0059 D2 ne change pas : la PR reste le défaut. Si un oubli passe malgré D4, on
  pose l'intercepteur (option C) en filet.

## Mise en œuvre

1. [20261004083838593](../../../../features/20261004083838593_guichet-unique-github-archive-reconcile.md) :
   poser `ezk forge` avec les verbes `prs`, y faire passer `ezk-archive` et `reconcile`, poser le
   test à cliquet.
2. [20261004083838687](../../../../features/20261004083838687_integrer-sans-pr-par-avance-rapide.md) :
   le verbe `integrate` et la stratégie `push-ff`. Dépend de la fiche 1.
3. [20261004083838781](../../../../features/20261004083838781_ezk-config-help-lu-comme-un-chemin.md) :
   le bug `ezk config --help`. Indépendant, tirable tout de suite.

## Glossaire

- **Port** — la liste des gestes dont la méthode a besoin, décrits par ce qu'ils font, pas par
  l'outil qui les fait.
- **Adaptateur** — le code qui réalise ces gestes avec un outil précis : `gh` pour GitHub, `git`
  seul pour le local.
- **Cliquet** — une liste qui peut rétrécir mais jamais grandir : un test échoue si elle grandit.
- **Avance rapide** (*fast-forward*) — pousser une branche sur `main` sans commit de fusion,
  parce que `main` n'a pas bougé depuis le départ de la branche.
