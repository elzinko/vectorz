#!/usr/bin/env bash
# DoD exécutable — cycle de vie du sprint : `ezk-sprint start` / `close`
# (fiche 20260930123438875, ADR-0054).
#
# Ce que ce test PROUVE, et que la prose d'un SKILL.md ne prouve pas :
#   - `check` ≡ `start --dry-run` : même sortie que le portier, strictement read-only ;
#   - `start` refuse sur ALERT (sauf override journalisé) et refuse d'ouvrir un 2e sprint ;
#   - `close` refuse tant qu'une story est ouverte, scelle sinon, et ne touche JAMAIS la
#     session (docs/sessions/, .claude/handoff.md : c'est le métier d'ezk-archive) ;
#   - `start → close → start` s'enchaîne sans perdre ni l'incrément ni les galères du labo ;
#   - un sprint où rien n'est livré a une sortie (`close --abandon`) : pas d'impasse, pas de rm SPRINT.md ;
#   - un SPRINT.md d'ancien format (statut en fin de ligne) se ferme, une seule fois.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SPRINT="$HERE/sprint.sh"
CHECK="$HERE/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() {
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}
sum() { cksum < "$1"; }
mkfiche() { # id titre slug
  printf -- '---\nid: "%s"\ntitle: "%s"\nstatus: ready\n---\n' "$1" "$2" > "features/$1_$3.md"
}
# Simule ce que fait l'agent pendant le sprint : édite SPRINT.md à la main.
edit() { sed -i.bak -e "$1" SPRINT.md && rm -f SPRINT.md.bak; }

A=20261001000001
B=20261001000002
C=20261001000003

cd "$TMP"
git init -q -b main repo && cd repo
git config user.email test@test && git config user.name test
git config commit.gpgsign false
mkdir -p features docs/sessions .claude
printf 'SPRINT.md\n.claude/handoff.md\n' > .gitignore
mkfiche "$A" "Alpha" alpha
mkfiche "$B" "Beta" beta
mkfiche "$C" "Gamma" gamma
echo hello > a.txt
echo snapshot > docs/sessions/2026-10-01-marker.md
git add . && git commit -qm "base"
echo "# handoff" > .claude/handoff.md # ignoré par git : état de SESSION, propriété d'ezk-archive

HEAD0="$(git rev-parse HEAD)"
REFS0="$(git for-each-ref | sort)"

echo "S1 — check ≡ start --dry-run, strictement read-only"
OUT_CHECK="$(bash "$CHECK" --gate)"
OUT_DRY="$(bash "$SPRINT" start --dry-run)"
ok "même sortie que le portier" '[ "$OUT_DRY" = "$OUT_CHECK" ]'
ok "VERDICT: CLEAR" 'printf "%s\n" "$OUT_DRY" | grep -qx "VERDICT: CLEAR"'
ok "aucun fichier écrit (pas de SPRINT.md, arbre propre)" '[ ! -e SPRINT.md ] && [ -z "$(git status --porcelain)" ]'
ok "HEAD et refs intacts (aucune branche, aucun commit)" '[ "$(git rev-parse HEAD)" = "$HEAD0" ] && [ "$(git for-each-ref | sort)" = "$REFS0" ]'

echo "S2 — start --dry-run sur arbre sale : ALERT, toujours read-only"
echo dirty >> a.txt
OUT2="$(bash "$SPRINT" start --dry-run)"
ok "VERDICT ALERT points=1" 'printf "%s\n" "$OUT2" | grep -q "^VERDICT: ALERT points=1"'
ok "toujours aucun SPRINT.md" '[ ! -e SPRINT.md ]'
git checkout -- a.txt

echo "S3 — start exige un lot réel ; close sans sprint est refusé"
rc=0; bash "$SPRINT" start >/dev/null 2>&1 || rc=$?
ok "sans --lot : exit 2 (erreur d'usage)" '[ "$rc" = 2 ]'
OUT3="$(bash "$SPRINT" start --lot "$A,99999999999999")"
ok "story inconnue : REFUSED lot_unknown" 'printf "%s\n" "$OUT3" | grep -qx "START: REFUSED lot_unknown id=99999999999999"'
ok "rien n'est écrit" '[ ! -e SPRINT.md ]'
OUT3G="$(bash "$SPRINT" start --lot '2026*')"
ok "un id n'est jamais un motif de glob : REFUSED lot_unknown" 'printf "%s\n" "$OUT3G" | grep -qxF "START: REFUSED lot_unknown id=2026*"'
ok "rien n'est écrit (glob)" '[ ! -e SPRINT.md ]'
OUT3B="$(bash "$SPRINT" close)"
ok "close sans SPRINT.md : REFUSED not_open" 'printf "%s\n" "$OUT3B" | grep -qx "CLOSE: REFUSED not_open"'

echo "S4 — start ouvre le sprint 1 (lot de 2 stories) quand le portier est CLEAR"
OUT4="$(bash "$SPRINT" start --lot "$A,$B" --objective "Premier sprint")"
ok "START: OPENED sprint=1 stories=2" 'printf "%s\n" "$OUT4" | grep -qx "START: OPENED sprint=1 stories=2"'
ok "titre « # Sprint 1 — Premier sprint »" '[ "$(head -1 SPRINT.md)" = "# Sprint 1 — Premier sprint" ]'
ok "Statut: en cours" 'grep -q "^Statut: en cours" SPRINT.md'
ok "le lot : 2 stories ouvertes, titres lus dans les fiches" '[ "$(grep -c "^- \[ \] 2026100100000[12] — " SPRINT.md)" = 2 ] && grep -qx -- "- \[ \] $A — Alpha" SPRINT.md'
ok "titre de section du labo conservé tel quel (lu par ezk-archive et ezk-chef)" 'grep -qxF "## Galères & gestes (labo)" SPRINT.md'
ok "start n'a créé ni branche ni commit" '[ "$(git rev-parse HEAD)" = "$HEAD0" ] && [ "$(git for-each-ref | sort)" = "$REFS0" ]'
ok "SPRINT.md est ignoré par git (arbre propre)" '[ -z "$(git status --porcelain)" ]'

echo "S5 — un sprint est déjà ouvert : start refuse, SPRINT.md intact"
SUM5="$(sum SPRINT.md)"
OUT5="$(bash "$SPRINT" start --lot "$C")"
ok "REFUSED open_sprint sprint=1" 'printf "%s\n" "$OUT5" | grep -qx "START: REFUSED open_sprint sprint=1"'
ok "SPRINT.md intact" '[ "$(sum SPRINT.md)" = "$SUM5" ]'
bash "$SPRINT" start --dry-run >/dev/null
ok "start --dry-run ne touche pas SPRINT.md" '[ "$(sum SPRINT.md)" = "$SUM5" ]'

echo "S6 — close refuse tant qu'une story du lot est ouverte"
OUT6="$(bash "$SPRINT" close)"
ok "CLOSE: OPEN sprint=1 open=2" 'printf "%s\n" "$OUT6" | grep -qx "CLOSE: OPEN sprint=1 open=2"'
ok "liste les stories ouvertes" 'printf "%s\n" "$OUT6" | grep -qx "STORY_OPEN: $A — Alpha"'
ok "SPRINT.md intact, sprint toujours en cours" '[ "$(sum SPRINT.md)" = "$SUM5" ] && grep -q "^Statut: en cours" SPRINT.md'

echo "S7 — close scelle l'incrément (1 livrée, 1 reportée) et ne touche pas la session"
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #12)/"
edit "s/^- \[ \] $B — Beta\$/- [~] $B — Beta (reportée : dépend d'Alpha)/"
awk '{print} /^## Galères & gestes \(labo\)$/ {print "- symptôme X — geste Y — pourquoi Z"}' SPRINT.md > SPRINT.md.new && mv SPRINT.md.new SPRINT.md
SESS_MARK="$(sum docs/sessions/2026-10-01-marker.md)"
SESS_HAND="$(sum .claude/handoff.md)"
OUT7="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=1 done=1 deferred=1" 'printf "%s\n" "$OUT7" | grep -qx "CLOSE: SEALED sprint=1 done=1 deferred=1"'
ok "annonce l'incrément (id + référence de PR)" 'printf "%s\n" "$OUT7" | grep -qx "INCREMENT: $A (PR #12)"'
ok "rend la main à la session : retro, planning, sprint suivant, archive nommés" 'N="$(printf "%s\n" "$OUT7" | grep "^NEXT:")" && for w in ezk-retro ezk-backlog "ezk-sprint start" ezk-archive; do printf "%s\n" "$N" | grep -qF "$w" || exit 1; done'
ok "Statut: clos" 'grep -q "^Statut: clos" SPRINT.md'
ok "incrément inscrit dans « Incréments scellés de la session »" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12)" SPRINT.md && grep -qxF "## Incréments scellés de la session" SPRINT.md'
ok "la session n'est pas touchée (docs/sessions, handoff)" '[ "$(sum docs/sessions/2026-10-01-marker.md)" = "$SESS_MARK" ] && [ "$(sum .claude/handoff.md)" = "$SESS_HAND" ] && [ "$(ls docs/sessions | wc -l | tr -d " ")" = 1 ]'
ok "close n'a créé ni branche ni commit, l'arbre reste propre" '[ "$(git rev-parse HEAD)" = "$HEAD0" ] && [ "$(git for-each-ref | sort)" = "$REFS0" ] && [ -z "$(git status --porcelain)" ]'

echo "S8 — close sans sprint ouvert : refus, pas de double scellé"
SUM8="$(sum SPRINT.md)"
OUT8="$(bash "$SPRINT" close)"
ok "REFUSED not_open" 'printf "%s\n" "$OUT8" | grep -qx "CLOSE: REFUSED not_open"'
ok "SPRINT.md intact" '[ "$(sum SPRINT.md)" = "$SUM8" ]'

echo "S9 — start → close → start : le sprint 2 garde le labo et l'incrément ; ALERT = override journalisé"
echo dirty >> a.txt
OUT9="$(bash "$SPRINT" start --lot "$C")"
ok "arbre sale : REFUSED gate=ALERT" 'printf "%s\n" "$OUT9" | grep -qx "START: REFUSED gate=ALERT"'
ok "le bloc du portier est montré (les faits pour décider)" 'printf "%s\n" "$OUT9" | grep -q "^VERDICT: ALERT points=1"'
ok "SPRINT.md (clos) intact" '[ "$(sum SPRINT.md)" = "$SUM8" ]'
rc=0; bash "$SPRINT" start --lot "$C" --override "" >/dev/null 2>&1 || rc=$?
ok "--override sans raison : exit 2" '[ "$rc" = 2 ]'
OUT9B="$(bash "$SPRINT" start --lot "$C" --objective "Second sprint" --override "arbre sale volontaire (test)")"
ok "avec override : OPENED sprint=2 stories=1" 'printf "%s\n" "$OUT9B" | grep -qx "START: OPENED sprint=2 stories=1"'
ok "l'override est journalisé dans les notes" 'grep -q "Override du portier.*ALERT points=1.*arbre sale volontaire (test)" SPRINT.md'
ok "le labo du sprint 1 est conservé, en une seule section" 'grep -q "symptôme X — geste Y" SPRINT.md && [ "$(grep -cxF "## Galères & gestes (labo)" SPRINT.md)" = 1 ]'
ok "l'incrément scellé du sprint 1 est conservé" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12)" SPRINT.md'
ok "le lot du sprint 2 ne contient que sa story" '[ "$(grep -c "^- \[[ x~]\] " SPRINT.md)" = 1 ] && grep -qx -- "- \[ \] $C — Gamma" SPRINT.md'
git checkout -- a.txt

echo "S10 — second incrément : deux sprints scellés dans la même session"
edit "s/^- \[ \] $C — Gamma\$/- [x] $C — Gamma (PR #13)/"
OUT10="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=2 done=1 deferred=0" 'printf "%s\n" "$OUT10" | grep -qx "CLOSE: SEALED sprint=2 done=1 deferred=0"'
ok "deux incréments dans la session, dans l'ordre" '[ "$(grep -c "^- Sprint [0-9]* — " SPRINT.md)" = 2 ] && [ "$(grep "^- Sprint [0-9]* — " SPRINT.md | head -1 | cut -c1-10)" = "- Sprint 1" ]'

echo "S11 — rien de livré : pas d'incrément, donc close refuse ; --abandon est la sortie, le savoir de session reste"
bash "$SPRINT" start --lot "$A" --objective "Sprint vide" >/dev/null
edit "s/^- \[ \] $A — Alpha\$/- [~] $A — Alpha (reportée)/"
SUM11="$(sum SPRINT.md)"
OUT11="$(bash "$SPRINT" close)"
ok "CLOSE: REFUSED empty_increment sprint=3" 'printf "%s\n" "$OUT11" | grep -qx "CLOSE: REFUSED empty_increment sprint=3"'
ok "indique la sortie : close --abandon" 'printf "%s\n" "$OUT11" | grep "^HINT:" | grep -qF -- "--abandon"'
ok "le sprint reste ouvert, SPRINT.md intact" '[ "$(sum SPRINT.md)" = "$SUM11" ] && grep -q "^Statut: en cours" SPRINT.md'
rc=0; bash "$SPRINT" close --abandon "" >/dev/null 2>&1 || rc=$?
ok "--abandon sans raison : exit 2" '[ "$rc" = 2 ]'
OUT11B="$(bash "$SPRINT" close --abandon "pas de capacité")"
ok "CLOSE: ABANDONED sprint=3 done=0 deferred=1 open=0" 'printf "%s\n" "$OUT11B" | grep -qx "CLOSE: ABANDONED sprint=3 done=0 deferred=1 open=0"'
ok "la story reportée est annoncée (retour au backlog)" 'printf "%s\n" "$OUT11B" | grep -qx "STORY_DEFERRED: $A — Alpha (reportée)"'
ok "Statut: clos, avec la raison de l'abandon" 'head -5 SPRINT.md | grep -q "^Statut: clos .*Abandon: pas de capacité"'
ok "le journal de session garde l'abandon ET les incréments précédents" 'grep -qF -- "- Sprint 3 — Sprint vide — abandonné (pas de capacité) — 0 livrée, 1 reportée, 0 ouverte" SPRINT.md && [ "$(grep -c "^- Sprint [0-9]* — " SPRINT.md)" = 3 ]'
ok "le labo est conservé" 'grep -q "symptôme X — geste Y" SPRINT.md'
ok "la session n'est pas touchée" '[ "$(sum .claude/handoff.md)" = "$SESS_HAND" ]'

echo "S12 — après un abandon, plus d'impasse : un nouveau sprint s'ouvre ; abandon avec des stories encore ouvertes"
OUT12="$(bash "$SPRINT" start --lot "$A,$B" --objective "Sprint repris")"
ok "START: OPENED sprint=4 stories=2" 'printf "%s\n" "$OUT12" | grep -qx "START: OPENED sprint=4 stories=2"'
OUT12B="$(bash "$SPRINT" close --abandon "PO arrête")"
ok "CLOSE: ABANDONED sprint=4 done=0 deferred=0 open=2" 'printf "%s\n" "$OUT12B" | grep -qx "CLOSE: ABANDONED sprint=4 done=0 deferred=0 open=2"'
ok "annonce les stories restées ouvertes" 'printf "%s\n" "$OUT12B" | grep -qx "STORY_OPEN: $B — Beta"'

echo "S13 — l'incrément ne reprend que de vraies références (PR, commit), pas un bout de titre"
bash "$SPRINT" start --lot "$A,$B" --objective "Références" >/dev/null
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (local abc1234)/"
edit "s/^- \[ \] $B — Beta\$/- [x] $B — Beta (kanban)/"
OUT13="$(bash "$SPRINT" close)"
ok "référence de commit reprise" 'printf "%s\n" "$OUT13" | grep -qx "INCREMENT: $A (local abc1234)"'
ok "parenthèse de titre ignorée" 'printf "%s\n" "$OUT13" | grep -qx "INCREMENT: $B"'

echo "S14 — un SPRINT.md d'ancien format (statut en fin de ligne) se ferme, une seule fois"
cat > SPRINT.md <<'EOF'
# Sprint 7 — ancien format
Périmètre: 2h   Statut: en cours | en attente de validation

## Backlog  (1 ligne = 1 feature = 1 PR)
- [x] feat: B      (PR #12, squash-merged)
- [~] feat: C (reportée)

## Definition of Done
## Notes / décisions  (ADR courts)

## Galères & gestes (labo)
- galère héritée — geste hérité
EOF
OUT14A="$(bash "$SPRINT" start --lot "$A")"
ok "compte comme un sprint ouvert : REFUSED open_sprint sprint=7" 'printf "%s\n" "$OUT14A" | grep -qx "START: REFUSED open_sprint sprint=7"'
OUT14="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=7 done=1 deferred=1" 'printf "%s\n" "$OUT14" | grep -qx "CLOSE: SEALED sprint=7 done=1 deferred=1"'
ok "le statut en fin de ligne passe à clos, le périmètre reste" 'sed -n 2p SPRINT.md | grep -q "^Périmètre: 2h   Statut: clos"'
ok "incrément lu sans « — » : libellé + référence de PR" 'printf "%s\n" "$OUT14" | grep -qx "INCREMENT: feat: B (PR #12, squash-merged)"'
SUM14="$(sum SPRINT.md)"
OUT14B="$(bash "$SPRINT" close)"
ok "second close : REFUSED not_open, pas de double scellé" 'printf "%s\n" "$OUT14B" | grep -qx "CLOSE: REFUSED not_open" && [ "$(sum SPRINT.md)" = "$SUM14" ]'
OUT14C="$(bash "$SPRINT" start --lot "$A" --objective "Après l'ancien format")"
ok "le sprint suivant s'ouvre (sprint=8) et garde le labo hérité" 'printf "%s\n" "$OUT14C" | grep -qx "START: OPENED sprint=8 stories=1" && grep -q "galère héritée — geste hérité" SPRINT.md'

echo "S15 — hors dépôt git : exit 2"
mkdir "$TMP/nogit"
rc=0; (cd "$TMP/nogit" && bash "$SPRINT" close >/dev/null 2>&1) || rc=$?
ok "exit 2" '[ "$rc" = 2 ]'

if (( FAIL )); then
  echo "FAIL"
  exit 1
fi
echo "PASS"
