# ADR-0061 — Un seul guichet pour GitHub : chaque geste passe par `ezk forge`, qui lit la config

- Statut : **Proposé** (à ratifier par le PO).
- Date : 2026-10-04 · perspective du bus ajoutée le même jour, à la demande du PO
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

Plus loin, ce guichet est le premier morceau d'un **bus** : la méthode y annonce ses moments, et
tout outil s'y branche sans toucher à son texte. La section « Perspective » le décrit.

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

Les verbes portent un nom **neutre** : `changes` désigne les demandes de fusion, qu'on appelle
« pull requests » chez GitHub et « merge requests » chez GitLab. Un adaptateur GitLab pourra donc
se brancher plus tard sans renommer aucun verbe.

| Verbe | Adaptateur GitHub | Adaptateur local |
|---|---|---|
| `ezk forge changes --open` | `gh pr list --state open` | « sans objet » |
| `ezk forge changes --merged` | `gh pr list --state merged` | « sans objet » |
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
- **Construire tout de suite un adaptateur GitLab.** Le PO veut que le motif marche pour GitLab,
  mais aucun projet ne l'utilise aujourd'hui. On garde donc les verbes neutres (D1), et on
  construit l'adaptateur GitLab quand un projet le demande. La fiche 0093 (le backlog stocké
  ailleurs que dans git) a rendu le même verdict pour le stockage : ne rien construire avant un
  besoin réel.

## Conséquences

- **Plus simple.** Un projet coupe GitHub, et tous les skills suivent. Un nouveau skill ne peut plus
  oublier la config. L'adaptateur local se teste sans réseau, avec un faux adaptateur.
- **Plus lourd.** Une surface de CLI de plus, à documenter dans `ezk help`. La migration des 7
  fichiers et des 9 textes prend plusieurs sprints. La base du cliquet rend cette dette visible.
- **À revoir.** ADR-0059 D2 ne change pas : la PR reste le défaut. Si un oubli passe malgré D4, on
  pose l'intercepteur (option C) en filet.

## Mise en œuvre

1. [20261004083838593](../../../../features/20261004083838593_guichet-unique-github-archive-reconcile.md) :
   poser `ezk forge` avec le verbe `changes`, y faire passer `ezk-archive` et `reconcile`, poser le
   test à cliquet.
2. [20261004083838687](../../../../features/20261004083838687_integrer-sans-pr-par-avance-rapide.md) :
   le verbe `integrate` et la stratégie `push-ff`. Dépend de la fiche 1.
3. [20261004083838781](../../../../features/20261004083838781_ezk-config-help-lu-comme-un-chemin.md) :
   le bug `ezk config --help`. Indépendant, tirable tout de suite.

## Perspective — le bus de la méthode

*Ajoutée le 2026-10-04 à la demande du PO, avant la ratification.*

### En clair

Le guichet `ezk forge` n'est qu'un premier morceau. Le but plus large : que n'importe quel outil
se branche sur la méthode **sans toucher à son texte**. GitHub, GitLab, Codex, SonarQube, Slack,
Linear, par exemple.

L'image est celle d'un **bus**, au sens des « Enterprise Integration Patterns » (EIP), un catalogue
reconnu de motifs d'intégration. La méthode annonce ses moments sur le bus. Les plugins s'y
branchent. Un diagramme généré montre qui écoute quoi.

Trois rôles, jamais mélangés :

| Qui | Décide | Où c'est écrit |
|---|---|---|
| La méthode | **quand** : le catalogue de ses moments | le texte des skills, qui ne nomme aucun outil |
| Le projet | **qui** : les plugins actifs, l'exécutant de chaque commande | `.vectorz/config.yml` |
| Le plugin | **comment** : ses scripts et son texte | son propre dossier, avec un manifeste |

### Le schéma

Les noms des moments sont indicatifs : le contrat les fixera.

```
           LA MÉTHODE  (texte stable : elle annonce des moments, elle ne nomme aucun outil)

 story.started  branch.validated  review.requested   integrate   story.integrated  sprint.closed
      │                │                 │               │               │               │
══════╪════════════════╪═════════════════╪═══════════════╪═══════════════╪═══════════════╪══ bus
      │                │                 │               │               │               │
  événement        événement           avis          commande        événement       événement
  0..N abonnés     0..N abonnés    N avis, 1 règle  1 exécutant     0..N abonnés    0..N abonnés
      │                │          ┌──────┼──────┐        │               │               │
  supervision     aperçu Vercel   revue  Codex  Sonar  GitHub,        Linear          Slack
  (journal)       statut GitHub   locale (filet)       GitLab         (ticket livré)  (message)
                                  (plancher)           ou local,
                                                       choisi par
                                                       la config
```

### Trois sortes d'échanges

| Sorte | La méthode attend ? | Combien de plugins | Motif EIP | Exemple |
|---|---|---|---|---|
| **Événement** | non : elle annonce et continue | zéro, un ou plusieurs abonnés | canal publier-s'abonner (*Publish-Subscribe Channel*) | `story.integrated` : ticket Linear livré, message Slack, journal de supervision |
| **Commande** | oui : il lui faut un résultat | exactement un exécutant, choisi par la config | passerelle et aiguillage (*Messaging Gateway*, *Content-Based Router*) | `integrate` : GitHub, GitLab ou local ; c'est `ezk forge` (D1) |
| **Avis** | oui : il lui faut un verdict | plusieurs avis, combinés par une règle écrite | diffuser puis rassembler (*Scatter-Gather*, *Aggregator*) | `review.requested` : revue locale, Codex, SonarQube ; règle de l'ADR-0059 |

La supervision observe tout le bus sans rien changer : c'est une écoute (*Wire Tap*). L'état
`unavailable` de D2 joue le rôle du canal des messages non livrés (*Dead Letter Channel*) : un
échec se voit, il ne se perd pas.

### Cinq règles pour que les plugins n'interfèrent pas

1. **Une commande a un seul exécutant.** Si deux plugins se proposent pour `integrate`, le
   chargement échoue, et la config tranche.
2. **Un abonné qui échoue ne bloque pas la méthode.** S'il doit bloquer, ce n'est pas un abonné :
   c'est un avis, avec sa règle.
3. **Un avis suit une règle écrite.** Par exemple celle de l'ADR-0059 : la revue locale doit dire
   GO, les autres ajoutent des constats.
4. **Les apports se fusionnent par identifiant, jamais par position.** Deux plugins qui ajoutent
   chacun une consigne ne s'écrasent pas.
5. **Le diagramme est généré** depuis les manifestes et la config, par une commande du type
   `ezk bus show`. Il n'est jamais dessiné à la main : il ne peut pas mentir.

### Un plugin, concrètement

Un plugin est un dossier, avec un manifeste qui déclare ce qu'il fait. Forme indicative :

```yaml
# plugins/github/plugin.yml
name: github
executes: [integrate, changes]   # commandes qu'il sait exécuter
listens: [branch.validated]      # événements qu'il écoute, ici pour poster un statut
advises: []                      # avis qu'il rend
needs: [network, gh-auth]        # ce qu'il lui faut pour répondre
```

Le projet active ses plugins dans sa config. Forme indicative :

```yaml
# .vectorz/config.yml
plugins: [github, codex, slack]
commands:
  integrate: github
```

L'activation reste explicite, jamais « toujours allumé »
([ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) §4). La forme d'aujourd'hui
reste lue : `github: false` revient à ne pas activer le plugin `github`.

### Ce qu'on reprend de BMAD, et ce qu'on laisse

Vérifié le 2026-10-04 dans la documentation officielle de BMAD (page « Customize BMad ») et dans la
copie installée dans vectorz (`_bmad/_config/`, version 6.0.0-Beta.8).

- **Repris : les couches.** Base, puis équipe, puis utilisateur. Chaque couche surcharge la
  précédente sans la modifier.
- **Repris : des règles de fusion selon la forme des données.** Une valeur simple est remplacée.
  Une table est fusionnée. Une liste dont les éléments portent un `id` est fusionnée par cet `id`.
  Une autre liste est complétée. C'est ce qui rend la règle 4 possible.
- **Repris : des prises nommées dans le cycle de vie.** BMAD offre `activation_steps_prepend`,
  `activation_steps_append` et `on_complete` sur ses workflows, et `critical_actions` sur ses
  agents. Un premier essai s'en sert déjà pour brancher la supervision sur BMAD sans le
  modifier : `BmadBridgeService`, dans cop1, écrit des `critical_actions`
  ([ADR-032](../../../../docs/adr/ADR-032-emission-adaptateur-separable.md)).
- **Laissé : des prises remplies par du texte libre.** Une prise BMAD reçoit une consigne en
  prose. Rien ne dit ce qu'elle doit rendre, ni ce qui se passe si elle échoue. C'est assez pour un
  événement, pas pour une commande ni pour un avis.
- **Laissé : des moments grossiers.** BMAD n'a que le début et la fin d'un workflow. Il n'a pas de
  moment comme « branche validée » ou « intégrer ».
- **Constat : BMAD n'a pas de plugin GitHub.** Un projet qui veut GitHub écrit lui-même la consigne
  dans une prise, par exemple dans `on_complete`.

### Ce qui existe déjà en germe dans vectorz

- **Les événements** : le contrat de supervisabilité (`run_start`, `gate_reached`, `heartbeat`,
  `run_finished`), et le « sidecar » d'[ADR-032](../../../../docs/adr/ADR-032-emission-adaptateur-separable.md),
  qui branche une méthode par des fiches « moment → consigne → prise ». Dans nos propres skills,
  ces consignes restent écrites en dur
  ([20260830110131298](../../../../features/20260830110131298_supervision-ezk-plugin-separable.md)).
- **Les avis** : [ADR-0059](0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md),
  la revue locale en plancher et Codex en filet.
- **Les commandes** : cet ADR, avec `ezk forge`.

### Faut-il attendre un deuxième plugin ?

ADR-0039 §4 dit : la règle complète des plugins s'écrit au deuxième plugin. **Ce deuxième plugin
existe déjà** : la supervision écoute la méthode depuis juillet 2026. On n'attend donc pas pour
fixer le **contrat** : le catalogue des moments, les trois sortes d'échanges, les trois rôles.
C'est du texte, peu coûteux, et c'est lui qui rend le diagramme lisible.

On construit en revanche **canal par canal**, quand on touche son premier client :

1. **Commande** : cet ADR, pour GitHub et le local.
2. **Événement** : sortir la supervision du texte des skills
   ([20260830110131298](../../../../features/20260830110131298_supervision-ezk-plugin-separable.md)).
3. **Avis** : à la prochaine retouche de la revue (ADR-0059).
4. **Plugins venus d'ailleurs**, avec manifeste et découverte : au premier outil demandé hors de
   vectorz, par exemple GitLab, Linear ou Slack.

Le contrat du bus fera l'objet de son propre ADR, quand on l'écrira.

### Outils candidats

| Outil | Sorte d'échange | Moment |
|---|---|---|
| GitHub | commande, événement | `integrate` et `changes` ; un statut à `branch.validated` |
| GitLab | commande, événement | les mêmes, en merge requests |
| Codex, CodeRabbit | avis | `review.requested` |
| SonarQube | avis | `review.requested`, comme seuil de qualité |
| Linear, Jira, GitHub Issues | événement | `story.started`, `story.integrated` (voir la fiche [0171](../../../../features/0171-adapter-github-issues-push-only.md)) |
| Slack, Discord, WhatsApp | événement | `sprint.closed`, ou un jalon qui attend une réponse |
| Vercel | événement | `branch.validated`, pour un déploiement d'aperçu |
| Supervision | événement, en écoute | tous les moments |

## Glossaire

- **Port** — la liste des gestes dont la méthode a besoin, décrits par ce qu'ils font, pas par
  l'outil qui les fait.
- **Adaptateur** — le code qui réalise ces gestes avec un outil précis : `gh` pour GitHub, `git`
  seul pour le local.
- **Cliquet** — une liste qui peut rétrécir mais jamais grandir : un test échoue si elle grandit.
- **Avance rapide** (*fast-forward*) — pousser une branche sur `main` sans commit de fusion,
  parce que `main` n'a pas bougé depuis le départ de la branche.
- **Bus** — le canal commun où la méthode annonce ses moments et où les plugins se branchent.
- **EIP** (*Enterprise Integration Patterns*) — un catalogue reconnu de motifs pour faire
  dialoguer des systèmes : canal, aiguillage, écoute, agrégation.
- **Événement** — une annonce de la méthode ; elle n'attend rien en retour.
- **Commande** — une demande de la méthode ; un seul plugin l'exécute, et la méthode attend son
  résultat.
- **Avis** — une demande de verdict à plusieurs plugins, combinés par une règle écrite.
- **Manifeste** — le fichier où un plugin déclare ce qu'il exécute, écoute et rend.
