---
id: 0180
title: Idées sans numéro — fiche datename à la capture, id numérique à l'intake sprint
type: feature
priority: P2
product: vectorz
status: idea
ready:
pr:
created: 2026-08-01
---

# 0180 — Idées sans numéro (mint id à l'intake)

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

Besoin : distinguer clairement **idée capturée** (pas encore dans la numérotation
actionnable) et **fiche intégrée** (id stable pour branche `feat/<id>-…`, PLAN,
reconcile).

## Proposition

Lifecycle d'identité en deux temps :

1. **Capture d'idée** — créer une fiche **sans id numérique** : nom (slug) + date
   seulement (fichier type datename / slug-date). `status: idea`. Visible dans
   l'index Idées, clairement hors séquence numérotée.
2. **Mint de l'id** — assigner le numéro **uniquement** à l'intégration dans un
   sprint, ou à la promotion `ready` / bascule `idea → todo` actionnable
   (point unique à figer au grooming).
3. **Mutex / single-writer** — un verrou (bail git, file lock, ou claim documenté
   dans le style [0090](0090-coherence-de-sprint.md)) pour qu'un seul processus
   à la fois mint un id (`max+1` sur base fetchée + branches non mergées).

Ironie assumée : **cette fiche-ci porte encore un numéro (0180)** parce que le
système actuel l'exige tant que la feature n'est pas livrée.

## Critères d'acceptation

- [ ] Une idée capturée crée un artefact **sans** id 4 chiffres (convention de
      nom de fichier + front-matter documentés).
- [ ] L'id numérique n'est minté qu'à l'intake sprint / promotion actionable
      (règle unique, testée).
- [ ] Deux processus concurrents ne peuvent pas mint le même id (mutex /
      single-writer vérifiable).
- [ ] `regen` / index listent les idées numberless à part ; pas de collision avec
      les fiches numérotées.
- [ ] Anti-régression : branches `feat/<id>-…`, `reconcile`, `PLAN.md` continuent
      de fonctionner pour les fiches déjà numérotées.

## Notes / décisions

- **Oui, c'est ezk-backlog** — follow-up de capacité (comportement `add` /
  intake sprint + mutex), **pas** le layout Skema v2.
- **Hors PR #87 / hors layout Skema v2** — ne pas implémenter sur
  `feat/0175-skema-layout-v2` ni en drive-by sur #87. Mauvaise scope : #87 =
  README curé + `BACKLOG.md` + migrations mécaniques Skema (safety mid-review).
  **0180** = lifecycle d'identité des fiches (idées datename → mint id à
  l'intake sprint) + concurrence mutex — plus large qu'un changement de layout.
- **Après merge de #87** — candidat prochaine évolution backlog :
  *ezk-backlog id lifecycle* (libellé préféré). « Skema layout v3 » reste
  optionnel seulement si une migration de fichiers numberless est nécessaire ;
  ne pas piggyback sur v2.
- **product: vectorz** — ownership de la fiche / surface `features/` monorepo ;
  le code skill reste côté mega-city (`ezk-backlog`).
- Croisement : [0175](0175-article-skema-skill-schema-migrations.md) (Skema /
  migrations de layout), [0177](0177-pack-pratiques-projet-portables.md)
  (Praxis / pratiques projet portables) — **pas des doublons** : 0175 = article
  + mécanisme de migration de layout ; 0177 = binding de pratiques au projet ;
  **0180 = lifecycle d'identité des fiches idée** (capacité ezk-backlog).
- Anti-doublon vs existant : [0172](0172-convention-sot-backlog-md.md) (SoT md vs
  GitHub) et [0174](0174-ezk-issues-intake-github.md) (intake GH) touchent le
  process backlog mais **pas** le report du mint d'id. [0064](done/0064-liste-unique-features-champ-product.md)
  (liste unique) et notes de [0102](0102-ezk-testbed-brique-boot-env-test.md)
  (course `max+1`) motivent le mutex, sans couvrir les idées sans numéro.
- Priorité **P2** — alignée sur les fiches process backlog voisines (0172, 0174),
  pas P1.
- Pattern name candidat (à arbitrer au grooming) : **datename → mint** (ou
  *deferred id* / *late-bound id*).
