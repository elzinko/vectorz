#!/usr/bin/env bash
# Initialise le suivi backlog ezk-backlog (layout courant, Skema).
# Usage : init.sh [racine-projet] [titre-index]
# Crée features/ + done/ + README curé (layout_version courant) + BACKLOG.md vide
# + feature-template.md. Idempotent : n'écrase pas un roadmap/ existant ni un
# features/ déjà peuplé (sauf regen de BACKLOG si demandé).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${2:-Backlog features & bugs}"
FEATURES="$ROOT/features"

if [[ -d "$ROOT/roadmap" ]]; then
  echo "convention roadmap/ détectée — rien créé (épouser l'existant)."
  exit 0
fi

mkdir -p "$FEATURES/done"

# README curé (layout courant)
if [[ ! -f "$FEATURES/README.md" ]]; then
  cp "$SKILL_DIR/templates/features-README.md" "$FEATURES/README.md"
  echo "créé features/README.md (guide, layout_version courant)"
elif grep -q 'Index auto-généré' "$FEATURES/README.md" 2>/dev/null; then
  echo "warning: features/README.md ressemble à un index v1 — lance la migration 002" >&2
fi

# Template fiche
if [[ ! -f "$FEATURES/feature-template.md" ]]; then
  if [[ -f "$SKILL_DIR/templates/feature-template.md" ]]; then
    cp "$SKILL_DIR/templates/feature-template.md" "$FEATURES/feature-template.md"
  else
    # Fallback minimal si le template n'est pas encore dans la skill
    cat > "$FEATURES/feature-template.md" <<'EOF'
---
id: 0000
title: <titre court et parlant>
type: feature # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: # obligatoire dans un monorepo — sinon omettre
epic:
status: todo # idea | todo | in-progress | blocked | shipped
ready:
pr:
created: <YYYY-MM-DD>
---

# <id> — <titre>

## Contexte / Problème

## Proposition

## Critères d'acceptation

- [ ]

## Notes / décisions
EOF
  fi
  echo "créé features/feature-template.md"
fi

# BACKLOG.md — généré (vide ou regen si fiches présentes)
REGEN=""
if [[ -x "$ROOT/products/mega-city/bin/regen-backlog.sh" ]]; then
  REGEN="$ROOT/products/mega-city/bin/regen-backlog.sh"
elif [[ -x "$ROOT/bin/regen-backlog.sh" ]]; then
  REGEN="$ROOT/bin/regen-backlog.sh"
else
  CANDIDATE="$(cd "$SKILL_DIR/../.." && pwd)/bin/regen-backlog.sh"
  [[ -x "$CANDIDATE" ]] && REGEN="$CANDIDATE"
fi

if [[ -n "$REGEN" ]] && { compgen -G "$FEATURES/[0-9]*.md" > /dev/null \
   || compgen -G "$FEATURES/done/[0-9]*.md" > /dev/null; }; then
  bash "$REGEN" "$ROOT" "$TITLE"
else
  cat > "$FEATURES/BACKLOG.md" <<EOF
# ${TITLE}

> Index auto-généré — **ne pas éditer à la main**. Guide : [README.md](README.md).

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|

> Livrées (\`done/\`) : .
EOF
  echo "créé features/BACKLOG.md (vide)"
fi

echo "init backlog OK → ${FEATURES} (layout_version=$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION"))"
