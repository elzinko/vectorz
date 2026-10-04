#!/usr/bin/env bash
# DoD exécutable — cycle de vie du sprint : `ezk-sprint start` / `close`
# (fiche 20260930123438875, ADR-0054).
#
# Ce que ce test PROUVE, et que la prose d'un SKILL.md ne prouve pas :
#   - `check` ≡ `start --dry-run` : même sortie que le portier, strictement read-only ;
#   - `start` refuse sur ALERT (sauf override journalisé) et refuse d'ouvrir un 2e sprint ;
#   - `close` refuse tant qu'une story est ouverte, scelle sinon, et ne touche JAMAIS la
#     session (docs/sessions/, note de handoff : c'est le métier d'ezk-archive) ;
#   - `start → close → start` s'enchaîne sans perdre ni l'incrément ni les galères du labo ;
#   - un sprint où rien n'est livré a une sortie (`close --abandon`) : pas d'impasse, pas de rm SPRINT.md ;
#   - un SPRINT.md d'ancien format (statut en fin de ligne) se ferme, une seule fois ;
#   - un skill installé en COPIE ou en LIEN (bind-global) ouvre un sprint : le loader se résout sans que
#     le script soit lancé depuis le catalogue ;
#   - les ids des stories reportées ou restées ouvertes survivent au prochain `start` (journal de session).
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
# La note de session, à son vrai lieu (dossier git commun, fiche 20261003105820077) : propriété d'ezk-archive.
HF="$(bash "$(cd "$(dirname "$SPRINT")/../../ezk-archive/scripts" && pwd)/handoff.sh" path)"

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
SESS_HAND="$(sum "$HF")"
OUT7="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=1 done=1 deferred=1" 'printf "%s\n" "$OUT7" | grep -qx "CLOSE: SEALED sprint=1 done=1 deferred=1"'
ok "annonce l'incrément (id + référence de PR)" 'printf "%s\n" "$OUT7" | grep -qx "INCREMENT: $A (PR #12)"'
ok "rend la main à la session : retro, planning, sprint suivant, archive nommés" 'N="$(printf "%s\n" "$OUT7" | grep "^NEXT:")" && for w in ezk-retro ezk-backlog "ezk-sprint start" ezk-archive; do printf "%s\n" "$N" | grep -qF "$w" || exit 1; done'
ok "Statut: clos" 'grep -q "^Statut: clos" SPRINT.md'
ok "incrément inscrit dans « Incréments scellés de la session », la story reportée nommée" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12) — reportée : $B" SPRINT.md && grep -qxF "## Incréments scellés de la session" SPRINT.md'
ok "la session n'est pas touchée (docs/sessions, handoff)" '[ "$(sum docs/sessions/2026-10-01-marker.md)" = "$SESS_MARK" ] && [ "$(sum "$HF")" = "$SESS_HAND" ] && [ "$(ls docs/sessions | wc -l | tr -d " ")" = 1 ]'
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
ok "l'incrément scellé du sprint 1 est conservé, avec sa story reportée" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12) — reportée : $B" SPRINT.md'
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
ok "la session n'est pas touchée" '[ "$(sum "$HF")" = "$SESS_HAND" ]'

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

echo "S15 — une case mal formée ne disparaît jamais en silence : close refuse au lieu de sceller en l'omettant"
# Retour Codex (PR #310) : `lot_lines` ne voit que `[ ]`, `[x]` et `[~]`. Un `[X]` tapé à la main devenait
# invisible aux totaux ; avec une autre story en `[x]`, close scellait le sprint sans lui.
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #20)/"
bash "$SPRINT" close >/dev/null # ferme proprement le sprint 8, resté ouvert à la fin de S14
bash "$SPRINT" start --lot "$A,$B,$C" --objective "Cases mal formées" >/dev/null
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #21)/"
edit "s/^- \[ \] $B — Beta\$/- [X] $B — Beta (PR #22)/" # majuscule : ni [ ], ni [x], ni [~]
edit "s/^- \[ \] $C — Gamma\$/- [] $C — Gamma/"          # marqueur vide
# Une puce de lot qui n'est PAS une case (un lien) ne doit pas être prise pour une case fautive.
awk -v ins="- [la fiche](features/x.md) — un lien, pas une case" '{ print } /^- \[x\] '"$A"' — / { print ins }' SPRINT.md > SPRINT.md.tmp && mv SPRINT.md.tmp SPRINT.md
SUM15="$(sum SPRINT.md)"
OUT15="$(bash "$SPRINT" close)"
HINT15="$(printf '%s\n' "$OUT15" | grep '^HINT:' || true)"
ok "CLOSE: REFUSED malformed_story sprint=9 rows=2 (le lien n'est pas compté)" 'printf "%s\n" "$OUT15" | grep -qx "CLOSE: REFUSED malformed_story sprint=9 rows=2"'
ok "chaque case fautive est citée telle qu'écrite" 'printf "%s\n" "$OUT15" | grep -qxF "STORY_MALFORMED: - [X] $B — Beta (PR #22)" && printf "%s\n" "$OUT15" | grep -qxF "STORY_MALFORMED: - [] $C — Gamma"'
ok "dit comment corriger : les trois marqueurs valides" 'printf "%s" "$HINT15" | grep -qF -- "[ ]" && printf "%s" "$HINT15" | grep -qF -- "[x]" && printf "%s" "$HINT15" | grep -qF -- "[~]"'
ok "rien n'est scellé : SPRINT.md intact, sprint toujours en cours" '[ "$(sum SPRINT.md)" = "$SUM15" ] && grep -q "^Statut: en cours" SPRINT.md'
OUT15B="$(bash "$SPRINT" close --abandon "test")"
ok "close --abandon refuse aussi : le résumé de session doit dire vrai" 'printf "%s\n" "$OUT15B" | grep -qx "CLOSE: REFUSED malformed_story sprint=9 rows=2" && [ "$(sum SPRINT.md)" = "$SUM15" ]'
edit "s/^- \[X\] $B — Beta (PR #22)\$/- [x] $B — Beta (PR #22)/"
edit "s/^- \[\] $C — Gamma\$/- [~] $C — Gamma (reportée)/"
OUT15C="$(bash "$SPRINT" close)"
ok "marqueurs corrigés : CLOSE: SEALED sprint=9 done=2 deferred=1" 'printf "%s\n" "$OUT15C" | grep -qx "CLOSE: SEALED sprint=9 done=2 deferred=1"'
ok "l'incrément reprend les deux stories livrées" 'printf "%s\n" "$OUT15C" | grep -qx "INCREMENT: $A (PR #21)" && printf "%s\n" "$OUT15C" | grep -qx "INCREMENT: $B (PR #22)"'

echo "S16 — skill installé en COPIE (bind-global par défaut) : aucun catalogue autour du script"
# Retour Codex (PR #275, P1) : MC se calculait depuis le chemin du script, donc = ~/.claude, où ni tsx ni
# bin/fiche-rows.ts n'existent. Tout `start --lot` sortait en « tsx introuvable ». Une copie ne matérialise que
# le DOSSIER de chaque skill (SKILL.md, scripts/…), jamais bin/ ni node_modules.
SKILLS_SRC="$(cd "$HERE/../.." && pwd -P)" # products/mega-city/skills
MC_REAL="$(cd "$HERE/../../.." && pwd -P)"  # products/mega-city : porte bin/ et node_modules
mkdir -p "$TMP/home-copy/.claude/skills"
cp -R "$SKILLS_SRC/ezk-sprint" "$SKILLS_SRC/ezk-archive" "$TMP/home-copy/.claude/skills/"
SPRINT_COPY="$TMP/home-copy/.claude/skills/ezk-sprint/scripts/sprint.sh"
rc=0; OUT16="$(bash "$SPRINT_COPY" start --lot "$A" --objective "Copie sans catalogue" 2>/dev/null)" || rc=$?
ok "start s'ouvre (OPENED sprint=10), il ne sort plus en exit 2 « tsx introuvable »" '[ "$rc" = 0 ] && printf "%s\n" "$OUT16" | grep -qx "START: OPENED sprint=10 stories=1"'
ok "dit que le loader est introuvable et comment le désigner (WARN, MEGA_CITY_ROOT)" 'printf "%s\n" "$OUT16" | grep "^WARN:" | grep -qF "MEGA_CITY_ROOT"'
ok "faute de loader, le titre vient du NOM du fichier (jamais d'un parse maison du front-matter)" 'grep -qx -- "- \[ \] $A — alpha" SPRINT.md'
bash "$SPRINT" close --abandon "S16 : copie sans catalogue" >/dev/null
rc=0; OUT16B="$(MEGA_CITY_ROOT="$MC_REAL" bash "$SPRINT_COPY" start --lot "$A" --objective "Copie + catalogue" 2>/dev/null)" || rc=$?
ok "MEGA_CITY_ROOT désigne le catalogue : OPENED sprint=11, sans WARN" '[ "$rc" = 0 ] && printf "%s\n" "$OUT16B" | grep -qx "START: OPENED sprint=11 stories=1" && ! printf "%s\n" "$OUT16B" | grep -q "^WARN:"'
ok "le titre est lu par le loader du catalogue (Alpha, pas alpha)" 'grep -qx -- "- \[ \] $A — Alpha" SPRINT.md'

echo "S17 — skill installé en LIEN (bind-global --link) : le script suit le symlink jusqu'au catalogue"
# Le chemin LOGIQUE du script (~/.claude/skills/ezk-sprint/scripts) ne contient pas le catalogue ; le chemin
# PHYSIQUE, si : MC doit se calculer depuis lui.
mkdir -p "$TMP/home-link/.claude/skills"
ln -s "$SKILLS_SRC/ezk-sprint" "$TMP/home-link/.claude/skills/ezk-sprint"
ln -s "$SKILLS_SRC/ezk-archive" "$TMP/home-link/.claude/skills/ezk-archive"
bash "$SPRINT" close --abandon "S17 : fin de S16" >/dev/null
rc=0; OUT17="$(bash "$TMP/home-link/.claude/skills/ezk-sprint/scripts/sprint.sh" start --lot "$A" --objective "Lien" 2>/dev/null)" || rc=$?
ok "start s'ouvre depuis le chemin installé (OPENED sprint=12)" '[ "$rc" = 0 ] && printf "%s\n" "$OUT17" | grep -qx "START: OPENED sprint=12 stories=1"'
ok "titre lu par le loader du catalogue, sans WARN" '! printf "%s\n" "$OUT17" | grep -q "^WARN:" && grep -qx -- "- \[ \] $A — Alpha" SPRINT.md'

echo "S18 — les ids non livrés (reportés, restés ouverts) traversent le prochain start"
# Retour Codex (PR #275, P2) : chaque start REMPLACE le lot, et la ligne scellée ne nommait que les stories livrées.
# L'id d'une story reportée ou abandonnée disparaissait du savoir de session, alors qu'ezk-archive en tire
# l'entête `fiches:` du récit.
cur() { sed -nE 's/^# Sprint ([0-9]+).*/\1/p' SPRINT.md | head -1; }
bash "$SPRINT" close --abandon "S18 : fin de S17" >/dev/null
bash "$SPRINT" start --lot "$A,$B" --objective "Reports" >/dev/null
N18="$(cur)"
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #30)/"
edit "s/^- \[ \] $B — Beta\$/- [~] $B — Beta (PR #31)/"
bash "$SPRINT" close >/dev/null
SEAL18="- Sprint $N18 — Reports — 1 livrée, 1 reportée : $A (PR #30) — reportée : $B (PR #31)"
ok "la ligne scellée nomme la story reportée, avec sa PR" 'grep -qxF -- "$SEAL18" SPRINT.md'
bash "$SPRINT" start --lot "$C" --objective "Après les reports" >/dev/null
N18B="$(cur)"
ok "le lot du sprint suivant ne contient que sa story" '[ "$(grep -c "^- \[[ x~]\] " SPRINT.md)" = 1 ] && grep -qx -- "- \[ \] $C — Gamma" SPRINT.md'
ok "l'id reporté a survécu au remplacement du lot" 'grep -qxF -- "$SEAL18" SPRINT.md'
bash "$SPRINT" close --abandon "PO arrête" >/dev/null
bash "$SPRINT" start --lot "$A" --objective "Suite" >/dev/null
ok "abandon : l'id de la story restée ouverte est gardé aussi" 'grep -qxF -- "- Sprint $N18B — Après les reports — abandonné (PO arrête) — 0 livrée, 0 reportée, 1 ouverte — ouverte : $C" SPRINT.md'

echo "S20 — projet hôte qui n'ignore pas SPRINT.md : start l'exclut de git en local (fiche 20261003200945204)"
# Sans ça, SPRINT.md reste « non suivi » et `ship-merge.sh --local` refuse un dépôt qu'il juge sale.
git init -q -b main "$TMP/hote"
(
  cd "$TMP/hote"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  echo node_modules/ > .gitignore
  git add . && git commit -qm base
)
GI0="$(cksum < "$TMP/hote/.gitignore")"
(cd "$TMP/hote" && bash "$SPRINT" start --lot "$A" >/dev/null)
ok "SPRINT.md écrit, et le dépôt reste propre pour git" '[ -f "$TMP/hote/SPRINT.md" ] && [ -z "$(git -C "$TMP/hote" status --porcelain)" ]'
ok "aucun fichier du projet modifié (.gitignore intact)" '[ "$(cksum < "$TMP/hote/.gitignore")" = "$GI0" ]'
EXCL="$(git -C "$TMP/hote" rev-parse --git-path info/exclude)"
case "$EXCL" in /*) ;; *) EXCL="$TMP/hote/$EXCL" ;; esac
ok "l'exclusion locale de git nomme SPRINT.md" 'grep -qx "/SPRINT.md" "$EXCL"'
(cd "$TMP/hote" && bash "$SPRINT" close --abandon "S20" >/dev/null && bash "$SPRINT" start --lot "$A" >/dev/null)
ok "un second start n'ajoute pas de doublon" '[ "$(grep -cx "/SPRINT.md" "$EXCL")" = 1 ]'
# Le dépôt de test principal (le dossier courant) ignore SPRINT.md dans son .gitignore, comme vectorz.
EXCL_REPO="$(git rev-parse --git-path info/exclude)"
ok "un dépôt qui ignore déjà SPRINT.md garde son exclusion locale intacte" '[ ! -f "$EXCL_REPO" ] || ! grep -qx "/SPRINT.md" "$EXCL_REPO"'

echo "S19 — hors dépôt git : exit 2"
mkdir "$TMP/nogit"
rc=0; (cd "$TMP/nogit" && bash "$SPRINT" close >/dev/null 2>&1) || rc=$?
ok "exit 2" '[ "$rc" = 2 ]'

if (( FAIL )); then
  echo "FAIL"
  exit 1
fi
echo "PASS"
