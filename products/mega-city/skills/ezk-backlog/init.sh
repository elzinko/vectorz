#!/usr/bin/env bash
# Initialise le suivi backlog ezk-backlog (layout courant, Skema).
# Usage : init.sh [racine-projet] [titre-index]
# Crée features/ + done/ + README curé (layout_version courant) + BACKLOG.md vide
# + feature-template.md. Idempotent : n'écrase pas un roadmap/ existant ni un
# features/ déjà peuplé (sauf regen de BACKLOG si demandé).
#
# Skema : refuse de half-migrer un layout v1 (README « Index auto-généré ») —
# propose apply-002 après OK utilisateur (pas de split-brain README+BACKLOG).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-.}"
if [[ ! -d "$ROOT" ]]; then
  echo "erreur: racine inexistante: $ROOT" >&2
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${2:-Backlog features & bugs}"
FEATURES="$ROOT/features"
CHECK="$SKILL_DIR/scripts/check-layout-version.sh"
RESOLVE="$SKILL_DIR/scripts/resolve-regen-backlog.sh"
SKILL_VERSION="$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION")"

installed_layout() {
  # Lit layout_version réel du projet (via check) — pas le VERSION skill.
  local out
  out="$("$CHECK" "$ROOT" 2>/dev/null || true)"
  if [[ "$out" =~ INSTALLED=([0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo 0
  fi
}

if [[ -d "$ROOT/roadmap" ]]; then
  echo "convention roadmap/ détectée — rien créé (épouser l'existant)."
  exit 0
fi

mkdir -p "$FEATURES/done"

# Legacy v1 : ne pas créer BACKLOG à côté d'un index README — propose migration.
if [[ -f "$FEATURES/README.md" ]] && grep -q 'Index auto-généré' "$FEATURES/README.md" 2>/dev/null; then
  out="$("$CHECK" "$ROOT")"
  echo "$out"
  cat <<EOF
init: layout v1 détecté (features/README.md = index auto-généré).
STATUS=behind — ne crée PAS BACKLOG.md (évite un split-brain README+BACKLOG).

Après OK utilisateur, appliquer la migration 002 :
  bash ${SKILL_DIR}/scripts/apply-002-readme-vs-backlog.sh ${ROOT} "${TITLE}"

Doc : ${SKILL_DIR}/migrations/002-readme-vs-backlog.md
EOF
  exit 2
fi

# README curé (layout courant)
if [[ ! -f "$FEATURES/README.md" ]]; then
  cp "$SKILL_DIR/templates/features-README.md" "$FEATURES/README.md"
  echo "créé features/README.md (guide, layout_version=${SKILL_VERSION})"
fi

# Template fiche
if [[ ! -f "$FEATURES/feature-template.md" ]]; then
  if [[ -f "$SKILL_DIR/templates/feature-template.md" ]]; then
    cp "$SKILL_DIR/templates/feature-template.md" "$FEATURES/feature-template.md"
  else
    # Fallback minimal si le template n'est pas encore dans la skill
    cat > "$FEATURES/feature-template.md" <<'EOF'
---
id: 0000 # 'add' le remplace par un horodatage AAAAMMDDHHMMSSmmm (scripts/mint-id.sh, fiche 0180) ; nom de fichier <id>_<slug>.md
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
has_fiches=0
if compgen -G "$FEATURES/[0-9]*.md" > /dev/null \
  || compgen -G "$FEATURES/done/[0-9]*.md" > /dev/null; then
  has_fiches=1
fi

if [[ "$has_fiches" -eq 1 ]]; then
  if REGEN="$("$RESOLVE" "$ROOT")"; then
    bash "$REGEN" "$ROOT" "$TITLE"
  else
    echo "init: fiches présentes mais regen-backlog.sh introuvable — BACKLOG non écrit." >&2
    exit 1
  fi
elif [[ ! -f "$FEATURES/BACKLOG.md" ]]; then
  cat > "$FEATURES/BACKLOG.md" <<EOF
# ${TITLE}

> Index auto-généré — **ne pas éditer à la main**. Guide : [README.md](README.md).

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|

> Livrées (\`done/\`) : .
EOF
  echo "créé features/BACKLOG.md (vide)"
fi

ACTUAL="$(installed_layout)"
echo "init backlog OK → ${FEATURES} (layout_version=${ACTUAL} ; skill CURRENT=${SKILL_VERSION})"
