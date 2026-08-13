#!/usr/bin/env bash
# ezk-start — LE PORTIER D'OUVERTURE : diagnostics de démarrage READ-ONLY (fiche 0090 tâche 1).
#
# Symétrique d'ezk-archive/scripts/check.sh, mais pour OUVRIR une session :
#   --gate (défaut) : bloc machine borné pour le skill `/ezk-start`
#   --full          : rapport humain lisible
#
# CONTRAT DU GATE v0 :
#   VERDICT: CLEAR                 ⟺ P1..P3 tous CLEAR
#   VERDICT: ALERT points=<n,…>    sous-ensemble de {1,2,3}
#   Exit 0 pour CLEAR COMME pour ALERT ; exit 2 uniquement « pas un dépôt git ».
#   Le verdict passe par stdout — jamais par le code retour.
#
# Points :
#   P1_TREE        — working tree dirty ?
#   P2_WORKTREES   — worktrees siblings (>1) ?
#   P3_IN_PROGRESS — fiches status: in-progress dans features/ ?
#
# Usage : bash check.sh [--gate|--full] [racine]

set -uo pipefail

MODE="gate"
ROOT=""
usage() {
  cat <<'USAGE'
check.sh — portier d'ouverture ezk-start (read-only, fiche 0090)

  --gate            bloc machine (DÉFAUT) : VERDICT + faits ALERT
  --full            rapport humain lisible
  -h, --help        cette aide
USAGE
}
while (( $# )); do
  case "$1" in
    --gate)    MODE="gate" ;;
    --full)    MODE="full" ;;
    -h|--help) usage; exit 0 ;;
    --*)       echo "check.sh : option inconnue « $1 »" >&2; usage >&2; exit 2 ;;
    *)         ROOT="$1" ;;
  esac
  shift
done

if [[ -n "$ROOT" ]]; then
  cd "$ROOT" || exit 2
fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2
  exit 2
fi
cd "$(git rev-parse --show-toplevel)" || exit 2
REPO="$(pwd)"
CUR="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD)"
WT="$(git rev-parse --show-toplevel)"

# --- P1 : working tree --------------------------------------------------------
P1="CLEAR"
P1_FACTS=()
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  P1="ALERT"
  dirty_n="$(git status --porcelain | wc -l | tr -d ' ')"
  P1_FACTS+=("[P1] dirty_files=${dirty_n}")
fi

# --- P2 : worktrees -----------------------------------------------------------
P2="CLEAR"
P2_FACTS=()
WT_COUNT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  WT_COUNT=$((WT_COUNT + 1))
done < <(git worktree list --porcelain 2>/dev/null | grep -E '^worktree ' || true)

if (( WT_COUNT > 1 )); then
  P2="ALERT"
  P2_FACTS+=("[P2] sibling_worktrees=$((WT_COUNT - 1)) total=${WT_COUNT}")
  while IFS= read -r path; do
    [[ -z "$path" || "$path" == "$WT" ]] && continue
    br="$(git -C "$path" symbolic-ref --quiet --short HEAD 2>/dev/null || git -C "$path" rev-parse --short HEAD 2>/dev/null || echo '?')"
    P2_FACTS+=("[P2] worktree ${path} branch=${br}")
  done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')
fi

# --- P3 : fiches in-progress --------------------------------------------------
P3="CLEAR"
P3_FACTS=()
INPROG=()
scan_in_progress() {
  local dir="$1"
  local f id title status
  for f in "$dir"/[0-9]*.md; do
    [[ -e "$f" ]] || continue
    status="$(awk '
      BEGIN { infm=0 }
      /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
      infm==1 && $0 ~ /^status:/ {
        sub(/^status:[[:space:]]*/, ""); sub(/[[:space:]]*#.*$/, ""); print; exit
      }
    ' "$f")"
    [[ "$status" == "in-progress" ]] || continue
    id="$(awk '
      BEGIN { infm=0 }
      /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
      infm==1 && $0 ~ /^id:/ { sub(/^id:[[:space:]]*/, ""); gsub(/^"|"$/, ""); print; exit }
    ' "$f")"
    title="$(awk '
      BEGIN { infm=0 }
      /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
      infm==1 && $0 ~ /^title:/ {
        sub(/^title:[[:space:]]*/, ""); gsub(/^"|"$/, ""); print; exit
      }
    ' "$f")"
    INPROG+=("${id}|${f}|${title}")
  done
}
scan_in_progress "features"
# Liste unique `features/` depuis 0064 (ADR-0017 A14) — plus de backlog séparé mega-city à scanner.

if (( ${#INPROG[@]} > 0 )); then
  P3="ALERT"
  P3_FACTS+=("[P3] in_progress_count=${#INPROG[@]}")
  for row in "${INPROG[@]}"; do
    IFS='|' read -r id path title <<<"$row"
    P3_FACTS+=("[P3] fiche id=${id} path=${path} title=${title}")
  done
fi

# --- handoff + plan (best-effort, never ALERT alone) --------------------------
HANDOFF_LINES=0
HANDOFF_SCRIPT="$(cd "$(dirname "$0")/../../ezk-archive/scripts" && pwd)/handoff.sh"
if [[ -x "$HANDOFF_SCRIPT" ]] && [[ -f .claude/handoff.md ]]; then
  HANDOFF_LINES="$(bash "$HANDOFF_SCRIPT" carry 2>/dev/null | wc -l | tr -d ' ')"
fi

PLAN_HEAD="-"
if command -v pnpm >/dev/null 2>&1 && [[ -d products/mega-city ]]; then
  PLAN_HEAD="$(pnpm --dir products/mega-city plan:head 2>/dev/null | head -3 | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  [[ -z "$PLAN_HEAD" ]] && PLAN_HEAD="-"
fi

# --- verdict ------------------------------------------------------------------
ALERT_POINTS=()
[[ "$P1" == "ALERT" ]] && ALERT_POINTS+=(1)
[[ "$P2" == "ALERT" ]] && ALERT_POINTS+=(2)
[[ "$P3" == "ALERT" ]] && ALERT_POINTS+=(3)

if (( ${#ALERT_POINTS[@]} == 0 )); then
  VERDICT="CLEAR"
else
  IFS=','; VERDICT="ALERT points=${ALERT_POINTS[*]}"; unset IFS
fi

# --- render -------------------------------------------------------------------
if [[ "$MODE" == "gate" ]]; then
  echo "# ezk-start gate v0"
  echo "VERDICT: ${VERDICT}"
  echo "REPO: ${REPO}"
  echo "BRANCH: ${CUR}   WORKTREE: ${WT}   SIBLING_WORKTREES: $((WT_COUNT > 0 ? WT_COUNT - 1 : 0))"
  echo "P1_TREE: ${P1}"
  echo "P2_WORKTREES: ${P2}"
  echo "P3_IN_PROGRESS: ${P3}"
  for f in "${P1_FACTS[@]+"${P1_FACTS[@]}"}"; do echo "$f"; done
  for f in "${P2_FACTS[@]+"${P2_FACTS[@]}"}"; do echo "$f"; done
  for f in "${P3_FACTS[@]+"${P3_FACTS[@]}"}"; do echo "$f"; done
  echo "HANDOFF: lines=${HANDOFF_LINES}"
  echo "PLAN_HEAD: ${PLAN_HEAD}"
  echo "--- END ---"
  exit 0
fi

# --full
echo "# ezk-start — rapport d'ouverture"
echo
echo "**Verdict :** ${VERDICT}"
echo "- Repo : \`${REPO}\`"
echo "- Branche : \`${CUR}\` · worktree : \`${WT}\`"
echo "- Worktrees totaux : ${WT_COUNT}"
echo
echo "## P1 — Working tree : ${P1}"
for f in "${P1_FACTS[@]+"${P1_FACTS[@]}"}"; do echo "- ${f#\[P1\] }"; done
[[ "$P1" == "CLEAR" ]] && echo "- propre"
echo
echo "## P2 — Worktrees : ${P2}"
for f in "${P2_FACTS[@]+"${P2_FACTS[@]}"}"; do echo "- ${f#\[P2\] }"; done
[[ "$P2" == "CLEAR" ]] && echo "- un seul worktree"
echo
echo "## P3 — Fiches in-progress : ${P3}"
for f in "${P3_FACTS[@]+"${P3_FACTS[@]}"}"; do echo "- ${f#\[P3\] }"; done
[[ "$P3" == "CLEAR" ]] && echo "- aucune"
echo
echo "## Contexte"
echo "- Handoff Pending : ${HANDOFF_LINES} ligne(s)"
echo "- Tête PLAN : ${PLAN_HEAD}"
exit 0
