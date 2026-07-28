#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — le gabarit de handoff n'existe QU'À UN endroit.
#
# La clôture a désormais DEUX chemins : inline (verdict CLEAN) et sous-agent (DIRTY).
# Le risque que cela crée est la dérive silencieuse — deux gabarits qui divergent, donc
# deux notes de handoff de forme différente selon le chemin emprunté. C'est exactement
# ce que protégeait l'ancien garde-fou « ne réimplémente jamais la checklist ici ».
# On le remplace par une contrainte VÉRIFIABLE plutôt que par une consigne.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MC="$(cd "$SKILL_DIR/../.." && pwd)"
TEMPLATE="$SKILL_DIR/references/handoff-template.md"
SKILL="$SKILL_DIR/SKILL.md"
AGENT="$MC/agents/ezk-archive.md"
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

echo "Le gabarit vit dans references/, et nulle part ailleurs :"
ok "references/handoff-template.md existe"   "[ -f \"\$TEMPLATE\" ]"
ok "il contient bien le gabarit"             "grep -q 'Fait cette session' \"\$TEMPLATE\""

# Marqueurs du gabarit : leur présence AILLEURS signale une copie.
for marker in 'Fait cette session' 'Candidats prioritaires' 'État de clôture'; do
  ok "« $marker » absent de SKILL.md"        "! grep -qF '$marker' \"\$SKILL\""
  ok "« $marker » absent de l'agent"         "! grep -qF '$marker' \"\$AGENT\""
done

echo "Les deux chemins RENVOIENT au gabarit au lieu de le recopier :"
ok "SKILL.md référence handoff-template.md"  "grep -q 'handoff-template.md' \"\$SKILL\""
ok "l'agent référence handoff-template.md"   "grep -q 'handoff-template.md' \"\$AGENT\""

echo "Personne n'édite .claude/handoff.md à la main :"
ok "SKILL.md passe par handoff.sh"           "grep -q 'handoff.sh' \"\$SKILL\""
ok "l'agent passe par handoff.sh"            "grep -q 'handoff.sh' \"\$AGENT\""

echo "Le contrat dry-run est écrit là où il s'applique (finding Codex PR #56) :"
# Le chemin inline CLEAN écrivait le handoff sans regarder la sous-commande : un `check`
# modifiait alors .gitignore, .claude/handoff.md et la mémoire. Un dry-run qui modifie le
# dépôt n'est plus un dry-run — la garde doit rester VISIBLE dans le chemin concerné.
ok "SKILL.md conditionne l'écriture à run/close" "grep -qE 'seulement si.*la sous-commande est' \"\$SKILL\""
ok "SKILL.md dit que check n'écrit jamais"       "grep -qE 'check. n.écrit jamais' \"\$SKILL\""
ok "SKILL.md défaut = check (sans argument)"     "grep -qE 'Défaut = .check' \"\$SKILL\""

echo
if [ "$FAIL" = 0 ]; then echo "test-template-unicity: TOUT VERT"; else echo "test-template-unicity: ÉCHECS"; exit 1; fi
