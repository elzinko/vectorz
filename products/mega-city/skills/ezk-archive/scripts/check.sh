#!/usr/bin/env bash
# ezk-archive — diagnostics de clôture READ-ONLY (cf. SKILL.md, sous-commande `check`).
# Rassemble les faits du rapport de clôture SANS rien modifier :
#   working tree, stashes, PRs ouvertes, branches non-mergées, ADR touchés.
#
# Usage : bash check.sh [base]     (base auto-détectée : main → master → HEAD)
#
# Strictement read-only : uniquement des lectures git/gh. Ne commite, push ni merge
# JAMAIS. Idempotent. Détecte tout seul l'absence de remote (repo local-only).

set -uo pipefail

# --- localiser le dépôt -------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2
  exit 2
fi
cd "$(git rev-parse --show-toplevel)" || exit 2

# --- branche de base + branche courante --------------------------------------
BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  for b in main master; do
    if git show-ref --verify --quiet "refs/heads/$b"; then BASE="$b"; break; fi
  done
fi
[[ -z "$BASE" ]] && BASE="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo HEAD)"
CUR="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD)"

echo "# ezk-archive — rapport de clôture (read-only)"
echo "branche courante : $CUR   ·   base : $BASE"
echo

# --- disponibilité remote / gh -----------------------------------------------
HAS_REMOTE=0
[[ -n "$(git remote 2>/dev/null)" ]] && HAS_REMOTE=1
HAS_GH=0
command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1 && HAS_GH=1

# --- 1. working tree ----------------------------------------------------------
echo "## 1. Working tree"
# -uall : déplie les dossiers untracked (un ADR dans un dossier neuf reste visible
# fichier-par-fichier, pas replié en `?? dir/`) — cohérent avec le but « ne rien perdre ».
PORC="$(git status --porcelain -uall 2>/dev/null)"
if [[ -z "$PORC" ]]; then
  echo "✓ propre (rien d'uncommitted/untracked)."
else
  echo "⚠ changements non commités / non suivis :"
  echo "$PORC" | sed 's/^/    /'
fi
STASH="$(git stash list 2>/dev/null)"
if [[ -n "$STASH" ]]; then
  echo "⚠ stash(es) en attente :"
  echo "$STASH" | sed 's/^/    /'
else
  echo "✓ aucun stash orphelin."
fi
echo

# --- 2. PRs & branches non-mergées -------------------------------------------
echo "## 2. PRs & branches en attente"
if [[ "$HAS_REMOTE" -eq 1 && "$HAS_GH" -eq 1 ]]; then
  PRS="$(gh pr list --state open \
        --json number,title,headRefName,isDraft \
        --jq '.[] | "    #\(.number) \(.headRefName) — \(.title)\(if .isDraft then " [draft]" else "" end)"' \
        2>/dev/null)"
  if [[ -n "$PRS" ]]; then echo "⚠ PRs ouvertes :"; echo "$PRS"; else echo "✓ aucune PR ouverte."; fi
elif [[ "$HAS_REMOTE" -eq 1 ]]; then
  echo "ℹ remote présent mais gh indisponible/non authentifié — vérifie les PRs à la main."
else
  echo "ℹ repo local-only (pas de remote) — pas de PRs ; on s'appuie sur les branches locales."
fi

# Sur un repo à convention SQUASH-MERGE, `git branch --no-merged` ment : les commits
# de branche ne sont jamais ancêtres de la base, donc les branches restent signalées
# « non-mergées » alors que 100 % de leur contenu est livré (fiche 0076). Classification
# DÉTERMINISTE (le script prouve, le LLM ne devine pas — ADR-0001) :
#   ABSORBÉE si (a) merger la branche ne changerait RIEN à la base (merge-tree), ou
#   (b) chaque fichier touché par la branche a son contenu exact (blob) INTRODUIT dans
#   la base APRÈS le point de fourche (= le squash a atterri, même si la base a évolué
#   depuis), les suppressions étant absentes de la base. Sinon RÉELLE.
#   ⚠ La preuve (b) est bornée à la fenêtre post-fourche mb..BASE ET exige qu'un commit
#   trouvé CONTIENNE le blob (finding Codex PR #31) : un blob réutilisé depuis le vieil
#   historique (revert, rename pur, contenu dupliqué) ne prouve RIEN — sans ces bornes,
#   une branche de revert serait « absorbée » à tort et sa purge perdrait du travail réel.
classify_branch() { # $1=branche → "ABSORBEE" | "REELLE <fichiers-non-prouvés>"
  local b="$1" mb base_tree merged_tree status path path2 blob unproven=""
  base_tree="$(git rev-parse "$BASE^{tree}" 2>/dev/null)" || { echo "REELLE (base illisible)"; return; }
  # (a) fast-path : le merge ne changerait rien (git ≥ 2.38 ; sinon on passe au (b))
  merged_tree="$(git merge-tree --write-tree "$BASE" "$b" 2>/dev/null | head -1)"
  if [[ -n "$merged_tree" && "$merged_tree" == "$base_tree" ]]; then echo "ABSORBEE"; return; fi
  # (b) le blob a-t-il ATTERRI dans la base après la fourche ?
  mb="$(git merge-base "$BASE" "$b" 2>/dev/null)" || { echo "REELLE (merge-base introuvable)"; return; }
  blob_landed() { # $1=blob $2=chemin-au-tip-de-branche → 0 si prouvé dans la base
    # fast-path : contenu exact au même chemin au tip de la base (couvre aussi le rename pur)
    [[ "$(git rev-parse "$BASE:$2" 2>/dev/null)" == "$1" ]] && return 0
    # sinon : un commit de la fenêtre post-fourche a touché ce blob ET le contient encore
    # (le commit qui l'a RETIRÉ matche aussi --find-object — on l'exclut via ls-tree).
    # NB pas de `grep -q` sur le pipe : son early-exit SIGPIPE ls-tree sous pipefail
    # et fait rater un match réel sur un gros arbre.
    local c
    while IFS= read -r c; do
      [[ -z "$c" ]] && continue
      [[ -n "$(git ls-tree -r "$c" 2>/dev/null | grep -F "$1")" ]] && return 0
    done < <(git log "$mb..$BASE" --format=%H --find-object="$1" 2>/dev/null)
    return 1
  }
  while IFS=$'\t' read -r status path path2; do
    [[ -z "$status" ]] && continue
    case "$status" in
      D*) # suppression : absorbée si le fichier est absent de la base
          git cat-file -e "$BASE:$path" 2>/dev/null && unproven="$unproven $path" ;;
      R*) # rename : prouver le blob au nouveau chemin
          blob="$(git rev-parse "$b:$path2" 2>/dev/null)" || { unproven="$unproven $path2"; continue; }
          blob_landed "$blob" "$path2" || unproven="$unproven $path2" ;;
      *)  blob="$(git rev-parse "$b:$path" 2>/dev/null)" || { unproven="$unproven $path"; continue; }
          blob_landed "$blob" "$path" || unproven="$unproven $path" ;;
    esac
  done < <(git diff --name-status -M "$mb" "$b" 2>/dev/null)
  if [[ -z "$unproven" ]]; then echo "ABSORBEE"; else echo "REELLE$unproven"; fi
}

# NB `+` = branche tenue par un AUTRE worktree (git branch la préfixe ainsi) : on la
# classe comme les autres, mais sa suppression exige d'abord `git worktree remove`.
UNMERGED="$(git branch --no-merged "$BASE" 2>/dev/null | sed 's/^[*+ ] *//' | grep -v "^$BASE$" || true)"
WT_HELD="$(git branch --no-merged "$BASE" 2>/dev/null | grep '^+' | sed 's/^+ *//' || true)"
if [[ -n "$UNMERGED" ]]; then
  ABSORBED_LIST=""; REAL_LIST=""
  while IFS= read -r b; do
    [[ -z "$b" ]] && continue
    verdict="$(classify_branch "$b")"
    last="$(git log -1 --format='%h %s (%cr)' "$b" 2>/dev/null)"
    wtmark=""
    grep -qx "$b" <<< "$WT_HELD" && wtmark=" [worktree — remove d'abord]"
    if [[ "$verdict" == "ABSORBEE" ]]; then
      ABSORBED_LIST="${ABSORBED_LIST}    $b${wtmark} — $last"$'\n'
    else
      REAL_LIST="${REAL_LIST}    $b${wtmark} — $last"$'\n'
      [[ "$verdict" != "REELLE" ]] && REAL_LIST="${REAL_LIST}        non prouvé dans $BASE :${verdict#REELLE}"$'\n'
    fi
  done <<< "$UNMERGED"
  if [[ -n "$REAL_LIST" ]]; then
    echo "⚠ branches locales avec du contenu NON livré dans $BASE (le vrai pending) :"
    printf '%s' "$REAL_LIST"
  else
    echo "✓ aucune branche locale avec du contenu non livré."
  fi
  if [[ -n "$ABSORBED_LIST" ]]; then
    echo "ℹ branches locales ABSORBÉES (contenu prouvé dans $BASE — résidu squash-merge,"
    echo "  suppression sûre : \`git branch -D <nom>\`, récupérable via reflog ~90 j) :"
    printf '%s' "$ABSORBED_LIST"
  fi
else
  echo "✓ aucune branche locale non-mergée dans $BASE."
fi
echo

# --- Note de handoff (fichier persistant) ------------------------------------
# Read-only : ne fait QUE rapporter les faits. La purge/écriture réelle est un
# geste de `run` (cf. SKILL.md §6), pas de ce script.
echo "## Note de handoff (fichier persistant)"
HANDOFF_FILE=".claude/handoff.md"
if git check-ignore -q "$HANDOFF_FILE" 2>/dev/null; then
  echo "✓ $HANDOFF_FILE couvert par .gitignore."
else
  echo "⚠ $HANDOFF_FILE n'est PAS ignoré — ajouter une entrée .gitignore avant d'écrire dedans."
fi
if [[ -f "$HANDOFF_FILE" ]]; then
  N_ENTRIES="$(grep -c '^## ' "$HANDOFF_FILE" 2>/dev/null || echo 0)"
  echo "ℹ $HANDOFF_FILE existe ($N_ENTRIES entrée(s))."
  REFS="$(grep -oE '#[0-9]+|`[a-zA-Z0-9./_-]+`' "$HANDOFF_FILE" 2>/dev/null | sort -u)"
  if [[ -n "$REFS" ]]; then
    echo "  PR/branches mentionnées (à croiser avec la section 2 ci-dessus — absentes"
    echo "  de la liste live = résolues, purgeables au prochain \`run\`) :"
    echo "$REFS" | sed 's/^/    /'
  fi
else
  echo "ℹ $HANDOFF_FILE absent — sera créé au premier \`run\`."
fi
echo

# --- 4. ADR de la session -----------------------------------------------------
# (checks 3/5/6/7 = jugement/délégation, pas du ressort de ce helper read-only)
echo "## 4. ADR de la session"
adr_filter='(^|/)(adr|adrs|decisions)/|(^|/)adr[-_][^/]*\.md$|[-_]adr\.md$'
COMMITTED_ADR="$(git log "$BASE"..HEAD --name-only --pretty=format: 2>/dev/null \
                 | grep -Ei "$adr_filter" | sort -u || true)"
WT_ADR="$( { git diff --name-only 2>/dev/null; \
             git diff --name-only --cached 2>/dev/null; \
             git ls-files --others --exclude-standard 2>/dev/null; } \
           | grep -Ei "$adr_filter" | sort -u || true)"
if [[ -z "$COMMITTED_ADR" && -z "$WT_ADR" ]]; then
  echo "✓ aucun ADR créé/modifié détecté sur $BASE..HEAD ni dans le working tree."
else
  if [[ -n "$WT_ADR" ]]; then
    echo "⚠ ADR non commités (working tree) — à committer :"
    echo "$WT_ADR" | sed 's/^/    /'
  fi
  if [[ -n "$COMMITTED_ADR" ]]; then
    echo "ℹ ADR commités sur $CUR mais pas encore dans $BASE — pending tant que la branche/PR n'est pas mergée :"
    echo "$COMMITTED_ADR" | sed 's/^/    /'
  fi
fi
echo

echo "— fin du rapport read-only. Aucune modification effectuée."
