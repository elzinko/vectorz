#!/usr/bin/env bash
# Initialise le suivi backlog ezk-backlog (layout courant, Skema).
# Usage : init.sh [racine-projet] [titre-index]
# Crée features/ + done/ + README curé (layout_version courant) + BACKLOG.md vide
# + feature-template.md. Idempotent : n'écrase pas un roadmap/ existant ni un
# features/ déjà peuplé (sauf regen de BACKLOG si demandé).
# Le [titre-index] s'écrit dans l'en-tête du README qu'init installe (backlog_title:) : c'est là
# que regen-backlog.sh le relit à chaque régénération. Un README existant n'est jamais réécrit.
#
# Skema : refuse de half-migrer un layout v1 (`layout_version` 1, ou README « Index
# auto-généré » SANS marqueur : le marqueur prime) — propose apply-002 après OK
# utilisateur (pas de split-brain README+BACKLOG).
#
# Codes de sortie : 0 ok · 1 racine inexistante · 2 layout v1 (migration 002 requise) ·
# 3 gabarit de référence (templates/feature-template.md) introuvable.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-.}"
if [[ ! -d "$ROOT" ]]; then
  echo "erreur: racine inexistante: $ROOT" >&2
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${2:-}"   # vide : le titre déclaré par le projet, sinon le défaut de regen-backlog.sh
FEATURES="$ROOT/features"
CHECK="$SKILL_DIR/scripts/check-layout-version.sh"
RESOLVE="$SKILL_DIR/scripts/resolve-regen-backlog.sh"
SKILL_VERSION="$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION")"
# UNE seule source pour le squelette de fiche : le gabarit du skill (fiche 20260918114726706).
TEMPLATE_REF="$SKILL_DIR/templates/feature-template.md"

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

# Écrit `backlog_title:` dans l'en-tête YAML d'un README tout juste copié du gabarit, juste avant
# le `---` qui le ferme. Valeur entre apostrophes, une apostrophe y est doublée : du YAML valide
# quel que soit le titre, que regen-backlog.sh relit à l'identique. Jumelle dans apply-002.
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

if [[ -d "$ROOT/roadmap" ]]; then
  echo "convention roadmap/ détectée — rien créé (épouser l'existant)."
  exit 0
fi

# Pas de repli embarqué : sans la référence on échoue (code 3, distinct du 2 « migration requise »)
# avant d'avoir créé quoi que ce soit.
if [[ ! -f "$TEMPLATE_REF" ]]; then
  echo "erreur: gabarit de référence introuvable: $TEMPLATE_REF" >&2
  exit 3
fi

# BACKLOG.md est toujours écrit par regen-backlog.sh : le trouver AVANT toute écriture (pas d'init
# à moitié faite). Le résolveur a toujours la copie vendored du skill en dernier recours.
if ! REGEN="$("$RESOLVE" "$ROOT")"; then
  echo "init: regen-backlog.sh introuvable — rien créé." >&2
  exit 1
fi

mkdir -p "$FEATURES/done"

# Legacy v1 : ne pas créer BACKLOG à côté d'un index README — propose migration.
# La version vient d'UNE seule source, check-layout-version.sh : le marqueur `layout_version`
# du front-matter PRIME sur la mention « Index auto-généré » (fiche 20260813122510737).
# Un README déjà en v2+ qui garde cette mention n'est donc PAS classé v1.
if [[ "$(installed_layout)" -eq 1 ]]; then
  out="$("$CHECK" "$ROOT")"
  echo "$out"
  title_arg=""
  [[ -z "$TITLE" ]] || title_arg=" \"${TITLE}\""
  cat <<EOF
init: layout v1 détecté (features/README.md : layout_version 1, ou index auto-généré sans marqueur).
STATUS=behind — ne crée PAS BACKLOG.md (évite un split-brain README+BACKLOG).

Après OK utilisateur, appliquer la migration 002 :
  bash ${SKILL_DIR}/scripts/apply-002-readme-vs-backlog.sh ${ROOT}${title_arg}

Doc : ${SKILL_DIR}/migrations/002-readme-vs-backlog.md
EOF
  exit 2
fi

# README curé (layout courant). Le titre demandé n'est écrit que dans un README qu'init installe.
title_written=0
if [[ ! -f "$FEATURES/README.md" ]]; then
  cp "$SKILL_DIR/templates/features-README.md" "$FEATURES/README.md"
  if [[ -n "$TITLE" ]]; then
    write_backlog_title "$FEATURES/README.md" "$TITLE"
    title_written=1
  fi
  echo "créé features/README.md (guide, layout_version=${SKILL_VERSION})"
fi

# Template fiche — copié tel quel depuis la référence. Un gabarit local existant n'est JAMAIS
# réécrit (il peut porter des réglages du projet) : on signale l'écart et la commande qui l'aligne.
if [[ ! -f "$FEATURES/feature-template.md" ]]; then
  cp "$TEMPLATE_REF" "$FEATURES/feature-template.md"
  echo "créé features/feature-template.md"
elif ! cmp -s "$TEMPLATE_REF" "$FEATURES/feature-template.md"; then
  echo "note: features/feature-template.md diffère du gabarit de référence (conservé tel quel)."
  echo "      Pour l'aligner : cp \"$TEMPLATE_REF\" \"$FEATURES/feature-template.md\""
fi

# BACKLOG.md — écrit par regen-backlog.sh, comme toute régénération (vide s'il n'y a pas encore de
# fiche). Un BACKLOG existant sans fiche n'est pas touché. Le titre n'est passé que s'il vient d'être
# écrit dans le README : même valeur des deux côtés, et la ligne 1 ne bougera pas à la prochaine
# régénération, même avec un script plus ancien qui ne lit pas encore backlog_title:.
has_fiches=0
if compgen -G "$FEATURES/[0-9]*.md" > /dev/null \
  || compgen -G "$FEATURES/done/[0-9]*.md" > /dev/null; then
  has_fiches=1
fi

if [[ "$has_fiches" -eq 1 || ! -f "$FEATURES/BACKLOG.md" ]]; then
  if [[ "$title_written" -eq 1 ]]; then
    bash "$REGEN" "$ROOT" "$TITLE"
  else
    bash "$REGEN" "$ROOT"
  fi
  if [[ -n "$TITLE" && "$(head -1 "$FEATURES/BACKLOG.md")" != "# ${TITLE}" ]]; then
    q="'"
    echo "note: titre « ${TITLE} » non appliqué : features/README.md existait déjà, c'est son en-tête qui fait foi."
    echo "      Pour l'appliquer, ajoute dans cet en-tête : backlog_title: '${TITLE//$q/$q$q}' — puis régénère."
  fi
fi

ACTUAL="$(installed_layout)"
echo "init backlog OK → ${FEATURES} (layout_version=${ACTUAL} ; skill CURRENT=${SKILL_VERSION})"
