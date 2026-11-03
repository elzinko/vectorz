#!/usr/bin/env bash
# DoD exécutable de la fiche 20261102182259416 — `ezk carto` : le carnet de tests, de bout en bout,
# sans IA ni navigateur, sur l'arbre de l'app jouet du scout (4 nœuds, axe fonctionnel).
# Cas : A arbre mal formé refusé avec sa ligne · B record refuse un nœud inconnu et une preuve
# absente · C 3 échecs + 1 valide donnent « 4 sur 4 testés » · D la preuve est copiée hors de
# l'arbre de travail, git status propre, garde find-only du scout OK · E l'horloge avancée au-delà de 14 jours fait tout expirer,
# et --todo liste les 4 · F --json porte schema_version et le même compte · G --zone restreint à une
# branche de l'arbre (fiche 20261102182259505), et refuse une branche inconnue.
set -euo pipefail

MEGA="$(cd "$(dirname "$0")/.." && pwd)"          # products/mega-city
BIN="$MEGA/bin/ezk-carto.ts"
TREE="$MEGA/skills/ezk-scout/examples/carto-demo-app.yml"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi }
carto() { (cd "$MEGA" && pnpm exec tsx "$BIN" "$@" --root "$PROJ"); }

# ── Projet-fixture : un dépôt git qui déclare l'arbre de l'app jouet ──────────
PROJ="$TMP/projet"
mkdir -p "$PROJ/.vectorz" "$PROJ/carto"
cp "$TREE" "$PROJ/carto/demo-app.yml"
cat > "$PROJ/.vectorz/config.yml" <<'EOF'
github: false
carto:
  trees:
    demo-app: carto/demo-app.yml
EOF
(
  cd "$PROJ"
  git init -q
  git -c user.email=t@test -c user.name=test add -A
  git -c user.email=t@test -c user.name=test commit -qm init
)
GUARD="$MEGA/skills/ezk-scout/scripts/find-only-guard.sh"
bash "$GUARD" snapshot "$PROJ" > "$TMP/snapshot.txt"   # la photo du scout, avant toute note au carnet
mkdir -p "$TMP/preuves"
for n in sante bpm dossier export; do echo "curl … → réponse de la sonde $n" > "$TMP/preuves/$n.log"; done

# ── A : un arbre mal formé est refusé avec la ligne fautive ───────────────────
cp "$PROJ/carto/demo-app.yml" "$TMP/arbre.bak"
sed -i.tmp 's/^    title: Exporter une grille par POST \/export$/    titel: faute/' "$PROJ/carto/demo-app.yml"
set +e; out_a="$(carto status 2>&1)"; code_a=$?; set -e
check "A — arbre mal formé refusé (code 1)"                 '[ "$code_a" -eq 1 ]'
check "A — le message nomme le fichier et la ligne"         'echo "$out_a" | grep -q "carto/demo-app.yml:17 — "'
cp "$TMP/arbre.bak" "$PROJ/carto/demo-app.yml"; rm -f "$PROJ/carto/demo-app.yml.tmp"

# ── B : record refuse un nœud inconnu, et une preuve absente ──────────────────
set +e
out_b1="$(carto record ecran-fantome --axis fonctionnel --verdict valide --proof "$TMP/preuves/sante.log" 2>&1)"; code_b1=$?
out_b2="$(carto record sante --axis fonctionnel --verdict valide --proof "$TMP/preuves/absente.log" 2>&1)"; code_b2=$?
set -e
check "B — nœud inconnu refusé, nœuds connus listés"       '[ "$code_b1" -eq 1 ] && echo "$out_b1" | grep -q "nœud inconnu « ecran-fantome »"'
check "B — preuve absente refusée"                          '[ "$code_b2" -eq 1 ] && echo "$out_b2" | grep -q "preuve introuvable"'

# ── C : 3 échecs + 1 valide = 4 sur 4 testés ──────────────────────────────────
carto record sante --axis fonctionnel --verdict valide --proof "$TMP/preuves/sante.log" >/dev/null 2>&1
carto record export --axis fonctionnel --verdict echec --proof "$TMP/preuves/export.log" >/dev/null 2>&1
carto record export/bpm-invalide --axis fonctionnel --verdict echec --proof "$TMP/preuves/bpm.log" >/dev/null 2>&1
carto record export/dossier-ferme --axis fonctionnel --verdict echec --proof "$TMP/preuves/dossier.log" >/dev/null 2>&1
out_c="$(carto status 2>/dev/null)"
check "C — « 4 sur 4 testés », 3 en échec"                 'echo "$out_c" | head -1 | grep -q "^En clair : 4 sur 4 testés — 0 jamais testé(s), 0 expiré(s), 3 en échec."'
check "C — la mention des passes d'exploration"            'echo "$out_c" | grep -q "ne compte que les passes d.exploration"'
check "C — sante valide, 0 commit depuis"                  'echo "$out_c" | grep -Eq "sante +fonctionnel +valide · il y a 0 j · 0 commit depuis"'

# ── D : la preuve est copiée dans le dossier git commun, l'arbre de travail reste propre ──
STORE="$(git -C "$PROJ" rev-parse --path-format=absolute --git-common-dir)/ezk/carto/demo-app"
check "D — journal de 4 lignes hors de l'arbre de travail" '[ "$(wc -l < "$STORE/journal.jsonl" | tr -d " ")" -eq 4 ]'
check "D — 4 preuves copiées, nommées par empreinte"       '[ "$(ls "$STORE/proofs" | grep -cE "^[0-9a-f]{64}\.log$")" -eq 4 ]'
rm -rf "$TMP/preuves"
check "D — la copie survit à la source supprimée"          '[ "$(ls "$STORE/proofs" | wc -l | tr -d " ")" -eq 4 ]'
check "D — git status propre"                               '[ -z "$(git -C "$PROJ" status --porcelain)" ]'

# ── E : au-delà de 14 jours, tout expire ; --todo liste les 4 ─────────────────
out_e="$(EZK_CARTO_NOW="$(date -u -v+15d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+15 days' +%Y-%m-%dT%H:%M:%SZ)" carto status --todo 2>/dev/null)"
check "E — « 0 sur 4 testés », 4 expirés"                  'echo "$out_e" | head -1 | grep -q "^En clair : 0 sur 4 testés — 0 jamais testé(s), 4 expiré(s)"'
check "E — --todo liste les 4 nœuds expirés"               '[ "$(echo "$out_e" | grep -c " expirée (dernier verdict")" -eq 4 ]'
# Le scout note au carnet pendant sa passe (fiche 20261102182259505) : sa garde find-only doit rester OK.
set +e; out_guard="$(bash "$GUARD" verify "$TMP/snapshot.txt" 2>&1)"; code_guard=$?; set -e
check "D — la garde find-only du scout reste OK après les notes" '[ "$code_guard" -eq 0 ] && echo "$out_guard" | grep -q "find-only : OK"'


# ── F : le JSON porte son numéro de format et le même compte ──────────────────
out_f="$(carto status --json 2>/dev/null)"
check "F — schema_version et compte 4 sur 4"               'echo "$out_f" | node -e "const s=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\")); process.exit(s.schema_version===1 && s.counts.tested===4 && s.counts.total===4 && s.scope===\"exploration\" ? 0 : 1)"'

# ── G : --zone restreint l'état à une branche de l'arbre ──────────────────────
out_g="$(carto status --zone export 2>/dev/null)"
check "G — la branche export compte 3 contrôles"           'echo "$out_g" | head -1 | grep -q "^En clair : 3 sur 3 testés"'
check "G — sante sort de la branche"                       '! echo "$out_g" | grep -Eq "^  sante "'
out_gj="$(carto status --zone export --json 2>/dev/null)"
check "G — le JSON nomme la branche, ses nœuds en sont"    'echo "$out_gj" | node -e "const s=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\")); process.exit(s.zone===\"export\" && s.counts.total===3 && s.checks.every(c=>c.node===\"export\"||c.node.startsWith(\"export/\")) ? 0 : 1)"'
set +e; out_g2="$(carto status --zone exp 2>&1)"; code_g2=$?; set -e
check "G — une branche inconnue est refusée (code 1)"      '[ "$code_g2" -eq 1 ] && echo "$out_g2" | grep -q "branche inconnue « exp »"'

if [ "$FAIL" -eq 0 ]; then echo "test-ezk-carto.sh : OK"; else echo "test-ezk-carto.sh : ÉCHEC" >&2; exit 1; fi
