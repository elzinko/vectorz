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

Install / découverte :
  1. Monorepo vectorz : bash products/mega-city/bin/regen-backlog.sh <racine> "<titre>"
  2. Copier le script dans <projet>/bin/regen-backlog.sh (chmod +x)
  3. Ou exporter EZK_REGEN_BACKLOG=/chemin/absolu/regen-backlog.sh
  4. Ou installer mega-city / ezk-backlog avec le bin du produit sur le PATH

Voir products/mega-city/skills/ezk-backlog/migrations/002-readme-vs-backlog.md
EOF
exit 1
