---
id: "20261010153046143"
title: "Brainstorm : la CLI de la méthode est-elle un DSL cohérent et professionnel ? (ezk / mc, toute la surface)"
type: refactor
priority: P2
product: mega-city
milestone: parked
version:
labels: [cli, dsl, dx, ezk]
status: idea
pr:
evidence: none # exploration + CLI, pas d'écran
created: 2026-10-10
blocked: attend-panel — parké hors version par auto-groom le 2026-10-17
---

# 20261010153046143 — La CLI de la méthode est-elle un DSL cohérent et professionnel ?

**En clair.** La CLI de la méthode a grandi par couches, et ça se voit : deux binaires séparés
(`ezk` et `lawgiver`), des commandes bancales (`pnpm lawgiver bind-global global --link` — « global »
deux fois, un `pnpm` au lieu du binaire, c'est long), un nommage pas tranché (`ezk` vs `mc`), et pas
de référence navigable des commandes **et de leurs paramètres**. On veut un **brainstorm cadré** (avec
panel) sur **toute la surface** de la CLI : est-elle un DSL cohérent, découvrable, professionnel ? Il
produit des **décisions** (ADR), pas du code tout de suite.

**Si tu arrives frais.** Un *DSL* ici = le « langage » des commandes (verbes, noms, options) qu'un
humain tape. `ezk` est le binaire de la méthode, lié globalement ; `lawgiver` est un **second** CLI
(déploiement de la loi) resté à part, appelé via `pnpm`. La *loi* = les règles compilées déployées
chez les agents (`~/.claude`).

## Contexte / Problème

Demande PO du 2026-10-10, en marge du déploiement des règles de la rétro. Symptômes concrets relevés :

- **Deux CLI au lieu d'un.** Déployer la loi passe par `pnpm lawgiver bind-global …`, pas par `ezk` :
  `lawgiver` (`bin/lawgiver.ts`) est un binaire distinct de `ezk` (`bin/ezk.ts`), et il n'est **pas
  lié globalement** — d'où le `pnpm` devant. La migration est **à moitié faite** : `ezk law doctor`
  existe déjà, mais `bind`/`bind-global` sont restés chez `lawgiver`.
- **La portée est cuite dans le nom.** `bind-global global` dit « global » deux fois : une fois dans
  la sous-commande (`bind-global`), une fois dans le profil passé en argument. La portée devrait être
  un **argument ou un flag**, pas un morceau du nom de commande. Cible proposée par le PO :
  `ezk law bind global --link`.
- **Pas de portée « version / sprint cible » au lancement** (besoin PO 2026-10-16). On ne peut pas dire
  à `ezk-sprint` / `ezk-product-build` « travaille CETTE version / CE sprint » par un flag uniforme
  (`--version <v>` / `--sprint <s>`) : le périmètre se **déduit** aujourd'hui (ADR-0070). Une instance
  est déjà fichée pour le groom
  ([groomer une version en une passe](done/20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md)),
  et le [checkpoint de version](done/20261015125606808_frontiere-version-checkpoint-run-autonome.md) en a
  besoin à l'entrée (ADR-0080). À trancher ici comme une **grammaire de portée uniforme** (point 2 de la
  Proposition), pas commande par commande — puis sortir une fiche fille si le besoin dépasse le groom.
- **Verbosité / valeurs par défaut.** `--link`, le profil `global` : lesquels sont des défauts ?
- **Nommage `ezk` vs `mc`.** Non tranché — cf. fiche
  [renommer ezk vers mc](20260904074824499_renommer-ezk-vers-mc.md) (idea).
- **Vocabulaire `next` / `list` ≠ verbes CLI réels.** La doc humaine et le SKILL.md d'`ezk-backlog`
  parlent encore de `next --ready-only` / `next --lot` / `list`, alors que le CLI n'a **ni `next` ni
  `list`** : les verbes réels sont `plan-head` / `plan-lot` / `plan-order`. Le mot « next » a même été
  retiré volontairement à la refonte du tirage (périmètre de version, ADR-0070). À trancher au panel :
  faut-il exposer un verbe humain `next` (« montre la suite, pas tout le stock »), ou **aligner la doc**
  sur `plan head` / `plan lot` et abandonner `next`/`list` en surface ? *(Absorbe la question de
  nommage de la fiche « next nu montre la suite », 20261009104436287, supersedée le 2026-10-11 : sa
  prémisse — « `next` nu = alias de `list` » — décrivait un état antérieur à la refonte.)*
- **Découvrabilité.** Pas de référence des commandes **et de leurs paramètres** dans le board.
  `ezk:help` existe (index des commandes) et la carte montre déjà les outils, mais sans les
  paramètres ni une vue navigable depuis le tableau de bord.
- **Ergonomie multi-projets.** Plusieurs commandes refusent `--root` depuis un projet hôte, cf. fiche
  [outils de la méthode depuis un projet hôte](done/20261004083344960_outils-methode-depuis-projet-hote.md).
- **Publication.** cf. fiche [CLI ezk complet publié](20260903134908019_cli-ezk-complet-publie.md)
  (idea).

## Proposition

Un **brainstorm cadré** (produit + architecte + panel adverse, méthode `ezk-retro`/panel) sur **toute
la surface** de la CLI, avant tout code. Il tranche au moins :

1. **Un seul CLI** : rapatrier `lawgiver` (bind/bind-global/status/doctor) sous `ezk law …`, binaire
   lié globalement — plus de `pnpm` pour un geste courant.
2. **Grammaire du DSL** : noms vs verbes, portée en **argument/flag** (pas dans le nom), défauts
   sensés (`--link`, profil). Viser court et prévisible (`ezk law bind [global] [--link]`).
3. **Nommage** : `ezk` ou `mc` (alias ?), tranché une bonne fois (absorbe la fiche renommage).
4. **Découvrabilité** : commandes **+ paramètres** dans le board et/ou `ezk:help`, vue navigable.
5. **Cohérence multi-projets** : `--root` uniforme (lien avec la fiche outils-depuis-hôte).

Le brainstorm **pose des décisions** (un ou plusieurs ADR), puis un **plan de refonte** découpé en
fiches. Il ne ré-écrit pas la CLI dans cette fiche.

## Déjà tranché par le PO (2026-10-10)

Deux points sont **déjà décidés** — le panel les entérine, il ne les re-débat pas :

- **`dashboard` + `map` → `board`.** On supprime `dashboard` et `map` **sans dépréciation** (produit
  sous contrôle du PO). Cible : `board show` (le texte, existant), `board open` (le web, ex-`dashboard`),
  `board stop`. `board stop` est du **code neuf** (suivre le serveur pour l'arrêter) → fiche fille.
- **« run » n'est pas un mot du domaine.** `run` est du jargon technique générique (comme *job*, *task*).
  Le concept réel = une **exécution autonome de `product-build`**. À trancher au panel : le **renommer**
  dans le vocabulaire de la méthode, ou **ranger** `run context` / `run report` sous le domaine qui gère
  déjà les runs (`supervision`) — ce qui résorbe le chevauchement des trois « report » (`run report`,
  `sprint report`, `supervision analyze`).

## Matière : revue du CLI (2026-10-10)

Versée en grooming, avant le panel. Alimente surtout la **question 2 (grammaire du DSL)**.

Le CLI suit déjà le bon modèle `ezk <nom> <verbe>` (façon `docker`/`gh`). Trois défauts cassent la
cohérence : des domaines en double (board/dashboard/map), des **verbes au tiret**, des **domaines sans
verbe**. **Garde-fou** : les **flags longs en kebab-case** (`--ready-only`, `--dry-run`) sont le
**standard** — on n'y touche pas. Tiret **interdit** dans un nom de commande, **obligatoire** dans un
flag long.

**Convention cible, 4 règles :**
1. `ezk <nom> <verbe> [args] [--flags]`, toujours.
2. Nom de commande : un mot, minuscule, zéro tiret ; un groupe s'**imbrique** (`supervision registry
   add`), ne se **colle** pas (`registry-add`).
3. Flags longs : kebab-case, comme partout.
4. Un concept = un domaine.

**Changements (actuel → cible) :**

| Aujourd'hui | Cible | Pourquoi |
|---|---|---|
| `dashboard`, `map` | `board open` / `board stop` | un seul domaine « board » (tranché) |
| `supervision registry-add` | `supervision registry add` | objet + verbe imbriqués |
| `pr emit-local` | `pr emit --local` | une variante = un flag |
| `pr check-body` | `pr check` | objet implicite |
| `backlog plan-head/lot/order` | `backlog plan head/lot/order` | sous-objet `plan` |
| `docs check-links/check-adr-ids` | `docs check links/adr` | verbe `check` + objet |
| `config`, `sessions` (nus) | `config show`, `sessions show` | tout est nom+verbe |
| `backlog portfolio` | `views …` | portfolio est une vue |
| `run context/report` | voir « Déjà tranché » | « run » hors vocabulaire |
| `--ready-only`, `--dry-run` | **inchangés** | kebab-case = standard |

## Critères d'acceptation

- [ ] Un brainstorm cadré a eu lieu (panel), avec une **capture** des options et des arbitrages.
- [ ] Les 5 questions ci-dessus sont **tranchées** (ou explicitement différées, avec raison), dans
      un ou plusieurs **ADR**.
- [ ] Un **plan de refonte** découpé en fiches filles (par même milestone/version, sans fiche-parapluie)
      sort du brainstorm.
- [ ] Les fiches existantes « renommer ezk→mc », « cli ezk publié » et le résidu de « next nu montre
      la suite » (vocabulaire `next`/`list` vs `plan head/lot`) sont **absorbés ou reliés**, pas
      laissés en doublon.

## Comment vérifier

Relecture : après le brainstorm, la capture et le(s) ADR existent, et le backlog porte les fiches
filles de refonte reliées par milestone/version (pas de fiche-parapluie — doctrine « une story = une
fiche »).

## Notes

Cadrage **large** demandé par le PO (« vois plus large que mega-city ») : la CLI est la **face
publique** de la méthode, utilisée depuis vectorz **et** depuis tout projet hôte (samplerz, muti,
cop1…). Le brainstorm juge l'ergonomie **de bout en bout**, pas un repli technique de `lawgiver`.
Priorité P2 **provisoire** — à confirmer au grooming / à l'ouverture du brainstorm. Rattachement
possible au thème « ranger la maison » (rationalisation, train V0.9), à trancher.

Grooming 2026-10-10 (session du PO) : décisions `dashboard`/`map` et « run » actées, et la **revue du
CLI** versée comme matière (voir sections ci-dessus). Le **panel complet** (ADR + plan de refonte) reste
à tenir en session dédiée.

**Grooming 2026-10-15 (audit adverse du découpage).** L'audit **renforce** plusieurs points de ce
brainstorm : « run » hors vocabulaire (et le chevauchement des trois « report »), les verbes au tiret,
`dashboard`/`map` → `board`. Il nomme surtout une dimension **sœur mais distincte** que ce brainstorm
ne couvre pas : la **surface CLI** est une chose, le **modèle de process** en est une autre. « Où en
est une fiche / un sprint / une version, et quoi ensuite » est ré-écrit à **8 endroits** (statut
`fiche-schema.ts`, position `process-data.ts`, cycle `cycle.ts`, cérémonies `ceremonies.yml`, moments
`moments.yml`, boucle de sprint en prose, éligibilité, « et maintenant »), reliés par de la **prose**,
et **exclu du graphe compilé** (`src/core/graph.ts` : `NodeKind` sans `state`/`step`/`moment`). Angle
proposé au panel : étendre le graphe compilé à la dimension process (nœuds `state`/`step`/`moment`,
**validés** comme le catalogue l'est), **source unique** dont les 8 vues ne sont plus que des
**projections** — le jugement (groom, revue, rétro) restant en markdown. À décider : même panel
(cohérence de la méthode, surface **et** modèle), ou fiche/ADR distincts. Source : rapport d'audit du
découpage, 2026-10-15.
