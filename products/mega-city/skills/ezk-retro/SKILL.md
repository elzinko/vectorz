---
composes: [ezk-backlog]
name: ezk-retro
argument-hint: "[help|run|impose|retire]"
description: >-
  Cérémonie d'AUTO-AMÉLIORATION DE LA MÉTHODE, déclenchée À LA DEMANDE par
  l'humain (Sujet A). A utiliser quand l'utilisateur veut « lancer une rétro »,
  « améliorer la méthode / l'équipe / les règles », capitaliser une friction
  récurrente, « transformer un symptôme en règle mesurable », ajouter un principe
  d'archi / un item de DoD-DoR / une convention, ou faire le point après une PR ou
  un sprint qui a coincé. Déroule une cérémonie en ROUND-ROBIN (2 tours) entre les
  agents de l'équipe (ezk-architect, ezk-qa, ezk-reviewer, ezk-tdd, ezk-pm) qui
  tombent d'accord sur des propositions RATTACHÉES À UN SYMPTÔME et MESURABLES
  (action, feature, spike, ou RÈGLE) — via les agents bindés du profil
  (ezk-architect, ezk-qa, ezk-tdd, ezk-pm) —, les passe à un JUGE DE COHÉRENCE (chief-judge
  / ezk-steward : doublons ? contradictions avec les règles existantes ?), puis
  range SOUS CONTRÔLE DU PO : les non-règles vers ezk-backlog, les règles validées
  vers rules/ · bundles/ · DoD (toujours réversibles). Pilotable par sous-commandes :
  help, run, impose, retire. Le PO garde la main — AUCUNE auto-application. N'EST
  PAS l'auto-amélioration MESURÉE qui se déclenche sur des chiffres (ça, c'est le
  contrat d'améliorabilité, Sujet B / ADR-030) ; n'est pas ezk-sprint ni
  ezk-backlog — il les COMPOSE.
---

# ezk-retro

Tu tiens la **cérémonie d'auto-amélioration de la méthode** (Sujet A). L'humain la
**déclenche quand il veut** ; une **équipe d'agents** débat en **round-robin** et tombe
d'accord sur des améliorations **rattachées à un symptôme** et **mesurables** ; un **juge**
vérifie la cohérence avec les règles existantes ; le **PO garde la main** sur ce qui est
rangé (et peut en retirer). C'est le pendant *déclenché-par-l'humain* de l'auto-amélioration
**mesurée** (Sujet B, le contrat d'améliorabilité — ADR-030, qui se déclenche sur des
chiffres). **Ici, c'est l'humain qui décide quand, et le PO qui tranche quoi.**

## Usage (sous-commandes)

`/ezk-retro [sous-commande] [args]` — ou en langage naturel (« lance une rétro sur… »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau + rappelle les règles d'équipe existantes concernées (`rules/`) |
| `run [périmètre]` | **LA cérémonie** : round-robin 2 tours → consensus → propositions typées (symptôme + mesure) → juge de cohérence → rangement sous contrôle PO. Périmètre au choix : une PR, un sprint, une friction ponctuelle, « la méthode en général » |
| `impose "<règle>"` | Le **PO impose** une règle directement (sans cérémonie) — passe **quand même** au juge de cohérence avant rangement |
| `retire <réf-règle>` | **Retire** une règle (réversible : suppression documentée + raison) — le pendant de « construire → prouver → retirer » |

## La cérémonie (le cœur du skill — sous-commande `run`)

Déroule **toujours** ces 5 temps. Les 3 premiers sont les **3 soudures** de la fiche 0063
(déclencheur → propositions → juge) ; les 2 derniers rangent sous contrôle PO.

### 1. Cadrer & rassembler les signaux
- Fixe le **périmètre** (PR, sprint, friction, méthode en général).
- Rassemble les **symptômes observés** : frictions vécues, échecs, retouches manuelles de
  PR, leçons ré-expliquées, points de douleur. **Pas de symptôme → pas de rétro utile** :
  si rien de concret ne remonte, dis-le et rends la main.

### 2. Cérémonie en round-robin (2 tours) — *soudure 1 : le déclencheur*
Réunis les **agents bindés** du profil (`global.yml`) — par défaut `ezk-architect`, `ezk-qa`,
`ezk-tdd`, `ezk-pm`, **spawnés comme sous-agents** (Task/Agent), **un appel par lentille et
par tour** (`ezk-reviewer` rejoindra la liste **quand il sera bindé** — fiche 0031 ; ne le
référence pas tant qu'il n'est pas dans `global.yml`). **Deux tours :**
- **Tour 1 — chacun observe et propose**, indépendamment, à travers sa lentille (archi, QA,
  revue, dev, produit).
- **Tour 2 — chacun réagit** aux propositions des autres → on **converge vers un consensus**
  (on garde ce qui rallie, on écarte ce qui divise sans preuve).
- *Option : tirer l'**ordre** des agents au sort pour couper l'effet d'ancrage du premier qui
  parle (l'ordre est déterministe par défaut — petit ajout).*

### 3. Sortie typée — *soudure 1 (suite) : ce qui sort de la cérémonie*
Chaque proposition retenue est **rattachée à un symptôme** et **porte un critère mesurable**,
et tombe dans **une** catégorie :
- `action` (geste ponctuel) · `feature` (→ fiche backlog) · `spike` (exploration) ·
- **`règle`** — lint, principe d'archi, item de **DoD/DoR**, convention de communication,
  outil de contrôle.

> **Garde-fou dur** : une proposition de type `règle` **sans symptôme OU sans critère
> mesurable est refusée** (on ne range pas une règle qui ne répond pas à un vrai besoin et
> qu'on ne saura pas mesurer). C'est le critère qui rend la règle *retirable* plus tard.

### 4. Juge de cohérence — *soudure 2*
Chaque **règle** candidate passe devant le **juge de cohérence** (compose la fiche
[0008 chief-judge](../../../../features/0113-chief-judge.md) / l'agent `ezk-steward`) :
« cette règle **contredit-elle** une règle existante de `rules/` ? est-ce un **doublon** ? ».
L'avis est **consultatif** — **le PO tranche**. Consigne l'avis (garder la trace).

### 5. Rangement sous contrôle PO — *soudure 3 : le pont*
Rien n'est rangé sans le **feu vert du PO** (aucune auto-application).

**Lisibilité (règle [`documentation-guidelines/human-facing-lisibility`](../../rules/documentation-guidelines/human-facing-lisibility.md))** —
toute restitution au PO (propositions, avis du juge, résumé de rangement) ouvre par un
bloc **« En clair »** (≤ 3 phrases : symptôme vécu → proposition en mots simples → effet
concret). Codes internes (`R1`, `DoR`, jargon inventé) hors ouverture — annexe/glossaire
seulement. On écrit **au PO**, pas entre agents.

Puis le rangement :
- **non-règles** (`action`/`feature`/`spike`) → backlog via `/ezk-backlog add` (avec le
  symptôme et le critère en contexte) ;
- **règles validées** → dans la **structure existante**, jamais un nouveau silo :
  `rules/<catégorie>/<slug>.md` (format maison : front-matter `id / kind / level(MUST|SHOULD)
  / enforcements[]`), rattachées à un `bundle` si besoin, ou intégrées au **DoD/DoR**.
- **réversibilité** : toute règle rangée est **retirable** (`retire`) — suppression documentée
  avec sa raison. Le PO **valide, peut imposer, peut retirer**.

> Frontière ADR-0001 : **le LLM rédige et juge** (cérémonie, propositions, avis de cohérence) ;
> le **rangement suit la structure déterministe** existante. *MVP : la fiche de règle est
> écrite au format `rules/` documenté ci-dessus ; un script de rangement déterministe est un
> durcissement post-MVP.*

## Contrôle direct du PO — `impose` / `retire`

Hors cérémonie, le PO garde la main sur la liste des règles :

- **`impose "<règle>"`** — le PO ajoute une règle **directement** (sans round-robin), mais
  elle passe **quand même** par le **juge de cohérence** (temps 4) puis le **rangement**
  (temps 5). Une règle imposée porte tout de même un **critère mesurable** (sinon on ne saura
  ni la prouver ni la retirer).
- **`retire <réf-règle>`** — retire une règle. **Réversible et tracé** : supprime le fichier
  `rules/<cat>/<slug>.md` (ou l'entrée de `bundle`) et **consigne la raison dans le message de
  commit** (`chore(rules): retire <slug> — <raison>`) ; l'archive git conserve la version
  retirée (réintroduction = décision PO). *Post-MVP : un `rules/CHANGELOG.md` daté si le volume
  le justifie.*

## Ce que le skill compose (il ne réinvente rien)

- **Juge de cohérence** : fiche [0008 chief-judge](../../../../features/0113-chief-judge.md) + agent `ezk-steward`.
- **Stockage des règles** : `rules/<cat>/` + `bundles/` (LA LOI ; 53 règles déjà migrées, fiche `done/0006`).
- **Rangement des non-règles** : skill [`ezk-backlog`](../ezk-backlog/) (`add`).
- **Agents de la cérémonie** : `ezk-architect`, `ezk-qa`, `ezk-reviewer`, `ezk-tdd`, `ezk-pm`.

## Quand l'utiliser / quand NE PAS

- **Utiliser** : rétro de méthode déclenchée par l'humain, post-mortem d'une friction, envie
  de transformer un symptôme récurrent en règle mesurable, faire évoluer le DoD/DoR/les principes.
- **Ne pas utiliser** : l'auto-amélioration **mesurée** qui se déclenche sur des **chiffres**
  (une PR retouchée, un cycle trop long) — ça, c'est le **Sujet B**, le contrat
  d'améliorabilité (ADR-030), pas cette cérémonie. Ni pour dérouler un sprint (`ezk-sprint`)
  ou gérer le backlog (`ezk-backlog`) : `ezk-retro` les **compose**, il ne les remplace pas.

## Garde-fous

- **Le PO garde la main** : aucune auto-application ; toute règle passe par sa validation.
- **Pas de règle sans symptôme + critère mesurable** (refus dur, étape 3).
- **Réversibilité** : une règle est toujours retirable (`retire`), c'est le pendant de
  « construire → prouver → retirer ».
- **Consensus, pas vote majoritaire brut** : on garde ce qui rallie *avec preuve/argument*,
  pas ce qui gagne au nombre.
- **Ne range jamais dans un nouveau silo** : `rules/`, `bundles/`, DoD/DoR ou backlog existants.
