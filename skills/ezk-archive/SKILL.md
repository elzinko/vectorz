---
name: ezk-archive
argument-hint: "[help|check|run]"
description: >-
  Rituel de CLÔTURE de session avant archivage : clôt proprement un repo pour ne
  RIEN perdre entre deux sessions. A utiliser quand l'utilisateur veut « archiver
  / clôturer une session », « fermer proprement avant de partir », « ne rien
  perdre entre deux sessions », préparer un « handoff » pour la prochaine session,
  ou demande « on archive ? » « avant de fermer ». Pilotable par sous-commandes :
  help, check (dry-run strictement read-only : produit le rapport de clôture),
  run/close (applique les corrections sûres — ship/regen du backlog, mémoire — et
  produit la note de handoff). Vérifie en 7 points : working tree propre +
  stashes, PRs & branches non-mergées (crucial pour les repos sans remote),
  backlog cohérent (délègue à ezk-backlog), ADR de la session restés en
  branche/PR non-mergée, mémoire projet durable, note de handoff prête-à-coller,
  verdict archivable/pending. Ne merge/push JAMAIS tout seul ; hygiène de clôture
  uniquement (pas du scrum/sprint — ça, c'est ezk-sprint).
---

# ezk-archive

Tu **clôtures proprement une session de travail** avant de l'archiver, pour que
**rien ne se perde entre deux sessions**. Le besoin réel : entre sessions, des
ADR/fiches/PRs restent parfois sur des **branches non-mergées** ou **hors backlog**,
et on les oublie. Ce skill passe une **checklist de clôture** et produit une **note
de handoff** prête à coller pour reprendre proprement la fois suivante.

> **Une seule responsabilité : l'hygiène de clôture.** Ce n'est PAS du sprint ni du
> scrum (ça, c'est [`ezk-sprint`](../ezk-sprint/)), ni le suivi du *quoi* (ça, c'est
> [`ezk-backlog`](../ezk-backlog/)). `ezk-sprint` **ouvre/déroule**, `ezk-backlog`
> suit **le quoi**, **`ezk-archive` clôt**.

## Usage (sous-commandes)

`/ezk-archive [sous-commande]` — ou en langage naturel (« clôture la session »,
« on archive ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + un mot sur chaque vérification |
| `check` | **Dry-run, ne modifie RIEN** — produit le rapport de clôture (les 7 points) |
| `run` / `close` | Applique les **corrections sûres** (ship/regen backlog, mémoire) puis produit la **note de handoff** + le **verdict** |

> **Help** : invoquée sans sous-commande (ou `help`/`?`), affiche ce tableau et le
> rôle de chaque check. Sous-commande non reconnue → traite la demande en prose
> (la skill reste pilotable naturellement).

> **`check` est strictement read-only** : il n'exécute que des lectures git/gh, ne
> commite/push/merge **jamais**. `run` n'applique que des corrections **sûres et
> réversibles** (mettre à jour le backlog, la mémoire) ; il ne merge/push **jamais**
> une PR ou une branche — ça reste à la main de l'utilisateur (cf. Garde-fous).

## Le helper read-only

`bash <skill>/scripts/check.sh [base]` rassemble les faits bruts — working tree,
stashes, PRs ouvertes, branches non-mergées, ADR touchés — **sans rien modifier**.
`check` **et** `run` partent tous deux de sa sortie. Il détecte tout seul :
l'absence de remote (repo **local-only** → pas de `gh`, on s'appuie sur les branches
locales) et la base (`main` → `master` → `HEAD`).

## Les 7 vérifications / actions

### 1. Working tree propre
`git status --porcelain` + `git stash list`. Rien d'uncommitted/untracked oublié
(tolère les scratch **connus** comme `SPRINT.md`), pas de stash orphelin. `run` :
**signale** ce qui doit être commité ; ne commite **pas** à l'aveugle du code
sensible — laisse la main à l'utilisateur.

### 2. PRs & branches en attente — *ne RIEN oublier*
- Remote + `gh` dispo → `gh pr list --state open` : aucune PR ouverte oubliée.
- **Repo SANS remote (crucial)** → pas de `gh` : on s'appuie sur
  `git branch --no-merged <base>` pour qu'aucune branche locale non-mergée ne soit
  perdue.
- Même avec un remote, `git branch --no-merged <base>` attrape les branches locales
  **jamais poussées**. Pour chaque entrée : dernier commit + **action proposée**
  (merger ? ouvrir une PR ? abandonner sciemment ?).

### 3. Backlog cohérent — *délègue à [`ezk-backlog`](../ezk-backlog/)*
- Fiches **livrées cette session** → `ship <id> #PR`.
- Idées/bugs **notés pendant la session** → `add <description>`.
- Puis `regen` l'index.

`check` : se contente de **lister** ce qui devrait être shipped/added (read-only).
`run` : invoque réellement `ezk-backlog`. ezk-archive ne réimplémente pas le suivi —
il l'**appelle**.

### 4. ADR de la session — *spécifique (ezk-backlog ne suit PAS les ADR)*
Détecte via git les ADR créés/modifiés depuis le début de session :
- `git log <base>..HEAD --name-only` → ADR commités sur la branche courante ;
- working tree (`git diff`, fichiers untracked) → ADR **non commités**.

Vérifie qu'ils sont **commités**, et **signale ceux restés en PR/branche
non-mergée** (pas perdus, mais *pending*). C'est le check qui justifie ce skill :
**ezk-backlog ne suit pas les ADR**, donc personne d'autre ne les rattrape.
Chemins ADR usuels : `docs/adr/`, `adr/`, `docs/decisions/`.

### 5. Mémoire projet
Propose les faits **DURABLES non-dérivables du repo** (contraintes, décisions et
leur *pourquoi*, objectifs en cours) et met à jour la mémoire **si le harness en a
une**. Convertis les dates relatives en absolues. Ne mémorise **pas** ce que le repo
encode déjà (structure du code, historique git, fixes passés, CLAUDE.md).

### 6. Note de handoff — **LE livrable**
Un prompt **prêt-à-coller** pour démarrer la prochaine session (gabarit ci-dessous) :
sync de `main`, `/ezk-backlog list`, la liste des **pending** PRs/branches avec leur
action, et les **candidats de travail prioritaires**.

### 7. Verdict
- **✅ archivable** — rien en suspens, handoff prêt.
- **⚠️ pending à traiter d'abord** — **liste précise** de ce qui bloque (working tree
  sale, branche non-mergée oubliée, ADR non commité, PR à reviewer…).

## Gabarit de la note de handoff

```markdown
## Handoff — <projet> — <YYYY-MM-DD>

**Reprendre :**
1. `git switch main && git pull`   (ou sync local si pas de remote)
2. `/ezk-backlog list`   → la prochaine fiche prioritaire

**Pending (à ne pas perdre) :**
- PR #<n> « <titre> » — <action : reviewer / merger / fermer>
- branche `<nom>` (non-mergée, dernier commit <date>) — <action>
- ADR `<chemin>` — <commité sur branche X, pending merge / à committer>

**Candidats prioritaires prochaine session :**
- P0 · <id> · <titre>
- <idée notée cette session, ajoutée au backlog>

État de clôture : ✅ archivable | ⚠️ pending (voir ci-dessus)
```

## Déroulé

1. **Lance le helper** `scripts/check.sh` → faits bruts (read-only).
2. **Compose le rapport** des 7 points à partir de ces faits + du contexte de session
   (ce qui a été livré/noté/décidé pendant la session, que git seul ne sait pas).
3. Si `check` → **t'arrêtes là** : aucune modification, juste le rapport + le verdict.
4. Si `run`/`close` → applique les **corrections sûres** (backlog via `ezk-backlog`,
   mémoire), **re-signale** ce qui reste à la main de l'utilisateur (merges/push),
   puis produis la **note de handoff** et le **verdict**.

## Intégration

- **[`ezk-backlog`](../ezk-backlog/)** : le check 3 lui délègue `ship`/`add`/`regen` ;
  la note de handoff renvoie vers `list`.
- **[`ezk-sprint`](../ezk-sprint/)** : complémentaire — le sprint *ouvre/déroule*,
  ezk-archive *clôt*. Typiquement invoqué **après** le checkpoint de fin de sprint.
- **[`ezk-commits`](../ezk-commits/)** : tout commit produit par `run` suit les
  Conventional Commits.

## Garde-fous

- **Une seule responsabilité** : l'hygiène de clôture (ce n'est pas du scrum/sprint).
- **Ne merge/push rien tout seul** : les PRs et branches restent à la main de
  l'utilisateur — ezk-archive les **signale**, il ne les **résout** pas.
- **Respecte les repos local-only** : pas de remote → pas de `gh`, uniquement les
  branches locales (`git branch --no-merged`).
- **Idempotent** ; `check` est **strictement read-only**.
- Ne commite jamais à l'aveugle du code ou des secrets ; n'invente ni date ni n° de PR
  (demande si inconnu).
