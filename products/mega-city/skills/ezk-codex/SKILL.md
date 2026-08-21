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
  (la boucle complète : récupère les findings inline + reviews, écarte le cas
  👍 « RAS », les classe P0/P1/P2 + file:line, pour chacun CORRIGE ou DÉCLINE
  avec raison postée + 👎, commit conventional scopé, push, re-déclenche
  `@codex review`, attend le verdict de façon BORNÉE, rapporte), check (lit le
  verdict Codex courant sans rien écrire). Garde-fou de tête : STAND-DOWN avant
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
| `check` | **Lecture seule** : liste les findings Codex ouverts + le verdict courant, sans rien écrire ni pousser |

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
# Commentaires inline de Codex (le gros des findings) :
gh api "repos/$REPO/pulls/$PR/comments" --paginate \
  --jq '.[] | select(.user.login=="chatgpt-codex-connector[bot]")
        | {id, path, line:(.line // .original_line), body}'
# Reviews + éventuels issue comments (verdict global, cas « 👍 RAS ») :
gh pr view "$PR" --repo "$REPO" --json reviews,comments
```

- **Cas 👍 « RAS »** : si Codex n'a laissé qu'une réaction 👍 (pas de finding) →
  rien à corriger, saute à l'étape 6 (rapport « clair »).
- Chaque finding porte un **badge de sévérité** (`P0`/`P1`/`P2`) et une ancre
  `path:line`. Classe-les P0 → P2.

### 2. Juger chaque finding — CORRIGER ou DÉCLINER

C'est le **jugement LLM**. Pour chaque finding :

- **Légitime** → lis le fichier ciblé, applique la correction minimale et exacte.
  Ne sur-corrige pas ; reste dans le périmètre du finding.
- **Faux positif / hors-sujet** → **décline explicitement** (jamais en silence) :
  réponds en fil du commentaire + pose un 👎, avec la raison.

```bash
# Répondre en fil d'un commentaire inline (id récupéré à l'étape 1) :
gh api "repos/$REPO/pulls/$PR/comments/$COMMENT_ID/replies" \
  -f body="Décliné : <raison courte et factuelle>."
# Marquer le désaccord (👎 sur le commentaire de review) :
gh api --method POST "repos/$REPO/pulls/comments/$COMMENT_ID/reactions" \
  -H "Accept: application/vnd.github+json" -f content="-1"
```

### 3. Commit conventional, scopé

- `git add` **fichier par fichier énuméré** — jamais un dossier en bloc (évite
  d'embarquer des éditions en cours). `git status` de contrôle avant commit.
- Message conventional, qui **cite le retour Codex** :

```
docs(scope)|fix(scope): <quoi> — <finding adressé>

Retour Codex (PR #<PR>) : <résumé du finding et du correctif>.

Co-Authored-By: Claude <modèle> <noreply@anthropic.com>
```

### 4. Push, puis re-déclencher Codex

```bash
git push origin "$HEAD_BRANCH"
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

- **État** : findings corrigés (avec `file:line`), déclinés (+ raison), verdict Codex.
- **Qui a la main** : toi / Codex (revue en vol) / le user (décision de merge, collision).
- **Prochaine action** : « prêt à merger » (→ `ezk-pr ship`), ou l'attente bornée
  précise, ou le point de collision à trancher.

## Garde-fous (rappel)

- **Stand-down d'abord** — on n'écrit jamais sur une PR pilotée ailleurs (étape 0).
- **Décline, n'ignore pas** — tout faux positif reçoit une réponse + 👎 + raison.
- **Sonde bornée et testée** — jamais de `sleep` non borné, jamais d'erreur avalée
  (`|| echo pending` en boucle = boucle infinie silencieuse — proscrit).
- **Anti-boucle** — cap ~2 rounds ; récidive identique = stop + escalade.
- **Commits scopés** — `git add` par fichiers énumérés, `git status` de contrôle.
- **Ne merge jamais** — c'est la frontière (voir plus haut).

## Composition / voisinage

- **`ezk-sprint`** (étape 10 « avant de merger ») **délègue** l'adressage des
  findings Codex à `ezk-codex fix` au lieu de le re-décrire.
- **`ezk-pr` / `ezk-pr-pilot`** (`ship`) l'appelle avant le squash-merge : PR verte
  **et** Codex clair, puis merge côté `pr`.
- **`ezk-commits`** — pour la forme du message conventional.

C'est le même idiome que le reste de la famille : une capacité fine que les
orchestrateurs composent (ADR-0020, ADR-0012). Décision fondatrice : **ADR-0024**.

## Suivi (polish noté, hors v1)

Extraire les parties mécaniques/sûreté en `scripts/` **testés** (façon
`ezk-archive/scripts/`) : `standdown.sh` (portier de collision), `verdict.sh`
(sonde bornée), `findings.sh` (fetch + normalisation JSON). v1 les garde inline
dans ce playbook — « POC fonctionnel d'abord, polissage ensuite ».
