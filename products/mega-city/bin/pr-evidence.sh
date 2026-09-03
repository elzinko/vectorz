#!/usr/bin/env bash
# pr-evidence.sh — outille la règle `development/pr-before-after-media` (ADR-0045,
# fiche 20260902224608715) : capture une paire d'images avant/après, rend le bloc
# markdown à coller dans une PR, et décide s'il faut capturer selon `evidence:`.
#
# En clair : une PR qui change un écran doit montrer l'écran avant et après, sans
# qu'on relise le diff. Ce script fait le geste mécanique (capturer, lier) ; le
# SKILL ezk-sprint orchestre QUAND l'appeler (avant = worktree sur main, après =
# branche).
#
# Trois sous-commandes :
#   capture <id> --view <nom> --phase before|after --url <URL>
#           [--viewport LxH] [--out <dir>]
#   render  <id> [--out <dir>] [--repo <owner/repo>] [--sha <sha>]
#   decide  --evidence before-after|auto|none [--changed-files <fichier>] [--reason "<texte>"]
#
# Backend de capture substituable par PR_EVIDENCE_SHOT_CMD (contrat : 4 arguments
# positionnels "<url>" "<fichier-sortie>" "<largeur>" "<hauteur>") — tests bash
# hermétiques sans navigateur. Défaut : `pnpm exec playwright screenshot`.
set -euo pipefail

DEFAULT_VIEWPORT="390x844"   # règle testing/visual-validation : mobile d'abord
MAX_BYTES=307200             # 300 Ko — avertissement seulement (POC)

print_help() {
  cat <<'EOF'
En clair : ce script capture une paire d'écrans avant/après pour une PR, rend le
bloc markdown à coller (liens par SHA), et décide si une capture est nécessaire
d'après le champ `evidence:` de la fiche.

Usage :
  pr-evidence.sh capture <id> --view <nom> --phase before|after --url <URL>
                 [--viewport LxH] [--out <dir>]
  pr-evidence.sh render  <id> [--out <dir>] [--repo <owner/repo>] [--sha <sha>]
  pr-evidence.sh decide  --evidence before-after|auto|none
                 [--changed-files <fichier>] [--reason "<texte>"]
EOF
}

git_root() { git rev-parse --show-toplevel; }

default_out() { printf '%s/docs/pr-evidence' "$(git_root)"; }

# ── capture ──────────────────────────────────────────────────────────────────────
cmd_capture() {
  local id="" view="" phase="" url="" viewport="$DEFAULT_VIEWPORT" out=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --view) view="${2:-}"; shift 2 ;;
      --phase) phase="${2:-}"; shift 2 ;;
      --url) url="${2:-}"; shift 2 ;;
      --viewport) viewport="${2:-}"; shift 2 ;;
      --out) out="${2:-}"; shift 2 ;;
      -*) echo "erreur: option inconnue : $1" >&2; exit 2 ;;
      *) if [ -z "$id" ]; then id="$1"; shift; else echo "erreur: argument inattendu : $1" >&2; exit 2; fi ;;
    esac
  done

  # Validation COMPLÈTE avant toute écriture disque (contrat : rien créé si un
  # argument manque).
  [ -n "$id" ] || { echo "erreur: id de fiche manquant" >&2; exit 2; }
  [ -n "$view" ] || { echo "erreur: option manquante : --view" >&2; exit 2; }
  case "$phase" in
    before|after) ;;
    *) echo "erreur: --phase doit valoir before ou after (reçu : \"$phase\")" >&2; exit 2 ;;
  esac
  [ -n "$url" ] || { echo "erreur: option manquante : --url" >&2; exit 2; }
  local w h
  case "$viewport" in
    *x*) w="${viewport%%x*}"; h="${viewport#*x}" ;;
    *) echo "erreur: --viewport doit être de la forme LARGEURxHAUTEUR (reçu : \"$viewport\")" >&2; exit 2 ;;
  esac
  [ -n "$out" ] || out="$(default_out)"

  local dir="$out/$id"
  local file="$dir/${view}-${phase}.png"
  mkdir -p "$dir"

  if [ -n "${PR_EVIDENCE_SHOT_CMD:-}" ]; then
    "$PR_EVIDENCE_SHOT_CMD" "$url" "$file" "$w" "$h"
  else
    if ! pnpm exec playwright screenshot --viewport-size="${w},${h}" "$url" "$file"; then
      echo "erreur: capture Playwright échouée — navigateur manquant ? essaie : pnpm exec playwright install chromium" >&2
      exit 1
    fi
  fi

  [ -f "$file" ] || { echo "erreur: capture non produite : $file" >&2; exit 1; }
  local size
  size="$(wc -c < "$file" | tr -d ' ')"
  if [ "$size" -gt "$MAX_BYTES" ]; then
    echo "avertissement: $file dépasse 300 Ko ($size octets) — envisage un JPEG" >&2
  fi
  echo "$file"
}

# ── render ───────────────────────────────────────────────────────────────────────
parse_origin_repo() {
  local url
  url="$(git remote get-url origin 2>/dev/null)" || {
    echo "erreur: remote origin introuvable — précise --repo <owner/repo>" >&2
    exit 1
  }
  case "$url" in
    https://github.com/*)
      url="${url#https://github.com/}"; url="${url%.git}"; printf '%s' "$url" ;;
    git@github.com:*)
      url="${url#git@github.com:}"; url="${url%.git}"; printf '%s' "$url" ;;
    *)
      echo "erreur: remote origin non reconnu (github attendu) : $url — précise --repo" >&2
      exit 1 ;;
  esac
}

cmd_render() {
  local id="" out="" repo="" sha=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --out) out="${2:-}"; shift 2 ;;
      --repo) repo="${2:-}"; shift 2 ;;
      --sha) sha="${2:-}"; shift 2 ;;
      -*) echo "erreur: option inconnue : $1" >&2; exit 2 ;;
      *) if [ -z "$id" ]; then id="$1"; shift; else echo "erreur: argument inattendu : $1" >&2; exit 2; fi ;;
    esac
  done
  [ -n "$id" ] || { echo "erreur: id de fiche manquant" >&2; exit 2; }
  [ -n "$out" ] || out="$(default_out)"
  local dir="$out/$id"

  # Vues complètes = paire <nom>-before.png + <nom>-after.png, triées.
  local views=() f base view
  if [ -d "$dir" ]; then
    for f in "$dir"/*-before.png; do
      [ -e "$f" ] || continue
      base="$(basename "$f")"
      view="${base%-before.png}"
      [ -f "$dir/${view}-after.png" ] && views+=("$view")
    done
  fi
  if [ "${#views[@]}" -eq 0 ]; then
    echo "erreur: aucune image pour la fiche $id sous $dir" >&2
    exit 1
  fi
  local sorted
  IFS=$'\n' sorted=($(printf '%s\n' "${views[@]}" | LC_ALL=C sort)); unset IFS

  [ -n "$repo" ] || repo="$(parse_origin_repo)"
  [ -n "$sha" ] || sha="$(git rev-parse HEAD)"

  if [ -n "$(git status --porcelain -- "$dir" 2>/dev/null || true)" ]; then
    echo "commit d'abord : le lien par SHA ne pointera vers l'image qu'une fois committée" >&2
  fi

  # Comparaison en chemins PHYSIQUES (pwd -P) : `mktemp -d` rend souvent un chemin
  # symlinké (/var/… → /private/var/… sur macOS) que `git rev-parse --show-toplevel`
  # résout déjà — un strip de préfixe sur les chemins bruts raterait le match.
  local root rel dir_phys
  root="$(cd "$(git_root)" && pwd -P)"
  dir_phys="$(cd "$dir" && pwd -P)"
  case "$dir_phys" in
    "$root"/*) rel="${dir_phys#"$root"/}" ;;
    *) rel="$dir" ;;
  esac

  echo '**Avant / après** (règle `development/pr-before-after-media`)'
  echo '| Vue | Avant | Après |'
  echo '|---|---|---|'
  for view in "${sorted[@]}"; do
    printf '| %s | ![%s avant](https://github.com/%s/blob/%s/%s/%s-before.png?raw=true) | ![%s après](https://github.com/%s/blob/%s/%s/%s-after.png?raw=true) |\n' \
      "$view" "$view" "$repo" "$sha" "$rel" "$view" "$view" "$repo" "$sha" "$rel" "$view"
  done
}

# ── decide ───────────────────────────────────────────────────────────────────────
# Chemin d'interface : extension vue|tsx|jsx|svelte|css|scss|html, hors tests.
# Garder alignée avec skills/ezk-pr/scripts/check-pr-body.sh (même définition dupliquée là-bas).
is_ui_path() {
  local path="$1"
  case "$path" in
    */__tests__/*|*/tests/*|*/test/*|*/e2e/*|*/spec/*) return 1 ;;
  esac
  local base="${path##*/}"
  case "$base" in
    *.test.*|*.spec.*) return 1 ;;
  esac
  case "$path" in
    *.vue|*.tsx|*.jsx|*.svelte|*.css|*.scss|*.html) return 0 ;;
    *) return 1 ;;
  esac
}

cmd_decide() {
  local evidence="" changed_files="" reason=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --evidence) evidence="${2:-}"; shift 2 ;;
      --changed-files) changed_files="${2:-}"; shift 2 ;;
      --reason) reason="${2:-}"; shift 2 ;;
      -*) echo "erreur: option inconnue : $1" >&2; exit 2 ;;
      *) echo "erreur: argument inattendu : $1" >&2; exit 2 ;;
    esac
  done

  case "$evidence" in
    before-after)
      echo "capture"
      ;;
    none)
      echo "N.A. — ${reason:-evidence: none}"
      ;;
    auto)
      local list path found=0
      if [ -n "$changed_files" ]; then
        list="$(cat "$changed_files")"
      else
        list="$(cat)"
      fi
      while IFS= read -r path; do
        [ -n "$path" ] || continue
        if is_ui_path "$path"; then found=1; break; fi
      done <<<"$list"
      if [ "$found" -eq 1 ]; then
        echo "capture"
      else
        echo "N.A. — aucun chemin d'interface touché"
      fi
      ;;
    *)
      echo "erreur: --evidence doit valoir before-after, auto ou none (reçu : \"${evidence:-<absent>}\")" >&2
      exit 2
      ;;
  esac
}

# ── dispatch ─────────────────────────────────────────────────────────────────────
main() {
  local sub="${1:-}"
  [ $# -gt 0 ] && shift
  case "$sub" in
    capture) cmd_capture "$@" ;;
    render) cmd_render "$@" ;;
    decide) cmd_decide "$@" ;;
    ""|-h|--help|help) print_help ;;
    *) echo "erreur: sous-commande inconnue : $sub" >&2; print_help >&2; exit 2 ;;
  esac
}

main "$@"
