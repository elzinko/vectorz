#!/usr/bin/env bash
# DoD de scripts/mint-id.sh (fiche 0180). On vérifie ce que le script GARANTIT :
#   - format horodaté `AAAAMMDDHHMMSSmmm` (17 chiffres exactement) ;
#   - préfixe = jour courant (AAAAMMDD) ;
#   - monotonie non décroissante entre appels ⇒ tri chronologique fiable.
# On NE teste PAS l'unicité stricte à la même milliseconde : deux sessions/branches
# ne se voyant pas, c'est l'entropie (la ms) qui protège, pas une garantie du script —
# le résiduel même-ms est documenté comme à désambiguïser par l'appelant.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
MINT="$HERE/mint-id.sh"
FAIL=0
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

id="$("$MINT")"
[[ "$id" =~ ^[0-9]{17}$ ]] || fail "format ≠ 17 chiffres : '$id'"

today="$(date -u +%Y%m%d)"   # l'id est minté en UTC (finding Codex) — comparer en UTC
[[ "${id:0:8}" == "$today" ]] || fail "préfixe ≠ jour UTC courant : ${id:0:8} ≠ $today"

# 5 mints successifs : tous bien formés, jamais décroissants (le temps avance).
prev=""
for _ in 1 2 3 4 5; do
  cur="$("$MINT")"
  [[ "$cur" =~ ^[0-9]{17}$ ]] || fail "format ≠ 17 chiffres (boucle) : '$cur'"
  if [[ -n "$prev" && "$cur" < "$prev" ]]; then fail "non monotone : $cur < $prev"; fi
  prev="$cur"
done

if [[ $FAIL -eq 0 ]]; then
  echo "✅ test-mint-id — format 17ch + préfixe jour + monotonie OK"
else
  echo "❌ test-mint-id — $FAIL assertion(s) en échec"
  exit 1
fi
