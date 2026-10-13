#!/usr/bin/env bash
# Banc E2E JETABLE du flux local (github:false) — fiche 20261011091556212.
#
# En clair : les outils du flux local cassent en silence et on le voit en plein run. Ce banc monte un
# dépôt jetable github:false (sans remote), rejoue les commandes du flux local et RELIT les artefacts :
# le bilan accepte un sha local et refuse un sha absent, le bon dépôt est visé, le titre des vues est
# correct. Il attrape ces régressions AVANT un vrai run.
#
# Décision (critère 3 du spike) : ce banc est gardé EN CI — c'est cette suite, listée dans
# bin/test-scripts.sh. Portée : il rejoue `run report` et `regen` (déterministes, sans réseau). Il NE
# rejoue PAS `sprint close` daté : la datation exige un gate de supervision (un serveur MCP), hors d'un
# banc hermétique — couvert à part (fiche 20261002230039863). Ce que le banc couvre est garanti sans réseau.
set -euo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"
TSX="$(cd "$MC" && node -e 'console.log(require.resolve("tsx/cli"))')"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# ── Monte un dépôt jetable github:false, SANS remote ───────────────────────────────
git -C "$TMP" init -q
git -C "$TMP" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
mkdir -p "$TMP/features/done" "$TMP/.vectorz"
printf 'github: false\n' > "$TMP/.vectorz/config.yml"
printf -- '---\nbacklog_title: "Banc E2E flux local"\n---\n\n# Guide\n' > "$TMP/features/README.md"
printf -- '---\nid: "20260101000000001"\ntitle: fiche banc\ntype: feature\npriority: P1\nstatus: shipped\nproduct: vectorz\npr: "local (seed)"\ncreated: 2026-01-01\n---\n\ncorps\n' \
  > "$TMP/features/done/20260101000000001-banc.md"
git -C "$TMP" add -A
git -C "$TMP" -c user.email=t@t -c user.name=t commit -q -m seed
SHA="$(git -C "$TMP" rev-parse --short HEAD)"
ABSENT="0000000"

report() { ( cd "$TMP" && INIT_CWD="$TMP" node "$TSX" "$MC/bin/run-report.ts" "$@" --no-fetch ); }

echo "Banc E2E flux local (github:false, jetable) :"

# 1. run report ACCEPTE une livraison locale dont le sha est sur le main local (code 0).
set +e
report --fiche "20260101000000001|mergée|local ($SHA)|verte|GO|locale verte|-" > "$TMP/r1" 2>&1
rc1=$?
set -e
check "run report accepte local (<sha sur main>) en github:false (code 0)" "test '$rc1' -eq 0"
check "… et vise le dépôt jetable (HEAD $SHA dans le bilan)" "grep -q '$SHA' '$TMP/r1'"

# 2. un sha ABSENT du main → écart (code 1), le sha nommé.
set +e
report --fiche "20260101000000001|mergée|local ($ABSENT)|verte|GO|locale verte|-" > "$TMP/r2" 2>&1
rc2=$?
set -e
check "run report : sha absent du main → écart (code 1)" "test '$rc2' -eq 1"
check "… l'écart nomme le sha absent" "grep -q '$ABSENT' '$TMP/r2'"

# 3. regen écrit le bon H1 (le vrai titre, jamais « # --root ») dans le dépôt jetable.
( cd "$TMP" && bash "$MC/bin/regen-backlog.sh" --root "$TMP" >/dev/null 2>&1 )
check "regen : H1 = vrai titre, pas « # --root »" "head -1 '$TMP/features/BACKLOG.md' | grep -qxF '# Banc E2E flux local'"

echo ""
if [ "$FAIL" = 0 ]; then
  echo 'test-flux-local-e2e: TOUT VERT (banc gardé en CI — décision du spike, critère 3)'
else
  echo 'test-flux-local-e2e: ÉCHECS' >&2
  exit 1
fi
