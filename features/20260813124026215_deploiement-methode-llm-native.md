---
id: "20260813124026215"
title: Déployer (et retirer) la méthode ezk LLM-native dans un projet cible — épic de cadrage (à la bmad)
type: epic
product: mega-city
priority: P1
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-10
---

# 20260813124026215 — Déploiement d'une méthode LLM-native dans un projet (épic de cadrage)

> **Épic de cadrage, pas une implémentation.** Cette fiche **relie** un archipel de
> fiches existantes en une seule vision, ajoute l'angle qui leur manque, et **prescrit un
> grooming à fond** (panel multi-agents). Elle ne remplace aucune fiche — elle les
> chapeaute. Voir **Anti-doublon** en fin.

## Pourquoi cette fiche — le déclencheur concret

Sur le projet **`google-mcp-multi-account`** (un consommateur de la méthode), trois PR de
brouillon coexistaient avec des descriptions de **formats différents** : deux en texte
libre (#82, #84), une seule suivant le template (#86) — et cette dernière était
**illisible** pour qui découvre le projet (jargon interne, renvois à un autre repo sans
explication). Il a fallu **reformuler la description à la main**.

Le constat de l'utilisateur : *« mes sessions ne passent pas toutes par les commandes
ezk »*. C'est la racine. La méthode existe (skills `ezk-*`), mais **rien ne la fixe dans le
projet** : chaque session est libre de l'appliquer ou non. La convention de PR n'est donc
pas tenue de façon **systématique**.

## Le problème

Aujourd'hui, on peut **utiliser** la méthode (skills globaux, invoqués à la main). Mais on
ne peut pas la **déployer dans un projet** pour qu'elle s'applique **à chaque session, quel
que soit le pilote** (autre skill, autre harness, autre LLM). Il manque un **point
d'ancrage projet** stable que tout agent soit tenu de lire — et un moyen propre de
l'**installer** puis de le **retirer**.

Conséquence directe : les conventions (format de PR, discipline de commits, backlog comme
source de vérité…) sont appliquées **au petit bonheur**.

## Ce qui existe déjà — cette fiche ne réinvente rien, elle unifie

| Fiche / doc | Ce qu'elle couvre | Ce qui manque encore |
|---|---|---|
| [0170](0170-modele-extension-plugin-mega-city.md) (P1) | **Modèle d'extension / plugin** mega-city : ADR + panel architecte, réf. **BMAD overlay** + **plugin Claude Code officiel** | La vision produit qui **motive** et **priorise** l'ADR |
| [0087](0087-plugin-claude-code-distribution.md) | **Distribuer** le catalogue de skills en plugin Claude Code | Le lien avec l'ancrage **par projet** (pas que la distribution globale) |
| [0177](0177-pack-pratiques-projet-portables.md) (P2) | **Pack de pratiques projet portable** : lien indirect README → répertoire déporté versionné, lu par **tout** LLM | Le **cycle install / retrait** + le **plugin GitHub** + le **monitoring** |
| [0172](0172-convention-sot-backlog-md.md) | **Backlog markdown = source de vérité**, GitHub = export | Le raccord avec la **description de PR** |
| [0171](0171-adapter-github-issues-push-only.md) · [0174](0174-ezk-issues-intake-github.md) | **Adaptateur GitHub** (Issues push-only, intake) | Le **template de PR** déployé qui pointe vers la fiche markdown |
| [ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md) · [0162](0162-bmad-contrat-supervisabilite.md) · [0154](done/0154-kit-emetteur-supervisabilite.md) | **Monitoring / supervision** branché en **sidecar** (cas BMAD) + kit émetteur | Le **déploiement du monitoring comme plugin** par le même installeur |

**Le trou** que cette fiche comble : personne ne relie ces pièces en **un seul cycle de
déploiement** « installe la méthode dans le projet / retire-la », avec la **convention de
PR** comme premier livrable visible, et le **monitoring** comme plugin du même mécanisme.

## La vision à groomer

### A. Installer / désinstaller, façon bmad (opt-in / opt-out)

- On peut **utiliser** la méthode **sans la déployer** (skills globaux, à la main).
- On peut la **déployer dans le projet** : elle s'applique alors **tout le temps**.
- On peut la **retirer** proprement (empreinte traçable, désinstallation nette).
- Modèle mental : un **`init`** qui écrit des fichiers dans le projet, un **`remove`** qui
  les enlève — comme l'installation d'un module bmad.

### B. Empreinte minimale sur `CLAUDE.md`

- `CLAUDE.md` ne reçoit qu'un **lien indirect** : « la méthode de ce projet est décrite ici
  → `<répertoire déporté>` ». Rien de plus. On touche `CLAUDE.md` **le moins possible**.
- Le **vrai point d'entrée** est un fichier **fourni par la méthode** (`LLM.md` /
  `README.md`) qui vit dans le répertoire déporté (`.mega-city/` ? `.ezk/` ? `.methode/` —
  à trancher, cf. 0177). Ce fichier gouverne les pratiques du projet.
- C'est exactement la direction de [0177](0177-pack-pratiques-projet-portables.md) ; cette fiche en fait le **cœur d'un
  installeur**, pas juste un pattern isolé.
- **⚠️ Question ouverte — découvrabilité hors Claude (à trancher au grooming).** L'objectif
  affiché (§ *Le problème*) est que la méthode s'applique **quel que soit le pilote** ; or une
  ancre uniquement dans `CLAUDE.md` n'est **pas lue** par un harness non-Claude, qui ne
  découvrirait donc pas le point d'entrée déporté. Trois pistes à arbitrer : **(a)** restreindre
  explicitement le périmètre à Claude (et amender le § *Le problème*) ; **(b)** garder l'ancre
  **générique projet-README** de [0177](0177-pack-pratiques-projet-portables.md) ; **(c)** faire générer par l'`init`
  le **fichier d'instructions natif de chaque harness supporté**. *(Tension relevée par la
  revue Codex — cf. critères d'acceptation.)*

### C. Un système de plugins (addons activables)

- La méthode de base + des **plugins** optionnels qu'on active par projet.
- Deux plugins nommés dès maintenant : **GitHub** (§D) et **Monitoring** (§E).
- Sujet déjà ouvert par [0170](0170-modele-extension-plugin-mega-city.md) — qui doit produire l'ADR du modèle
  d'extension **avant** tout code d'adaptateur.

### D. La description de PR = une convention OUVERTE

- Le format de description de PR doit être une **convention réutilisable**, **pas fermée à
  mega-city**. Un autre outil doit pouvoir l'adopter.
- mega-city **génère la fiche markdown** qui décrit la feature branch en cours (le *quoi* et
  le *pourquoi*).
- Si le **plugin GitHub est activé**, l'installeur déploie un
  **`.github/PULL_REQUEST_TEMPLATE.md`** dans le projet. Ce template **pointe vers la fiche
  markdown** de la feature — la description de PR devient le **reflet** de la fiche, pas un
  texte réécrit à la main.
- S'appuie sur [0172](0172-convention-sot-backlog-md.md) (fiche = source de vérité), [0171](0171-adapter-github-issues-push-only.md)
  (adaptateur GitHub) et la convention [`docs/PR_VALIDATION.md`](../docs/PR_VALIDATION.md) déjà en place.

### E. Le monitoring comme plugin déployable

- Le **même installeur** doit pouvoir déployer le **kit de supervision** dans un projet.
- La mécanique existe déjà : **sidecar** qui injecte les consignes d'émission dans les
  prises de la méthode ([ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md),
  [brancher une méthode](../docs/brancher-une-methode-existante.md), kit émetteur
  [0154](done/0154-kit-emetteur-supervisabilite.md), cas BMAD [0162](0162-bmad-contrat-supervisabilite.md)).
- Ici : en faire un **plugin de l'installeur**, activable par projet, au même titre que
  GitHub.

## À étudier en priorité — le fork BMAD

L'utilisateur possède un fork : **`elzinko/BMAD-METHOD`**. ⚠️ Le tree `_bmad/` **n'est pas
vendoré dans ce repo** : il est gitignoré (`.gitignore` : « Epoch-1 BMAD trees — history on
tag `epoch-1-bmad-final`; not part of dogfood ») et n'existe que sur le tag archivé
**`epoch-1-bmad-final`**. Pour l'étude, se référer au **fork** ou à ce **tag**, pas à l'arbre
courant. Avant de concevoir notre installeur, **étudier comment bmad installe des modules /
expansion packs en mode LLM** :

- ses **prises officielles** (`_bmad/_config/agents/*.customize.yaml` : *critical actions*,
  memories, menu… — à lire dans le **fork** / le tag `epoch-1-bmad-final`) ;
- son mécanisme de **modules installables** / overlay ;
- l'échelle **adaptateur → overlay → fork jetable** (déjà notée en [0162](0162-bmad-contrat-supervisabilite.md)).

Objectif : **reprendre le mécanisme d'installation LLM-native de bmad** (répertoires,
overlay, config), en **écartant** ce qui ne colle pas à mega-city. **Ne pas copier** — cf.
la consigne du panel de [0170](0170-modele-extension-plugin-mega-city.md), qui cite déjà bmad **et** le plugin
Claude Code officiel comme références.

## Critères d'acceptation (cadrage — le « à groomer à fond »)

- [ ] **Grooming multi-agents tenu** (voir méthode ci-dessous) : décision sur le périmètre
      et le découpage en fiches enfants.
- [ ] **Archipel consolidé** : dire, pour 0170 / 0087 / 0177 / 0172 / 0171 / 0174, ce que
      cet épic **absorbe**, **coordonne**, ou **laisse tel quel** — sans les dupliquer.
- [ ] **Étude bmad écrite** : comment il installe des modules LLM-native ; ce qu'on reprend /
      écarte pour notre installeur.
- [ ] **ADR(s)** : (1) le modèle d'extension / plugin (peut être porté par 0170) ; (2) le
      cycle `init` / `remove` + l'empreinte projet (répertoire déporté, lien `CLAUDE.md`).
- [ ] **Convention PR ouverte** spécifiée : où vit le format, comment un outil tiers
      l'adopte, comment le template GitHub pointe vers la fiche markdown.
- [ ] **Monitoring-as-plugin** cadré : le kit ([0154](done/0154-kit-emetteur-supervisabilite.md) /
      [ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md)) devient un plugin de l'installeur.
- [ ] **Frontières écrites** : distribution globale ([0087](0087-plugin-claude-code-distribution.md)) vs ancrage par
      projet (cette fiche) vs store agnostique ([0093](0093-backlogstore-port-agnostique.md), **YAGNI** jusqu'au trigger).
- [ ] **Découvrabilité hors Claude tranchée** (cf. §B) : soit périmètre **Claude-only**
      assumé (et § *Le problème* aligné), soit ancrage **lu par tout harness** — ancre
      projet-README ([0177](0177-pack-pratiques-projet-portables.md)) et/ou fichier d'instructions natif par harness.
- [ ] **MVP identifié** : le plus petit `init` utile (hypothèse : plugin GitHub =
      `.github/PULL_REQUEST_TEMPLATE.md` + lien `CLAUDE.md` + point d'entrée méthode).

## Méthode de grooming prescrite

Sujet **central au produit** → grooming **à fond**, avec un **panel multi-agents** :

- **`ezk-architect`** — le modèle d'extension, le cycle install / remove, l'empreinte projet
  (réutiliser le pattern **panel adverse + juge** qui a durci [ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md)).
- **`ezk-pm`** — périmètre, découpage en fiches enfants, priorité, MVP, ce qu'on parque.
- **dev / QA** (`ezk-dev` / `ezk-qa`) — faisabilité de l'installeur, scénario cobaye « skill
  A puis skill B sur le même projet → mêmes pratiques lues » (repris de [0177](0177-pack-pratiques-projet-portables.md)).

## Anti-doublon (par intention)

*Pas* un remplacement — un **chapeau**. Distinctions :

- [0170](0170-modele-extension-plugin-mega-city.md) produit **l'ADR technique** du modèle de plugin ; ici = la **vision
  produit** qui le motive, le priorise et le relie au reste. 0170 reste la fiche qui grave la
  décision d'extension.
- [0177](0177-pack-pratiques-projet-portables.md) définit **le pack de pratiques portable** (le *quoi* déposé) ; ici = **le
  cycle qui l'installe / le retire** et les **plugins** autour.
- [0087](0087-plugin-claude-code-distribution.md) = **distribution globale** de la méthode ; ici = **ancrage par
  projet**. Frontière à graver (critère ci-dessus).
- [0172](0172-convention-sot-backlog-md.md) / [0171](0171-adapter-github-issues-push-only.md) / [0174](0174-ezk-issues-intake-github.md) = briques GitHub / backlog ;
  ici = **le plugin qui les déploie** + la **convention PR ouverte** au-dessus.
- [ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md) / [0162](0162-bmad-contrat-supervisabilite.md) /
  [0154](done/0154-kit-emetteur-supervisabilite.md) = **monitoring** déjà conçu ; ici = **le rendre déployable comme
  plugin** du même installeur.

## Notes / décisions

- **Id horodaté `20260813124026215`** (schéma `AAAAMMDDHHMMSSmmm`, fiche 0180) : re-minté
  au traitement de la PR car l'id provisoire `0186` (schéma legacy `max+1`) collisionnait
  avec `0186-skema-versioning-migrations-skills-deployees` déjà sur `main`. Index régénéré à
  l'outil, jamais édité à la main ([`PR_VALIDATION`](../docs/PR_VALIDATION.md) §6).
- `product: mega-city` (méthode). Le monitoring (cop1) est **référencé**, pas dupliqué.
- **`status: idea`** : exploration / cadrage. Panel + grooming **avant** `ready`.
- Déclencheur tracé côté consommateur : PR #82 / #84 / #86 de `google-mcp-multi-account`
  (la #86 a servi de cas de reformulation manuelle).
