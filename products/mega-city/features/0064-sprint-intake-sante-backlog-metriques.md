---
id: 0064
title: Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible »)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0064 — Sprint intake : DoR & santé du backlog

## Contexte / Problème

Friction née du **premier self-host** (session 2026-07-16) : en voulant piloter par sprint
**en journée** (mode moniteur, pas la nuit), le PO constate que l'intake d'`ezk-sprint`
(étape 0, `products/mega-city/skills/ezk-sprint/SKILL.md:71`) se réduit à *« prends LA
prochaine fiche prioritaire »*. Manque toute la couche **amont d'un vrai début de sprint** :

1. **Grooming / readiness** : quelles fiches respectent une **DoR** (Definition of Ready)
   **fixée par des règles d'équipe** (pas au doigt mouillé) ?
2. **Priorisation** puis **sprint planning** (constituer un lot de stories).
3. **Indicateur de santé du backlog** — *anticiper* : combien de features au total,
   **combien prêtes, combien pas prêtes**.
4. Ces métriques doivent apparaître **dans le résultat du prompt** ET être **émises comme
   messages de monitoring** (= le contrat de supervisabilité — l'app moniteur les affiche).
5. Un **garde** : pouvoir dire *« on ne peut pas faire de sprint : pas (assez) de features
   prêtes »* au lieu de démarrer à vide.
6. *Un jour* : des **seuils** qui signalent *« il faut penser à groomer »*.

### Réconciliation `done` ↔ état réel des PRs (ajout 2026-07-22)

Sous-problème découvert en revue de la chaîne de skills : le passage d'une fiche à
`status: shipped` (déplacement dans `done/`) est une **commande explicite** (sous-commande
`ship <id> [#PR]` d'`ezk-backlog`). Elle n'est appelée **que** sur deux chemins :
`ezk-sprint` étape 10 (`SKILL.md:81`) et `ezk-pr-pilot ship` (`SKILL.md:110`). **Dès que la
PR est mergée autrement** — PO qui clique « Squash & merge » dans l'UI GitHub, reviewer
humain, merge par un autre outil — **personne n'appelle `ship`** : la fiche reste `todo`/
`in-progress` alors que le code est sur `main`. Le `status` est un **cache** de la vraie
source de vérité (l'état *merged* de la PR) ; il n'a aucun mécanisme de réconciliation
continue. Seul filet actuel : `ezk-archive` en clôture de session (ponctuel, à la demande)
et `review` contrôle #1 (« code livré entre-temps ? », au jugement LLM, cadence 5 sprints).

Trou dans la raquette : la dérive n'est corrigée sur **aucun chemin garanti** entre le merge
et la clôture. Conséquence concrète : une fiche déjà livrée peut être **re-tirée et
reconstruite** au sprint suivant.

> C'est un **gros sujet** (dixit PO) — et c'est aussi la **démonstration live de la boucle
> Sujet A** : la 1ʳᵉ friction du self-hosting devient un item d'amélioration de la méthode
> (cf. [0063 ezk-retro](done/0063-ezk-retro-ceremonie-auto-amelioration.md)).

## Proposition

À groomer. Pistes (composent l'existant, ne réinventent rien) :

- **DoR = une règle d'équipe** dans `rules/` — critères observables de « fiche prête »
  (problème/valeur clairs, critères d'acceptation testables, dépendances connues…). Évolutive
  via `ezk-retro` (0063).
- **Intake enrichi** d'`ezk-sprint` (ou skill `ezk-planning` dédié — à trancher) : classe les
  fiches du backlog par la DoR, compte **total / prêtes / pas-prêtes**, priorise, planifie un lot.
- **Émission** d'un événement `backlog.health {total, ready, not_ready, by_priority…}` dans le
  **journal de supervisabilité** → l'app moniteur (aveugle à la méthode) l'affiche ; et la même
  synthèse **dans le résultat du prompt**.
- **Garde d'intake** : `ready < seuil` ⇒ **refuse le sprint** avec un message clair
  (« groomez d'abord »). En termes de supervisabilité : un état/escalade « pas de travail prêt ».
- **Futur** : seuils → signal *« temps de groomer »* (relie l'auto-amélioration / Sujet B, ou
  simple alerte de flux).
- **Réconciliation `done` ↔ PRs mergées** (sous-problème 2026-07-22) — moment retenu :
  **sprint intake en primaire** (juste avant `next --ready-only` : croiser les fiches actives
  avec les PRs mergées ; c'est là que la dérive coûte cher — re-build) + **`review` en
  backstop périodique** (rendre le contrôle #1 *mécanique*, pas seulement au jugement LLM).
  **Pas de git hook / GitHub Action** (casse le local-only, infra par repo, mapping fiche↔PR
  flou quand `ship` n'a pas enregistré le n° de PR → jugement LLM requis, donc côté skill).
  **Jamais d'auto-`ship` silencieux** : proposer au PO « ces fiches semblent mergées → shipper ? »
  (invariant `review` : arbitrage PO, aucune modification sans accord explicite).

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`) pour la partie **santé/DoR/émission**.
- [x] **Réconciliation** — l'intake d'`ezk-sprint` (avant tirage) signale toute fiche active
      dont une PR semble déjà mergée (match par id embarqué dans la branche `feat/<id>-<slug>`
      quand présent, sinon rapprochement au jugement) ; sortie = **proposition de `ship` au PO**,
      jamais une bascule automatique. → sous-commande `ezk-backlog reconcile` (ADR-0018).
- [x] `ezk-backlog review` : le contrôle #1 « code livré entre-temps ? » croise
      explicitement les **PRs mergées** (quand `gh` + remote dispo) via `reconcile`, en plus du
      jugement LLM.
- [x] Comportement **local-only** défini : pas de `gh`/remote ⇒ `reconcile` le dit et retombe
      sur le jugement LLM + le filet `ezk-archive` (documenté, pas d'erreur).
- [x] Frontière respectée : `reconcile` **propose**, `ezk-backlog ship` **exécute** — brique
      unique, appelée par intake / review / ezk-pr-pilot, aucune bascule réimplémentée ailleurs.

## Notes / décisions

- 2026-07-17 — **réconciliation avec ADR-0016 mega-city (PR #26)**, qui traite le même
  besoin (travail mené en parallèle, découvert au merge). **Livré** : DoR maison en gate
  bloquant (`ready <id>` pose `ready:` — fiche 0056) ; compteurs de santé émis par le
  script `regen` (total / statuts / todo-ready / création médiane — point 3, moitié
  « résultat du prompt ») ; garde « pas de sprint possible » = checkpoint bloquant
  « aucune fiche ready » d'ezk-product-builder (point 5) ; priorisation + tirage via
  `next --ready-only` et `review` (points 1-2). Le « à trancher » (skill `ezk-planning`
  dédié ?) est **tranché** : sous-commandes d'ezk-backlog (ADR-0016 option B, gate
  ADR-0013). **Reste à cette fiche** (à groomer) : la DoR comme règle d'équipe dans
  `rules/` (évolutive via ezk-retro), l'**émission `backlog.health`** au journal de
  supervisabilité (point 4, moitié monitoring), les seuils « temps de groomer » (point 6).
- **Métriques de FLUX / santé du backlog** — distinctes des 2 axes d'[ADR-031](../../../docs/adr/ADR-031-deux-axes-de-validation.md)
  (Axe 1 « le produit tourne ? », Axe 2 « la méthode est bonne ? ») : ici c'est la santé du
  **backlog**, en amont du sprint.
- **Non bloquant** pour construire une fiche **déjà prête** (ex. 0063) : ce sujet compte quand
  il y a un **stock** à trier/anticiper.
- Compose : `ezk-sprint` (intake `SKILL.md:71`), `ezk-backlog` (statuts, `list`), `rules/` (la
  DoR), le contrat de supervisabilité (event `backlog.health` → app moniteur), `ezk-retro`
  (0063, fait évoluer la DoR/les règles).
- Origine : session 2026-07-16 (premier self-host — 1ʳᵉ friction). Priorité P2 à confirmer au grooming.
- 2026-07-22 — **ajout du sous-problème « réconciliation `done` ↔ PRs mergées »** (arbitrage
  PO : étendre 0064 plutôt qu'une fiche dédiée — anti-doublon, 0064 possède déjà le moment
  *intake*). Cross-réf : [0029](0029-propagation-maj-skills.md) (hook de drift des skills —
  concept voisin, sujet distinct : versions de skills, pas statut de fiche).
- 2026-07-26 — **exigence PO (roadmap)** : au lancement d'`ezk-product-builder`, tant qu'il
  n'y a **pas un nombre suffisant** de fiches `ready` — **pas seulement zéro** — s'arrêter et
  **proposer une session de grooming** pour constituer un lot tirable, plutôt que de démarrer
  un sprint à vide. C'est le **seuil de lot** (point 6, « temps de groomer ») + la garde
  d'intake `ready < seuil ⇒ propose groom` (Proposition), **au-delà** du checkpoint « aucune
  fiche ready » déjà livré (point 5). Le seuil (« combien = suffisant ») est **configurable**,
  à fixer au grooming. Contexte : le PO veut lancer le builder depuis une autre session sur
  le backlog fraîchement ordonnancé (`features/PLAN.md`, 2026-07-26) où le NOW est encore
  tout en `idea` — le builder doit donc l'aiguiller vers le grooming, pas tenter un sprint.
- 2026-07-22 — **sous-problème réconciliation LIVRÉ** (décision + implémentation) : voir
  [ADR-0018](../docs/adr/0018-reconciliation-done-etat-reel-des-prs.md). Brique unique
  `ezk-backlog reconcile` (croise fiches actives ↔ PRs mergées via `gh`, **propose** au PO,
  ne ship jamais seule, dégrade en local-only) ; appelée à l'intake (`ezk-sprint` étape 0),
  par `review` (bras mécanique du contrôle #1) et par `ezk-pr-pilot` après un merge UI ;
  convention de branche `feat/<id>-<slug>` pour un rapprochement mécanique. La décision de
  frontière était fléchée `ezk-architect` : l'appel a été **interrompu par une erreur d'API**,
  la décision a donc été tranchée et documentée directement dans l'ADR. **Reste ouvert dans
  0064** : la DoR comme règle d'équipe, l'émission `backlog.health`, les seuils « temps de
  groomer » — c'est pourquoi la fiche **reste `idea`** (le sous-problème réconciliation est le
  seul volet clos).
