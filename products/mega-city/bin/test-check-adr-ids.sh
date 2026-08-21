#!/usr/bin/env bash
# DoD exécutable de check-adr-ids.sh — fixtures jetables, aucun accès au dépôt réel.
# Cas : A deux séries disjointes · B collision NOUVELLE détectée · C collision HÉRITÉE
# tolérée · D héritée + nouvelle : seule la nouvelle sort · E `--next` donne le premier
# libre des DEUX côtés · F `--next` saute un trou déjà pris d'un seul côté · G dossier
# d'ADR absent → code 2 · H les graphies `ADR-025-x.md` et `0025-x.md` sont comparées
# comme le MÊME nombre (c'est par là que la collision a prospéré) · I le README n'est
# jamais compté comme un ADR.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-adr-ids.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=commande attendue vraie
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

repo() { # $1=nom ; crée les deux dossiers d'ADR
  mkdir -p "$TMP/$1/docs/adr" "$TMP/$1/products/mega-city/docs/adr"
  printf '%s\n' "$TMP/$1"
}
umbrella() { : > "$1/docs/adr/ADR-$2-sujet.md"; }              # graphie ombrelle
method()   { : > "$1/products/mega-city/docs/adr/$2-sujet.md"; } # graphie méthode

# ── A : séries disjointes → vert ────────────────────────────────────────────────
A=$(repo a); umbrella "$A" 040; umbrella "$A" 041; method "$A" 0001; method "$A" 0002
check "A — deux séries disjointes : code 0" "bash '$SCRIPT' '$A' >/dev/null 2>&1"

# ── B : collision NOUVELLE (hors plage héritée) → rouge ─────────────────────────
B=$(repo b); umbrella "$B" 040; method "$B" 0040
check "B — collision neuve détectée : code 1" "! bash '$SCRIPT' '$B' >/dev/null 2>&1"
B_OUT=$(bash "$SCRIPT" "$B" 2>/dev/null || true)
check "B — le numéro fautif est nommé sur stdout" "grep -q '^040' <<<\"\$B_OUT\""

# ── C : collision HÉRITÉE (015-029) → tolérée, on ne réécrit pas le passé ───────
C=$(repo c); umbrella "$C" 020; method "$C" 0020
check "C — collision héritée tolérée : code 0" "bash '$SCRIPT' '$C' >/dev/null 2>&1"
C_ERR=$(bash "$SCRIPT" "$C" 2>&1 >/dev/null || true)
check "C — elle est comptée dans le résumé" "grep -q '1 héritée' <<<\"\$C_ERR\""

# ── D : héritée + neuve → seule la neuve fait échouer ───────────────────────────
D=$(repo d); umbrella "$D" 020; method "$D" 0020; umbrella "$D" 044; method "$D" 0044
check "D — code 1 à cause de la neuve" "! bash '$SCRIPT' '$D' >/dev/null 2>&1"
D_OUT=$(bash "$SCRIPT" "$D" 2>/dev/null || true)
check "D — l'héritée n'est PAS listée comme fautive" "! grep -q '^020' <<<\"\$D_OUT\""
check "D — la neuve, si"  "grep -q '^044' <<<\"\$D_OUT\""

# ── E : --next = premier libre des DEUX côtés ───────────────────────────────────
E=$(repo e); umbrella "$E" 001; method "$E" 0002
check "E — 001 et 002 pris des deux côtés → next = 003" \
      "[ \"\$(bash '$SCRIPT' '$E' --next)\" = '003' ]"

# ── F : --next saute un numéro pris d'UN SEUL côté (le piège d'origine) ─────────
F=$(repo f); method "$F" 0001; method "$F" 0002; umbrella "$F" 003
check "F — 003 pris côté ombrelle seul → next = 004, pas 003" \
      "[ \"\$(bash '$SCRIPT' '$F' --next)\" = '004' ]"

# ── G : dossier d'ADR absent → code 2 (périmètre invalide, pas un verdict) ──────
G="$TMP/g"; mkdir -p "$G/docs/adr"
check "G — dossier méthode absent : code 2" \
      "bash '$SCRIPT' '$G' >/dev/null 2>&1; [ \$? -eq 2 ]"

# ── H : les deux graphies désignent le même NOMBRE ──────────────────────────────
H=$(repo h); umbrella "$H" 045; method "$H" 0045
check "H — 'ADR-045-x.md' et '0045-x.md' collisionnent bien" \
      "! bash '$SCRIPT' '$H' >/dev/null 2>&1"

# ── I : le README n'est pas un ADR ──────────────────────────────────────────────
I=$(repo i); : > "$I/docs/adr/README.md"; : > "$I/products/mega-city/docs/adr/README.md"
check "I — aucun README compté : code 0" "bash '$SCRIPT' '$I' >/dev/null 2>&1"

if [ "$FAIL" -eq 0 ]; then echo "✅ test-check-adr-ids — TOUT VERT"; else echo "❌ test-check-adr-ids — ÉCHECS"; fi
exit "$FAIL"
