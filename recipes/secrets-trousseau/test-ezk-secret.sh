#!/usr/bin/env bash
# test-ezk-secret.sh — DoD exécutable de la CLI `ezk-secret` (fiche 20260906121839943).
#
# Teste le ROUTAGE, l'aide, la validation d'arguments et les invariants de SÉCURITÉ de la
# CLI — SANS toucher au vrai trousseau. Faux `security`/`pbpaste`/`open` injectés par PATH.
# Ce n'est PAS mocker un secret (rail 1) : on vérifie que la CLI appelle le bon binaire avec
# les bons arguments, pas qu'un vrai secret a été rangé. Le vrai aller-retour trousseau reste
# la vérification manuelle (section « Comment vérifier » de la fiche, qui déclenche Touch ID).
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CLI="$HERE/ezk-secret"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
BIN="$TMP/bin"; mkdir -p "$BIN"
LOG="$TMP/security.log"
export FAKE_LOG="$LOG"
export FAKE_SECRET_VALUE="abcdefghijklmnop"   # 16 car. → aperçu "ab…op"
export FAKE_CLIP="clip-value-1234567890"

# --- faux binaires (injectés par PATH) ---
cat > "$BIN/security" <<'FAKE'
#!/usr/bin/env bash
printf '%s\n' "$@" >> "$FAKE_LOG"
case "$1" in
  find-generic-password) printf '%s\n' "${FAKE_SECRET_VALUE:-abcdefghijklmnop}" ;;
  dump-keychain)
    cat <<'DUMP'
    "svce"<blob>="samplerz-ionos-api"
    "svce"<blob>="livestreamz-vercel-token"
    "svce"<blob>="demo-test-api"
DUMP
    ;;
esac
exit 0
FAKE
cat > "$BIN/pbpaste" <<'FAKE'
#!/usr/bin/env bash
printf '%s' "${FAKE_CLIP:-clip-value}"
FAKE
cat > "$BIN/open" <<'FAKE'
#!/usr/bin/env bash
printf 'open %s\n' "$*" >> "$FAKE_LOG"
exit 0
FAKE
chmod +x "$BIN/security" "$BIN/pbpaste" "$BIN/open"
PATH="$BIN:$PATH"; export PATH

# --- harnais ---
PASS=0; FAIL=0
DESC=""; OUT=""; ERR=""; RC=0
run() { DESC="$1"; shift; : > "$LOG"; OUT="$("$@" 2>"$TMP/err")"; RC=$?; ERR="$(cat "$TMP/err")"; }
ok() { PASS=$((PASS+1)); }
ko() { FAIL=$((FAIL+1)); printf '  ✗ %s\n' "$1" >&2; }
a_rc()    { if [ "$RC" = "$1" ]; then ok; else ko "$DESC : rc attendu $1, obtenu $RC"; fi; }
a_out()   { case "$OUT" in *"$1"*) ok ;; *) ko "$DESC : stdout devait contenir « $1 »" ;; esac; }
a_err()   { case "$ERR" in *"$1"*) ok ;; *) ko "$DESC : stderr devait contenir « $1 »" ;; esac; }
a_nout()  { case "$OUT" in *"$1"*) ko "$DESC : stdout NE devait PAS contenir « $1 »" ;; *) ok ;; esac; }
a_log()   { if grep -qxF -- "$1" "$LOG"; then ok; else ko "$DESC : le log security devait contenir la ligne « $1 »"; fi; }

# 1. Aide globale
run "help"        "$CLI" help
a_rc 0; a_out "set <nom>"; a_out "get <nom>"; a_out "check <nom>"; a_out "list"; a_out "remove <nom>"; a_out "open"
run "--help"      "$CLI" --help ; a_rc 0; a_out "Verbes :"
run "-h"          "$CLI" -h     ; a_rc 0; a_out "Verbes :"
run "no-arg"      "$CLI"        ; a_rc 2; a_err "Verbes :"
run "unknown"     "$CLI" frobnicate ; a_rc 2; a_err "verbe inconnu"

# 2. Aide par sous-commande
for v in set get check list remove open; do
  run "help $v" "$CLI" "$v" --help
  a_rc 0; a_out "ezk-secret $v"
done

# 3. Validation d'arguments (verbes exigeant un nom)
run "get sans nom"    "$CLI" get    ; a_rc 2; a_err "usage"
run "check sans nom"  "$CLI" check  ; a_rc 2; a_err "usage"
run "remove sans nom" "$CLI" remove ; a_rc 2; a_err "usage"
run "set sans nom"    "$CLI" set    ; a_rc 2; a_err "usage"

# 4. Routage get → security find-generic-password -s <nom> -w
run "get routes" "$CLI" get demo-test-api
a_rc 0; a_log "find-generic-password"; a_log "demo-test-api"; a_log "-w"

# 5. set --clip : upsert (-U), -T '' par défaut, lit le presse-papier
run "set --clip" "$CLI" set demo-test-api --clip
a_rc 0; a_log "add-generic-password"; a_log "demo-test-api"; a_log "-U"; a_log "-T"; a_err "presse-papier"

# 6. set --trust <app> : pose -T <app> + avertit
run "set --trust" "$CLI" set demo-test-api --clip --trust /usr/bin/security
a_rc 0; a_log "/usr/bin/security"; a_err "--trust"

# 7. check n'affiche JAMAIS la valeur en clair
run "check masque" "$CLI" check demo-test-api
a_rc 0; a_out "longueur=16"; a_out "aperçu=ab…op"; a_out "empreinte="; a_nout "abcdefghijklmnop"

# 7b. check d'un secret court : pas d'aperçu révélateur
export FAKE_SECRET_VALUE="court"
run "check court" "$CLI" check demo
a_rc 0; a_out "longueur=5"; a_out "trop court"; a_nout "empreinte=court"
export FAKE_SECRET_VALUE="abcdefghijklmnop"

# 8. list → dump-keychain, extrait les noms (jamais les valeurs)
run "list tous" "$CLI" list
a_rc 0; a_out "samplerz-ionos-api"; a_out "livestreamz-vercel-token"; a_log "dump-keychain"
run "list motif" "$CLI" list samplerz
a_rc 0; a_out "samplerz-ionos-api"; a_nout "livestreamz-vercel-token"

# 9. remove → security delete-generic-password
run "remove routes" "$CLI" remove demo-test-api
a_rc 0; a_log "delete-generic-password"; a_log "demo-test-api"
# 9b. verbes à nom unique : refusent un argument en trop (Codex #2 — verbe destructif)
run "remove refuse extra" "$CLI" remove foo bar ; a_rc 2; a_err "argument en trop"
run "get refuse extra"    "$CLI" get foo bar    ; a_rc 2; a_err "argument en trop"

# 10. open → ouvre le Trousseau d'accès
run "open routes" "$CLI" open
a_rc 0; if grep -q "Keychain Access" "$LOG"; then ok; else ko "open : devait ouvrir Keychain Access"; fi

# 11. Rétro-compatibilité : les anciens noms redirigent
run "shim set"       "$HERE/ezk-secret-set" demo-test-api --clip ; a_rc 0; a_log "add-generic-password"; a_err "déprécié"
run "shim get"       "$HERE/ezk-secret-get" demo-test-api        ; a_rc 0; a_log "find-generic-password"
run "shim list"      "$HERE/ezk-secret-list"                     ; a_rc 0; a_log "dump-keychain"
run "shim check"     "$HERE/ezk-secret-check" demo-test-api      ; a_rc 0; a_log "find-generic-password"
run "shim set-ionos" "$HERE/ezk-secret-set-ionos" demo-ionos --clip ; a_rc 0; a_log "add-generic-password"; a_err "déprécié"

# Codex #1 : set-ionos SANS argument → défaut « samplerz-ionos-api » (rétro-compat).
# Faux ezk-secret posé à côté d'une copie du shim : on vérifie l'argument transmis, sans interactif.
IONOS="$TMP/ionos"; mkdir -p "$IONOS"
cp "$HERE/ezk-secret-set-ionos" "$IONOS/ezk-secret-set-ionos"
cat > "$IONOS/ezk-secret" <<'FAKE'
#!/usr/bin/env bash
printf '%s\n' "$@" >> "$FAKE_LOG"
FAKE
chmod +x "$IONOS/ezk-secret"
run "shim set-ionos no-arg → défaut" "$IONOS/ezk-secret-set-ionos"
a_rc 0; a_log "set"; a_log "samplerz-ionos-api"; a_err "déprécié"

# --- bilan ---
echo "----"
printf 'ezk-secret : %d ok, %d ko\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || { echo "❌ test-ezk-secret — ÉCHEC" >&2; exit 1; }
echo "✅ test-ezk-secret — TOUT VERT"
