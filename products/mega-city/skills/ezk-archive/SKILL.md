---
applies: [documentation-guidelines/human-facing-lisibility, documentation-guidelines/readable-deliverable-trio]
delegates: [ezk-backlog]
name: ezk-archive
argument-hint: "[help|check|run]"
description: >-
  CLÔTURE de session avant archivage (une capacité de continuité, pas une étape
  agile) : clôt proprement un repo pour ne RIEN perdre entre deux sessions. Une
  session sans rien à sauver sort en une ligne « rien à archiver ». A utiliser quand l'utilisateur veut « archiver
  / clôturer une session », « fermer proprement avant de partir », « ne rien
  perdre entre deux sessions », préparer un « handoff » pour la prochaine session,
  ou demande « on archive ? » « avant de fermer ». Pilotable par sous-commandes :
  help, check (dry-run strictement read-only : produit le rapport de clôture),
  run/close (applique les corrections sûres — ship/regen du backlog, mémoire — et
  produit la note de handoff). Un script portier (`scripts/check.sh`) rend un
  verdict CLEAN/DIRTY sur 4 points de contrôle : working tree + stashes, PRs &
  branches non-mergées (crucial pour les repos sans remote), fiches déclarées
  livrées, ADR de la session ; sur CLEAN la clôture est traitée directement, sur
  DIRTY elle est déléguée au sous-agent, scopée aux points signalés. Produit
  toujours la note de handoff persistée hors du worktree (`<git-common-dir>/ezk/handoff.md`, anneau FIFO)
  et le verdict archivable/pending. Ne merge/push JAMAIS tout seul ; hygiène de
  clôture uniquement (pas du scrum/sprint — ça, c'est ezk-sprint).
---

# ezk-archive

**Ce skill ne *juge* jamais lui-même.** C'est l'invariant — il a remplacé « ce skill ne
fait QUE déléguer », qui était posé à la mauvaise granularité et coûtait ~235 000 tokens
par clôture (fiche mega-city 0088). Le partage, en trois verbes, suit ADR-0001 §2 :

| Verbe | Qui | Quoi |
|---|---|---|
| **Ranger** | le **script** | classer une branche, prouver une divergence, faire tourner le handoff, écrire un fichier |
| **Rédiger** | **cette session** | le récit de ce qui a été livré, les faits durables, les candidats — elle seule a la matière |
| **Juger** | le **sous-agent** | cette branche RÉELLE est-elle un brouillon supersédé ou du travail à récupérer ? cette divergence, on en fait quoi ? |

Le sous-agent (`~/.claude/agents/ezk-archive.md`) n'a **aucune mémoire de la
conversation**. Lui déléguer la *rédaction* n'achète pas un meilleur rédacteur : il ne
peut que recopier ce qu'on lui écrit. On délègue **uniquement** pour le **jugement**
(branches RÉELLES, stashes ambigus).

### Modèle (Claude Code) : léger par défaut, Opus pour le seul jugement

Les skills / agents mega-city sont **orientés Claude Code** (ids host-natifs), pas
Cursor/Grok. Le portier est un script et la note est un gabarit : le travail délégué est
surtout mécanique. L'agent tourne donc sur un modèle **léger** par défaut.

| Quand | Modèle | Pourquoi |
|---|---|---|
| Par défaut (frontmatter de l'agent) | `sonnet` | mécanique : purges prouvées, mémoire, note, archive session |
| Le bloc gate contient un fait `[P2] branch REAL`, un `MAINSYNC` non prouvé (`DIVERGED_UNPROVEN`, `UNKNOWN`) ou un stash | `claude-opus-4-8` | le seul pas de **jugement** : cette branche est-elle un brouillon jetable ou du travail à récupérer ? |

Quand tu délègues :

1. **Par défaut**, ne passe pas de `model` : le frontmatter de l'agent (`sonnet`) s'applique.
2. **Sur un fait de jugement** (ligne ci-dessus), passe `model: "claude-opus-4-8"` à l'outil Agent.
   Si l'hôte le refuse, retombe sur `sonnet` et dis-le en une ligne.
3. **Ne substitue jamais** Opus 5 / `claude-opus-5` / alias `opus` (il peut dériver vers Opus 5).
4. **Hôte Cursor** (outil Task) : pour le pas de jugement, mappe vers
   `claude-opus-4-8-thinking-high` (ou équivalent 4.8 du catalogue) ; sinon Sonnet. N'utilise
   Grok / autres familles **que** si l'humain le demande explicitement.

> **Une seule responsabilité : l'hygiène de clôture de la SESSION** (s'asseoir puis se lever
> dans Claude Code). Ce n'est PAS du sprint ni du scrum (ça, c'est `ezk-sprint`), ni le suivi
> du *quoi* (ça, c'est `ezk-backlog`). `ezk-sprint` **ouvre, déroule et ferme le sprint**
> (`start` / `close`, voir [ADR-0054](../../docs/adr/0054-cloture-sprint-vs-archive-session.md)),
> `ezk-backlog` suit **le quoi**, **`ezk-archive` ferme la session**.
>
> **Bande (ADR-0022)** : **capacité de continuité d'exécution**, pas orchestrateur ni étape agile.
> Elle existe parce qu'un agent perd sa mémoire entre deux sessions, pas parce qu'un incrément
> est fini. Sur le diagramme
> [`ezk-methode-globale`](../../diagrams/ezk-methode-globale/), `archive` vit
> avec backlog / sandbox / preview — pas dans la chaîne
> product-builder → sprint → pr.

## Usage (sous-commandes)

`/ezk-archive [sous-commande]` — ou en langage naturel (« clôture la session »,
« on archive ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + un mot sur chaque vérification |
| `check` | **Dry-run, ne modifie RIEN** — produit le rapport de clôture |
| `run` / `close` | Applique les **corrections sûres** (ship/regen backlog, mémoire) puis produit la **note de handoff** + le **verdict** |

> **Deux `close`, deux étages.** `ezk-archive close` (alias de `run`) ferme la **session**.
> `ezk-sprint close` ferme le **sprint** et scelle l'incrément : il ne touche pas à la session.
> L'ordre normal : un ou plusieurs `ezk-sprint close`, la rétro et le planning si besoin, puis
> `ezk-archive`. L'**ouverture** de session est implicite : le handoff se reprend au premier
> `ezk-sprint start` (via `handoff.sh carry`). Il n'existe pas de verbe d'ouverture ici.

Deux échappatoires, quand le portier ne doit pas décider :

| Modificateur | Effet |
|---|---|
| `run --delegate` | force la délégation au sous-agent même sur un verdict `CLEAN` |
| `run --inline` | interdit la délégation ; à n'utiliser que si tu assumes de juger toi-même les points DIRTY |

Le détail des 7 vérifications et les garde-fous vivent dans le sous-agent
(`~/.claude/agents/ezk-archive.md`) ; le gabarit de la note vit dans
[`references/handoff-template.md`](references/handoff-template.md), **source unique lue
par les deux chemins** (`scripts/test-template-unicity.sh` interdit de le dupliquer).

Cette note suit le pattern [gabarit + extracteur + rendu](../../rules/documentation-guidelines/readable-deliverable-trio.md) :
le gabarit est `references/handoff-template.md`, l'extracteur est `scripts/check.sh`, le rendu
est la réponse en « 3 réponses, zéro jargon » ci-dessous. Le gabarit fixe le format ; la règle de
clarté garantit le texte dedans.

## Le portier décide

> **Ce que tu AFFICHES à l'humain — 3 réponses, zéro jargon.** Il lance `run` pour archiver ;
> il n'a **pas** le gate en tête. Ne recrache **jamais** son vocabulaire (`DIRTY`, `P1`/`P2`,
> `REAL`, `PENDING`, « clôture inline », coûts en tokens) dans le chat — traduis **tout** en
> français simple. Ton message répond à **trois questions, dans cet ordre** :
>
> 1. **Ton travail est-il sauvé ?** (poussé sur `main`, ou reste-t-il quelque chose)
> 2. **Peux-tu archiver ?** (oui / non — et quoi faire d'abord si non)
> 3. **Qu'est-ce qui traîne, et est-ce grave ?** — chaque point en une phrase : *quel* fichier ou
>    branche, *d'où* il vient, *est-ce urgent*. Jamais « `P2_PENDING: DIRTY` », toujours
>    « une PR du bot dependabot attend, pas urgent ».
>
> Le jargon du gate reste dans ton **raisonnement**, jamais à l'écran. Une personne qui découvre
> le sujet doit comprendre du premier coup (règle
> [`human-facing-lisibility`](../../rules/documentation-guidelines/human-facing-lisibility.md)).

### 1. Déclare les ids, puis (peut-être) compose le résumé

D'abord **deux listes d'ids**, une ligne chacune, `none` si elles sont vides :

- **livrées** (`--shipped`) : les fiches mergées cette session ;
- **travaillées** (`--worked`) : les fiches sur lesquelles la session a travaillé, **livrées ou non**.

Elles coûtent presque rien et le portier en a besoin. Le **résumé** de 5-15 lignes (fiches/PRs
livrées **avec leurs ids**, décisions ADR, faits notables appris : contraintes, choix et leur
*pourquoi*, tout ce qui **n'est pas dérivable de l'état git/gh**) se compose **après** le gate,
et seulement si la voie rapide ne s'applique pas. Tu es la seule à avoir cette matière.

### 2. Interroge le portier — **une seule commande**

D'abord, rafraîchis la copie locale d'`origin` : le portier compare les branches à `origin/main`, et
lui ne fetch jamais (il reste strictement en lecture).

```bash
git fetch --prune origin
```

Sans réseau (ou sans remote), la clôture continue : dis-le en une ligne (« `origin/main` peut dater,
le fetch a échoué »), puis lance le portier quand même. Il signale lui-même une ref trop vieille.

```bash
bash <chemin-du-skill>/scripts/check.sh --gate --shipped <ids-livrés|none> --worked <ids-travaillés|none>
```

Une branche dont le contenu est déjà sur `origin/main` sort **absorbée**, même si le `main` local est
en retard (un squash-merge n'avance pas le `main` local).

`--shipped` prend les ids que tu viens de lister (`0089,0097`), ou `none` si la
session n'a **rien** livré. `--worked` prend ceux sur lesquels elle a **travaillé**, livrés
ou non, ou `none` : une session qui a travaillé la fiche X sans la livrer déclare
`--shipped none --worked X`, et le récit porte alors `fiches: X`. **Ne les omets jamais sans
raison** : sans déclaration, le portier n'a aucune preuve, répond `P3_BACKLOG: UNKNOWN` et
refuse la voie rapide. C'est voulu — c'est ce qui garantit qu'une session qui n'a *pas* tenu
ses comptes reçoit toujours la clôture complète.

Le portier est **read-only** et rend ~12 lignes sur une session propre.

### 3. Lis `FASTPATH:` d'abord, puis `VERDICT:`

#### `FASTPATH: EMPTY` → la voie rapide : une ligne, rien d'autre

Le portier a **prouvé** qu'il n'y a rien à sauver : verdict propre, rien livré, rien travaillé,
pas de `SPRINT.md` avec du contenu. Il reste une seule question, la tienne : **la session
a-t-elle un fait durable à transmettre** — une décision, une contrainte, un « pourquoi » que ni
git ni le backlog ne disent ? Si **non**, réponds par **une seule ligne** et arrête-toi :

> Rien à archiver : tout est poussé, aucune branche ni PR en attente.

Aucune note de handoff, aucun résumé, aucune écriture, **aucun sous-agent**, sur `check` comme
sur `run`. Si le bloc montre des restes à ranger (`branch_absorbed` ou `worktree_prunable` non
nuls), ajoute à la même ligne : « N branches absorbées à ranger : `check.sh --cleanup` ».
Si la ligne porte `other_worktrees_dirty=N`, d'autres worktrees (un agent, une autre session) ont du
travail non commité que le portier ne juge pas : ajoute à la même ligne « N autre(s) worktree(s) ont
des changements non commités : à regarder ». La voie rapide ne tait jamais ce reste.
Si **oui** (un fait durable existe), compose le résumé et déroule la branche `CLEAN` ci-dessous.

#### `FASTPATH: NO reason=…` → la clôture complète

La raison (`verdict`, `shipped`, `worked`, `sprint`, `shipped_undeclared`, `worked_undeclared`)
dit pourquoi. Compose le résumé de l'étape 1, puis lis `VERDICT:` — et une seule des deux
branches suivantes.

#### `VERDICT: CLEAN` → tu traites la clôture toi-même

Les 4 points de contrôle sont **prouvés** propres. Il ne reste que les points d'écriture,
qui ne demandent aucun jugement.

> ⚠️ **`check` est un dry-run : il n'écrit RIEN.** Le verdict ne change pas la
> sous-commande. Si l'utilisateur a demandé `check`, tu produis le rapport et la note
> **dans le chat** — sans `handoff.sh add`, sans toucher `.gitignore`, sans mettre à jour
> la mémoire. Seul `run`/`close` écrit. `handoff.sh carry` reste autorisé partout : il est
> read-only.

1. `bash <skill>/scripts/handoff.sh carry` → les pendings **non-git** à reporter *(read-only)*.
2. Rédige la note d'après [`references/handoff-template.md`](references/handoff-template.md)
   — **ouvre par « En clair »** (règle
   [`human-facing-lisibility`](../../rules/documentation-guidelines/human-facing-lisibility.md)).
   **Chat** : Markdown seul — jamais `<details>`, `<summary>` ni HTML brut (le terminal les
   affiche tels quels) ; le détail va en bas, sous un titre. Une fiche se cite par son
   **titre + lien**, jamais par son id nu.
3. **Si — et seulement si — la sous-commande est `run`/`close`** :
   - **mémoire projet** : les faits durables non-dérivables du repo (dates relatives
     converties en absolues) ; ne mémorise pas ce que le repo encode déjà ;
   - persiste la note :
     ```bash
     bash <skill>/scripts/handoff.sh add "<date> — <titre> — clôture ezk-archive" <<'EOF'
     …
     EOF
     ```
   - **machine jetable** — si la ligne `HANDOFF:` du gate porte `durable=0` (session cloud,
     conteneur recyclé), écris AUSSI la copie versionnée, avec le même corps :
     `bash <skill>/scripts/handoff.sh durable "<date> — <titre>"`. Elle atterrit dans
     `docs/sessions/`. Propose le commit `docs(sessions): handoff <date>` et dis en toutes lettres
     qu'il faut le **pousser** avant de fermer : sans push, la copie disparaît avec le conteneur.
     Tu ne commites ni ne pousses jamais toi-même ;
   - **8. Archive session** — si `SPRINT.md` existe à la racine **et** a du contenu réel
     (pas un stub vide) :
     - copier vers `docs/sessions/YYYY-MM-DD-<slug>.md` (créer `docs/sessions/` si besoin ;
       en cas de collision de nom, suffixer `-2`, `-3`… — **ne jamais écraser**) ;
     - **si la session a travaillé une ou plusieurs fiches** : **entête `fiches: <id>[,<id>]`**
       en tête du récit (première ligne, avant le titre) — le ou les ids de fiche backlog
       travaillés dans la session, c'est ce qui rend le récit **rapprochable** de sa/ses
       feature(s) (`grep -rl <id> docs/sessions/`, `git log --grep=<id>`, convention
       `feat/<id>-<slug>` — ADR-0018). **Les ids sont ceux de `--worked`** (livrées ou non) ;
       **session sans fiche** (`--worked none`) → **pas d'entête**, ne jamais inventer d'id
       (même interdiction que le reste des faits de session) ;
     - si `SPRINT.md` porte une section **`## Galères & gestes (labo)`** avec du contenu
       (pas vide) : la **reprendre telle quelle** dans le récit sous le même titre
       `## Galères & gestes (labo)` — c'est le moment où « corrigé + validé » est vrai
       par construction (la clôture), aucun nouveau déclencheur à inventer ; section
       vide ou absente → ne rien ajouter (même garde-fou qu'`ezk-retro` : rien à
       retenir → on n'écrit rien) ;
     - proposer le commit : `docs(sessions): archive session YYYY-MM-DD <slug>`
       (ne pas committer à l'aveugle — laisser la main à l'utilisateur) ;
     - **laisser `SPRINT.md` en place** (scratch éphémère du sprint) ;
     - le handoff **pointe** vers le chemin d'archive (`**Archive session :** …`) —
       **ne duplique pas** le corps de `SPRINT.md` dans la note.
   - **9. Carnet de rétro (best-effort)** — invite la session à déposer une note **si** une
     friction ou une idée durable mérite d'atteindre la prochaine rétro. Une commande suffit, sans
     commit ni PR : `ezk retro note "<titre>" [--type friction|idée|problème] <<< "<corps>"`. La note
     va dans le dossier git commun à tous les worktrees : elle survit à la suppression de celui-ci.
     Corps auto-porteur : chemins et commits explicites, aucun renvoi « voir plus haut ». C'est le
     carnet lu au temps 1 du skill `ezk-retro` (fiche 0081, fiche 20261003105820077). **Rien de durable à noter → n'écris rien** (même garde-fou que « Galères & gestes
     (labo) »). Best-effort assumé : la garantie déterministe (hook) attend la fiche 0077.
4. Rends la note + le verdict **✅ archivable** — **En clair d'abord** (≤ 3 phrases),
   puis le corps gabarit. Sur `check`, dis que rien n'a été écrit et que `run` le ferait.
5. **Ménage** — si `branch_absorbed` ou `worktree_prunable` sont non nuls, ou si la machine
   porte beaucoup de worktrees d'agents, propose `bash <skill>/scripts/check.sh --cleanup` :
   l'inventaire des worktrees et branches sûrs à retirer, avec la commande exacte de chacun. Il
   ne supprime **rien**. Chaque `git branch -D` proposé cite sa preuve (`proof=merged:origin/main` ou
   `proof=content:<base>`) : c'est la commande qui réussira depuis ce worktree, même en retard. Montre la liste au PO ; ne lance que ce qu'il valide, **une commande par appel**.
   En mode auto, Claude Code peut bloquer ce listage comme « git destructif » (vu le 2026-10-03,
   [fiche du ménage en mode auto](../../../../features/20261003105820099_menage-archive-lancable-mode-auto.md)) :
   donne alors la commande à l'utilisateur, qui la lance dans son terminal.
   Les worktrees que les agents de CETTE session viennent de laisser ont moins de 24 h : le ménage
   les garde (« recent »). Une fois certain qu'aucun agent ne tourne encore, relance avec
   `EZK_CLEANUP_IDLE_HOURS=0` pour les proposer.

#### `VERDICT: DIRTY points=…` → tu délègues, scopé

Appelle l'outil **Agent** avec `subagent_type: "ezk-archive"`, `run_in_background: false`,
**modèle léger par défaut** ; `model: "claude-opus-4-8"` seulement si le bloc gate contient un
fait de jugement (section Modèle ci-dessus),
et un prompt **autonome** contenant :

- la sous-commande (`check` ou `run`) et le chemin du repo (cwd) ;
- le **résumé de session** de l'étape 1 ;
- **le bloc gate collé verbatim** — il a déjà payé la dérivation, la refaire est une faute.
  Il porte `worked=` sur la ligne `P3_BACKLOG` : c'est de là que l'agent tire l'en-tête
  `fiches:` du récit, y compris pour une fiche travaillée et non livrée ;
- la phrase de scope :

> `SCOPE : traite les points de contrôle <liste>. Les autres points de contrôle sont`
> `PROUVÉS CLEAN par le portier — les re-dériver est une faute (token-economy/read-once).`
> `Les points d'écriture 5 (mémoire), 6 (handoff), 7 (verdict), 8 (archive session),`
> `9 (carnet de rétro best-effort) sont TOUJOURS de ton ressort.`
> `Restitution : ouvre par « En clair » (≤ 3 phrases) avant tout tableau —`
> `human-facing-lisibility.`

Puis **restitue la réponse de l'agent telle quelle** (elle doit déjà ouvrir par En clair ;
si ce n'est pas le cas, préfixe toi-même un En clair de 3 phrases puis colle le reste).

## Intégration

- **`ezk-backlog`** : le sous-agent lui délègue `ship`/`add`/`regen`
  — **uniquement si le point 3 est DIRTY** (c'est le geste le plus cher de la chaîne) ;
  la note de handoff renvoie vers `list`. **Délégation optionnelle** (`delegates:`, pas `composes:`) :
  si `ezk-backlog` n'est pas installé dans le profil, ne livre rien toi-même — nomme dans le rapport
  les fiches à livrer, verdict `pending`, et laisse l'humain lancer `ship`.
- **`ezk-sprint`** : complémentaire — le sprint *ouvre, déroule et ferme* (`start` / `close`,
  qui scelle l'incrément dans `SPRINT.md`), ezk-archive ferme la *session*. Typiquement invoqué
  **après** le `close` du dernier sprint de la session. À la clôture `run`/`close`, archive un
  snapshot de `SPRINT.md` (tous les incréments scellés de la session y figurent) dans
  `docs/sessions/` (voir `docs/sessions/README.md` du projet).
- **`ezk-commits`** : tout commit produit suit les Conventional Commits.
- **`ezk-product-build`** : à ses pauses inter-sprint, il **rappelle** que
  `/ezk-archive` est disponible — il ne réimplémente rien du handoff ni de
  l'archive `docs/sessions/`.

## Garde-fous (skill)

- **Ne juge jamais toi-même** une branche RÉELLE (brouillon supersédé ou travail à
  récupérer ?) ni une divergence de `main` : c'est ce qui se délègue. Si tu te surprends
  à trancher un cas comme ceux-là dans la conversation principale, arrête-toi et délègue.
- **`check` n'écrit jamais**, quel que soit le verdict : ni handoff, ni `.gitignore`, ni
  mémoire. Un dry-run qui modifie le dépôt n'est plus un dry-run.
- **Ne relis jamais la note de handoff** : `handoff.sh carry` en rend la seule partie
  utile, bornée. Le lire en entier (20 Ko, deux fois par run) est ce que la fiche 0088 a
  supprimé — et c'est une violation directe de `rules/token-economy/read-once.md`.
- **Ne re-dérive jamais un point que le gate a prouvé CLEAN**, ni dans la conversation,
  ni en le redemandant au sous-agent.
- **Ne recopie pas le gabarit ici** : il vit dans `references/handoff-template.md`.
- **Toujours fournir le résumé de session** au sous-agent quand tu délègues : sans lui,
  il ne voit que l'état git, pas ce qui a été décidé/appris/livré.
- **Ne ferme jamais un sprint** : sceller l'incrément, c'est `ezk-sprint close` (ADR-0054). Ici on ferme la session.
- **Une session vide ne coûte presque rien** : sur `FASTPATH: EMPTY` et sans fait durable, une ligne,
  aucune note, aucun sous-agent. Ne déroule jamais la clôture complète « par habitude ».
- **Le ménage ne supprime jamais tout seul** : `check.sh --cleanup` liste, le PO valide, une
  commande par appel. Un worktree d'une autre session vivante ne se retire jamais.
- **Ne merge/push rien toi-même** ; ça reste à l'utilisateur de trancher.
- **PRs déjà ouvertes (fiche 0185)** : si un fait gate `branch REAL … pr=#N` (ou
  rendu `→ PR #N`) existe, **ne propose jamais** d'ouvrir une nouvelle PR sur
  cette branche — pointe vers `#N`. Si `P2_PENDING: UNKNOWN` (gh indisponible),
  **ne propose pas** non plus d'ouvrir une PR : demande une vérif `gh pr list`
  à l'humain d'abord.
