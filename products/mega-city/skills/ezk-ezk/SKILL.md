---
composes: [ezk-backlog]
roles: [ezk-steward]
applies: [documentation-guidelines/human-facing-lisibility]
name: ezk-ezk
argument-hint: "[help|harvest|create|deploy|audit]"
description: >-
  Méta-skill qui transforme une discussion de session en un skill réutilisable.
  A utiliser quand l'utilisateur veut « créer un skill », « ezk-ezk »,
  « transforme cette discussion en skill », « fais-en un skill », « génère un
  skill depuis la session », « capitalise ce qu'on vient de faire en skill
  réutilisable », ou outiller un déroulé manuel récurrent. Orchestrateur MINCE : il COMPOSE
  product-management:product-brainstorming (cadrer le besoin),
  engineering:architecture (trancher la structure) et skill-creator (rédiger /
  valider / packager le SKILL.md) — il ne réimplémente aucun des trois. Pilotable
  par sous-commandes : help, harvest (récolte ≤3 sujets du contexte de session +
  champ libre), create (brainstorm → archi → skill-creator, après validation ;
  avec --via-fiche, propose une fiche au backlog au lieu de fabriquer le skill),
  audit (convoque l'agent ezk-steward : gate mécanique + jugement du catalogue),
  deploy (range via scripts/deploy.sh : crée le dossier + symlink non-destructif,
  destination par défaut mega-city skills/). Frontière ADR-0001 : le LLM
  rédige/juge via les sous-skills, le script range. N'est PAS la fabrique de
  skills elle-même (ça, c'est skill-creator) ; c'est l'orchestrateur qui
  l'alimente depuis une conversation.
---

# ezk-ezk

Tu **transformes une discussion de session en un skill réutilisable**, en
**composant** des compétences existantes — sans rien réinventer. Le besoin réel :
on vient de dérouler à la main un « brainstorm → archi → rédaction du skill →
déploiement », et on veut le **productiser** une fois, proprement, plutôt que de
le refaire chaque fois.

**Restitution** (`harvest` / `create` / `deploy`) : ouvre par **« En clair »**
(≤ 3 phrases) — règle
[`human-facing-lisibility`](../../rules/documentation-guidelines/human-facing-lisibility.md).
**Chat** : Markdown seul — jamais `<details>`, `<summary>` ni HTML brut (le terminal les affiche
tels quels) ; le détail va en bas, sous un titre. Une fiche se cite par son **titre + lien**,
jamais par son id nu.
Politique modèles + inventaire :
[`docs/ezk-model-and-lisibility.md`](../../docs/ezk-model-and-lisibility.md).

> **Orchestrateur mince, pas une cathédrale.** `ezk-ezk` **compose** trois
> compétences et **délègue le rangement mécanique à un seul script**. Il ne
> réécrit ni le brainstorm produit, ni l'archi, ni la fabrique de skills.
> C'est le même idiome que la capacité `ezk-archive` qui *appelle* `ezk-backlog`
> au lieu de réimplémenter le suivi.

## Carte de la méthode (naming — ADR-0020)

Quand tu **fabriques** un skill ezk, place-le dans **une** bande. Diagramme :
[`diagrams/ezk-methode-globale/`](../../diagrams/ezk-methode-globale/).

**Quatre bandes.** La ligne de partage qui compte : les trois premières bandes
portent la **méthode** (ce qu'on fait et dans quel ordre), la quatrième porte
l'**outillage** (avec quoi on le fait). Une capacité d'outillage ne connaît pas
le sprint ; c'est ce qui la rend réutilisable hors de la méthode.

| Bande | La question | Exemples |
|---|---|---|
| **Cérémonies** | *quand & dans quel ordre* | `ezk-product-build`, `ezk-sprint`, `ezk-pr`, `ezk-retro` |
| **Rôles** (agents) | *qui décide / qui juge* | `ezk-pm`, `ezk-architect`, `ezk-dev`, `ezk-qa`, `ezk-reviewer`, `ezk-steward` |
| **Artefacts & rituels de méthode** | *quoi — l'état du produit* | `ezk-backlog`, `ezk-commits`, `ezk-archive`, `ezk-sprint:check` |
| **Outillage & pratiques techno** | *avec quoi — la technique* | `ezk-ci`, `ezk-docker`, `ezk-npm-scripts`, `ezk-device`, `ezk-apk`, `ezk-preview`, `ezk-diagram`, `ezk-readme`, `ezk-article`, `ezk-design-system` |

> **Test mécanique** (le graphe le dit à ta place) : un skill que **aucune
> cérémonie ne compose** (`composes:`) appartient à la bande outillage. Régénère
> avec `pnpm composes:graph` et regarde qui reste isolé.

Règles de nommage (ADR-0020, rename exécuté le 2026-08-20) :

1. **Pas de `-pilot`** — `ezk-pr` (ex-`ezk-pr-pilot`). De même `ezk-dev`
   (ex-`ezk-tdd`) : la bande Rôles nomme le **métier**, pas la technique.
2. **Capacités** : préfixe `ezk-caps-…` quand le risque de confusion avec un rôle
   est réel ; alias court OK. ⚠️ `ezk-sandbox` / `ezk-caps-sandbox` est un nom
   **réservé, pas encore construit** (fiche 0102) — ne l'utilise pas comme
   exemple d'existant.
3. **Scaffold repo** : `features/` / `done/` / index → **`ezk-backlog init`**.
   Convention Validation (`docs/PR_VALIDATION.md` + template) → **aujourd'hui
   `ezk-pr init`** (seul chemin implémenté). **À terme** : absorbée par
   `ezk-backlog init` (ADR-0022) — ne pas router Validation vers backlog tant
   que la migration n'est pas faite.
4. **`ezk-archive` = capacité** (hygiène de clôture), **pas** un 4ᵉ orchestrateur
   après `pr`.
5. **`ezk-backlog` ≠ `ezk-pr`** — backlog = *quoi* (fiches) ; pr = *comment*
   valider/merger un **stock de PRs**. Intersection : `ship` / `reconcile` autour
   du « done », objets différents.

Test ADR-0020 : une capacité utilisée par ≥ 2 rôles **ne vit pas** dans un
orchestrateur.

## Usage (sous-commandes)

`/ezk-ezk [sous-commande]` — ou en langage naturel (« crée un skill de ça »,
« transforme cette session en skill »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + le rôle de chaque étape — ne lance rien |
| `harvest` | **Récolte ≤ 3 sujets** par introspection du contexte de session courant + champ libre ; 1 seul candidat → confirmation. Ne génère rien |
| `create` (**défaut** en langage naturel) | Déroule le flux complet : harvest → résumé + questions (boucle de validation) → compose les sous-skills → produit le contenu du SKILL.md → demande la destination. **Options** : `--direct` (défaut) fabrique le skill ; `--via-fiche` (alias `--propose`) propose une **fiche** au backlog à la place des étapes 5-6 — voir « Mode `create --via-fiche` » |
| `deploy` | Range le skill validé via `scripts/deploy.sh` (dossier + symlink non-destructif + ligne de catalogue) puis émet le verdict de disponibilité + le fallback `/reload-skills` |
| `audit` | **Convoque l'agent [`ezk-steward`](../../agents/ezk-steward.md)** (le gardien) : gate mécanique du repo puis jugement de cohérence du catalogue, verdict GO/NO-GO. ezk-ezk est le CLI de la librairie ; steward reste l'exécutant (modèle/effort épinglés) — décision PO 2026-08-24 |

> **Help** : invoquée sans sous-commande (ou `help`/`?`), affiche ce tableau. Une
> demande en langage naturel route vers `create`. Sous-commande non reconnue →
> traite la demande en prose (la skill reste pilotable naturellement).

## Le flux (les 6 étapes)

Les étapes 1→4 sont du **jugement LLM** (prose, validation) ; l'étape 5 est
**déterministe** (le script range) ; l'étape 6 est un **message honnête**.

### 1. Récolte (`harvest`) — ≤ 3 sujets, jamais inventés
Introspecte le **contexte de la session courante** pour repérer les candidats de
skill : un déroulé manuel répété, une astuce non triviale, une convention qu'on
vient d'établir. Propose **au plus 3 sujets**, plus un **champ libre** (« ou
décris toi-même le skill voulu »). Si un **seul** candidat se dégage →
**confirme-le** avant d'avancer.

> **Garde-fou clé** : n'**invente jamais** un sujet absent de la conversation. La
> récolte est un jugement sur la fenêtre de contexte — **partielle** si la
> session est longue ou compactée. Présente-la comme une **suggestion**, jamais
> comme exhaustive ; le champ libre est toujours là pour corriger.

### 2. Cadrage du besoin — compose `product-management:product-brainstorming`
Une fois le sujet choisi, invoque
**`product-management:product-brainstorming`** comme partenaire de réflexion pour
cerner le **problème réel** : à qui sert ce skill, quand il devrait se
déclencher, ce qu'il doit éviter de faire. Tu n'écris pas le brainstorm
toi-même — tu l'**appelles** et tu en récoltes les réponses.

### 3. Structure — compose `engineering:architecture`
Invoque **`engineering:architecture`** pour **trancher la structure** : un seul
SKILL.md suffit-il, faut-il un script déterministe, où passe la frontière
LLM/script, quels garde-fous. Si la décision est structurante, l'ADR sort de ce
sous-skill — pas de ce playbook.

### 4. Validation — boucle AVANT toute génération
Présente un **résumé** (sujet + ce que fait le skill + quand il trigger + format
de sortie + besoin de tests) et **les questions ouvertes**. Boucle
**valider / refuser / compléter**. **Ne génère aucun fichier tant que ce n'est
pas validé.** C'est le point de contrôle : on ne fabrique un skill qu'une fois le
besoin et la structure tenus.

### 5. Fabrication — délègue à `skill-creator`
Invoque **`skill-creator`** (anthropic-skills) — référencé **par capacité**, pas
par chemin (son cache est versionné). Fournis-lui les réponses à son
« Capture Intent » produites en amont par les étapes 2-4 :
- **ce que fait le skill** (issu du brainstorm) ;
- **quand il se déclenche** (les formulations de trigger) ;
- **le format de sortie attendu** ;
- **le besoin de tests / scripts**.

`skill-creator` possède déjà les règles de `description` *pushy*, la structure
< 500 lignes / progressive disclosure, `quick_validate` et le packaging.
`ezk-ezk` n'en réimplémente **aucun** — il l'**alimente**. (Voir
[Délégation / voisinage](#délégation--voisinage).)

### 6. Destination & rangement (`deploy`)
Demande **où** ranger le skill. **Défaut : `skills/` de mega-city** — seul
write-target depuis le jour J (ADR-0006). `claude-skills` n'est proposé que comme
**option dépréciée / gelée** (lecture seule : on n'y ajoute plus rien). Le
sous-ensemble réellement actif par projet reste gouverné par le **Profile**, pas
par ce skill.

Puis **lance le script** — c'est lui, et lui seul, qui crée le dossier et pose le
symlink (cf. [Frontière](#frontière-déterministelmm)) :

```bash
bash skills/ezk-ezk/scripts/deploy.sh [--copy] <name> <chemin/SKILL.md> [dest-skills-dir]
```

- `<name>` : nom du skill (= nom du dossier cible). Slug simple (minuscules, `-`/`_`) ; `/` et `..` sont refusés.
- `<chemin/SKILL.md>` : le SKILL.md **déjà produit** par `skill-creator`.
- `[dest-skills-dir]` : optionnel, **défaut = `skills/` de mega-city**.
- `--copy` (option) : pose une **copie figée** au lieu du symlink (par défaut : symlink, qu'un `git pull` met à jour).
- **catalogue** : après le rangement, `deploy.sh` maintient l'index `skills/README.md` du dossier cible — il **ajoute la ligne du skill si elle est absente** (via `scripts/catalog-sync.mjs`, non-destructif/idempotent, `node` requis, best-effort : n'échoue jamais le deploy). Le libellé état/rôle auto (« 🆕 auto (deploy) ») est à **curer** ; le garde-fou CI `catalog-readme.test.ts` reste le filet de sécurité.

Après le déploiement, énonce le verdict de l'étape suivante.

## Mode `create --via-fiche` — entrer par la porte du backlog

**En clair.** Par défaut, `create` fabrique le skill tout de suite. Avec `--via-fiche` (alias
`--propose`), il **propose une fiche** au backlog à la place, avec les specs et les contraintes déjà
écrites. Le skill naît ensuite par le flux normal : groom, build, ship. « Bien faire la fiche, c'est
déjà tout dire. » Le mode direct reste le défaut : `--direct` (rien à écrire) ne change rien au flux
des six étapes.

**Ce qui change.** Les étapes 1 à 4 restent telles quelles : récolte, cadrage, structure, validation.
Les étapes 5 et 6 (fabrication par `skill-creator`, rangement par `deploy.sh`) sont **remplacées** par
une seule étape, **5′ — Proposition de fiche**.

**Étape 5′.** Délègue la création à `ezk-backlog add`, avec une description en quatre blocs. `add`
garde ses réflexes : anti-doublon, regroupement, id horodaté, statut `idea`.

1. **Problème et valeur** : tirés du cadrage de l'étape 2.
2. **Specs** : ce que fait le skill, ses formulations de déclenchement, son format de sortie.
3. **Contraintes et garde-fous** : la structure tranchée à l'étape 3 (script ou non, frontière
   LLM / script) et ce que le skill ne doit jamais faire.
4. **Source** : la session ou le dépôt d'où vient la matière, avec la date.

Finis la fiche par cette consigne : *construire ce skill avec `/ezk-ezk create --direct`*. La fiche
existe déjà ; relancer `--via-fiche` ferait une boucle. Elle doit être **tirable** : assez de matière
pour groomer sans te redemander. Annonce-la à l'humain par son **titre + lien**, jamais par son id nu.

**Garde-fous du mode.** Aucun `SKILL.md` n'est écrit. `deploy.sh` n'est pas appelé et `skill-creator` n'est pas invoqué.
Rien n'est créé hors de `features/`, et seulement par `ezk-backlog add`. Si `add` trouve une fiche
équivalente, propose de l'enrichir au lieu d'en créer une seconde.

**Frontière avec `ezk-chef extract`.** `ezk-ezk` propose un **skill** via une fiche. `ezk-chef extract`
produit une **recette**. Deux objets différents, deux portes différentes.

## Disponibilité intra-session — le verdict HONNÊTE

Un skill fraîchement symlinké **n'est PAS visible dans la session en cours** :
l'énumération des skills est faite **au démarrage de session**. **Mais une
nouvelle session n'est pas nécessaire.** Émets **systématiquement**, après tout
déploiement, ce fallback :

> Skill déployé. Lance **`/reload-skills`** pour l'activer **sans quitter la
> session** ; sinon il sera pris **au prochain démarrage**.

Préfère **`/reload-skills`** à `/reload-plugins`. Reste honnête : le comportement
exact **varie selon la version de Claude Code et l'hôte** (CLI vs desktop) — d'où
un message clair plutôt qu'une promesse. Ne garantis pas l'effet ; **émets** le
fallback.

## Frontière déterministe/LLM

ADR-0001 §2 — **« le LLM ne range jamais »**, non négociable.

| Acteur | Fait | Ne fait pas |
|---|---|---|
| **LLM (ce playbook + sous-skills)** | récolte, cadre, tranche la structure, **rédige/juge** le contenu via les sous-skills, demande la destination | **ne crée aucun dossier**, **ne pose aucun symlink** lui-même |
| **`scripts/deploy.sh` (déterministe)** | crée `skills/<name>/`, écrit le SKILL.md fourni, symlink **non-destructif** vers `~/.claude/skills/<name>`, **ajoute la ligne de catalogue** (`catalog-sync.mjs`), idempotent | **ne décide aucun contenu**, ne touche **que ses propres artefacts** |

Le script ne retire **que son propre symlink** (ou un skill homonyme déjà déployé)
— il **refuse** un vrai fichier/dossier utilisateur préexistant, et un `<name>`
contenant `/` ou `..` (anti-traversal). Idempotent ; refuse une source **sans
SKILL.md**. Il ne touche **jamais** un fichier de l'utilisateur (invariant ADR-0006).

## Délégation / voisinage

`ezk-ezk` **compose**, il ne réinvente pas — règle reprise de fiche 0021 :

- **`product-management:product-brainstorming`** — cadre le besoin (étape 2).
- **`engineering:architecture`** — tranche la structure / sort l'ADR (étape 3).
- **`skill-creator`** (anthropic-skills) — **fabrique et valide** le SKILL.md
  (étape 5) : `description` pushy, < 500 lignes, `quick_validate`, packaging.
  Référencé **par capacité** (deux enregistrements existent —
  `anthropic-skills:skill-creator` et `skill-creator:skill-creator` — et le cache
  est versionné ; **jamais de chemin en dur**).
- **`ezk-backlog add`** — reçoit la fiche pré-remplie en mode `--via-fiche` (étape 5′). Les
  **recettes** viennent de `ezk-chef extract`, pas d'ici.

Même idiome que `ezk-archive` (capacité de clôture qui appelle `ezk-backlog`,
ne réimplémente pas le suivi) et `ezk-ci` (génère via `skill-creator` à partir
du besoin). C'est **`skill-creator`** qui valide la `description` — pas
`ezk-ezk`. Avant de nommer un nouveau skill, relis la
[Carte de la méthode](#carte-de-la-méthode-naming--adr-0022).

## Garde-fous

- **Compose, ne réimplémente rien** : ni le brainstorm, ni l'archi, ni la
  fabrique de skills. Si tu te surprends à réécrire l'un des trois, **arrête** et
  appelle le sous-skill.
- **Le LLM ne range jamais** : dossier + symlink = `scripts/deploy.sh`
  uniquement (ADR-0001 §2). Pas de `mkdir`/`ln` à la main par le LLM.
- **N'invente jamais un sujet** absent de la conversation ; la récolte est une
  suggestion partielle, jamais une exhaustivité.
- **Valide avant de générer** : pas de fabrication tant que le résumé + les
  questions ne sont pas tranchés (étape 4).
- **Destination par défaut = mega-city `skills/`** (ADR-0006) ; `claude-skills`
  est gelé (lecture seule). Le script ne touche **que ses propres artefacts**.
- **Reload honnête** : émets le fallback `/reload-skills`, ne promets pas un
  effet qui dépend de la version/hôte.
- **Une seule responsabilité** : orchestrer la fabrique depuis une conversation.
  Ce n'est pas `skill-creator` (la fabrique), ni le `bind`/`cap` du cœur (si le
  rangement multi-hôtes grossit, porte-le là plutôt que d'épaissir ce skill).
