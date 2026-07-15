#!/usr/bin/env bash
# deploy.sh — le rangement DÉTERMINISTE d'ezk-ezk (ADR-0001 §2 : « le LLM ne range jamais »).
#
# Fait, et fait SEUL, le travail mécanique :
#   1. crée le dossier du skill cible  skills/<name>/  (défaut : mega-city skills/, ADR-0006)
#   2. y écrit le SKILL.md fourni      (déjà rédigé/validé par skill-creator — le script n'invente RIEN)
#   3. symlink non-destructif          ~/.claude/skills/<name> -> skills/<name>
#
# Pattern repris de claude-skills/install.sh (link_or_copy) : on ne remplace QUE notre
# propre destination, jamais un fichier de l'utilisateur. Idempotent. Chemins quotés.
#
# Usage :
#   deploy.sh <name> <src-SKILL.md> [dest-skills-dir]
#
#   <name>            nom du skill (= nom du dossier cible et de l'entrée ~/.claude/skills/)
#   <src-SKILL.md>    chemin du SKILL.md produit par skill-creator
#   [dest-skills-dir] dossier catalogue où ranger le skill (défaut : mega-city skills/)
#
#   deploy.sh --copy ...   pose une COPIE figée au lieu du symlink live-update (par défaut : symlink)

set -euo pipefail

MODE="symlink"
if [[ "${1:-}" == "--copy" ]]; then
  MODE="copy"
  shift
fi

NAME="${1:-}"
SRC_SKILL="${2:-}"

# Catalogue de destination : argument explicite, sinon le skills/ de mega-city.
# Ce script vit dans skills/ezk-ezk/scripts/ ; remonter de 2 niveaux donne skills/.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SKILLS_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEST_SKILLS_DIR="${3:-$DEFAULT_SKILLS_DIR}"

usage() {
  echo "usage: deploy.sh [--copy] <name> <src-SKILL.md> [dest-skills-dir]" >&2
  exit 2
}

[[ -n "$NAME" ]] || { echo "✗ nom du skill manquant" >&2; usage; }
[[ -n "$SRC_SKILL" ]] || { echo "✗ chemin du SKILL.md source manquant" >&2; usage; }

# --- Garde anti-traversal : <name> = slug simple, jamais '/' ni '..' ---------
if [[ ! "$NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  echo "✗ nom de skill invalide : '$NAME' (attendu : minuscules/chiffres/-/_ ; pas de / ni ..)" >&2
  exit 1
fi

# --- Pré-conditions strictes : on ne range qu'un VRAI skill ------------------
if [[ ! -f "$SRC_SKILL" ]]; then
  echo "✗ source introuvable : $SRC_SKILL" >&2
  exit 1
fi
if [[ "$(basename "$SRC_SKILL")" != "SKILL.md" ]]; then
  echo "✗ la source doit être un fichier SKILL.md (reçu : $(basename "$SRC_SKILL")) — skip" >&2
  exit 1
fi

# --- 1. dossier cible + 2. écriture du SKILL.md -----------------------------
SKILL_DIR="$DEST_SKILLS_DIR/$NAME"
mkdir -p "$SKILL_DIR"

# Idempotent : si la source EST déjà le fichier de destination, ne pas se copier sur soi-même.
DEST_SKILL="$SKILL_DIR/SKILL.md"
if [[ "$(cd "$(dirname "$SRC_SKILL")" && pwd)/$(basename "$SRC_SKILL")" != "$DEST_SKILL" ]]; then
  cp "$SRC_SKILL" "$DEST_SKILL"
fi
echo "✓ skill rangé → $SKILL_DIR"

# --- 3. symlink (ou copie) non-destructif vers ~/.claude/skills/<name> ------
# Réplique link_or_copy d'install.sh : on remplace UNIQUEMENT notre propre entrée,
# jamais un autre fichier de l'utilisateur (invariant ADR-0006).
CLAUDE_SKILLS="$HOME/.claude/skills"
mkdir -p "$CLAUDE_SKILLS"
LINK="$CLAUDE_SKILLS/$NAME"

# Non-destructif (invariant ADR-0006) : on ne retire QUE notre propre symlink, ou un
# skill homonyme déjà déployé (dossier contenant un SKILL.md = idempotent). Un VRAI
# fichier/dossier utilisateur préexistant est refusé, jamais écrasé.
if [[ -L "$LINK" ]]; then
  rm -f "$LINK"
elif [[ -d "$LINK" && -f "$LINK/SKILL.md" ]]; then
  rm -rf "$LINK"
elif [[ -e "$LINK" ]]; then
  echo "✗ $LINK existe et n'est ni notre symlink ni un skill — refus (non-destructif)." >&2
  echo "  Retire-le à la main ou choisis un autre nom." >&2
  exit 1
fi
if [[ "$MODE" == "copy" ]]; then
  cp -r "$SKILL_DIR" "$LINK"
  echo "✓ installé (copie figée) → $LINK"
else
  ln -s "${SKILL_DIR%/}" "$LINK"
  echo "✓ installé (symlink live-update) → $LINK"
fi

# --- 4. catalogue : ajoute la ligne du skill si le dossier a un README de catalogue ------
# Best-effort NON-DESTRUCTIF (ADR-0001 « le script range ») : deploy range un skill mais
# l'index skills/README.md dérivait faute d'être mis à jour. Idempotent ; n'échoue JAMAIS
# le deploy (le garde-fou CI catalog-readme.test.ts reste le filet de sécurité).
CATALOG="$DEST_SKILLS_DIR/README.md"
if [[ -f "$CATALOG" ]] && command -v node >/dev/null 2>&1; then
  node "$SCRIPT_DIR/catalog-sync.mjs" "$DEST_SKILL" "$CATALOG" || true
fi

echo ""
echo "Skill « $NAME » déployé."
echo "→ Lance /reload-skills pour l'activer sans quitter la session ;"
echo "  sinon il sera pris au prochain démarrage de session."
