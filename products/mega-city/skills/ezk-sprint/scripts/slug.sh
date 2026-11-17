#!/usr/bin/env bash
# slug.sh — le nom sûr d'un sprint, tiré de son objectif (fiche 20261115180226950).
#
# Il entre dans un nom de fichier (docs/sprints/<date>-sprint-<slug>.md) et dans l'id du point de passage
# de supervision (sprint-<slug>-checkpoint). Les lettres accentuées deviennent des lettres simples
# (« décisions » → « decisions ») au lieu de casser le mot ; le reste suit la règle d'avant : minuscules,
# tirets, 48 caractères au plus, repli n<N> quand il ne reste rien.
#
# Usage : source slug.sh ; sprint_slug "<objectif>" <numéro>

# Retire les accents (décomposition Unicode, puis suppression des signes diacritiques).
# Sans perl, le texte passe tel quel (la règle d'avant s'applique) et un WARN le dit sur stderr.
_strip_accents() {
  if command -v perl >/dev/null 2>&1; then
    # Les ligatures œ, Œ, æ, Æ n'ont pas de décomposition : on les écrit par leur code.
    perl -CS -MUnicode::Normalize -pe '$_ = NFD($_); s/\pM//g; s/\x{153}/oe/g; s/\x{152}/OE/g; s/\x{e6}/ae/g; s/\x{c6}/AE/g'
  else
    # Sans perl, les accents ne sont pas convertis : on le dit, plutôt que de retomber en silence.
    echo "WARN: perl introuvable — les accents du nom de sprint ne sont pas translittérés" >&2
    cat
  fi
}

sprint_slug() { # <objectif> <numéro>
  local obj="$1" n="$2" slug
  slug="$(printf '%s' "${obj:-sprint $n}" | _strip_accents | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' \
    | sed 's/^-*//;s/-*$//' | cut -c1-48 | sed 's/-*$//')"
  [[ -n "$slug" ]] || slug="n${n}"
  printf '%s\n' "$slug"
}
