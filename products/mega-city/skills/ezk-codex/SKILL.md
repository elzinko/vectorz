---
composes: [ezk-commits]
name: ezk-codex
argument-hint: "[help|fix|check] [PR]"
description: >-
  Adresse les retours du reviewer Codex sur une PR, de bout en bout, sans les
  retaper à la main. A utiliser quand l'utilisateur veut « fix les retours
  codex », « adresse / traite les commentaires Codex de la PR X », « Codex a
  commenté ma PR », « corrige ce que Codex a relevé », ou après un `@codex
  review` qui a laissé des findings. Pilotable par sous-commandes : help, fix
  (la boucle complète : récupère les fils Codex non résolus + reviews, écarte
  le cas 👍 « RAS », les classe P0/P1/P2 + file:line, pour chacun CORRIGE ou
  DÉCLINE, commit conventional scopé, push, puis RÉPOND en fil et RÉSOUT chaque
  fil traité (le décliné à la décision, le corrigé après le push), re-déclenche
  `@codex review`, attend le verdict de façon BORNÉE, rapporte), check (liste les fils Codex non résolus +
  le verdict courant sans rien écrire). Garde-fou de tête : STAND-DOWN avant
  toute écriture (PR déjà mergée/fermée, branche pilotée par un autre worktree,
  commits d'une autre session apparus) → ne rien pousser, rapporter, rendre la
  main. Cross-repo (samplerz, muti… tout repo GitHub avec Codex branché).
  N'EST PAS le merge (ça reste `ezk-pr ship` / décision explicite) ni la revue
  initiale (le premier `@codex review` avant-merge reste décrit par `ezk-sprint`) ;
  `ezk-sprint` et `ezk-pr` la COMPOSENT au lieu de re-décrire le handling Codex.
---

# ezk-codex

**En clair.** Codex laisse des commentaires sur une PR ; ce skill les récupère,
les corrige (ou les décline avec une raison), relance Codex et te dit si c'est
bon à merger. Tu ne retapes plus « fix les retours codex » à chaque fois — et il
refuse de foncer si quelqu'un d'autre pilote déjà la PR.

> Politique de restitution ezk : ouvre toute sortie par un **« En clair »** ≤ 3
> phrases (règle `human-facing-lisibility`).

## Usage (sous-commandes)

`/ezk-codex [sous-commande] [PR]` — ou en langage naturel (« fix les retours
codex de la PR 343 »). `[PR]` = numéro ou URL ; **par défaut, la PR de la branche
courante**.

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou sans argument) | Affiche ce tableau — ne lance rien |
| `fix` (**défaut** en langage naturel) | Déroule la boucle complète d'adressage (étapes 1→6 ci-dessous) |
| `check` | **Lecture seule** : liste les fils Codex non résolus (requête de l'étape 1) + le verdict courant, sans rien écrire ni pousser |

## Frontière (ce que ce skill ne fait PAS)

- **Ne merge pas.** Le merge reste à `ezk-pr ship` ou à une décision explicite du
  user. `ezk-codex` amène la PR à « verte + Codex clair », pas plus loin.
- **Ne fait pas la revue initiale.** Le premier `@codex review` (trigger
  avant-merge) reste décrit par `ezk-sprint`. Ici on intervient **après**, pour
  adresser des findings existants.

## La boucle `fix` (6 étapes)

### 0. STAND-DOWN — garde-fou de tête, AVANT toute écriture

Ne jamais écrire sur une PR qu'on ne pilote pas. Vérifie, dans l'ordre :

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
# a) PR déjà mergée / fermée ?
gh pr view "$PR" --repo "$REPO" --json state,headRefName,headRefOid \
  -q '"\(.state) \(.headRefName) \(.headRefOid)"'
# b) la branche est-elle sortie dans un AUTRE worktree ?
git worktree list
# c) de nouveaux commits d'un autre auteur depuis mon dernier fetch ?
git fetch origin "$HEAD_BRANCH" --quiet && \
  git log --oneline -5 "origin/$HEAD_BRANCH"
```

- `state != OPEN` (MERGED/CLOSED), **ou** la branche est checkout dans un worktree
  qui n'est pas le tien, **ou** le HEAD distant a avancé avec des commits d'un
  autre auteur/session → **STAND-DOWN** : ne rien pousser, rapporter la collision
  (qui pilote, quel commit), rendre la main. (Leçon PR #343 — ADR-0024.)
- Sinon → continue.

### 1. Récupérer les findings

```bash
# Fils NON résolus ouverts par Codex (le gros des findings). Un fil résolu n'est
# jamais re-traité : un `fix` relancé ne repasse pas sur ce qui est déjà clos.
OWNER=${REPO%/*}; NAME=${REPO#*/}
gh api graphql -f owner="$OWNER" -f name="$NAME" -F pr="$PR" -f query='
query($owner:String!,$name:String!,$pr:Int!){
  repository(owner:$owner,name:$name){ pullRequest(number:$pr){
    reviewThreads(first:100){ nodes{
      id isResolved
      comments(first:1){ nodes{ databaseId path line originalLine body author{ login } } }
    } } } } }' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[]
        | select(.isResolved==false)
        | select(.comments.nodes[0].author.login=="chatgpt-codex-connector")
        | {threadId:.id, commentId:.comments.nodes[0].databaseId,
           path:.comments.nodes[0].path,
           line:(.comments.nodes[0].line // .comments.nodes[0].originalLine),
           body:.comments.nodes[0].body}'
# Reviews + éventuels issue comments (verdict global, cas « 👍 RAS ») :
gh pr view "$PR" --repo "$REPO" --json reviews,comments
```

- **Garde les deux ids de chaque finding.** `threadId` (id GraphQL du fil) sert à le
  **résoudre**. `commentId` (id REST du 1er commentaire du fil) sert à **répondre**.
- En GraphQL, l'auteur du bot s'écrit `chatgpt-codex-connector`, **sans** `[bot]`
  (contrairement à l'API REST).
- La requête lit 100 fils. Au-delà (rare), pagine avec `pageInfo`.
- **Cas 👍 « RAS »** : si Codex n'a laissé qu'une réaction 👍, ou aucun fil non résolu
  → rien à corriger, saute à l'étape 6 (rapport « clair »).
- Chaque finding porte un **badge de sévérité** (`P0`/`P1`/`P2`) et une ancre
  `path:line`. Classe-les P0 → P2.

### 2. Juger chaque finding — CORRIGER ou DÉCLINER

C'est le **jugement LLM**. Pour chaque finding :

- **Légitime** → lis le fichier ciblé, applique la correction minimale et exacte.
  Ne sur-corrige pas ; reste dans le périmètre du finding. **Ne réponds pas et ne
  résous pas encore** : la réponse cite le commit, qui n'existe qu'après le push
  (étape 4). Garde `threadId` + `commentId` pour la clore là.
- **Faux positif / hors-sujet** → **décline explicitement** (jamais en silence) :
  pose un 👎, puis **clos le fil tout de suite** avec la raison. Aucun commit à attendre.

Le **même geste clôt tout fil traité**, corrigé comme décliné : **répondre dans le fil,
puis le marquer `resolved`**. Les deux appels vont ensemble.

```bash
# COMMENT_ID et THREAD_ID viennent de l'étape 1.
# Décliné seulement — marquer le désaccord (👎 sur le commentaire de review) :
gh api --method POST "repos/$REPO/pulls/comments/$COMMENT_ID/reactions" \
  -H "Accept: application/vnd.github+json" -f content="-1"
# Clore un fil traité (corrigé OU décliné) = 1) répondre en fil, 2) le résoudre.
# REPLY = "Décliné : <raison courte et factuelle>."  ou  "Corrigé en `<sha>` : <ce qui a changé>."
gh api "repos/$REPO/pulls/$PR/comments/$COMMENT_ID/replies" -f body="$REPLY"
gh api graphql -f threadId="$THREAD_ID" -f query='
mutation($threadId:ID!){
  resolveReviewThread(input:{threadId:$threadId}){ thread{ id isResolved } }
}' --jq '.data.resolveReviewThread.thread.isResolved'   # doit afficher true
```

Si la réponse ou la résolution échoue (droits, réseau), **ne l'avale pas** : note le fil
resté ouvert et rapporte-le à l'étape 6. Si la réponse est partie mais pas la résolution,
**relance seulement la mutation** : ne reposte pas la réponse. Au `fix` suivant, ouvre le fil
avant de répondre : s'il porte déjà ta réponse, résous-le sans répondre une seconde fois.

### 3. Commit conventional, scopé

- `git add` **fichier par fichier énuméré** — jamais un dossier en bloc (évite
  d'embarquer des éditions en cours). `git status` de contrôle avant commit.
- Message conventional, qui **cite le retour Codex** :

```
docs(scope)|fix(scope): <quoi> — <finding adressé>

Retour Codex (PR #<PR>) : <résumé du finding et du correctif>.

Co-Authored-By: Claude <modèle> <noreply@anthropic.com>
```

### 4. Push, clore les fils corrigés, puis re-déclencher Codex

```bash
git push origin "$HEAD_BRANCH"
```

**Push réussi** → clos chaque fil **corrigé** avec le bloc « Clore un fil » de l'étape 2,
`REPLY="Corrigé en \`$(git rev-parse --short HEAD)\` : <ce qui a changé>."`. Si tu as fait un
commit par finding, cite le commit propre au finding plutôt que le HEAD poussé.
**Push échoué** → ne résous rien : le fil resterait « resolved » sans correction publiée.
Rapporte l'échec (étape 6).

```bash
gh pr comment "$PR" --repo "$REPO" \
  --body "@codex review

Corrigé en \`$(git rev-parse --short HEAD)\` : <ce qui a été traité / décliné>."
```

### 5. Attendre le verdict — BORNÉ et TESTÉ

Sonde le nouveau verdict par rapport à un **baseline** = timestamp de la dernière
review Codex AVANT le push. Essais **comptés** (pas de `sleep` infini), erreurs
**non avalées**. Pattern vérifié :

```bash
BASELINE="<submittedAt de la dernière review Codex avant push>"
for i in $(seq 1 8); do
  NEW=$(gh pr view "$PR" --repo "$REPO" --json reviews \
    | jq --arg b "$BASELINE" '[.reviews[]
        | select(.author.login=="chatgpt-codex-connector")
        | select(.submittedAt > $b)] | length') || { echo "PROBE-ERROR $i"; break; }
  [ "${NEW:-0}" -gt 0 ] && { echo "VERDICT-READY (essai $i)"; break; }
  echo "essai $i/8 : pas encore de verdict"; [ "$i" -lt 8 ] && sleep 45
done
```

- **Verdict = clair** si : réaction 👍 sur le trigger **ou** nouvelle review **sans
  nouveau finding** sur le HEAD courant.
- **Nouveau finding différent** → on peut le traiter **une fois** (retour étape 2),
  dans la limite de **~2 rounds**.
- **Finding qui récidive à l'identique** après un fix conforme, **ou** 3ᵉ round →
  **STOP** : jamais de re-reviews en série. Escalade au user avec l'état exact.
- **Timeout de la sonde** (~6 min) → rapporte « verdict Codex en attente (borné
  atteint) », rends la main.

### 6. Rapport — format checkpoint

Toujours finir par :

- **État** : findings corrigés (avec `file:line`), déclinés (+ raison), **fils clos
  parmi les traités**, verdict Codex.
- **Contrôle des fils** : rejoue la requête de l'étape 1. **Aucun `threadId` traité ne
  doit y réapparaître.** Un fil traité resté ouvert (appel en échec, push échoué) = **pas**
  « prêt à merger » : liste-le. Un fil **nouveau** vient d'un nouveau finding du re-review :
  c'est un retour à traiter (étape 2, dans la limite des rounds), pas un oubli.
- **Qui a la main** : toi / Codex (revue en vol) / le user (décision de merge, collision).
- **Prochaine action** : « prêt à merger » (→ `ezk-pr ship`) **seulement avec 0 fil traité
  non résolu**, ou l'attente bornée précise, ou le point de collision à trancher.

## Garde-fous (rappel)

- **Stand-down d'abord** — on n'écrit jamais sur une PR pilotée ailleurs (étape 0).
- **Décline, n'ignore pas** — tout faux positif reçoit une réponse + 👎 + raison.
- **Clos chaque fil traité** — corrigé comme décliné : réponse en fil, puis `resolved`.
  Un fil **corrigé** n'est clos qu'**après** un commit **et** un push réussis.
- **Ne traite que les fils non résolus** — jamais deux fois le même fil, jamais de
  réponse en double sur un `fix` relancé.
- **Sonde bornée et testée** — jamais de `sleep` non borné, jamais d'erreur avalée
  (`|| echo pending` en boucle = boucle infinie silencieuse — proscrit).
- **Anti-boucle** — cap ~2 rounds ; récidive identique = stop + escalade.
- **Commits scopés** — `git add` par fichiers énumérés, `git status` de contrôle.
- **Ne merge jamais** — c'est la frontière (voir plus haut).

## Composition / voisinage

- **`ezk-sprint`** (étape 10 « avant de merger ») **délègue** l'adressage des
  findings Codex à `ezk-codex fix` au lieu de le re-décrire.
- **`ezk-pr` / `ezk-pr`** (`ship`) l'appelle avant le squash-merge : PR verte
  **et** Codex clair, puis merge côté `pr`.
- **`ezk-commits`** — pour la forme du message conventional.

C'est le même idiome que le reste de la famille : une capacité fine que les
orchestrateurs composent (ADR-0020, ADR-0012). Décision fondatrice : **ADR-0024**.

## Suivi (polish noté, hors v1)

Extraire les parties mécaniques/sûreté en `scripts/` **testés** (façon
`ezk-archive/scripts/`) : `standdown.sh` (portier de collision), `verdict.sh`
(sonde bornée), `findings.sh` (fetch + normalisation JSON), `close-thread.sh`
(réponse + résolution d'un fil, avec contrôle de `isResolved`). v1 les garde inline
dans ce playbook — « POC fonctionnel d'abord, polissage ensuite ».

Piste notée : `resolveReviewThread` accepte un `resolutionReason` facultatif
(`ADDRESSED`, `WONT_FIX`, `INVALID`), vérifié dans le schéma GitHub. Il distinguerait
corrigé et décliné à l'œil dans la PR. Non utilisé en v1 : pas encore rejoué sur un fil vivant.
