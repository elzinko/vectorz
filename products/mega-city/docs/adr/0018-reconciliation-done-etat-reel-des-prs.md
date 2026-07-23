# ADR 0018 — Réconciliation `done` ↔ état réel des PRs : `ezk-backlog reconcile`, pas de hook

- Statut : **accepté** — décision de frontière, 2026-07-22 (sole-judge sur délégation PO ; l'appel `ezk-architect` a été interrompu par une erreur d'API, la décision est reprise et tranchée ici)
- Date : 2026-07-22
- Portée : skills mega-city `ezk-backlog`, `ezk-sprint`, `ezk-pr-pilot`
- Liens : [ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) (cycle de vie du backlog), fiche [0064](../../features/0064-sprint-intake-sante-backlog-metriques.md) (sprint intake / santé du backlog)

## Contexte

Le passage d'une fiche à `status: shipped` (déplacée dans `features/done/`) est une
**commande explicite** — `ezk-backlog ship <id> #PR`. Elle n'est appelée que sur **deux
chemins** : `ezk-sprint` étape 10 (`skills/ezk-sprint/SKILL.md:81`) et `ezk-pr-pilot ship`
(`skills/ezk-pr-pilot/SKILL.md:110`). **Dès que la PR est mergée autrement** — le PO clique
« Squash & merge » dans l'UI GitHub, un reviewer humain merge, un autre outil merge —
**personne n'appelle `ship`** : la fiche reste `todo`/`in-progress` alors que le code est
sur `main`.

Le `status` d'une fiche est donc un **cache** de la vraie source de vérité (l'état *merged*
de la PR), **sans mécanisme de réconciliation continue**. Symptôme concret : une fiche déjà
livrée peut être **re-tirée et reconstruite** au sprint suivant. Filets actuels, tous deux
insuffisants pour fermer le trou : `ezk-archive` en clôture de session (ponctuel, à la
demande) et `ezk-backlog review` contrôle #1 « code livré entre-temps ? » (au **jugement
LLM**, cadence 5 sprints).

Obstacle de conception : **rapprocher une PR mergée d'une fiche est ambigu** quand `ship`
n'a jamais tourné (donc aucun n° de PR enregistré dans le front-matter). La branche était,
**avant cette décision**, `feat/<slug>` (intake `ezk-sprint`, étape 0) et le titre de PR =
conventional commit — **l'id de fiche n'y figure nulle part de façon fiable** → pas de
matching mécanique (c'est ce que la convention `feat/<id>-<slug>` du point 2 vient corriger).

Invariant à préserver (ADR-0016) : le backlog vit sur `main`, `review` **propose**, le PO
**arbitre** ; aucune modification de fiche sans accord explicite. Et l'invariant de
séparabilité (`ezk-backlog` : « aucune logique de gate/tirage réimplémentée en aval, test de
séparabilité ») : **aucune logique de gate/tirage réimplémentée en aval** — `ezk-sprint`
compose `ezk-backlog`, il ne le double pas.

## Décision

1. **Une seule brique de réconciliation : la sous-commande `ezk-backlog reconcile`.**
   Elle croise les fiches **actives** (hors `done/`) avec les **PRs mergées** et renvoie une
   **liste de propositions** « ces fiches semblent déjà mergées → `ship <id> #PR` ? ». Elle
   **ne bascule jamais** une fiche elle-même (invariant PO : `reconcile` détecte/propose,
   `ship` exécute). C'est le **point unique** ; tous les autres chemins l'appellent, aucun ne
   réimplémente le croisement (test de séparabilité respecté).

2. **Rapprochement fiche↔PR — mécanique quand c'est possible, LLM en repli.**
   - *Going forward* : **la branche de sprint devient `feat/<id>-<slug>`** (id de fiche en
     préfixe — ex. `feat/0064-reconcile-done`). L'id remonte alors dans `headRefName` des PRs
     et rend le croisement **déterministe** : `gh pr list --state merged --json
     number,headRefName,title,mergedAt` → une fiche est « probablement mergée » si une PR
     mergée porte son id en préfixe de branche.
   - *Legacy / id absent de la branche* : repli sur **rapprochement au jugement LLM** par
     sujet (titre/corps de PR vs titre de fiche) — proposition seulement, jamais mécanique.
   - Le n° de PR reste enregistré par `ship` (inchangé) : une fiche `shipped` avec `pr:` posé
     n'est plus candidate.

3. **Trois points d'appel, une cadence bornée** (pas d'appel réseau sur `list`/`next`) :
   - **Sprint intake** (`ezk-sprint` étape 0, primaire) : avant `next --ready-only`, appelle
     `reconcile` — c'est là que la dérive coûte cher (re-build). Une proposition non vide se
     traite (ship au PO) **avant** de tirer.
   - **`ezk-backlog review`** (backstop périodique) : le contrôle #1 « code livré
     entre-temps ? » **appelle `reconcile`** pour la partie mécanique, en plus du jugement LLM.
   - **`ezk-pr-pilot`**, bloc « squash fait par le PO depuis l'UI GitHub »
     (`SKILL.md:114-116`) : après `git fetch --prune` + suppression de la copie locale,
     **`reconcile` puis `ship`** — sinon la fiche reste orpheline du merge UI.
   `list`/`next` restent **offline et rapides** : seul `reconcile` touche le réseau.

4. **Dégradation local-only, sans erreur.** Pas de remote / pas de `gh` ⇒ `reconcile` le
   **dit** (« réconciliation PR indisponible — pas de remote/`gh` ») et **retombe** sur le
   jugement LLM de `review` + le filet `ezk-archive`. Ce n'est pas une panne, c'est un mode.

5. **Pas de git hook `post-merge` ni de GitHub Action.** Rejeté : casse les repos
   local-only, impose de l'infra par repo, et le rapprochement flou (point 2) exige du
   jugement — donc côté skill, pas côté déclencheur déterministe. Cohérent avec l'invariant
   backlog-sur-main d'ADR-0016 (mêmes raisons que son option C).

## Options considérées

### Option A — hook `post-merge` / GitHub Action qui flippe la fiche
Rejeté (§5). Infra par repo, aveugle au local-only, et incapable de rapprocher fiche↔PR sans
convention préalable ni jugement.

### Option B — `ezk-backlog reconcile` composé à l'intake + review + pr-pilot (retenue)
Une brique, trois appelants ; propose-not-auto-ship ; cadence bornée ; dégradation propre ;
respecte la séparabilité (aucun croisement dupliqué en aval). Réversible (retirer la
sous-commande + l'appel suffit).

### Option C — tout mettre dans `review` uniquement
Rejeté : `review` est cadencé (5 sprints / post-pivot) — trop rare pour empêcher un re-build
au sprint suivant. `review` reste un **appelant** de `reconcile`, pas le seul.

### Option D — matching purement LLM, sans convention de branche
Rejeté comme cible : laisse le rapprochement fragile et non reproductible. Conservé
seulement en **repli** pour les branches legacy sans id.

## Conséquences

**Plus facile** — la dérive `done` est rattrapée sur un chemin **fréquent et garanti** (chaque
intake), plus seulement en clôture ; le croisement devient **mécanique** dès que la branche
porte l'id ; une seule brique à tester et à faire évoluer.

**Plus dur / à surveiller** — la convention de branche `feat/<id>-<slug>` doit être adoptée
partout (sinon on reste en repli LLM) ; `reconcile` dépend de `gh`+remote pour son mode
mécanique ; vigilance anti-doublon avec le contrôle #1 de `review` (c'est le **même** appel,
pas deux logiques). Le rapprochement LLM reste faillible — d'où « **proposition**, jamais
bascule ».

## Action items

1. [ ] `ezk-backlog` : sous-commande `reconcile` (tableau + section détaillée + garde-fou
   propose-not-auto-ship + dégradation local-only) ; graver la convention `feat/<id>-<slug>`.
2. [ ] `ezk-sprint` : étape 0 appelle `reconcile` avant `next` ; branche `feat/<id>-<slug>`.
3. [ ] `ezk-pr-pilot` : bloc merge-UI → `reconcile` puis `ship`.
4. [ ] `ezk-backlog review` : contrôle #1 appelle `reconcile` (bras mécanique).
5. [ ] Fiche 0064 : cocher les critères de réconciliation traités, lier cet ADR.
