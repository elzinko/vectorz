#!/usr/bin/env bash
# Lance tous les DoD exécutables en bash du repo (`pnpm test:scripts`).
#
# Ils existaient déjà mais se lançaient à la main, donc rien ne garantissait qu'ils
# soient encore verts (`rules/development/use-project-scripts.md`). Les tests TypeScript
# restent sous `pnpm test` (vitest) : ce runner ne couvre que les scripts shell.
set -uo pipefail

# HERMÉTICITÉ — on neutralise la config git de la MACHINE avant de lancer les suites.
# Sans ça, un test qui dépend d'un réglage local (le cas vécu : `init.defaultBranch`, à
# « main » sur le poste du dev mais « master » sur les runners GitHub) passe en local et
# ne casse qu'en CI. Chaque fixture pose déjà sa propre identité git en LOCAL, donc rien
# ici ne dépend d'une config utilisateur : le défaut doit se voir dès la machine du dev.
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

MC="$(cd "$(dirname "$0")/.." && pwd)"
SUITES=(
  "skills/ezk-archive/scripts/test-check-branches.sh"    # fiche 0076 — classification des branches
  "skills/ezk-archive/scripts/test-check-gate.sh"        # fiche 0088 — contrat du gate
  "skills/ezk-archive/scripts/test-mainsync.sh"          # fiche 0088 — garde anti-faux-positif
  "skills/ezk-archive/scripts/test-handoff.sh"           # fiche 0088 — anneau FIFO du handoff
  "skills/ezk-archive/scripts/test-template-unicity.sh"  # fiche 0088 — gabarit non dupliqué
  "bin/test-regen-backlog.sh"                            # ezk-backlog — régénération de l'index
  "bin/test-regen-recipes.sh"                            # ezk-chef — régénération du livre de recettes (fiche 20260824185422122)
  "bin/test-ezk-help.sh"                                 # /ezk-help — index de commandes généré (fiche 20260816131704335)
  "skills/ezk-backlog/scripts/test-mint-id.sh"           # ezk-backlog — id horodaté (fiche 0180)
  "skills/ezk-backlog/scripts/test-layout-version.sh"    # ezk-backlog — Skema layout version
  "bin/test-check-links.sh"                              # fiche 0101 — sabotage du vérificateur de liens
  "bin/test-links-repo.sh"                               # fiche 0101 — liens réels du repo (mega-city + racine vectorz)
  "bin/test-check-adr-ids.sh"                            # sabotage du garde-fou de numérotation des ADR
  "bin/test-adr-ids-repo.sh"                             # numéros d'ADR réels du repo (aucune NOUVELLE collision)
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
