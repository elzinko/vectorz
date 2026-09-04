#!/usr/bin/env bash
# Skema migration 003 — retrait du statut `todo` (layout v2 → v3).
#
# Le statut `todo` est SCINDÉ selon le champ `ready:` :
#   - `ready:` daté (non vide) → `status: ready`  (groomée, DoR passée, tirable)
#   - `ready:` vide / absent   → `status: idea`   (pas encore prête, à groomer)
# Décision : panel adverse du 2026-09-04
# (docs/captures/2026-09-04-panel-adverse-objet-sprint.md). Une fiche est soit une idée
# pas prête, soit prête — plus d'état ambigu au milieu.
#
# Ne touche QUE les fiches `status: todo`. `idea` / `in-progress` / `blocked` / `shipped`
# sont laissés intacts. Les REVIEW.md (features/reviews/) sont hors périmètre (pas des fiches).
#
# Usage : apply-003-statuts-colonnes.sh [--apply] [racine-projet]
#   sans --apply : DRY-RUN — liste les changements, n'écrit rien.
#   avec --apply : réécrit le front-matter des fiches `todo`.
# Filet : les fiches sont versionnées par git — `git diff` montre tout, `git checkout` annule.
set -euo pipefail

APPLY=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    *) ARGS+=("$a") ;;
  esac
done
ROOT="${ARGS[0]:-.}"
ROOT="$(cd "$ROOT" && pwd)"
FEATURES="$ROOT/features"
[[ -d "$FEATURES" ]] || { echo "erreur: pas de features/ dans ${ROOT}" >&2; exit 1; }

# 1re valeur d'un champ dans le front-matter (entre le 1er et le 2e ---).
fm_field() {
  awk -v f="$2" '
    /^---[[:space:]]*$/ { c++; next }
    c==1 && $0 ~ ("^" f ":") {
      sub(("^" f ":[[:space:]]*"), ""); sub(/[[:space:]]*#.*/, ""); gsub(/[[:space:]]/, "");
      print; exit
    }
  ' "$1"
}

n_ready=0; n_idea=0
while IFS= read -r -d '' f; do
  [[ "$(fm_field "$f" status)" == "todo" ]] || continue
  if [[ -n "$(fm_field "$f" ready)" ]]; then tgt=ready; n_ready=$((n_ready + 1)); else tgt=idea; n_idea=$((n_idea + 1)); fi
  if [[ "$APPLY" -eq 1 ]]; then
    # Remplace la 1re ligne `^status: todo` du front-matter. Portable BSD/GNU (temp + mv).
    tmp="$(mktemp)"
    sed "s/^status:[[:space:]]*todo.*$/status: $tgt/" "$f" > "$tmp" && mv "$tmp" "$f"
  else
    echo "  $(basename "$f") : todo → $tgt"
  fi
done < <(find "$FEATURES" -name '*.md' ! -name 'feature-template.md' ! -name 'README.md' ! -path '*/reviews/*' -print0)

if [[ "$APPLY" -eq 1 ]]; then
  # Bumper le marqueur de layout du projet à 3 (comme 002 le pose à 2).
  readme="$FEATURES/README.md"
  if [[ -f "$readme" ]]; then
    tmp="$(mktemp)"; sed 's/^layout_version:.*/layout_version: 3/' "$readme" > "$tmp" && mv "$tmp" "$readme"
  fi
  # Le template déployé : un nouvel `add` doit désormais naître `idea` (plus de `todo`).
  tpl="$FEATURES/feature-template.md"
  if [[ -f "$tpl" ]]; then
    tmp="$(mktemp)"; sed 's/^status: todo.*/status: idea # idea | ready | in-progress | blocked | shipped/' "$tpl" > "$tmp" && mv "$tmp" "$tpl"
  fi
  echo "migration 003 appliquée : todo→ready = ${n_ready} · todo→idea = ${n_idea} (layout_version: 3)."
  echo "→ régénère les vues (regen-backlog.sh + avancement:regen)."
else
  echo "DRY-RUN : todo→ready = ${n_ready} · todo→idea = ${n_idea}. Relance avec --apply pour écrire."
fi
