#!/usr/bin/env bash
# Skema migration 002 — applique README curé + regen BACKLOG.md (layout v1 → v2).
# Usage : apply-002-readme-vs-backlog.sh [--force] [racine] [titre-index]
#
# Ne migre le README que s'il est clairement un **index legacy v1**
# (marqueur « Index auto-généré »), ou avec --force. Sinon refuse — ne touche
# pas aux README curés / tombstones (ex. products/mega-city/features/README.md).
# Avant tout écrasement : backup → features/README.md.bak-skema-002
# Résout regen **avant** toute mutation ; échoue clairement si introuvable.
# Le [titre-index] s'écrit dans l'en-tête du README installé (backlog_title:), que regen-backlog.sh
# relit à chaque régénération ; un README conservé n'est jamais réécrit.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FORCE=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    *) ARGS+=("$a") ;;
  esac
done
ROOT="${ARGS[0]:-.}"
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${ARGS[1]:-}"   # vide : le titre déclaré par le projet, sinon le défaut de regen-backlog.sh
FEATURES="$ROOT/features"
TEMPLATE="$SKILL_DIR/templates/features-README.md"
RESOLVE="$SKILL_DIR/scripts/resolve-regen-backlog.sh"
BAK_SUFFIX=".bak-skema-002"

is_legacy_v1_index() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  grep -q 'Index auto-généré' "$f" 2>/dev/null
}

# Écrit `backlog_title:` dans l'en-tête YAML d'un README tout juste copié du gabarit, juste avant
# le `---` qui le ferme. Valeur entre apostrophes, une apostrophe y est doublée : du YAML valide
# quel que soit le titre, que regen-backlog.sh relit à l'identique. Jumelle dans init.sh.
write_backlog_title() { # $1=README $2=titre
  local tmp
  tmp="$(mktemp)"
  BACKLOG_TITLE="$2" awk '
    BEGIN { v = ENVIRON["BACKLOG_TITLE"]; gsub("\047", "\047\047", v) }
    NR == 1 { fm = /^---[[:space:]]*$/; print; next }
    fm && /^---[[:space:]]*$/ { print "backlog_title: \047" v "\047"; fm = 0 }
    { print }
  ' "$1" > "$tmp" && cat "$tmp" > "$1"
  rm -f "$tmp"
}

[[ -d "$FEATURES" ]] || { echo "erreur: pas de features/ dans ${ROOT}" >&2; exit 1; }
[[ -f "$TEMPLATE" ]] || { echo "erreur: template manquant ${TEMPLATE}" >&2; exit 1; }

README="$FEATURES/README.md"

# Resolve regen before any write — fail loud, no half-migrate.
REGEN="$("$RESOLVE" "$ROOT")"

title_written=0
if [[ -f "$README" ]] && grep -q '^layout_version:[[:space:]]*2' "$README" 2>/dev/null; then
  echo "README déjà layout_version: 2 — skip scaffold"
elif [[ -f "$README" ]] && ! is_legacy_v1_index "$README" && [[ "$FORCE" -ne 1 ]]; then
  echo "erreur: ${README} n'est pas un index v1 (pas de marqueur « Index auto-généré »)." >&2
  echo "        Rien écrasé (README curé / tombstone préservé)." >&2
  echo "        Relance avec --force si tu veux vraiment le remplacer (backup ${BAK_SUFFIX})." >&2
  exit 1
else
  if [[ -f "$README" ]]; then
    bak="${README}${BAK_SUFFIX}"
    cp "$README" "$bak"
    echo "sauvegarde → $bak"
  fi
  cp "$TEMPLATE" "$README"
  # 002 vise layout_version: 2 — forcer le marqueur même si le template courant est plus récent
  # (init, lui, reste au courant en copiant le template tel quel).
  tmp="$(mktemp)"; sed 's/^layout_version:.*/layout_version: 2/' "$README" > "$tmp" && mv "$tmp" "$README"
  if [[ -n "$TITLE" ]]; then
    write_backlog_title "$README" "$TITLE"
    title_written=1
  fi
  echo "README curé écrit → $README"
fi

# Le titre n'est passé que s'il vient d'être écrit dans le README (même valeur des deux côtés) :
# la prochaine régénération, sans titre, garde la même ligne 1.
if [[ "$title_written" -eq 1 ]]; then
  bash "$REGEN" "$ROOT" "$TITLE"
else
  bash "$REGEN" "$ROOT"
fi
if [[ -n "$TITLE" && "$(head -1 "$FEATURES/BACKLOG.md")" != "# ${TITLE}" ]]; then
  q="'"
  echo "note: titre « ${TITLE} » non appliqué : features/README.md est conservé, c'est son en-tête qui fait foi."
  echo "      Pour l'appliquer, ajoute dans cet en-tête : backlog_title: '${TITLE//$q/$q$q}' — puis régénère."
fi
echo "migration 002 appliquée (layout_version: 2)."
