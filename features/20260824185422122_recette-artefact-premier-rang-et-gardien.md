---
id: "20260824185422122"
title: « Recette » comme artefact de premier rang + gardien (ezk-cuisinier) — instancier le pattern steward, ne rien inventer
type: feature
priority: P2 # posée par défaut — PO à confirmer au grooming (P1 si construction prochaine session)
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-24
---

## En clair

Tu veux **capitaliser** ce que tu fais et réutilises dans tes projets, sous forme de
**recettes**. Décision prise : la recette est un **artefact de premier rang**, et le
**« livre de recettes »** est son **index**. Un **gardien** (façon `iamthelaw`) veille à ce
que les recettes soient correctement inscrites.

La bonne nouvelle : **ce n'est pas un nouveau pattern.** C'est l'assemblage de **trois
mécanismes que tu as déjà** — un artefact + son index (comme le backlog), des rules +
`enforcements:`, et un rôle gardien (comme `ezk-steward` pour les skills). Rien à inventer.
Tout à **instancier**.

Ce sujet est de l'**outillage de capitalisation**, **hors méthode scrum** (proche dev / archi).

## Le pattern (la découverte)

`ezk-steward` est au catalogue de skills ce que **« ezk-cuisinier »** serait aux recettes :
un gardien qui vérifie qu'un artefact d'une **famille** est bien formé.

Le méta-pattern, déjà présent trois fois dans ton système :

- une **famille d'artefacts + un index régénéré** — le backlog (fiches + `BACKLOG.md`) ;
- des **rules** (`rules/`, MAY/SHOULD/MUST) reliées à qui les vérifie (`enforcements:`) ;
- un **rôle gardien** — `ezk-steward` (skills), `ezk-reviewer` (code), `iamthelaw` (LA LOI).

« Recette » ne fait que **réinstancier ce trio** pour une nouvelle famille. C'est ce qui
dé-risque tout : pas de concept neuf gratuit (doctrine respectée).

## Les décisions d'archi

### D1 — Format de l'artefact recette + du livre

- **La recette = une fiche markdown** (front-matter + corps), dans son propre dossier
  (`recipes/` à trancher). Champs pressentis :
  - ce qu'elle **fabrique** ;
  - la **liste de tâches** (le playbook) ;
  - les **rules qu'elle compose** (`composes:`) ;
  - le **profil** référencé ;
  - un **pointeur vers un exemple réel** (`fichier:ligne`) — **jamais le code copié**
    (doctrine [ADR-0013](../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md), « entonnoir, jamais fabrique ») ;
  - **statut** + **provenance**.
- **Le livre de recettes = un index régénéré par script** (comme `BACKLOG.md` via `regen`).
  **Le LLM ne range jamais** (ADR-0001) : le script écrit l'index.

### D2 — Le gardien (ezk-cuisinier)

Instance du pattern steward. Deux formes, à trancher au grooming :

- **(a)** un **rôle distinct** « ezk-cuisinier » — responsabilité unique : les recettes ;
- **(b)** **étendre `ezk-steward`** (qui garde déjà le catalogue) aux recettes.

Ses **rules ne sont pas informatiques** : « une recette pointe vers un exemple réel »,
« elle liste des tâches + compose des rules + référence un profil », « jamais de code
stocké ». Elles forment un **bundle « recette bien formée »**, relié au gardien via
`enforcements:` (même idiome que `pr-before-after-media` → `ezk-reviewer`).

**Inclinaison** : un rôle **mince**, tranché au grooming. Ne pas dupliquer `ezk-steward`
sans raison ; le nom « cuisinier » est OK s'il porte une responsabilité claire et distincte.

### D3 — Placement dans la carte (4 bandes, ADR-0020)

Ça résout le « je ne sais pas où placer ça ». **La carte classe des skills, pas des données.**

- **L'artefact recette = de la donnée** (comme les fiches) → **pas dans une bande**.
- **Le producteur** (ezk-ezk recipy / ezk-recipy) → bande **Outillage** (« avec quoi »).
- **Le gardien** (ezk-cuisinier / ezk-steward étendu) → bande **Rôles** (« qui juge »).

Le mécanisme s'étale donc sur **2 bandes + 1 type de donnée**. Cohérent avec « hors méthode
scrum ».

### D4 — Frontière avec l'existant (anti-doublon)

Cette fiche définit **l'OBJET** (format recette + livre + gardien). Les autres fiches
**produisent** ou **consomment** :

- **session courante** → `ezk-ezk harvest` ;
- **feature désignée** → `ezk-ezk recipy`/`extract` ([fiche 794](20260824122629794_ezk-extract-capitaliser-feature-en-recette.md)) ;
- **repos froids** → `ezk-recipy` ([fiche 0147](0147-ezk-recipy-mvp.md)) ;
- **cas d'usage** : `ezk-cowork` ([fiche 0155](0155-ezk-cowork-scaffold-audit-contrat-cowork.md)) et
  [recette-site 540](20260821172716540_recette-site-produit-regles-activables.md).

Pas de doublon : eux produisent/consomment, **celle-ci définit**.

## L'alternative écartée

**Option B — « recette = juste un skill dont le playbook est la liste de tâches »** (ta
doctrine actuelle, fiche 794). Écartée : la recette est de la **donnée réutilisable
transverse** (un exemple pointé, des tâches, des rules), pas un outil. La traiter comme un
skill mélange l'outil et son produit. Et le pattern steward existe déjà pour garder une
famille d'artefacts-données.

**Risque de A à surveiller** : un type d'artefact neuf a un coût. **Antidote** : réutiliser
au maximum la mécanique backlog (fiche + index + `regen`) plutôt que d'en réinventer une.

## Débat ouvert — où vit une recette ? (central vs projet)

**La tension** (soulevée le 2026-08-24). Une recette doit-elle vivre dans un dépôt central
(`vectorz/recipes/`) ou **dans le projet qui la développe** ?

- **Pour le central** : une seule bibliothèque, découvrable, réutilisable entre projets.
- **Pour le projet** : cohérence avec le **contrat cowork lui-même** — le guide vit **dans l'app**,
  pas dans un dépôt central. Par le même raisonnement, une recette née dans un projet pourrait y rester.

**Les deux coexistent déjà, ce qui prouve la tension** :
- `vectorz/recipes/plan-distribution-app.md` décrit **samplerz** mais vit dans **vectorz**.
- `pasteriz/recipy/cowork-project.md` vit **dans pasteriz**.

**Position actuelle du PO** : « pour le moment, dans `vectorz/recipes/` » — à revisiter au grooming.
Piste : une recette pourrait **naître dans son projet** (près du code qu'elle décrit) et être
**indexée** centralement (le « livre de recettes » pointe, ne copie pas). À trancher avec le format (D1).

## Questions ouvertes (grooming)

- [ ] Gardien : **rôle distinct `ezk-cuisinier`** vs **extension `ezk-steward`** ?
- [ ] **Format exact** des champs de la fiche recette + du livre/index + dossier (`recipes/` ?).
- [ ] Producteur : **`ezk-ezk recipy`** (sous-commande) vs **`ezk-recipy`** (skill) — « à méditer » (PO).
- [ ] Le **bundle de rules** « recette bien formée » + son `enforcements:`.
- [ ] **Gate ADR-0013** : PO le déclare non bloquant (« je sais anticiper ») — finir de le neutraliser au build.
- [ ] Sous-commandes **multi-niveaux** (`ezk-ezk recipy add`) : nouvelle grammaire à valider (aujourd'hui tout est plat) — ne l'introduire que si une **famille** de verbes le justifie.
- [ ] **Où vit une recette** : central (`vectorz/recipes/`) vs projet qui la développe — voir le débat ci-dessus. Position actuelle : central, provisoire.
- [ ] **Élicitation par auth forte** : recette capturée (`vectorz/recipes/elicitation-authentification-forte.md`) — source `google-mcp-multi-account` (ADR-0001/0005). À relier au gardien et au geste sensible de pasteriz.

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Décision tranchée : format recette (champs) + livre/index + placement carte.
- [ ] Gardien décidé (rôle distinct vs steward étendu) avec responsabilité unique.
- [ ] Bundle de rules « recette bien formée » relié au gardien via `enforcements:`.
- [ ] **Zéro code stocké** dans une recette (pointeur vers exemple réel — ADR-0013).
- [ ] Frontière écrite avec 794 / 0147 / 0155 / 540 (aucun doublon).

## Comment reprendre (prompt à relancer)

```
Ouvre la fiche vectorz features/20260824185422122_recette-artefact-premier-rang-et-gardien.md.
Elle capture la décision d'archi « recette = artefact de premier rang + gardien (ezk-cuisinier),
instance du pattern steward — rien à inventer ». Groome-la : tranche les questions ouvertes
(gardien distinct vs ezk-steward étendu ; format exact des champs recette + livre/index + dossier ;
producteur ezk-ezk recipy vs ezk-recipy), puis propose le plan de construction. Ne construis pas
sans mon ok. Respecte la doctrine : skill/rôle mince, une responsabilité, le LLM ne range jamais
(script — ADR-0001), pas de concept neuf gratuit, gate ADR-0013 non bloquant.
```

## Lignée / références

- Doctrine cowork : ADR-0015 (« contrat cowork »).
- Doctrine recipy : [ADR-0013](../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) (entonnoir, jamais fabrique).
- Nommage / carte 4 bandes : ADR-0020.
- Frontière déterministe : ADR-0001 (le LLM ne range jamais).
- Producteurs & cas : fiches 794, 0147, 0155, 540.
- Gardiens existants (le pattern) : `ezk-steward`, `ezk-reviewer`, `iamthelaw`.
- Origine : session du 2026-08-24 (brainstorm pasteriz → le pattern cowork a fait émerger le besoin d'un objet « recette »).
