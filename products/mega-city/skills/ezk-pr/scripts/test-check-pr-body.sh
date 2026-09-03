#!/usr/bin/env bash
# DoD exécutable de check-pr-body.sh — fixtures jetables, aucun accès au dépôt réel.
# Cas : (a) corps valide sans option (non-régression) · (b) --changed-files avec un
# chemin d'interface + ligne ⏳ → refusé · (c) idem + N.A. motivé → OK · (d) idem +
# liens avant/après → OK · (e) --changed-files sans chemin d'interface + ⏳ → OK
# (fiche 20260902224608715, ADR-0045).
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-pr-body.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Corps de PR VALIDE et COMPLET (rendu de fiche) — variante paramétrable de la ligne
# « Before / after (UI) » de la matrice.
body() { # $1=valeur de la ligne Before/after (UI)
  cat <<EOF
**En clair.** Tout va bien, en trois phrases simples.

> 🗎 Rendu de la fiche features/0001_x.md

## Contexte

Contexte réel du problème.

## Proposition

Une proposition concrète.

## Critères d'acceptation

- [ ] un critère observable

## Comment vérifier

\`\`\`bash
pnpm test
\`\`\`

## Validation

| Item | Statut |
|---|---|
| CI | ✅ |
| Before / after (UI) | $1 |
EOF
}

# ── Cas a : corps valide complet, SANS --changed-files → non-régression ──────────
out_a="$(body '⏳' | "$SCRIPT")"; rc_a=$?
echo "Cas a (non-régression, sans option) :"
check "code de sortie 0" "[ $rc_a -eq 0 ]"

# ── Cas b : --changed-files avec un .vue + ligne ⏳ → refusé ─────────────────────
list_b="$TMP/changed-b"; printf 'src/App.vue\n' > "$list_b"
err_b="$(body '⏳' | "$SCRIPT" --changed-files "$list_b" 2>&1 1>/dev/null)"; rc_b=$?
echo "Cas b (chemin d'interface touché, ligne ⏳) :"
check "code de sortie ≠ 0"          "[ $rc_b -ne 0 ]"
check "message nomme « Before / after »" "printf '%s' \"\$err_b\" | grep -qF 'Before / after'"
check "message nomme le chemin src/App.vue" "printf '%s' \"\$err_b\" | grep -qF 'src/App.vue'"

# ── Cas c : idem + N.A. motivé → OK ──────────────────────────────────────────────
out_c="$(body 'N.A. — app de bureau non capturable' | "$SCRIPT" --changed-files "$list_b")"; rc_c=$?
echo "Cas c (N.A. motivé sur diff d'interface) :"
check "code de sortie 0" "[ $rc_c -eq 0 ]"

# ── Cas d : idem + liens avant/après → OK ────────────────────────────────────────
liens='![avant](https://github.com/o/r/blob/abc/docs/pr-evidence/1/x-before.png?raw=true) ![après](https://github.com/o/r/blob/abc/docs/pr-evidence/1/x-after.png?raw=true)'
out_d="$(body "$liens" | "$SCRIPT" --changed-files "$list_b")"; rc_d=$?
echo "Cas d (liens avant/après sur diff d'interface) :"
check "code de sortie 0" "[ $rc_d -eq 0 ]"

# ── Cas e : --changed-files SANS chemin d'interface (test only) + ⏳ → OK ────────
list_e="$TMP/changed-e"; printf 'src/__tests__/x.tsx\n' > "$list_e"
out_e="$(body '⏳' | "$SCRIPT" --changed-files "$list_e")"; rc_e=$?
echo "Cas e (aucun chemin d'interface — un .tsx sous __tests__) :"
check "code de sortie 0" "[ $rc_e -eq 0 ]"

# ── Cas f : ✅ dans la matrice + les deux liens dans « Comment vérifier » → OK ───
# C'est le rendu que produit `pr-evidence.sh render` (bloc collé dans la fiche, donc dans le
# corps) : la matrice dit ✅, les liens vivent dans « Comment vérifier » — pas dans la cellule.
bloc_f='| carte | ![carte avant](https://github.com/o/r/blob/abc/docs/pr-evidence/1/carte-before.png?raw=true) | ![carte après](https://github.com/o/r/blob/abc/docs/pr-evidence/1/carte-after.png?raw=true) |'
body_f() { body '✅ liens dans « Comment vérifier »' | awk -v bloc="$bloc_f" '/^## Validation/ { print bloc; print "" } { print }'; }
out_f="$(body_f | "$SCRIPT" --changed-files "$list_b")"; rc_f=$?
echo "Cas f (✅ + liens avant/après dans le corps, hors cellule) :"
check "code de sortie 0" "[ $rc_f -eq 0 ]"

# ── Cas g : ✅ dans la matrice mais AUCUN lien dans le corps → refusé ────────────
err_g="$(body '✅ liens dans « Comment vérifier »' | "$SCRIPT" --changed-files "$list_b" 2>&1 1>/dev/null)"; rc_g=$?
echo "Cas g (✅ sans aucun lien dans le corps) :"
check "code de sortie ≠ 0"               "[ $rc_g -ne 0 ]"
check "message nomme « Before / after »"  "printf '%s' \"\$err_g\" | grep -qF 'Before / after'"

echo
if [ "$FAIL" -eq 0 ]; then echo "check-pr-body : tous les cas passent."; else echo "check-pr-body : ÉCHEC."; fi
exit "$FAIL"
