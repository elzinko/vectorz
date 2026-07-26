#!/usr/bin/env bash
# Lance tous les DoD exécutables en bash du repo (`pnpm test:scripts`).
#
# Ils existaient déjà mais se lançaient à la main, donc rien ne garantissait qu'ils
# soient encore verts (`rules/development/use-project-scripts.md`). Les tests TypeScript
# restent sous `pnpm test` (vitest) : ce runner ne couvre que les scripts shell.
set -uo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"
SUITES=(
  "skills/ezk-archive/scripts/test-check-branches.sh"    # fiche 0076 — classification des branches
  "skills/ezk-archive/scripts/test-check-gate.sh"        # fiche 0088 — contrat du gate
  "skills/ezk-archive/scripts/test-mainsync.sh"          # fiche 0088 — garde anti-faux-positif
  "skills/ezk-archive/scripts/test-handoff.sh"           # fiche 0088 — anneau FIFO du handoff
  "skills/ezk-archive/scripts/test-template-unicity.sh"  # fiche 0088 — gabarit non dupliqué
  "bin/test-regen-backlog.sh"                            # ezk-backlog — régénération de l'index
)

FAILED=()
for s in "${SUITES[@]}"; do
  echo "═══ $s"
  if [[ ! -f "$MC/$s" ]]; then echo "  ⚠ absent — ignoré"; continue; fi
  if bash "$MC/$s" >/tmp/ezk-test-out.$$ 2>&1; then
    tail -1 /tmp/ezk-test-out.$$
  else
    cat /tmp/ezk-test-out.$$
    FAILED+=("$s")
  fi
  rm -f /tmp/ezk-test-out.$$
done

echo
if (( ${#FAILED[@]} == 0 )); then
  echo "✅ test:scripts — ${#SUITES[@]} suites, TOUT VERT"
else
  echo "❌ test:scripts — ${#FAILED[@]} suite(s) en échec :"
  printf '   %s\n' "${FAILED[@]}"
  exit 1
fi
