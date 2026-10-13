#!/usr/bin/env bash
# DoD exécutable — ezk-archive reprend proprement un run interrompu (fiche 20261002155911264).
#
# Ce que ce test PROUVE :
#   - un run coupé après 2 points laisse un marqueur ; `check` dit « run incomplet » et NOMME
#     les points manquants (critère 3), et refuse la voie rapide ;
#   - relancé, le run ne refait QUE les points manquants (critère 1) ;
#   - les points faits AVANT la coupure ne sont pas réécrits → zéro doublon dans la note de
#     passation (handoff) NI dans l'index de mémoire (critère 2) ;
#   - un second relancement ne refait rien (idempotent) ;
#   - une fois le run effacé (clear), `check` redevient silencieux.
#
# Le « run » réel est déroulé par l'agent ezk-archive (LLM, SKILL.md) : ici on le SIMULE — pour chaque
# point requis encore manquant lu dans le marqueur, on fait son écriture puis on le marque. C'est très
# exactement la discipline que le marqueur impose à l'agent.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
AP="$HERE/archive-progress.sh"
CHECK="$HERE/check.sh"
HANDOFF="$HERE/handoff.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

cd "$TMP"
git init -q -b main repo >/dev/null && cd repo
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p features docs/sessions .claude
printf 'SPRINT.md\n.claude/handoff.md\n' > .gitignore
echo base > a.txt && git add . && git commit -qm base >/dev/null

# Un index de mémoire simulé (le point « mémoire » y ajoute UNE ligne) : on éprouve le zéro-doublon.
MEMIDX="$TMP/memory-index.md"; : > "$MEMIDX"
INDEX_LINE="- [session 2026-10-14](sessions/2026-10-14-recit.md) — récit de session"
HANDOFF_TITLE="2026-10-14 — clôture de session"

handoff_entries() { grep -c "^## ${HANDOFF_TITLE}\$" "$(bash "$HANDOFF" where)" 2>/dev/null || echo 0; }
index_lines()     { grep -c -F -e "$INDEX_LINE" "$MEMIDX" 2>/dev/null || echo 0; } # -e : le motif commence par « - »
snapshots()       { ls docs/sessions/2026-10-14-recit.md 2>/dev/null | wc -l | tr -d ' '; }

# Un point du run = son écriture PUIS sa marque (ce que fait l'agent). Les écritures visent de vrais
# artefacts (handoff réel, index, snapshot) pour que le zéro-doublon se mesure sur eux, pas sur le marqueur.
do_point() {
  case "$1" in
    memoire)         printf '%s\n' "$INDEX_LINE" >> "$MEMIDX" ;;
    handoff)         printf '**Pending**\n- un report non-git\n' | bash "$HANDOFF" add "$HANDOFF_TITLE" >/dev/null ;;
    verdict)         echo "verdict rendu" > "$TMP/verdict.flag" ;;
    archive-session) echo "snapshot de session" > docs/sessions/2026-10-14-recit.md ;;
  esac
  bash "$AP" done "$1" >/dev/null
}

# Le relancement : fait UNIQUEMENT les points requis manquants (lus du marqueur), comme l'agent.
resume_run() {
  local st rest p
  st="$(bash "$AP" status)"
  if [[ "$st" == "ARCHIVE_RUN: NONE" ]]; then
    for p in memoire handoff verdict archive-session; do do_point "$p"; done
    return 0
  fi
  if [[ "$st" == "ARCHIVE_RUN: INCOMPLETE"* ]]; then
    rest="${st#*missing=}"; rest="${rest//,/ }"
    for p in $rest; do do_point "$p"; done
  fi
  return 0
}

echo "T1 — run coupé après 2 points : check dit « incomplet » et nomme les points manquants"
bash "$AP" begin >/dev/null
do_point memoire
do_point handoff                      # ← COUPURE ici : verdict et archive-session non faits
GATE="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "le gate signale un run incomplet" 'printf "%s\n" "$GATE" | grep -q "^ARCHIVE_RUN: INCOMPLETE"'
ok "il nomme les points manquants (verdict, archive-session)" 'printf "%s\n" "$GATE" | grep -q "missing=verdict,archive-session"'
ok "la voie rapide est refusée (reason archive_incomplete)" 'printf "%s\n" "$GATE" | grep -qE "^FASTPATH: NO reason=.*archive_incomplete"'
ok "handoff : UNE entrée de clôture après la coupure" '[ "$(handoff_entries)" = 1 ]'
ok "index : UNE ligne après la coupure" '[ "$(index_lines)" = 1 ]'

echo "T2 — relancé, le run complète EXACTEMENT les points manquants, sans rien refaire"
resume_run
ST="$(bash "$AP" status)"
ok "status COMPLETE" 'printf "%s\n" "$ST" | grep -q "^ARCHIVE_RUN: COMPLETE"'
ok "les 4 points requis sont faits" 'printf "%s\n" "$ST" | grep -q "done=memoire,handoff,verdict,archive-session"'
ok "zéro doublon dans le handoff (l'entrée d'avant la coupure n'est pas réécrite)" '[ "$(handoff_entries)" = 1 ]'
ok "zéro doublon dans l'index de mémoire" '[ "$(index_lines)" = 1 ]'
ok "le verdict et le snapshot manquants ont bien été produits" '[ -f "$TMP/verdict.flag" ] && [ "$(snapshots)" = 1 ]'

echo "T3 — un second relancement ne refait RIEN (idempotent)"
resume_run
ok "handoff toujours à UNE entrée" '[ "$(handoff_entries)" = 1 ]'
ok "index toujours à UNE ligne" '[ "$(index_lines)" = 1 ]'
ok "snapshot non dupliqué" '[ "$(snapshots)" = 1 ]'

echo "T4 — run terminé puis effacé : check redevient silencieux"
bash "$AP" clear >/dev/null
GATE2="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "plus de ligne ARCHIVE_RUN: INCOMPLETE/COMPLETE dans le gate" '! printf "%s\n" "$GATE2" | grep -qE "^ARCHIVE_RUN: (INCOMPLETE|COMPLETE)"'
ok "la voie rapide n'est plus refusée pour archive_incomplete" '! printf "%s\n" "$GATE2" | grep -q "archive_incomplete"'

echo "T5 — begin est idempotent : relancé sur un run en cours, il REPREND (resumed=1), ne réinitialise pas"
bash "$AP" begin >/dev/null
do_point memoire
OUT_BEGIN="$(bash "$AP" begin)"
ok "begin sur un run en cours : resumed=1" 'printf "%s\n" "$OUT_BEGIN" | grep -q "resumed=1"'
ok "le point déjà fait survit au second begin" 'bash "$AP" status | grep -q "done=memoire"'

if (( FAIL )); then echo "FAIL"; exit 1; fi
echo "PASS"
