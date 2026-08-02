---
name: ezk-commits
argument-hint: "[help|commit|hook|check]"
description: Help write Conventional Commits messages and set up a commit-msg
  hook. Use when the user wants to commit code, asks for help with commit message
  format, mentions "conventional commit", or wants to enforce commit format in a
  project. Also triggers after implementing a feature or fix when the user asks
  to create a commit.
---

# ezk-commits

Tu aides à rédiger des messages de commit au format **Conventional Commits
v1.0.0** et à installer la validation automatique via un hook git.

## Usage (sous-commandes)

`/ezk-commits [sous-commande] [args]` — ou en langage naturel (« commit ça »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau d'usage |
| `commit` (**défaut** pour une demande en langage naturel) | Analyse le diff stagé, infère type+scope, propose un message, puis commite après validation |
| `hook` | Installe le hook git `commit-msg` qui enforce le format (une fois par projet) |
| `check <message>` | Valide un message existant contre le pattern et explique ce qui cloche |

> **Help** : invoquée sans sous-commande (ou avec `help`/`?`), affiche ce tableau. Une demande en langage naturel (« commit ça ») lance `commit`. Sous-commande non reconnue → traite la demande en prose (la skill reste pilotable naturellement).

## Format

```
type(scope?)[!]?: description courte (≤ 100 chars)

[corps optionnel — contexte, pourquoi]

[footer: Co-Authored-By: ..., Fixes #123, BREAKING CHANGE: ...]
```

**Types :** `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`  
**Breaking change :** `feat!:` ou footer `BREAKING CHANGE:`

## Flux principal — rédiger + committer

1. **Analyse le diff stagé** avant de proposer quoi que ce soit :
   ```bash
   git diff --cached --stat
   git diff --cached
   ```
2. **Infère** le type (feat/fix/refactor/…) et le scope (nom du module, fichier,
   domaine) depuis le diff. Ne demande pas si c'est évident.
3. **Propose** un message de commit court et précis. Si hésitation entre deux
   types, présente les deux et explique.
4. **Attends** la validation ou l'ajustement de l'utilisateur.
5. **Exécute** le commit :
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): description

   [body si pertinent]

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

## Règles de rédaction

- Description en **anglais**, minuscule, sans point final
- Scope = nom du module / fichier / domaine touché (ex: `playlist`, `inbox`,
  `api`, `ui`, `deps`). Omis si le changement est vraiment global.
- Corps = **pourquoi**, pas ce qui est dans le diff (le diff dit déjà "quoi")
- Sujet ≤ 100 chars — si trop long, déplacer le détail dans le corps
- `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` quand Claude
  a écrit ou co-écrit le code

## Installer le hook (une fois par projet)

Si l'utilisateur veut enforcer le format automatiquement :

```bash
# 1. Créer le dossier
mkdir -p .githooks

# 2. Créer le hook (coller le contenu ci-dessous dans .githooks/commit-msg)
chmod +x .githooks/commit-msg

# 3. Activer
git config core.hooksPath .githooks

# 4. Committer
git add .githooks/commit-msg
git commit -m "chore(git): add commit-msg hook enforcing Conventional Commits"
```

**Contenu de `.githooks/commit-msg` :**

```bash
#!/usr/bin/env bash
# commit-msg hook — enforces Conventional Commits v1.0.0
MSG_FILE="$1"
MSG=$(head -1 "$MSG_FILE")

[[ "$MSG" =~ ^Merge[[:space:]] ]] && exit 0
[[ "$MSG" =~ ^Revert[[:space:]] ]] && exit 0

TYPES="feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
PATTERN="^(${TYPES})(\\([^()]+\\))?(!)?: .{1,100}$"

if ! echo "$MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "  ✗  Commit message does not follow Conventional Commits format."
  echo ""
  echo "     Format :  type(scope): short description   (max 100 chars)"
  echo "     Types  :  feat | fix | docs | style | refactor | perf"
  echo "                test | build | ci | chore | revert"
  echo "     Breaking:  feat!: ... or feat(scope)!: ..."
  echo ""
  echo "     Examples:"
  echo "       feat(auth): add OAuth2 login"
  echo "       fix(api): handle null response from upstream"
  echo "       chore(deps): update fastapi to 0.115"
  echo ""
  echo "     Got: \"$MSG\""
  echo ""
  exit 1
fi
exit 0
```

**Ajouter dans CLAUDE.md** (setup post-clone) :

```markdown
## Setup post-clone
```bash
git config core.hooksPath .githooks   # active le hook commit-msg
```
```

## Valider un message existant

Si l'utilisateur passe un message à vérifier, applique le pattern :
`^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^()]+\))?(!)?: .{1,100}$`

Si invalide, explique précisément ce qui cloche et propose une correction.

## Exemples de bons messages

```
feat(playlist): suppress deleted samples from re-syncing after poll
fix(inbox): resolve HTTP 530 with fire-and-forget audience submit
refactor(inbox): replace popover with inline header controls
style(plugins): remove redundant "Installé" badge from plugin cards
chore(git): add commit-msg hook enforcing Conventional Commits
docs(readme): add setup instructions for local dev
test(api): add regression tests for TestSprintXSuppressedItems
perf(sync): run yt-dlp in thread pool to avoid blocking event loop
build(deps): bump fastapi from 0.110 to 0.115
ci(github): add matrix test job for Python 3.11 and 3.12
```

## À ne pas faire

- `Update stuff` → pas de type
- `fix: Fixed the bug in the inbox that was causing the 530 error to appear` → trop long, trop verbeux
- `feat: Ajout de la fonctionnalité` → description en français
- `FEAT: add thing` → type en majuscules

## Identité git pour les commits automatisés (agents / cop1)

> **Règle non négociable (0176)** : le `~/.gitconfig` global appartient **toujours**
> à l'humain. Un agent/script ne doit **jamais** faire :
>
> ```bash
> # ❌ INTERDIT
> git config --global user.name "..."
> git config --global user.email "..."
> ```

### Patterns autorisés

| Scope | Commande |
|---|---|
| **One-shot** (**défaut**) | `git -c user.name="cop1 CI" -c user.email="ci@cop1.local" commit …` |
| **Variables d'env** | `GIT_AUTHOR_NAME="cop1 CI" GIT_AUTHOR_EMAIL="ci@cop1.local" GIT_COMMITTER_NAME="cop1 CI" GIT_COMMITTER_EMAIL="ci@cop1.local" git commit …` |
| **Local au repo/worktree** (exception) | `git config user.name "cop1 CI"` *(sans `--global`)* **uniquement** dans un worktree jetable de PR auto |

Préférer one-shot / env : un `git config` local écrit dans le `.git/config` du checkout
courant — si l'agent se trompe de dossier, il détourne l'identité humaine sur tout le
repo, plus discrètement qu'une pollution globale. Le scope local reste OK pour la
traçabilité cop1 sur une PR de nuit, **jamais** sur le checkout principal de l'humain.

## Frontière

Tu fournis le **titre** conventional-commit (et le hook). Tu **ne rédiges pas** le
corps de PR — c'est l'étape PR d'`ezk-sprint` (règle `human-facing-lisibility`).
