#!/usr/bin/env bash
# Résout le chemin de regen-backlog.sh pour un projet donné.
# Usage : resolve-regen-backlog.sh [racine-projet]
# stdout = chemin absolu ; exit 1 si introuvable (message stderr + consignes).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"

candidates=()

# Override explicite
if [[ -n "${EZK_REGEN_BACKLOG:-}" ]]; then
  candidates+=("$EZK_REGEN_BACKLOG")
fi

# Monorepo vectorz / produit avec bin/ local
candidates+=(
  "$ROOT/products/mega-city/bin/regen-backlog.sh"
  "$ROOT/bin/regen-backlog.sh"
)

# Skill embarquée dans mega-city : …/skills/ezk-backlog → …/bin
candidates+=("$(cd "$SKILL_DIR/../.." && pwd)/bin/regen-backlog.sh")

# Remonter depuis ROOT (repo externe cloné à côté, worktree, …)
d="$ROOT"
for _ in 1 2 3 4 5 6; do
  candidates+=("$d/products/mega-city/bin/regen-backlog.sh")
  parent="$(dirname "$d")"
  [[ "$parent" == "$d" ]] && break
  d="$parent"
done

# Copie vendored dans la skill (install skill-only, hors monorepo)
candidates+=("$SKILL_DIR/scripts/regen-backlog.sh")

# PATH
if command -v regen-backlog.sh >/dev/null 2>&1; then
  candidates+=("$(command -v regen-backlog.sh)")
fi

for c in "${candidates[@]}"; do
  [[ -n "$c" && -x "$c" ]] || continue
  # -x suffit ; certains FS ignorent +x sur scripts → accepter -f lisible
  echo "$c"
  exit 0
done

# Retry en -f si non exécutable mais présent
for c in "${candidates[@]}"; do
  [[ -n "$c" && -f "$c" ]] || continue
  echo "$c"
  exit 0
done

cat >&2 <<EOF
erreur: regen-backlog.sh introuvable pour ${ROOT}

Install / découverte (ordre de résolution) :
  1. EZK_REGEN_BACKLOG=/chemin/absolu/regen-backlog.sh
  2. <projet>/products/mega-city/bin/regen-backlog.sh ou <projet>/bin/regen-backlog.sh
  3. bin du produit relatif à la skill (monorepo)
  4. <skill>/scripts/regen-backlog.sh (copie vendored — skill-only)
  5. regen-backlog.sh sur le PATH

Sans regen : init/apply-002 **échouent avant** toute mutation (pas de BACKLOG vide
écrasant un index peuplé). Voir migrations/002-readme-vs-backlog.md
EOF
exit 1
