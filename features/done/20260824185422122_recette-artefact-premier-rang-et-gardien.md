---
id: "20260824185422122"
title: « Recette » comme artefact de premier rang + gardien (ezk-chef) — instancier le pattern steward, ne rien inventer
type: feature
priority: P2 # confirmé au grooming (P1 si construction planifiée)
product: mega-city
version:
epic:
depends: []
status: shipped
ready: 2026-08-25
pr: "#192"
created: 2026-08-24
---

## En clair

Tu veux **capitaliser** ce que tu réutilises entre projets, sous forme de **recettes**. La
recette est un **artefact de premier rang** ; le **« livre de recettes »** est son **index**.
Un **gardien** — nommé **`ezk-chef`** — veille à ce que chaque recette soit bien formée.

Rien de neuf à inventer. C'est l'assemblage de **trois mécanismes déjà en place** : un artefact +
son index (comme le backlog), des rules reliées à qui les vérifie (`enforcements:`), et un rôle
gardien (comme `ezk-steward` pour les skills). On **instancie**, on ne crée pas de concept.

**Grooming du 2026-08-25 (panel `ezk-architect`) : tout est tranché.** Cette fiche est prête à
construire — à ton OK. C'est de l'**outillage de capitalisation**, hors méthode scrum (proche archi).

## MAJ 2026-08-26 — apport PO : l'analogie « cuisine » + CLI d'abord (à plier dans le gabarit, étape 1)

> Non destructif. Le design **D1–D5 reste tranché**. Ceci **enrichit le gabarit de corps** (D2)
> avant construction : le PO **nomme les rubriques** par une analogie de cuisine et ajoute un
> principe d'outillage. À intégrer au gabarit à l'**étape 1** du plan de construction.

**En clair.** Le corps normalisé de D2 gagne des **rubriques nommées** par l'analogie cuisine.
L'analogie rend explicites deux choses que le gabarit noyait : ce qu'il faut **avoir** (comptes,
secrets) vs les **outils** qui exécutent, et les **gestes manuels** vs les étapes automatiques.

| analogie (PO) | rubrique de recette | contenu |
|---|---|---|
| **Ingrédients** | Prérequis / front-matter | comptes, **secrets**, variables (ex. compte R2, `R2_PUBLIC_URL`, token Vercel, nom de domaine) |
| **Ustensiles** | Outils | les **CLI** qui font le travail (`wrangler`, `vercel`, `gh`, `cloudflared`) — voir « CLI d'abord » |
| **Préliminaires** | Gestes manuels | ce qui **ne s'automatise pas** : créer le compte, valider un paiement — marqués ⚙️ dans la checklist |
| **Le concept** | Mécanisme + schéma | l'**archi** en un schéma texte (déjà prévu par D2) |
| **Exemples pour goûter** | Référence | l'implémentation prouvée (`source:`) + un run d'exemple |
| **Les étapes** | Playbook | la suite **tâche-après-tâche** (déjà prévu par D2) |

La **checklist « rien d'oublié »** et son **En clair** restent (D2 inchangé). L'analogie ne
remplace pas le format : elle **nomme** ses cases pour qu'une recette se lise comme une recette.

**Principe d'outillage — CLI d'abord (les ustensiles).** Une recette pilote les fournisseurs
**par leur CLI**, jamais par des clics : Cloudflare via `wrangler`, Vercel via `vercel`, GitHub
via `gh`. Les secrets se **récupèrent et se câblent par la CLI** (`gh auth token`, `wrangler
secret put`, `vercel env`), pas par copier-coller manuel. Un geste sans CLI = un **préliminaire**
marqué ⚙️.

**Le format doit rester améliorable.** Aujourd'hui la « recette bien formée » est gardée par
**`ezk-chef` + le bundle `rules/recipe/*`** (jugement + présence), pas par un **schéma déclaré
que la machine vérifie seule**. Le PO veut faire **évoluer le format par itérations** — d'où une
idée sœur à instruire : un **schéma markdown déclaratif + validateur mécanique**, transverse
(fiches, ADR, recettes). Fiche
[`20260826112620281`](../20260826112620281_schema-markdown-declaratif-validateur.md).

**Cobaye naturel = le cas R2 / Vercel / domaines.** La chaîne « créer un R2 + déployer un site
Vercel + rattacher les domaines **dev / staging / prod** » est le premier vrai cas. R2 + site +
endpoint de téléchargement sont **déjà** capturés à la main dans
[`recipes/plan-distribution-app.md`](../../recipes/plan-distribution-app.md) (méthode muti). Le
**rattachement multi-environnements des domaines** n'y est **pas encore** : c'est le trou à
combler quand on tirera la construction.

> **Précision PO 2026-08-26.** Le rattachement passe par l'**API IONOS** (le registrar des
> domaines), pas par Vercel en direct. **Préliminaire ⚙️ par projet** : aller sur le compte
> du domaine IONOS, **s'inscrire à l'API**, récupérer les **clés** ; **joindre la doc API
> IONOS** à la recette. Puis **étapes automatiques** via l'API : pointer `dev` / `staging` /
> `prod` vers le déploiement Vercel. Bel exemple de l'analogie : un **préliminaire** manuel
> (⚙️), un **ustensile** (l'API/CLI IONOS), des **étapes** scriptées.

## Le pattern (la découverte)

`ezk-steward` est au catalogue de skills ce que **`ezk-chef`** est aux recettes : un gardien qui
vérifie qu'un artefact d'une **famille** est bien formé. Le méta-pattern est déjà présent trois fois :

- une **famille d'artefacts + un index régénéré** — le backlog (fiches + `BACKLOG.md`) ;
- des **rules** (`rules/`, MAY/SHOULD/MUST) reliées à qui les vérifie (`enforcements:`) ;
- un **rôle gardien** — `ezk-steward` (skills), `ezk-reviewer` (code), `iamthelaw` (LA LOI).

« Recette » ne fait que **réinstancier ce trio** pour une nouvelle famille. Pas de concept neuf
gratuit : doctrine respectée.

## Décisions (grooming 2026-08-25)

### D1 — Gardien = rôle DISTINCT `ezk-chef` (pas une extension de `ezk-steward`)

`ezk-steward` garde **le repo de skills** : sa gate, ce sont les tests/typecheck de mega-city +
`check-links`, et son jugement porte sur les `description:` déclencheuses, les chevauchements de
skills, le README. « Une recette pointe un exemple réel, compose des rules, ne stocke pas de code »
est une **autre famille**, avec une **autre gate** (pointeurs `fichier:ligne` valides, champs
présents). Les fusionner donnerait à `ezk-steward` **deux raisons de changer** — on l'évite.

→ Un agent gardien **mince**, une responsabilité : `products/mega-city/agents/ezk-chef.md`.
Nom `ezk-chef` (arbitrage PO 2026-08-25) : anglais/neutre comme les `ezk-*`, « l'autorité qui
valide » — et « cook**er** » désignerait l'appareil, pas la personne.

### D2 — Format = on clone le trio du backlog (fiche + index + `regen`)

La recette **réutilise la mécanique backlog telle quelle**. Rien à réinventer.

- **La recette = une fiche markdown** dans `recipes/`, avec un **front-matter YAML** (aujourd'hui
  absent des deux exemples — c'est ce qui manque) et un **corps normalisé** (déjà porté par les deux
  exemples). Champs du front-matter, miroir de la fiche backlog :

  | champ | rôle |
  |---|---|
  | `id` | id horodaté minté (même anti-collision que le backlog) |
  | `title` | titre lisible |
  | `makes` | ce qu'elle **fabrique**, une ligne |
  | `source` | racine de l'implémentation prouvée (`~/git/…`) |
  | `composes` | rules composées (idiome ADR-0012/0025) |
  | `profile` | profil référencé (optionnel) |
  | `status` | `draft` / `ready` / … (source de vérité) |
  | `home` | `central` ou `project` (voir D4) |
  | `created` / `updated` | dates |

- Le **corps** (déjà présent dans les exemples) : `## En clair`, sections numérotées, une section
  **« Fichiers de référence (entonnoir — pointer, jamais copier) »** avec des pointeurs
  `fichier:ligne`, un `## Statut de cette recette`.
- **Le livre = `recipes/RECIPES.md`**, régénéré par **`scripts/regen-recipes.sh`** calqué sur
  `regen-backlog.sh` (tri déterministe, bandeau « ne pas éditer à la main »). **Le LLM ne range
  jamais** : le script écrit l'index (ADR-0001).

### D3 — Producteur = aucun skill neuf

Le geste « produire une recette » est **déjà couvert** : `ezk-ezk harvest` (session courante) et
`ezk-extract` / [fiche 794](20260824122629794_ezk-extract-capitaliser-feature-en-recette.md)
(feature désignée). On **n'ajoute pas** de skill producteur, et surtout **pas** sous le nom
`ezk-recipy` — faux ami déjà pris ([fiche 0147](../0147-ezk-recipy-mvp.md) = scanner de repos
**froids**, pas les recettes de démarrage).

Pas de sous-commandes multi-niveaux (`ezk-ezk recipy add`) pour l'instant : la grammaire est plate.
Si une **famille** de verbes (`add/list/rm/regen`) apparaît un jour, elle appartiendra au **gardien
+ son `regen`** (façon `ezk-backlog`), pas à `ezk-ezk`. YAGNI.

### D4 — Où vit une recette = index central qui POINTE ; fichier central par défaut

L'archi non négociable : **le livre (l'index) est TOUJOURS central et POINTE, jamais ne copie** —
doctrine entonnoir ([ADR-0013](../../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md))
appliquée à la localisation. Du coup, l'emplacement du **fichier** devient un réglage réversible
(champ `home`), sans toucher au livre.

- **Par défaut : central `vectorz/recipes/`** (arbitrage PO 2026-08-25). C'est déjà le cas des deux
  exemples, le plus simple à outiller. Position provisoire, réversible.
- **Bascule vers `home: project`** quand une recette est **fortement couplée au code d'un dépôt
  vivant** — même raisonnement que le contrat cowork (« le guide vit dans l'app », ADR-0015). Elle
  naît près du code, le livre central l'indexe par pointeur.

### D5 — Placement dans la carte (4 bandes, ADR-0020, inchangé)

La carte classe des **skills**, pas des données.

- **L'artefact recette = de la donnée** (comme les fiches) → **pas dans une bande**.
- **Le producteur** (`ezk-ezk harvest` / `ezk-extract`) → bande **Outillage** (« avec quoi »).
- **Le gardien** (`ezk-chef`) → bande **Rôles** (« qui juge »).

## Le bundle de rules « recette bien formée »

Dans `rules/recipe/`, relié au gardien via `enforcements:` (même idiome que
`pr-before-after-media` → `ezk-reviewer`). Chaque rule pointe `agent: ezk-chef`.

| rule | niveau | ce qu'elle vérifie |
|---|---|---|
| `recipe/points-to-real-example` | **MUST** | une section « Fichiers de référence » avec ≥1 pointeur `fichier:ligne` ; la racine `source:` existe |
| `recipe/no-stored-code` | **MUST** | aucun code recopié qui duplique la source — pointeurs only (ADR-0013) |
| `recipe/valid-frontmatter` | **MUST** | front-matter YAML valide ; champs requis présents (`id/title/makes/source/status`) |
| `recipe/indexed` | **MUST** (mécanique) | présente dans l'index régénéré — vérifié par le **script**, pas le LLM (ADR-0001) |
| `recipe/lists-tasks-and-composes` | **SHOULD** | playbook (liste de tâches) + `composes:` + profil référencé |
| `recipe/plain-language-first` | **SHOULD** | une section « En clair » en tête |

Les trois premières + `indexed` = la gate dure ; les deux SHOULD relèvent du jugement du gardien.

## Frontière anti-doublon (aucun recouvrement)

Cette fiche définit **l'OBJET** (format recette + livre + gardien). Les autres **produisent** ou
**consomment** :

- **session courante** → `ezk-ezk harvest` ;
- **feature désignée** → `ezk-extract` ([794](20260824122629794_ezk-extract-capitaliser-feature-en-recette.md)) ;
- **repos froids** → `ezk-recipy` ([0147](../0147-ezk-recipy-mvp.md)) ;
- **cas d'usage** : `ezk-cowork` ([0155](../0155-ezk-cowork-scaffold-audit-contrat-cowork.md)),
  [recette-site 540](../20260821172716540_recette-site-produit-regles-activables.md), et « pack de
  pratiques projet » ([0177](../0177-pack-pratiques-projet-portables.md)).

Eux produisent/consomment, **celle-ci définit**. Pas de doublon.

## Alternative écartée

**« recette = juste un skill dont le playbook est la liste de tâches »** (doctrine 794). Écartée :
la recette est de la **donnée réutilisable transverse** (un exemple pointé, des tâches, des rules),
pas un outil. La traiter comme un skill mélange l'outil et son produit. Le pattern steward existe
déjà pour garder une famille d'artefacts-données.

## Critères d'acceptation (DoR — tous tranchés)

- [x] Gardien décidé : rôle distinct **`ezk-chef`**, responsabilité unique (D1).
- [x] Format tranché : fiche + front-matter + corps gabarit ; livre `recipes/RECIPES.md` régénéré (D2).
- [x] Producteur tranché : aucun skill neuf ; `ezk-recipy` **non** réutilisé (D3).
- [x] Emplacement tranché : central provisoire, index qui pointe, `home` réversible (D4).
- [x] Bundle de rules « recette bien formée » défini, relié à `ezk-chef` via `enforcements:`.
- [x] **Zéro code stocké** dans une recette (pointeur vers exemple réel — ADR-0013).
- [x] Frontière écrite avec 794 / 0147 / 0155 / 540 / 0177 (aucun doublon).

## Plan de construction (à ton OK — ne pas construire avant)

1. **Figer le gabarit** de recette (front-matter D2 + corps), en normalisant par-dessus les 2 exemples.
2. **Écrire le bundle `rules/recipe/*.md`** avec `enforcements:` → `ezk-chef`.
3. **Créer l'agent** `products/mega-city/agents/ezk-chef.md` : instance mince du pattern steward —
   gate mécanique (lancer `regen-recipes.sh`, vérifier pointeurs + champs, `check-links` sur
   `recipes/`), puis jugement des SHOULD ; verdict GO/NO-GO.
4. **Écrire `scripts/regen-recipes.sh`** : clone de `regen-backlog.sh` → `recipes/RECIPES.md`.
5. **Rétro-normaliser les 2 recettes existantes** (`plan-distribution-app.md`,
   `elicitation-authentification-forte.md`) : ajouter leur front-matter, générer le livre.
6. **Écrire la frontière anti-doublon** dans la fiche et **neutraliser la gate ADR-0013**
   (déclarée non bloquante par le PO).
7. *(différé)* activer la bascule `home: project` **si** le critère de D4 se déclenche.

## Lignée / références

- Doctrine cowork : ADR-0015 (« contrat cowork »).
- Doctrine recipy : [ADR-0013](../../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) (entonnoir, jamais fabrique).
- Nommage / carte 4 bandes : ADR-0020.
- Frontière déterministe : ADR-0001 (le LLM ne range jamais).
- Producteurs & cas : fiches 794, 0147, 0155, 540, 0177.
- Gardiens existants (le pattern) : `ezk-steward`, `ezk-reviewer`, `iamthelaw`.
- Recette « élicitation par auth forte » déjà capturée : `recipes/elicitation-authentification-forte.md`
  (source `~/git/google-mcp-multi-account/`) — à normaliser à l'étape 5.
- Origine : session du 2026-08-24 (brainstorm pasteriz → le pattern cowork a fait émerger « recette »).
- Grooming : 2026-08-25, panel `ezk-architect` (décisions D1–D5).
