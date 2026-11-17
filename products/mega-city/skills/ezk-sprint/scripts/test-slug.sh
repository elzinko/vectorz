#!/usr/bin/env bash
# test-slug.sh — le nom du compte rendu de sprint garde les lettres accentuées (fiche 20261115180226950).
# « Les décisions deviennent loi » doit donner les-decisions-deviennent-loi, pas les-d-cisions-….
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=slug.sh
source "$HERE/slug.sh"

FAIL=0
ok() { # <libellé> <attendu> <obtenu>
  if [[ "$2" == "$3" ]]; then echo "  ✓ $1"; else echo "  ✗ $1 — attendu « $2 », obtenu « $3 »"; FAIL=1; fi
}

ok "les accents deviennent des lettres simples" "les-decisions-deviennent-loi" "$(sprint_slug "Les décisions deviennent loi" 7)"
ok "majuscules accentuées, ç et œ" "ete-a-la-francaise-coeur" "$(sprint_slug "Été à la française : cœur" 1)"
ok "un but sans accent garde exactement le même nom" "voir-le-process-de-chaque-projet-dans-mission-co" "$(sprint_slug "voir le process de chaque projet dans mission control" 2)"
ok "le nom est coupé à 48 caractères, sans tiret final" "voir-tout-ce-qui-est-relie-dans-la-methode-sur-u" "$(sprint_slug "voir tout ce qui est relié dans la méthode, sur une carte zoomable" 2)"
ok "un but sans lettre convertible retombe sur n<N>" "n4" "$(sprint_slug "日本語" 4)"
ok "un but vide retombe sur sprint-<N>" "sprint-3" "$(sprint_slug "" 3)"

# Sans perl : le nom d'avant, et un avertissement sur stderr.
NOPERL="$(mktemp -d)"; for b in tr sed cut cat printf; do p="$(command -v "$b")" && ln -s "$p" "$NOPERL/$b"; done
WARNED="$(PATH="$NOPERL" sprint_slug "Été" 1 2>&1 >/dev/null)"
ok "sans perl, un avertissement le dit" "1" "$(printf '%s' "$WARNED" | grep -c 'perl introuvable')"
rm -rf "$NOPERL"

if (( FAIL )); then echo "❌ test-slug — en échec"; exit 1; fi
echo "✅ test-slug — TOUT VERT"
