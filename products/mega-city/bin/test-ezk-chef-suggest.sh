#!/usr/bin/env bash
# DoD exécutable de la fiche 20260831075615809 — teste bin/ezk-chef-suggest.ts (CLI, bord
# I/O) sur fixtures jetables. Le cœur PUR est déjà couvert par vitest
# (src/core/__tests__/ezk-chef-suggest.test.ts) ; ici on vérifie le bord : refus francs,
# lecture seule (rien n'est écrit), sortie sur un sprint avec/sans galère.
set -euo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }
run() { (cd "$MC" && npx tsx bin/ezk-chef-suggest.ts "$@"); }

report() { # $1=dir → un rapport de sprint minimal mais valide (sprint-report@0.1)
  cat > "$1/report.json" <<'EOF'
{
  "schema": "sprint-report@0.1",
  "sprint": { "slug": "test" },
  "generatedAt": "2026-08-31T00:00:00.000Z",
  "window": { "startTs": "2026-08-30T00:00:00.000Z", "endTs": "2026-08-31T00:00:00.000Z" },
  "duration": { "ms": 3600000, "grain": "sprint" },
  "tokens": { "grain": "sprint", "inputTokens": 1, "outputTokens": 1, "totalTokens": 2 },
  "kpi": {
    "shippedFeatures": { "count": 0, "ids": [] },
    "blockages": { "count": 0, "events": [] },
    "prRetouches": { "total": 0, "sansRetouche": 0, "indetermine": 0 }
  },
  "steps": { "ventilated": false, "note": "test" }
}
EOF
}

session_avec_galere() { # $1=dir $2=id
  cat > "$1/session.md" <<EOF
fiches: $2

# Sprint de test

## Galères & gestes (labo)

- **Une galère résolue**
  Symptôme : x. Geste : y. Pourquoi : z.
EOF
}

session_calme() { # $1=dir $2=id
  cat > "$1/session-calme.md" <<EOF
fiches: $2

# Sprint calme

## Backlog
- [x] rien à signaler
EOF
}

echo "Cas A (sprint avec galère → 1 candidat) :"
A="$TMP/a"; mkdir -p "$A"; report "$A"; session_avec_galere "$A" "99900000000001"
out_a="$(run "$A/report.json" "$A/session.md")"
check "annonce 1 candidat"        "grep -q '1 candidat' <<<\"\$out_a\""
check "nomme la bonne fiche"      "grep -q '99900000000001' <<<\"\$out_a\""
check "pointe vers le récit"      "grep -q 'session.md' <<<\"\$out_a\""

echo "Cas B (sprint calme → zéro candidat) :"
B="$TMP/b"; mkdir -p "$B"; report "$B"; session_calme "$B" "99900000000002"
out_b="$(run "$B/report.json" "$B/session-calme.md")"
check "zéro candidat"             "grep -q 'zéro candidat' <<<\"\$out_b\""

echo "Cas C (aucun argument → refus, pas de crash silencieux) :"
set +e
(cd "$MC" && npx tsx bin/ezk-chef-suggest.ts >/tmp/ezk-chef-suggest-c.$$ 2>&1); rc_c=$?
set -e
check "code de sortie ≠ 0"        "[[ \$rc_c -ne 0 ]]"
check "message de refus explicite" "grep -qi 'sprint explicite' /tmp/ezk-chef-suggest-c.$$"
rm -f "/tmp/ezk-chef-suggest-c.$$"

echo "Cas D (rapport absent → refus) :"
set +e
(cd "$MC" && npx tsx bin/ezk-chef-suggest.ts "$TMP/absent.json" "$A/session.md" >/tmp/ezk-chef-suggest-d.$$ 2>&1); rc_d=$?
set -e
check "code de sortie ≠ 0"        "[[ \$rc_d -ne 0 ]]"
check "message : rapport introuvable" "grep -qi 'introuvable' /tmp/ezk-chef-suggest-d.$$"
rm -f "/tmp/ezk-chef-suggest-d.$$"

echo "Cas E (lecture seule : rien de nouveau n'apparaît dans le dossier fixture) :"
before="$(find "$A" -type f | LC_ALL=C sort)"
run "$A/report.json" "$A/session.md" >/dev/null
after="$(find "$A" -type f | LC_ALL=C sort)"
check "aucun fichier créé/modifié" "[[ \"\$before\" == \"\$after\" ]]"

echo "Cas F (deux rapports .json → refus d'ambiguïté) :"
set +e
(cd "$MC" && npx tsx bin/ezk-chef-suggest.ts "$A/report.json" "$A/report.json" "$A/session.md" >/tmp/ezk-chef-suggest-f.$$ 2>&1); rc_f=$?
set -e
check "code de sortie ≠ 0"          "[[ \$rc_f -ne 0 ]]"
check "message : récits en .md"     "grep -qi 'récits de session attendus en .md' /tmp/ezk-chef-suggest-f.$$"
rm -f "/tmp/ezk-chef-suggest-f.$$"

echo "Cas G (rapport partiel : discriminateur + kpi vide, sections manquantes → refus de forme) :"
printf '%s' '{"schema":"sprint-report@0.1","sprint":{"slug":"x"},"generatedAt":"2026-01-01T00:00:00.000Z","window":{"startTs":"2026-01-01T00:00:00.000Z","endTs":"2026-01-02T00:00:00.000Z"},"kpi":{}}' > "$TMP/partiel.json"
set +e
(cd "$MC" && npx tsx bin/ezk-chef-suggest.ts "$TMP/partiel.json" "$A/session.md" >/tmp/ezk-chef-suggest-g.$$ 2>&1); rc_g=$?
set -e
check "code de sortie ≠ 0"          "[[ \$rc_g -ne 0 ]]"
check "message : rapport invalide"  "grep -qi 'rapport de sprint invalide' /tmp/ezk-chef-suggest-g.$$"
rm -f "/tmp/ezk-chef-suggest-g.$$"

echo "Cas H (schéma inattendu mais forme complète → refus, pas d'émission) :"
printf '%s' '{"schema":"unrelated@1","sprint":{"slug":"x"},"generatedAt":"2026-01-01T00:00:00.000Z","window":{"startTs":"2026-01-01T00:00:00.000Z","endTs":"2026-01-02T00:00:00.000Z"},"duration":{"ms":1,"grain":"sprint"},"tokens":{"grain":"sprint","inputTokens":1,"outputTokens":1,"totalTokens":2},"kpi":{"shippedFeatures":{"count":0,"ids":[]},"blockages":{"count":0,"events":[]},"prRetouches":{"total":0,"sansRetouche":0,"indetermine":0}},"steps":{"ventilated":false,"note":"x"}}' > "$TMP/wrongschema.json"
set +e
(cd "$MC" && npx tsx bin/ezk-chef-suggest.ts "$TMP/wrongschema.json" "$A/session.md" >/tmp/ezk-chef-suggest-h.$$ 2>&1); rc_h=$?
set -e
check "code de sortie ≠ 0"          "[[ \$rc_h -ne 0 ]]"
check "message : rapport invalide"  "grep -qi 'rapport de sprint invalide' /tmp/ezk-chef-suggest-h.$$"
rm -f "/tmp/ezk-chef-suggest-h.$$"

if [[ $FAIL -eq 0 ]]; then
  echo "test-ezk-chef-suggest.sh : OK"
else
  echo "test-ezk-chef-suggest.sh : ÉCHEC"
fi
exit $FAIL
