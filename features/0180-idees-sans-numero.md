---
id: 0180
title: Fiches datées — id AAAAMMDDHHMMSSmmm (17 ch., ms, UTC) à la capture, fin de max+1
type: feature
priority: P2
product: vectorz
status: idea
ready:
pr:
created: 2026-08-01
---

# 0180 — Fiches datées : id = timestamp à la capture

## Contexte / Problème

**Surface monorepo** : `product: vectorz` — la fiche vit dans le backlog
`features/` du monorepo (convention lifecycle / ownership des fiches).
**Implémentation** : le comportement change dans la skill `ezk-backlog`
(owner mega-city / claude-skills), pas dans un autre produit applicatif.

Aujourd'hui toute capture (`ezk-backlog add`, même en `status: idea`) **brûle un id
numérique** (`max+1`, 4 chiffres). Conséquences :

1. **Pollution de séquence** — des idées jamais groomées occupent des numéros ; les
   trous et les « faux » ids rendent la lecture du backlog plus bruyante (le numéro
   suggère une fiche actionnable alors que ce n'est qu'une icebox).
2. **Course à l'assignation** — plusieurs sprints / worktrees / processus calculent
   `max+1` en parallèle (déjà constaté dans [0102](0102-ezk-testbed-brique-boot-env-test.md))
   et peuvent coller le même id, ou en brûler plusieurs inutilement.

Besoin : un id **généré localement, sans coordination**, qui ne collisionne pas
quand plusieurs sessions/worktrees d'un **même** projet créent des fiches en
parallèle — le préfixe projet (`mc-`, `cop1-`) ne suffit donc pas.

**Symptôme daté — 2026-08-10.** Collision `0073` entre PR #82 et #86 (deux sujets
distincts, chacune ayant fait `max+1` sur sa vue de `main`) ; arbitrée à la main
(#82 garde `0073` — réservé en premier, id présent jusque dans sa branche ; #86 →
`0075`). Même motif déjà vu : 0064, la course `max+1` de
[0102](0102-ezk-testbed-brique-boot-env-test.md), et les ids 0168–0172 « réservés
par une autre branche » ([0173](done/0173-ezk-methode-trois-bandes-naming.md)).

## Décision (2026-08-10)

**L'id EST un horodatage `AAAAMMDDHHMMSSmmm` (17 chiffres, à la milliseconde, en UTC),
généré localement à la capture.** On supprime `max+1`. Un timestamp se génère **sans voir les autres branches** → plus
de coordination, plus de mint tardif, plus de verrou. Le slug parlant reste la
**poignée humaine** (« la fiche `archive-croise` ») ; le timestamp est la
**plomberie** qui trie et désambiguïse, jamais prononcée.

Ce que ça change vraiment : on passe d'une **collision certaine** — `max+1` sur deux
branches parties du même `main` collisionne même à des heures d'écart — à une
**collision seulement en cas de même milliseconde** (17 chiffres), cas négligeable et sans cascade.

## Format

- **Nom de fichier** : `AAAAMMDDHHMMSSmmm_slug-parlant.md`. L'underscore sépare
  id ↔ slug ; les tirets vivent **dans** le slug → split trivial (`cut -d_ -f1`),
  et on reste aligné sur les branches `feat/<id>-slug` en tirets (ADR-0018).
- **Front-matter `id:`** = le timestamp complet, **entre guillemets** (`id: "<ts>"`) :
  17 chiffres > `Number.MAX_SAFE_INTEGER`, non quoté un parser YAML JS le corromprait
  en nombre. Les lecteurs (regen, portfolio, gate d'ouverture) le dé-quotent. Source de vérité.
- **Tri** : l'ordre lexicographique du nom = ordre chronologique (format fixe,
  left-padded). Bonus « je vois le sujet **et** quand » directement dans l'arbo.
- **Granularité — millisecondes (tranché 2026-08-10).** `id = AAAAMMDDHHMMSSmmm`
  (17 chiffres). La seconde seule suffirait au volume actuel, mais le résiduel
  « deux sessions, même seconde » ne se règle **pas** par un check « le fichier
  existe-t-il ? » : deux branches ne se voient pas avant le merge, le check est
  aveugle à l'autre session. Seule parade sans coordination = **entropie** ; on
  prend les millisecondes (reste 100 % temporel et triable, coût lisibilité nul —
  c'est déjà de la plomberie après `AAAAMMDD`).
- **Portabilité macOS.** `date +%N`/`%3N` n'existe pas en BSD date : le mint passe
  par un script dédié (`scripts/mint-id.sh`, fallback python3/perl) plutôt que par
  `date` inliné.

## Alternative écartée — mint tardif + mutex

Version antérieure de cette fiche : capturer l'idée **sans** numéro, puis **minter**
un id court à l'intake sprint, sérialisé par un **verrou** (bail git / file lock /
claim style [0090](done/0090-coherence-de-sprint.md)). Écartée : elle garde un id court
dans les branches, mais réintroduit un « moment de mint » **et** un mutex — soit la
coordination qu'on veut justement supprimer. On préfère la simplicité du timestamp
partout ; prix assumé = branches/PR portent le timestamp (long, mais généré par
l'outil, greppé par `reconcile` aussi bien qu'un nombre court, cité à l'oral par le
slug).

Ironie assumée : **cette fiche-ci garde son numéro `0180`** — les fiches existantes
ne sont pas renommées (voir Migration).

## Critères d'acceptation

- [ ] `add` génère un id `AAAAMMDDHHMMSSmmm` (17 chiffres, ms, UTC) — front-matter
      `id:` **quoté** + préfixe du nom de fichier ; **plus aucun appel à `max+1`**
      (`ezk-backlog` `add`, étape 5).
- [ ] Deux sessions concurrentes d'un même projet ne collisionnent pas dans le cas
      nominal ; le résiduel « même milliseconde » relève de l'entropie du timestamp,
      **documenté comme non couvert** par un check d'existence.
- [ ] Bascule en avant : les fiches `00XX` existantes restent **inchangées**
      (branches `feat/00XX-…`, PR, `reconcile`, `PLAN` intacts) — pas de big-bang.
- [ ] `regen` trie et liste les deux formats sans warning d'unicité erroné ; ordre
      lexicographique cohérent (`00XX` avant `2026…`).
- [ ] `reconcile` matche une fiche horodatée à sa branche/PR (grep `headRefName`)
      aussi bien qu'un id court ; regex `\d{4}` élargies aux deux formats.
- [ ] Anti-régression : branches, `reconcile`, `PLAN.md` fonctionnent pour les deux
      formats.

## Notes / décisions

- **Oui, c'est ezk-backlog** — follow-up de capacité (comportement `add` :
  génération d'id), **pas** le layout Skema v2.
- **Migration — bascule en avant, pas de big-bang.** Les fiches `00XX` gardent leur
  id (branches / PR / `reconcile` historiques intacts). Seules les **nouvelles**
  fiches naissent horodatées. Outillage à toucher : retirer `max+1` d'`add` ;
  élargir les regex `\d{4}` de `regen` / `reconcile` aux deux formats ; le warning
  d'unicité de [0064](done/0064-liste-unique-features-champ-product.md) reste utile.
- **Le préfixe projet ne suffit pas (tranché 2026-08-10).** Les collisions viennent
  aussi de **plusieurs sessions d'un même projet** ; un namespace `mc-` / `cop1-`
  ne les couvre pas. L'horodatage est sans coordination y compris **intra-repo**.
- **Hors PR #87 / hors layout Skema v2** — ne pas piggyback : #87 = README curé +
  `BACKLOG.md` + migrations mécaniques Skema ; **0180** = génération d'id des fiches
  (capacité `ezk-backlog`), plus large qu'un changement de layout.
- **product: vectorz** — ownership de la fiche / surface `features/` monorepo ;
  le code skill reste côté mega-city (`ezk-backlog`).
- Croisement : [0175](0175-article-skema-skill-schema-migrations.md) (Skema /
  migrations de layout), [0177](0177-pack-pratiques-projet-portables.md)
  (pratiques projet portables) — **pas des doublons**. Anti-doublon vs
  [0172](0172-convention-sot-backlog-md.md) (SoT md vs GitHub) et
  [0174](0174-ezk-issues-intake-github.md) (intake GH) : process backlog, mais pas
  la génération d'id.
- Priorité **P2** — alignée sur les fiches process backlog voisines (0172, 0174).
- Pattern name (à arbitrer au grooming) : **datename-id** (ou *timestamp-id* /
  *late-bound id* pour l'ancienne variante mint-tardif).
