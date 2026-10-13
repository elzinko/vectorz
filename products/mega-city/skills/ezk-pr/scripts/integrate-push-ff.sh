#!/usr/bin/env bash
# integrate-push-ff.sh — intègre une branche par PUSH EN AVANCE RAPIDE (ADR-0061 D3, ADR-0052 D2,
# fiche 20261004083838687).
#
# En clair : pour un projet qui pousse directement sur origin/main (muti), sans PR et sans squash
# local. On vérifie que origin/<base> n'a pas avancé (sinon on refuse net et on dit de rebaser),
# puis on pousse les commits de la branche TELS QUELS sur <base>. Aucun `git checkout <base>` :
# le geste marche depuis n'importe quel worktree, même quand <base> est sortie ailleurs.
#
# Usage : integrate-push-ff.sh --repo <dir> --branch <b> [--base main] [--dry-run]
# Codes : 0 poussé (ou dry-run OK) · 3 refusé (origin a avancé, ou pas de remote joignable).
set -euo pipefail

repo="."
branch=""
base="main"
dry_run=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --branch) branch="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    *) echo "integrate-push-ff.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$branch" ]] || { echo "integrate-push-ff.sh: --branch requis" >&2; exit 2; }

git_c() { git -C "$repo" "$@"; }

git_c remote 2>/dev/null | grep -q . || { echo "push-ff: REFUSÉ — aucun remote (push-ff exige origin). Reste en local-squash." >&2; exit 3; }

# On rafraîchit origin/<base> AVANT la garde (sinon on pousserait sur une base réputée à jour à tort).
if ! git_c fetch -q origin "$base" 2>/dev/null; then
  echo "push-ff: REFUSÉ — git fetch origin $base a échoué (remote injoignable)." >&2
  exit 3
fi

head="$(git_c rev-parse "$branch")"
# Garde d'ancêtre : origin/<base> DOIT être une ancêtre du head de la branche, sinon un push ff
# écraserait ou serait rejeté. On refuse net et on dit quoi faire.
if ! git_c merge-base --is-ancestor "origin/$base" "$head"; then
  echo "push-ff: REFUSÉ — origin/$base a avancé depuis le départ de $branch ; rien n'est poussé." >&2
  echo "  Rebase d'abord : git -C \"$repo\" fetch origin $base && git -C \"$repo\" rebase origin/$base $branch" >&2
  exit 3
fi

if [[ "$dry_run" -eq 1 ]]; then
  echo "push-ff (à blanc) : git -C \"$repo\" push origin $head:$base — base à jour, aucun commit de fusion."
  exit 0
fi

git_c push origin "$head:refs/heads/$base"
echo "push-ff: poussé $branch sur origin/$base en avance rapide (aucun commit de fusion)."

# Réalignement du <base> LOCAL par avance rapide, best-effort, sans toucher un worktree qui l'a sortie
# (ADR-0052 D2). `update-ref` seulement si <base> n'est la branche courante d'AUCUN worktree.
checked_out=0
while IFS= read -r line; do
  [[ "$line" == "branch refs/heads/$base" ]] && checked_out=1
done < <(git_c worktree list --porcelain 2>/dev/null || true)
if [[ "$checked_out" -eq 0 ]] && git_c show-ref --verify --quiet "refs/heads/$base"; then
  git_c update-ref "refs/heads/$base" "$head" && echo "push-ff: $base local réaligné (ff) sur $head."
else
  echo "push-ff: $base local sorti dans un worktree — réaligne-le là : git -C <ce worktree> pull --ff-only (ou merge --ff-only origin/$base)."
fi
