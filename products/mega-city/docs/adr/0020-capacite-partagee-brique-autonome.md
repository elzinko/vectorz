# ADR 0020 — une capacité partagée devient une brique autonome, jamais un chapitre d'orchestrateur (amende ADR-0009 §2)

- Statut : **accepté** — 2026-08-20 (voir *Amendement du 2026-08-20* en fin de fiche)
- Date : 2026-07-26
- Amende : [ADR-0009 §2](0009-ezk-pr-pilot-orchestrateur-validation-prs.md) · Fiche : [0102](../../../../features/0102-ezk-testbed-brique-boot-env-test.md)
- **Absorbe [ADR-0022](0022-ezk-methode-trois-bandes-naming.md)** (fusion décidée par le PO
  le 2026-08-20) : la taxonomie et le naming vivent désormais **ici**, en une seule décision.

> ⚠️ **Nota de lecture.** Le corps ci-dessous est le texte d'origine du 2026-07-26 : il
> emploie les noms de l'époque (`ezk-pr-pilot`, `ezk-tdd`) et **rejetait** le rename. C'est
> l'*Amendement du 2026-08-20*, en fin de fiche, qui fait foi sur ces deux points. On ne
> réécrit pas un raisonnement daté : on l'amende (règle d'immuabilité, ADR-025 §5 racine).

## Contexte

Le besoin « démarrer un environnement de test isolé, avec un état de départ maîtrisé » est
arrivé par une demande **PR-centrée** (samplerz, fiche P0 `pr_local_stack_testable`), et sa
recommandation de grooming était d'**étendre `ezk-pr-pilot`**. L'inventaire du 2026-07-26
montre autre chose :

1. **Quatre rôles** de la méthode ont ce besoin, pas un : `ezk-pr-pilot run` (« démarre les
   bancs »), `ezk-preview` cas B (qui **devine** le port : 3000 / 5173 / 8080 / 4321 / 8000),
   `ezk-sprint` étape 6 via `ezk-qa`, et `verify`/`run`.
2. **Le terrain a déjà généralisé** : city-guided a écrit `scripts/preview-pr.sh` pour les
   PRs, puis l'a étendu aux branches de lui-même (`PREVIEW_ENTRY=pr|branch` ×
   `PREVIEW_MODE=node|docker`). Deux axes — **cible** et **recette** — sans guidance.
3. **`ezk-pr-pilot` est un orchestrateur de stock, et c'est gravé mécaniquement** :
   `src/__tests__/profiles-sync.test.ts:44` l'exclut de `cop1-target` au titre des
   orchestrateurs (doctrine « deux chefs dans la même session »). Y loger la capacité
   signifie que « démarre l'env de cette branche » — sans aucune PR — oblige à charger un
   chef de stock.
4. **Doctrine PO (2026-07-26)** : les skills sont des **briques autonomes composables**,
   utilisables **hors** de la méthode mega-city. Une capacité accessible uniquement via un
   orchestrateur n'est pas une brique : c'est un bundle déguisé.

ADR-0009 §2 avait tranché « **un seul** nouveau skill pour la consommation » — arbitrage
juste **à son échelle** (écrire vs consommer des PRs), qui ne couvrait pas une capacité
partagée par quatre rôles.

## Décision

1. **Règle de découpage.** Une **capacité** sollicitée par **≥ 2 rôles** ne vit pas dans un
   orchestrateur : elle devient une **brique autonome** que les rôles **composent**. Un
   orchestrateur peut posséder une **convention** (ADR-0009 : la convention « Validation »
   reste à `ezk-pr-pilot`) ; il ne possède pas une capacité que d'autres consomment.
2. **Test d'autonomie (critère d'acceptation, pas intention).** Une brique doit fonctionner
   dans un repo où **aucun autre skill ezk n'est installé**. Si sa valeur exige un
   orchestrateur, ce n'est pas une brique.
3. **Application immédiate** : `ezk-testbed` (fiche 0102) — `init` / `check` / `start` /
   `stop` / `list`, cibles `pr <n>` · `branch <nom>` · `local`, recette choisie **par le
   projet**. `ezk-pr-pilot` gagne **une ligne** de délégation et **aucune** logique de boot ;
   `ezk-preview` **retire** son heuristique de port et délègue.
4. **Le projet déclare, la méthode lit** — 4 slots (`start`, `stop`, état de départ,
   périmètre d'isolation). La politique d'état de départ est **projet-locale** ; la méthode
   n'impose que l'obligation de la déclarer (« sans objet » explicite est une réponse
   valide). Aucun nouveau format de config : la déclaration épouse l'interface de commandes
   existante (règle **MUST** `development/use-project-scripts`).

## Options considérées

- **A. Renommer `ezk-pr-pilot` → `ezk-pr` et y loger le contrat** — rejetée : ~12 fichiers
  plus une liste figée (`expand.test.ts`) pour zéro changement de comportement, et la
  capacité reste captive d'un orchestrateur (viole §2 du test d'autonomie).
- **B′. Split en deux temps** (contrat hébergé provisoirement par `ezk-pr-pilot`, extraction
  ultérieure sur preuve) — rejetée : construit délibérément la mauvaise forme pour la
  défaire ensuite, et coûte **plus** de prose dans l'orchestrateur que la délégation directe.
- **C. Statu quo** — rejetée : deux projets sur trois ont écrit l'adaptateur à la main,
  séparément ; le besoin est de méthode, pas de projet.
- **D. Loger la capacité dans `ezk-docker` ou `ezk-preview`** — rejetée : docker n'est
  **qu'une recette** (un projet en mode node n'a pas à le charger) ; `ezk-preview` a un
  autre métier (exposer vers l'extérieur, avec ses règles de sécurité sur les credentials)
  et deviendrait une brique grasse.

## Conséquences

**Plus facile** — utiliser une brique seule, hors méthode ; retirer de la prose qui devine
(`ezk-preview`) ; décrire un banc de test dans n'importe quel repo sans imposer sa stack.

**Plus dur** — un skill de plus au catalogue (19) et au profil `global` ; la discipline de
frontière doit être re-tenue à chaque ajout (le test d'autonomie §2 est là pour ça).

**À surveiller** — la composition `ezk-pr-pilot → ezk-testbed` reste **en prose** tant que
`composes:` (ADR-0012, **proposé** ; fiche 0044 `todo`) n'est pas implémenté : un profil peut
binder l'un sans l'autre sans erreur. La doctrine « briques autonomes **composables** » rend
0044 nettement plus utile — c'est son déclencheur naturel.

---

## Amendement du 2026-08-20 — fusion d'ADR-0022 : quatre bandes + rename exécuté

**Statut : accepté** (décision PO du 2026-08-20). Cet amendement **absorbe**
[ADR-0022](0022-ezk-methode-trois-bandes-naming.md), qui passe *superseded*.

### Pourquoi fusionner

L'audit de méthode du 2026-08-20 a montré que 0020 et 0022 se **contredisaient
frontalement** : 0020 §Options *rejetait* le rename `ezk-pr-pilot` → `ezk-pr` (« ~12 fichiers
pour zéro changement de comportement »), 0022 §3 le déclarait *« nom préféré »*. Les deux
étaient « proposé », aucun n'était exécuté — et pendant ce temps `ezk-ezk`, le méta-skill qui
sert à **fabriquer** les nouveaux skills, enseignait une taxonomie citant `ezk-dev` et
`ezk-sandbox`, deux noms qui n'existaient pas. Deux décisions concurrentes sur un même objet
produisent zéro décision.

### 1. Quatre bandes (remplace les trois d'ADR-0022 §1)

| Bande | La question | Exemples |
|---|---|---|
| **Cérémonies** | *quand & dans quel ordre* | `ezk-product-builder`, `ezk-sprint`, `ezk-pr`, `ezk-retro` |
| **Rôles** (agents) | *qui décide / qui juge* | `ezk-pm`, `ezk-architect`, `ezk-dev`, `ezk-qa`, `ezk-reviewer`, `ezk-steward` |
| **Artefacts & rituels de méthode** | *quoi — l'état du produit* | `ezk-backlog`, `ezk-commits`, `ezk-archive`, `ezk-start` |
| **Outillage & pratiques techno** | *avec quoi — la technique* | `ezk-ci`, `ezk-docker`, `ezk-npm-scripts`, `ezk-device`, `ezk-apk`, `ezk-preview`, `ezk-diagram`, `ezk-readme`, `ezk-article`, `ezk-design-system` |

**Ce que la quatrième bande apporte.** La bande « Capacités » d'ADR-0022 était un
fourre-tout : elle rangeait `ezk-backlog` (le cœur de la méthode) à côté de `ezk-docker` (un
outil qui ignore tout du scrum). La ligne de partage utile n'est pas *composable / non
composable*, c'est **méthode vs technique** : une capacité d'outillage ne connaît pas le
sprint, et c'est précisément ce qui la rend réutilisable dans un projet qui n'utilise pas
mega-city (test d'autonomie, §1 du corps ci-dessus).

**La bande se lit mécaniquement, elle ne se décrète pas.** Depuis l'annotation `composes:`
du catalogue (ADR-0025), le graphe généré par `pnpm composes:graph` répond tout seul : un
skill que **aucune cérémonie ne compose** appartient à la bande outillage. Au 2026-08-20,
les isolés du graphe sont exactement `ezk-docker`, `ezk-npm-scripts`, `ezk-design-system` et
les `supervision-*`. Le critère est donc **testable**, pas déclaratif — c'est ce qui manquait
à ADR-0022.

### 2. Naming — le rename est exécuté (renverse §Options « A » du corps ci-dessus)

| Avant | Après | Bande |
|---|---|---|
| `ezk-pr-pilot` | **`ezk-pr`** | Cérémonies |
| `ezk-tdd` | **`ezk-dev`** | Rôles |

Le corps de 0020 rejetait le rename au motif du coût (« ~12 fichiers »). Mesure réelle du
2026-08-20 : **63 fichiers / 194 occurrences** pour `ezk-pr-pilot`, 30 / 52 pour `ezk-tdd`.
Le coût était donc **sous-estimé d'un facteur 5** — mais l'argument s'est inversé : tant que
le rename n'était pas fait, les diagrammes, `ezk-ezk` et les ADR enseignaient des noms
fantômes, et **chaque nouveau skill fabriqué héritait de la confusion**. Le PO a tranché pour
l'exécution.

`ezk-tdd → ezk-dev` suit la même logique de bande : la bande Rôles nomme un **métier**
(`dev`), pas une technique (`tdd`) — le TDD est *comment* le rôle travaille, et cela vit dans
LA LOI (`rules/testing/`), pas dans le nom de l'agent.

**Politique de rename appliquée** — le vivant est renommé, l'histoire est préservée :

- **renommé** : `skills/`, `agents/`, `profiles/`, `src/`, `bin/`, docs non-ADR, fiches
  actives, diagrammes ;
- **non renommé** : `docs/adr/**` et `features/done/**` — la prose y garde le nom d'époque
  (un ADR est immuable, une fiche archivée est un constat daté). **Seules les références de
  chemin** y sont corrigées, pour ne pas casser de lien : 4 fichiers, vérifié par
  `check-links.sh` (404 liens, 0 cassé).

### 3. Ce que cet amendement ne fait PAS

- **`ezk-sandbox` / `ezk-caps-sandbox` n'est pas créé.** ADR-0022 §3 le nommait comme s'il
  existait ; c'est un nom **réservé** dont la construction reste la fiche
  [0102](../../../../features/0102-ezk-testbed-brique-boot-env-test.md), `status: blocked`.
  Renommer n'est pas construire.
- **La convention Validation n'est pas migrée** vers `ezk-backlog init` (dette d'ADR-0022 §3,
  reprise telle quelle) : `ezk-pr init` reste le chemin opérationnel.
- **Le préfixe `ezk-caps-*` n'est pas déployé** : il reste une préférence, pas une règle.

### Conséquences

- **+** Une seule décision fait autorité sur la taxonomie et le naming ; les contradictions
  C1, C5 et C10 de l'audit tombent ensemble.
- **+** `ezk-ezk` enseigne enfin des noms qui existent, et la bande d'un skill est
  **vérifiable par un script** au lieu d'être un jugement.
- **−** Les fiches archivées et les ADR emploient l'ancien nom : c'est assumé et signalé par
  le nota de lecture en tête. Un lecteur qui grep `ezk-pr-pilot` trouve de l'histoire, pas du
  code mort.
- **⚠️ Le re-bind ne suffit PAS à nettoyer** (relevé par la revue Codex, 2026-08-20) :
  `applyGlobalPlan` (`src/io/apply.ts:296-335`) n'itère que le **nouveau** plan. Rejouer
  `bind-global` installe donc bien `ezk-pr` et `ezk-dev`, mais **laisse en place** les
  anciennes entrées `~/.claude/skills/ezk-pr-pilot` et `~/.claude/agents/ezk-tdd.md` — d'où
  un catalogue global où les DEUX noms coexistent, exactement la confusion qu'on supprime.
  Le retrait doit être **gardé** (vérifier que l'entrée est bien gérée, même invariant que
  `assertReplaceableSkillDir`) : jamais un `rm -rf` aveugle, qui détruirait une
  personnalisation utilisateur, ni une purge des entrées hors-plan, qui effacerait les skills
  volontairement omis d'un profil curated (`daily`). Le correctif propre — **durcir le binder
  pour gérer les renommages** — reste à faire : fiche
  [`20260813131737962`](../../../../features/20260813131737962_nommage-catalogue-adr0022.md).
