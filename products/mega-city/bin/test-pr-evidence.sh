#!/usr/bin/env bash
# DoD exécutable de pr-evidence.sh (fiche 20260902224608715, ADR-0045) — fixtures
# jetables, backend de capture FACTICE (PR_EVIDENCE_SHOT_CMD), aucun accès réseau
# ni navigateur, aucun accès au dépôt réel.
# Cas : 1 capture before+after · 2 capture sans --url · 3 render après commit (lien
# par SHA) · 3b render avant commit (avertissement) · 4 render sans image · 5-9 decide.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/pr-evidence.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Backend factice : écrit un VRAI PNG minimal (signature + IHDR + IDAT vide + IEND,
# CRC inclus) aux dimensions demandées — contrat PR_EVIDENCE_SHOT_CMD : 4 arguments
# positionnels <url> <fichier-sortie> <largeur> <hauteur>.
FAKE_BACKEND="$TMP/fake-shot.py"
cat > "$FAKE_BACKEND" <<'PY'
#!/usr/bin/env python3
import sys, struct, zlib

def chunk(tag, data):
    body = tag + data
    return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xffffffff)

_url, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)  # 8 bits, couleur RGB
with open(out, 'wb') as f:
    f.write(b'\x89PNG\r\n\x1a\n')
    f.write(chunk(b'IHDR', ihdr))
    f.write(chunk(b'IDAT', zlib.compress(b'')))
    f.write(chunk(b'IEND', b''))
PY
chmod +x "$FAKE_BACKEND"
export PR_EVIDENCE_SHOT_CMD="$FAKE_BACKEND"

# Lit largeur/hauteur depuis l'IHDR (octets 16-23, big-endian).
png_dims() {
  python3 -c "
import struct, sys
with open(sys.argv[1], 'rb') as f:
    data = f.read(24)
w, h = struct.unpack('>II', data[16:24])
print(f'{w}x{h}')
" "$1"
}

git_repo() { # $1=dir — dépôt jetable, identité LOCALE, remote origin github
  mkdir -p "$1"
  git -C "$1" init -q -b main
  git -C "$1" -c user.name=t -c user.email=t@t commit -q --allow-empty -m "init"
  git -C "$1" remote add origin https://github.com/o/r.git
}

# ══ Cas 1 : capture before + after → deux fichiers, même dimension (390x844) ═════
R1="$TMP/repo1"
git_repo "$R1"
out1="$("$SCRIPT" capture 20260902224608715 --view board --phase before --url http://x/before --out "$R1/docs/pr-evidence")"; rc1a=$?
out2="$("$SCRIPT" capture 20260902224608715 --view board --phase after --url http://x/after --out "$R1/docs/pr-evidence")"; rc1b=$?
echo "Cas 1 (capture before/after) :"
check "code de sortie 0 (before)"  "[ $rc1a -eq 0 ]"
check "code de sortie 0 (after)"   "[ $rc1b -eq 0 ]"
check "fichier before présent"     "[ -f '$R1/docs/pr-evidence/20260902224608715/board-before.png' ]"
check "fichier after présent"      "[ -f '$R1/docs/pr-evidence/20260902224608715/board-after.png' ]"
check "dimension before = 390x844" "[ \"\$(png_dims '$R1/docs/pr-evidence/20260902224608715/board-before.png')\" = '390x844' ]"
check "dimension after = 390x844"  "[ \"\$(png_dims '$R1/docs/pr-evidence/20260902224608715/board-after.png')\" = '390x844' ]"

# ══ Cas 2 : capture sans --url → échec explicite, rien créé ═════════════════════
R2="$TMP/repo2"
git_repo "$R2"
err2="$("$SCRIPT" capture 20260902224608715 --view board --phase before --out "$R2/docs/pr-evidence" 2>&1 1>/dev/null)"; rc2=$?
echo "Cas 2 (capture sans --url) :"
check "code de sortie ≠ 0"           "[ $rc2 -ne 0 ]"
check "message nomme --url"          "printf '%s' \"\$err2\" | grep -q -- '--url'"
check "dossier <out>/<id> absent"    "[ ! -d '$R2/docs/pr-evidence/20260902224608715' ]"

# ══ Cas 3 : render après commit des PNG → liens par SHA (pas la branche) ════════
R3="$TMP/repo3"
git_repo "$R3"
"$SCRIPT" capture 20260902224608715 --view board --phase before --url http://x/b --out "$R3/docs/pr-evidence" >/dev/null
"$SCRIPT" capture 20260902224608715 --view board --phase after  --url http://x/a --out "$R3/docs/pr-evidence" >/dev/null
( cd "$R3" && git add docs/pr-evidence && git -c user.name=t -c user.email=t@t commit -q -m "add evidence" )
sha3="$(git -C "$R3" rev-parse HEAD)"
out3="$(cd "$R3" && "$SCRIPT" render 20260902224608715 --out "$R3/docs/pr-evidence")"; rc3=$?
echo "Cas 3 (render après commit — liens par SHA) :"
check "code de sortie 0" "[ $rc3 -eq 0 ]"
check "lien avant présent, bon SHA" \
  "printf '%s' \"\$out3\" | grep -qF 'https://github.com/o/r/blob/$sha3/docs/pr-evidence/20260902224608715/board-before.png?raw=true'"
check "lien après présent, même SHA" \
  "printf '%s' \"\$out3\" | grep -qF 'https://github.com/o/r/blob/$sha3/docs/pr-evidence/20260902224608715/board-after.png?raw=true'"
check "le SHA n'est pas le nom de branche" "[ '$sha3' != 'main' ]"

# ══ Cas 3b : render AVANT commit → avertissement stderr, stdout inchangé, exit 0 ═
R3B="$TMP/repo3b"
git_repo "$R3B"
"$SCRIPT" capture 20260902224608715 --view board --phase before --url http://x/b --out "$R3B/docs/pr-evidence" >/dev/null
"$SCRIPT" capture 20260902224608715 --view board --phase after  --url http://x/a --out "$R3B/docs/pr-evidence" >/dev/null
( cd "$R3B" && git add docs/pr-evidence )   # ajouté mais PAS committé
out3b="$(cd "$R3B" && "$SCRIPT" render 20260902224608715 --out "$R3B/docs/pr-evidence" 2>"$TMP/3b.err")"; rc3b=$?
echo "Cas 3b (render avant commit) :"
check "code de sortie 0"                 "[ $rc3b -eq 0 ]"
check "avertissement « commit d'abord »" "grep -q \"commit d'abord\" '$TMP/3b.err'"
check "stdout garde les liens malgré tout" "printf '%s' \"\$out3b\" | grep -q 'board-before.png'"

# ══ Cas 4 : render sans image → échec explicite ═════════════════════════════════
R4="$TMP/repo4"
git_repo "$R4"
err4="$(cd "$R4" && "$SCRIPT" render 99999999999999 --out "$R4/docs/pr-evidence" 2>&1 1>/dev/null)"; rc4=$?
echo "Cas 4 (render sans image) :"
check "code de sortie ≠ 0"       "[ $rc4 -ne 0 ]"
check "message nomme la fiche"   "printf '%s' \"\$err4\" | grep -q '99999999999999'"
check "message dit « aucune image »" "printf '%s' \"\$err4\" | grep -qi 'aucune image'"

# ══ Cas 5-9 : decide (logique pure, sans dépôt) ══════════════════════════════════
echo "Cas 5 (decide before-after) :"
out5="$("$SCRIPT" decide --evidence before-after)"; rc5=$?
check "code de sortie 0" "[ $rc5 -eq 0 ]"
check "stdout = capture"  "[ \"\$out5\" = 'capture' ]"

echo "Cas 6 (decide none --reason x) :"
out6="$("$SCRIPT" decide --evidence none --reason x)"; rc6=$?
check "code de sortie 0"       "[ $rc6 -eq 0 ]"
check "stdout = N.A. — x"      "[ \"\$out6\" = 'N.A. — x' ]"

echo "Cas 7 (decide auto — diff sans chemin d'interface) :"
list7="$TMP/changed7"; printf 'src/a.test.ts\nsrc/__tests__/b.tsx\n' > "$list7"
out7="$("$SCRIPT" decide --evidence auto --changed-files "$list7")"; rc7=$?
check "code de sortie 0"                         "[ $rc7 -eq 0 ]"
check "stdout = N.A. — aucun chemin d'interface" "[ \"\$out7\" = 'N.A. — aucun chemin d'\''interface touché' ]"

echo "Cas 8 (decide auto — diff avec un .tsx hors tests) :"
list8="$TMP/changed8"; printf 'src/a.test.ts\nsrc/Board.tsx\n' > "$list8"
out8="$("$SCRIPT" decide --evidence auto --changed-files "$list8")"; rc8=$?
check "code de sortie 0" "[ $rc8 -eq 0 ]"
check "stdout = capture" "[ \"\$out8\" = 'capture' ]"

echo "Cas 9 (decide sans --evidence) :"
err9="$("$SCRIPT" decide 2>&1)"; rc9=$?
check "code de sortie 2" "[ $rc9 -eq 2 ]"
check "message nomme --evidence" "printf '%s' \"\$err9\" | grep -q -- '--evidence'"

echo
if [ "$FAIL" -eq 0 ]; then echo "pr-evidence : tous les cas passent."; else echo "pr-evidence : ÉCHEC."; fi
exit "$FAIL"
