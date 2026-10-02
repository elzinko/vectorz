#!/usr/bin/env bash
# test-ship-in-pr.sh — DoD du « ship dans la PR » (ADR-0049, fiche 20261002114435782).
#
# En clair : la fiche d'une story arrive en done/ par un commit de SA branche, avant le merge.
# Ce test prouve les trois gestes de `ship-in-pr.sh` (check, add, undo) et la garde de
# `ship-merge.sh --remote`, qui refuse de merger une branche de story sans son ship.
#
# Fixtures 100% jetables sous $TMPDIR — jamais le vrai repo, jamais de `gh` réel. La
# transaction `ship:fiche` est simulée par un faux `pnpm` (git mv + statut) : on teste
# l'orchestration, `ship:fiche` a ses propres tests.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/ship-in-pr.sh"
MERGE="$HERE/ship-merge.sh"
FAIL=0

fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

ID=20990101000000001
FAKE_BIN="$WORK/fakebin"
mkdir -p "$FAKE_BIN"
# Faux `pnpm --dir <mc> ship:fiche -- --pr '#N' features/<id>_x.md` : déplace la fiche,
# pose le statut et touche l'index, comme la vraie transaction. FAKE_SHIP_FAIL=1 la fait refuser.
cat > "$FAKE_BIN/pnpm" <<'EOF'
#!/usr/bin/env bash
[[ "${FAKE_SHIP_FAIL:-0}" == 1 ]] && { echo "✗ ship refusé — rien n'a été écrit" >&2; exit 1; }
mc="$2"; pr=""; fiche=""
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in --pr) pr="$2"; shift 2 ;; ship:fiche|--) shift ;; *) fiche="$1"; shift ;; esac
done
repo="$(cd "$mc/../.." && pwd)"
mkdir -p "$repo/features/done"
git -C "$repo" mv "$fiche" "features/done/$(basename "$fiche")"
sed -i.bak -e 's/^status: ready$/status: shipped/' -e "s/^pr:\$/pr: \"$pr\"/" "$repo/features/done/$(basename "$fiche")"
rm -f "$repo/features/done/$(basename "$fiche").bak"
echo "- livrée $(basename "$fiche")" >> "$repo/features/BACKLOG.md"
EOF
chmod +x "$FAKE_BIN/pnpm"
export PATH="$FAKE_BIN:$PATH"

# Un dépôt-jouet : main porte la fiche active, la branche de story porte le code.
new_repo() {
  local r="$1"
  git init -q -b main "$r"
  git -C "$r" config user.email t@t.io
  git -C "$r" config user.name t
  mkdir -p "$r/features" "$r/products/mega-city"
  echo '{}' > "$r/products/mega-city/package.json"
  printf -- '---\nid: "%s"\nstatus: ready\npr:\n---\n# x\n' "$ID" > "$r/features/${ID}_x.md"
  echo "# Backlog" > "$r/features/BACKLOG.md"
  git -C "$r" add -A
  git -C "$r" commit -qm "chore: base"
  git -C "$r" checkout -qb "feat/${ID}-x"
  echo code > "$r/code.txt"
  git -C "$r" add code.txt
  git -C "$r" commit -qm "feat: le code de la story"
}

REPO="$WORK/repo"
new_repo "$REPO"

echo "=== check — lecture seule : missing avant le ship, ref inconnue refusée ==="
rc=0; OUT="$(bash "$SCRIPT" check --repo "$REPO" --ref HEAD --fiche-id "$ID")" || rc=$?
[[ $rc -eq 1 && "$OUT" == "SHIP: missing" ]] && ok "fiche encore active → SHIP: missing (exit 1)" || fail "check avant ship : rc=$rc out=$OUT"
rc=0; bash "$SCRIPT" check --repo "$REPO" --ref deadbeef --fiche-id "$ID" >/dev/null 2>&1 || rc=$?
[[ $rc -eq 2 ]] && ok "ref inconnue → exit 2" || fail "ref inconnue : rc=$rc"

echo "=== add — refus sans rien écrire : sur main, arbre sale, transaction refusée ==="
git -C "$REPO" checkout -q main
rc=0; bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null 2>&1 || rc=$?
[[ $rc -eq 1 ]] && ok "sur main → refusé (exit 1)" || fail "add sur main : rc=$rc"
git -C "$REPO" checkout -q "feat/${ID}-x"
echo wip > "$REPO/wip.txt"
rc=0; bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null 2>&1 || rc=$?
[[ $rc -eq 1 ]] && ok "arbre sale → refusé (exit 1)" || fail "add arbre sale : rc=$rc"
rm "$REPO/wip.txt"
before="$(git -C "$REPO" rev-parse HEAD)"
rc=0; FAKE_SHIP_FAIL=1 bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null 2>&1 || rc=$?
[[ $rc -eq 2 && "$(git -C "$REPO" rev-parse HEAD)" == "$before" ]] && ok "ship:fiche refuse → exit 2, aucun commit" || fail "transaction refusée : rc=$rc"

echo "=== add — le commit ship entre dans la branche, seul et complet ==="
OUT="$(bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr '#12')"
grep -q "^SHIP: added " <<<"$OUT" && ok "SHIP: added <sha>" || fail "sortie add : $OUT"
[[ "$(git -C "$REPO" log -1 --format=%s)" == "docs(features): ship ${ID} #12" ]] && ok "sujet conventional « docs(features): ship <id> #12 »" || fail "sujet : $(git -C "$REPO" log -1 --format=%s)"
FILES="$(git -C "$REPO" show --no-renames --name-only --format= HEAD | sort | tr '\n' ' ')"
[[ "$FILES" == "features/${ID}_x.md features/BACKLOG.md features/done/${ID}_x.md " ]] && ok "le commit ne porte que le ship (fiche déplacée + index)" || fail "fichiers du commit : $FILES"
grep -q '^status: shipped$' "$REPO/features/done/${ID}_x.md" && ok "status: shipped dans done/" || fail "statut non posé"
[[ -z "$(git -C "$REPO" status --porcelain)" ]] && ok "arbre propre après add" || fail "arbre sale après add"
bash "$SCRIPT" check --repo "$REPO" --ref HEAD --fiche-id "$ID" >/dev/null && ok "check → SHIP: present" || fail "check après add"
n_before="$(git -C "$REPO" rev-list --count HEAD)"
OUT="$(bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12)"
[[ "$OUT" == "SHIP: already" && "$(git -C "$REPO" rev-list --count HEAD)" == "$n_before" ]] && ok "add rejoué → SHIP: already, aucun commit en plus" || fail "add idempotent : $OUT"

echo "=== ship-merge.sh --remote — garde ADR-0049 avant tout appel à gh ==="
git -C "$REPO" remote add origin https://example.invalid/repo.git
GH_MARKER="$WORK/gh-called"
cat > "$FAKE_BIN/gh" <<EOF
#!/usr/bin/env bash
echo "gh appelé: \$*" >> "$GH_MARKER"
EOF
chmod +x "$FAKE_BIN/gh"
SHIPPED="$(git -C "$REPO" rev-parse HEAD)"
UNSHIPPED="$(git -C "$REPO" rev-parse HEAD~1)"
OUT="$(bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "feat/${ID}-x" --subject s --body b --head-sha "$SHIPPED" --dry-run)"
grep -q "SHIP-GUARD: present" <<<"$OUT" && grep -q "^DRY-RUN: gh pr merge 12" <<<"$OUT" && ok "head avec le ship → merge construit" || fail "head shippé : $OUT"
rc=0; ERR="$(bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "feat/${ID}-x" --subject s --body b --head-sha "$UNSHIPPED" 2>&1)" || rc=$?
[[ $rc -eq 3 && ! -f "$GH_MARKER" ]] && grep -q "ship-in-pr.sh add" <<<"$ERR" && ok "head sans le ship → refus (exit 3), remède imprimé, gh jamais appelé" || fail "head non shippé : rc=$rc err=$ERR"
rc=0; bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "feat/${ID}-x" --subject s --body b --head-sha cafe1234 >/dev/null 2>&1 || rc=$?
[[ $rc -eq 3 && ! -f "$GH_MARKER" ]] && ok "head inconnu → refus (exit 3), gh jamais appelé" || fail "head inconnu : rc=$rc"
OUT="$(bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "feat/${ID}-x" --subject s --body b --head-sha "$UNSHIPPED" --allow-unshipped "livraison partielle" --dry-run)"
grep -q "SHIP-GUARD: override (${ID}) — livraison partielle" <<<"$OUT" && grep -q "^DRY-RUN:" <<<"$OUT" && ok "--allow-unshipped : passe, raison imprimée" || fail "override : $OUT"
OUT="$(bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "docs/rangement" --subject s --body b --head-sha "$UNSHIPPED" --dry-run)"
grep -q "SHIP-GUARD: skip" <<<"$OUT" && ok "branche sans id de fiche → garde non concernée" || fail "branche sans id : $OUT"
for br in retro/2026-09-23-versions feat/2026-09-23-x; do
  OUT="$(bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "$br" --subject s --body b --head-sha "$UNSHIPPED" --dry-run)"
  grep -q "SHIP-GUARD: skip" <<<"$OUT" && ok "branche datée $br → une date n'est pas un id" || fail "branche datée $br : $OUT"
done
rc=0; bash "$MERGE" --repo "$REPO" --remote --pr 12 --branch "feat/${ID}-x" --subject s --body b --head-sha "$UNSHIPPED" --allow-unshipped --dry-run >/dev/null 2>&1 || rc=$?
[[ $rc -eq 2 && ! -f "$GH_MARKER" ]] && ok "--allow-unshipped sans raison n'avale pas --dry-run (exit 2, gh jamais appelé)" || fail "raison avalée : rc=$rc"

echo "=== undo — NO-GO après le ship : la fiche revient sous features/ ==="
OUT="$(bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID")"
grep -q "^SHIP: undone " <<<"$OUT" && ok "SHIP: undone <sha>" || fail "sortie undo : $OUT"
[[ -f "$REPO/features/${ID}_x.md" && ! -e "$REPO/features/done/${ID}_x.md" ]] && ok "fiche de retour sous features/" || fail "fiche pas revenue"
grep -q '^status: ready$' "$REPO/features/${ID}_x.md" && ok "statut revenu à ready" || fail "statut pas revenu"
[[ "$(git -C "$REPO" log -1 --format=%s)" == "revert(features): retire le ship ${ID} après un no-go de revue" ]] && ok "commit de revert conventional (aucune réécriture d'historique)" || fail "sujet undo : $(git -C "$REPO" log -1 --format=%s)"
rc=0; bash "$SCRIPT" check --repo "$REPO" --ref HEAD --fiche-id "$ID" >/dev/null || rc=$?
[[ $rc -eq 1 ]] && ok "check → SHIP: missing (la branche ne présente plus la story comme livrée)" || fail "check après undo : rc=$rc"
OUT="$(bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID")"
[[ "$OUT" == "SHIP: none" ]] && ok "undo rejoué → SHIP: none" || fail "undo sans ship : $OUT"
bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null && bash "$SCRIPT" check --repo "$REPO" --ref HEAD --fiche-id "$ID" >/dev/null \
  && ok "re-ship après correction → SHIP: present" || fail "re-ship après undo"
rc=0; bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID" --base nulle-part >/dev/null 2>&1 || rc=$?
[[ $rc -eq 2 ]] && ok "base introuvable → exit 2 (pas un code git brut)" || fail "base introuvable : rc=$rc"

echo "=== deux cycles NO-GO / re-ship : undo retire toujours le dernier ship ==="
for cycle in 1 2; do
  bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID" >/dev/null && bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null \
    || fail "cycle $cycle : undo puis re-ship"
done
n_ship="$(git -C "$REPO" log --oneline --grep="^docs(features): ship ${ID}" | wc -l | tr -d ' ')"
OUT="$(bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID")"
[[ "$n_ship" -ge 3 && "$OUT" == "SHIP: undone $(git -C "$REPO" rev-parse --short=8 HEAD~1)" ]] \
  && ok "$n_ship commits ship sur la branche → undo vise le plus récent" || fail "multi-ship : n=$n_ship out=$OUT"
bash "$SCRIPT" add --repo "$REPO" --fiche-id "$ID" --pr 12 >/dev/null

echo "=== check — une fiche déplacée à la main, sans status: shipped, ne compte pas ==="
REPO3="$WORK/repo3"
new_repo "$REPO3"
mkdir -p "$REPO3/features/done"
git -C "$REPO3" mv "features/${ID}_x.md" "features/done/${ID}_x.md"
git -C "$REPO3" commit -qm "docs: déplacement à la main"
rc=0; bash "$SCRIPT" check --repo "$REPO3" --ref HEAD --fiche-id "$ID" >/dev/null || rc=$?
[[ $rc -eq 1 ]] && ok "done/ mais status: ready → SHIP: missing" || fail "déplacement à la main accepté : rc=$rc"
rc=0; bash "$MERGE" --repo "$REPO3" --remote --pr 4 --branch "feat/${ID}-x" --subject s --body b --head-sha "$(git -C "$REPO3" rev-parse HEAD)" --dry-run >/dev/null 2>&1 || rc=$?
[[ $rc -eq 3 ]] && ok "la garde du merge refuse ce faux ship (exit 3)" || fail "garde : rc=$rc"

echo "=== undo — refus : revert en conflit, fiche héritée de main ==="
# Un commit plus récent retouche la ligne même que le revert doit rétablir : conflit franc.
sed -i.bak 's/^pr: "#12"$/pr: "#12" # retouché/' "$REPO/features/done/${ID}_x.md" && rm -f "$REPO/features/done/${ID}_x.md.bak"
git -C "$REPO" commit -qam "docs: retouche la fiche après le ship"
before="$(git -C "$REPO" rev-parse HEAD)"
rc=0; bash "$SCRIPT" undo --repo "$REPO" --fiche-id "$ID" >/dev/null 2>&1 || rc=$?
[[ $rc -eq 2 && "$(git -C "$REPO" rev-parse HEAD)" == "$before" && -z "$(git -C "$REPO" status --porcelain)" ]] \
  && ok "revert en conflit → exit 2, revert abandonné, arbre propre" || fail "conflit : rc=$rc"
REPO2="$WORK/repo2"
new_repo "$REPO2"
bash "$SCRIPT" add --repo "$REPO2" --fiche-id "$ID" --pr 3 >/dev/null
git -C "$REPO2" checkout -q main
git -C "$REPO2" merge -q --ff-only "feat/${ID}-x"
git -C "$REPO2" checkout -qb "feat/${ID}-suite"
rc=0; bash "$SCRIPT" undo --repo "$REPO2" --fiche-id "$ID" >/dev/null 2>&1 || rc=$?
[[ $rc -eq 1 ]] && ok "fiche déjà en done/ sur main, pas de ship sur la branche → refus (exit 1)" || fail "fiche héritée : rc=$rc"

echo
if [[ $FAIL -eq 0 ]]; then echo "OK — ship dans la PR (ADR-0049) : check, add, undo, garde du merge"; else echo "ÉCHEC"; exit 1; fi
