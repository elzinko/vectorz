#!/usr/bin/env bash
# DoD exécutable — cycle de vie du sprint : `ezk-sprint start` / `close`
# (fiche 20260930123438875, ADR-0054 ; journal par branche : fiche 20261004181110201).
#
# Ce que ce test PROUVE, et que la prose d'un SKILL.md ne prouve pas :
#   - `check` ≡ `start --dry-run` : même sortie que le portier, strictement read-only ;
#   - `start` refuse sur ALERT (sauf override journalisé) et refuse d'ouvrir un 2e sprint ;
#   - `close` refuse tant qu'une story est ouverte, scelle sinon, et ne touche JAMAIS la
#     session (docs/sessions/, note de handoff : c'est le métier d'ezk-archive) ;
#   - `start → close → start` s'enchaîne sans perdre ni l'incrément ni les galères du labo ;
#   - un sprint où rien n'est livré a une sortie (`close --abandon`) : pas d'impasse, pas de rm du journal ;
#   - un journal d'ancien format (statut en fin de ligne) se ferme, une seule fois ;
#   - un skill installé en COPIE ou en LIEN (bind-global) ouvre un sprint : le loader se résout sans que
#     le script soit lancé depuis le catalogue ;
#   - les ids des stories reportées ou restées ouvertes survivent au prochain `start` (journal de session) ;
#   - LE JOURNAL VIT HORS DU WORKTREE, un fichier par BRANCHE (dossier git commun) : un worktree neuf sur
#     une branche neuve ouvre « Sprint 1 » sans héritage, le journal survit à `git worktree remove`, et un
#     SPRINT.md étranger resté à la racine est signalé, jamais repris en silence (fiche 20261004181110201).
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
# Le journal de la branche courante du dépôt où l'on est (même résolution que sprint.sh : pwd -P).
journal_of() { # [dossier] → chemin du journal de branche
  ( [[ -n "${1:-}" ]] && cd "$1"
    echo "$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)/ezk/sprints/$(git branch --show-current).md" )
}
# Simule ce que fait l'agent pendant le sprint : édite le journal à la main.
edit() { sed -i.bak -e "$1" "$J" && rm -f "$J.bak"; }

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
# Le journal de sprint vit au même endroit, mais clé par branche (ici : main).
J="$(journal_of)"
mkdir -p "$(dirname "$J")"

HEAD0="$(git rev-parse HEAD)"
REFS0="$(git for-each-ref | sort)"

echo "S1 — check ≡ start --dry-run, strictement read-only"
OUT_CHECK="$(bash "$CHECK" --gate)"
OUT_DRY="$(bash "$SPRINT" start --dry-run)"
ok "même sortie que le portier" '[ "$OUT_DRY" = "$OUT_CHECK" ]'
ok "VERDICT: CLEAR" 'printf "%s\n" "$OUT_DRY" | grep -qx "VERDICT: CLEAR"'
ok "aucun fichier écrit (pas de journal, arbre propre)" '[ ! -e "$J" ] && [ -z "$(git status --porcelain)" ]'
ok "HEAD et refs intacts (aucune branche, aucun commit)" '[ "$(git rev-parse HEAD)" = "$HEAD0" ] && [ "$(git for-each-ref | sort)" = "$REFS0" ]'

echo "S2 — start --dry-run sur arbre sale : ALERT, toujours read-only"
echo dirty >> a.txt
OUT2="$(bash "$SPRINT" start --dry-run)"
ok "VERDICT ALERT points=1" 'printf "%s\n" "$OUT2" | grep -q "^VERDICT: ALERT points=1"'
ok "toujours aucun journal" '[ ! -e "$J" ]'
git checkout -- a.txt

echo "S3 — start exige un lot réel ; close sans sprint est refusé"
rc=0; bash "$SPRINT" start >/dev/null 2>&1 || rc=$?
ok "sans --lot : exit 2 (erreur d'usage)" '[ "$rc" = 2 ]'
OUT3="$(bash "$SPRINT" start --lot "$A,99999999999999")"
ok "story inconnue : REFUSED lot_unknown" 'printf "%s\n" "$OUT3" | grep -qx "START: REFUSED lot_unknown id=99999999999999"'
ok "rien n'est écrit" '[ ! -e "$J" ]'
OUT3G="$(bash "$SPRINT" start --lot '2026*')"
ok "un id n'est jamais un motif de glob : REFUSED lot_unknown" 'printf "%s\n" "$OUT3G" | grep -qxF "START: REFUSED lot_unknown id=2026*"'
ok "rien n'est écrit (glob)" '[ ! -e "$J" ]'
OUT3B="$(bash "$SPRINT" close)"
ok "close sans journal : REFUSED not_open" 'printf "%s\n" "$OUT3B" | grep -qx "CLOSE: REFUSED not_open"'

echo "S4 — start ouvre le sprint 1 (lot de 2 stories) quand le portier est CLEAR"
OUT4="$(bash "$SPRINT" start --lot "$A,$B" --objective "Premier sprint")"
ok "START: OPENED sprint=1 stories=2" 'printf "%s\n" "$OUT4" | grep -qx "START: OPENED sprint=1 stories=2"'
ok "SPRINT_FILE nomme le journal commun (hors du worktree)" 'printf "%s\n" "$OUT4" | grep -qxF "SPRINT_FILE: $J"'
ok "titre « # Sprint 1 — Premier sprint »" '[ "$(head -1 "$J")" = "# Sprint 1 — Premier sprint" ]'
ok "Statut: en cours" 'grep -q "^Statut: en cours" "$J"'
ok "l'en-tête porte la branche (main)" 'grep -qx "Branche: main" "$J"'
ok "le lot : 2 stories ouvertes, titres lus dans les fiches" '[ "$(grep -c "^- \[ \] 2026100100000[12] — " "$J")" = 2 ] && grep -qx -- "- \[ \] $A — Alpha" "$J"'
ok "titre de section du labo conservé tel quel (lu par ezk-archive et ezk-chef)" 'grep -qxF "## Galères & gestes (labo)" "$J"'
ok "start n'a créé ni branche ni commit" '[ "$(git rev-parse HEAD)" = "$HEAD0" ] && [ "$(git for-each-ref | sort)" = "$REFS0" ]'
ok "le journal est hors git (arbre propre, pas de SPRINT.md à la racine)" '[ -z "$(git status --porcelain)" ] && [ ! -e SPRINT.md ]'

echo "S5 — un sprint est déjà ouvert : start refuse, journal intact"
SUM5="$(sum "$J")"
OUT5="$(bash "$SPRINT" start --lot "$C")"
ok "REFUSED open_sprint sprint=1" 'printf "%s\n" "$OUT5" | grep -qx "START: REFUSED open_sprint sprint=1"'
ok "journal intact" '[ "$(sum "$J")" = "$SUM5" ]'
bash "$SPRINT" start --dry-run >/dev/null
ok "start --dry-run ne touche pas le journal" '[ "$(sum "$J")" = "$SUM5" ]'

echo "S6 — close refuse tant qu'une story du lot est ouverte"
OUT6="$(bash "$SPRINT" close)"
ok "CLOSE: OPEN sprint=1 open=2" 'printf "%s\n" "$OUT6" | grep -qx "CLOSE: OPEN sprint=1 open=2"'
ok "liste les stories ouvertes" 'printf "%s\n" "$OUT6" | grep -qx "STORY_OPEN: $A — Alpha"'
ok "journal intact, sprint toujours en cours" '[ "$(sum "$J")" = "$SUM5" ] && grep -q "^Statut: en cours" "$J"'

echo "S7 — close scelle l'incrément (1 livrée, 1 reportée) et ne touche pas la session"
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #12)/"
edit "s/^- \[ \] $B — Beta\$/- [~] $B — Beta (reportée : dépend d'Alpha)/"
awk '{print} /^## Galères & gestes \(labo\)$/ {print "- symptôme X — geste Y — pourquoi Z"}' "$J" > "$J.new" && mv "$J.new" "$J"
SESS_MARK="$(sum docs/sessions/2026-10-01-marker.md)"
SESS_HAND="$(sum "$HF")"
OUT7="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=1 done=1 deferred=1" 'printf "%s\n" "$OUT7" | grep -qx "CLOSE: SEALED sprint=1 done=1 deferred=1"'
ok "annonce l'incrément (id + référence de PR)" 'printf "%s\n" "$OUT7" | grep -qx "INCREMENT: $A (PR #12)"'
ok "rend la main à la session : retro, planning, sprint suivant, archive nommés" 'N="$(printf "%s\n" "$OUT7" | grep "^NEXT:")" && for w in ezk-retro ezk-backlog "ezk-sprint start" ezk-archive; do printf "%s\n" "$N" | grep -qF "$w" || exit 1; done'
ok "Statut: clos" 'grep -q "^Statut: clos" "$J"'
ok "la branche reste inscrite dans l'en-tête après close" 'grep -qx "Branche: main" "$J"'
ok "incrément inscrit dans « Incréments scellés de la session », la story reportée nommée" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12) — reportée : $B" "$J" && grep -qxF "## Incréments scellés de la session" "$J"'
ok "la session n'est pas touchée (docs/sessions, handoff)" '[ "$(sum docs/sessions/2026-10-01-marker.md)" = "$SESS_MARK" ] && [ "$(sum "$HF")" = "$SESS_HAND" ] && [ "$(ls docs/sessions | wc -l | tr -d " ")" = 1 ]'
ok "close committe le compte rendu du sprint (ADR-0068) sans salir l'arbre" 'printf "%s\n" "$OUT7" | grep -q "^SPRINT-REPORT: committ" && git log --all --format=%s | grep -q "compte rendu du sprint 1" && [ -z "$(git status --porcelain)" ]'
ok "le compte rendu porte le lot scellé (## Lot scellé + la story livrée)" 'SHA="$(git log --all --format=%H --grep="compte rendu du sprint 1" | head -1)" && git show "$SHA" -- "docs/sprints/*" | grep -q "Lot scellé" && git show "$SHA" -- "docs/sprints/*" | grep -q "$A"'

echo "S8 — close sans sprint ouvert : refus, pas de double scellé"
SUM8="$(sum "$J")"
OUT8="$(bash "$SPRINT" close)"
ok "REFUSED not_open" 'printf "%s\n" "$OUT8" | grep -qx "CLOSE: REFUSED not_open"'
ok "journal intact" '[ "$(sum "$J")" = "$SUM8" ]'

echo "S9 — start → close → start : le sprint 2 garde le labo et l'incrément ; ALERT = override journalisé"
echo dirty >> a.txt
OUT9="$(bash "$SPRINT" start --lot "$C")"
ok "arbre sale : REFUSED gate=ALERT" 'printf "%s\n" "$OUT9" | grep -qx "START: REFUSED gate=ALERT"'
ok "le bloc du portier est montré (les faits pour décider)" 'printf "%s\n" "$OUT9" | grep -q "^VERDICT: ALERT points=1"'
ok "journal (clos) intact" '[ "$(sum "$J")" = "$SUM8" ]'
rc=0; bash "$SPRINT" start --lot "$C" --override "" >/dev/null 2>&1 || rc=$?
ok "--override sans raison : exit 2" '[ "$rc" = 2 ]'
OUT9B="$(bash "$SPRINT" start --lot "$C" --objective "Second sprint" --override "arbre sale volontaire (test)")"
ok "avec override : OPENED sprint=2 stories=1" 'printf "%s\n" "$OUT9B" | grep -qx "START: OPENED sprint=2 stories=1"'
ok "l'override est journalisé dans les notes" 'grep -q "Override du portier.*ALERT points=1.*arbre sale volontaire (test)" "$J"'
ok "le labo du sprint 1 est conservé, en une seule section" 'grep -q "symptôme X — geste Y" "$J" && [ "$(grep -cxF "## Galères & gestes (labo)" "$J")" = 1 ]'
ok "l'incrément scellé du sprint 1 est conservé, avec sa story reportée" 'grep -qxF -- "- Sprint 1 — Premier sprint — 1 livrée, 1 reportée : $A (PR #12) — reportée : $B" "$J"'
ok "le lot du sprint 2 ne contient que sa story" '[ "$(grep -c "^- \[[ x~]\] " "$J")" = 1 ] && grep -qx -- "- \[ \] $C — Gamma" "$J"'
git checkout -- a.txt

echo "S10 — second incrément : deux sprints scellés dans la même session"
edit "s/^- \[ \] $C — Gamma\$/- [x] $C — Gamma (PR #13)/"
OUT10="$(bash "$SPRINT" close)"
ok "CLOSE: SEALED sprint=2 done=1 deferred=0" 'printf "%s\n" "$OUT10" | grep -qx "CLOSE: SEALED sprint=2 done=1 deferred=0"'
ok "deux incréments dans la session, dans l'ordre" '[ "$(grep -c "^- Sprint [0-9]* — " "$J")" = 2 ] && [ "$(grep "^- Sprint [0-9]* — " "$J" | head -1 | cut -c1-10)" = "- Sprint 1" ]'

echo "S11 — rien de livré : pas d'incrément, donc close refuse ; --abandon est la sortie, le savoir de session reste"
bash "$SPRINT" start --lot "$A" --objective "Sprint vide" >/dev/null
edit "s/^- \[ \] $A — Alpha\$/- [~] $A — Alpha (reportée)/"
SUM11="$(sum "$J")"
OUT11="$(bash "$SPRINT" close)"
ok "CLOSE: REFUSED empty_increment sprint=3" 'printf "%s\n" "$OUT11" | grep -qx "CLOSE: REFUSED empty_increment sprint=3"'
ok "indique la sortie : close --abandon" 'printf "%s\n" "$OUT11" | grep "^HINT:" | grep -qF -- "--abandon"'
ok "le sprint reste ouvert, journal intact" '[ "$(sum "$J")" = "$SUM11" ] && grep -q "^Statut: en cours" "$J"'
rc=0; bash "$SPRINT" close --abandon "" >/dev/null 2>&1 || rc=$?
ok "--abandon sans raison : exit 2" '[ "$rc" = 2 ]'
OUT11B="$(bash "$SPRINT" close --abandon "pas de capacité")"
ok "CLOSE: ABANDONED sprint=3 done=0 deferred=1 open=0" 'printf "%s\n" "$OUT11B" | grep -qx "CLOSE: ABANDONED sprint=3 done=0 deferred=1 open=0"'
ok "la story reportée est annoncée (retour au backlog)" 'printf "%s\n" "$OUT11B" | grep -qx "STORY_DEFERRED: $A — Alpha (reportée)"'
ok "Statut: clos, avec la raison de l'abandon" 'head -5 "$J" | grep -q "^Statut: clos .*Abandon: pas de capacité"'
ok "le journal de session garde l'abandon ET les incréments précédents" 'grep -qF -- "- Sprint 3 — Sprint vide — abandonné (pas de capacité) — 0 livrée, 1 reportée, 0 ouverte" "$J" && [ "$(grep -c "^- Sprint [0-9]* — " "$J")" = 3 ]'
ok "le labo est conservé" 'grep -q "symptôme X — geste Y" "$J"'
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

echo "S14 — un journal d'ancien format (statut en fin de ligne, sans Branche) se ferme, une seule fois"
cat > "$J" <<'EOF'
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
ok "le statut en fin de ligne passe à clos, le périmètre reste" 'sed -n 2p "$J" | grep -q "^Périmètre: 2h   Statut: clos"'
ok "incrément lu sans « — » : libellé + référence de PR" 'printf "%s\n" "$OUT14" | grep -qx "INCREMENT: feat: B (PR #12, squash-merged)"'
SUM14="$(sum "$J")"
OUT14B="$(bash "$SPRINT" close)"
ok "second close : REFUSED not_open, pas de double scellé" 'printf "%s\n" "$OUT14B" | grep -qx "CLOSE: REFUSED not_open" && [ "$(sum "$J")" = "$SUM14" ]'
OUT14C="$(bash "$SPRINT" start --lot "$A" --objective "Après l'ancien format")"
ok "le sprint suivant s'ouvre (sprint=8) et garde le labo hérité" 'printf "%s\n" "$OUT14C" | grep -qx "START: OPENED sprint=8 stories=1" && grep -q "galère héritée — geste hérité" "$J"'

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
awk -v ins="- [la fiche](features/x.md) — un lien, pas une case" '{ print } /^- \[x\] '"$A"' — / { print ins }' "$J" > "$J.tmp" && mv "$J.tmp" "$J"
SUM15="$(sum "$J")"
OUT15="$(bash "$SPRINT" close)"
HINT15="$(printf '%s\n' "$OUT15" | grep '^HINT:' || true)"
ok "CLOSE: REFUSED malformed_story sprint=9 rows=2 (le lien n'est pas compté)" 'printf "%s\n" "$OUT15" | grep -qx "CLOSE: REFUSED malformed_story sprint=9 rows=2"'
ok "chaque case fautive est citée telle qu'écrite" 'printf "%s\n" "$OUT15" | grep -qxF "STORY_MALFORMED: - [X] $B — Beta (PR #22)" && printf "%s\n" "$OUT15" | grep -qxF "STORY_MALFORMED: - [] $C — Gamma"'
ok "dit comment corriger : les trois marqueurs valides" 'printf "%s" "$HINT15" | grep -qF -- "[ ]" && printf "%s" "$HINT15" | grep -qF -- "[x]" && printf "%s" "$HINT15" | grep -qF -- "[~]"'
ok "rien n'est scellé : journal intact, sprint toujours en cours" '[ "$(sum "$J")" = "$SUM15" ] && grep -q "^Statut: en cours" "$J"'
OUT15B="$(bash "$SPRINT" close --abandon "test")"
ok "close --abandon refuse aussi : le résumé de session doit dire vrai" 'printf "%s\n" "$OUT15B" | grep -qx "CLOSE: REFUSED malformed_story sprint=9 rows=2" && [ "$(sum "$J")" = "$SUM15" ]'
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
ok "faute de loader, le titre vient du NOM du fichier (jamais d'un parse maison du front-matter)" 'grep -qx -- "- \[ \] $A — alpha" "$J"'
bash "$SPRINT" close --abandon "S16 : copie sans catalogue" >/dev/null
rc=0; OUT16B="$(MEGA_CITY_ROOT="$MC_REAL" bash "$SPRINT_COPY" start --lot "$A" --objective "Copie + catalogue" 2>/dev/null)" || rc=$?
ok "MEGA_CITY_ROOT désigne le catalogue : OPENED sprint=11, sans WARN" '[ "$rc" = 0 ] && printf "%s\n" "$OUT16B" | grep -qx "START: OPENED sprint=11 stories=1" && ! printf "%s\n" "$OUT16B" | grep -q "^WARN:"'
ok "le titre est lu par le loader du catalogue (Alpha, pas alpha)" 'grep -qx -- "- \[ \] $A — Alpha" "$J"'

echo "S17 — skill installé en LIEN (bind-global --link) : le script suit le symlink jusqu'au catalogue"
# Le chemin LOGIQUE du script (~/.claude/skills/ezk-sprint/scripts) ne contient pas le catalogue ; le chemin
# PHYSIQUE, si : MC doit se calculer depuis lui.
mkdir -p "$TMP/home-link/.claude/skills"
ln -s "$SKILLS_SRC/ezk-sprint" "$TMP/home-link/.claude/skills/ezk-sprint"
ln -s "$SKILLS_SRC/ezk-archive" "$TMP/home-link/.claude/skills/ezk-archive"
bash "$SPRINT" close --abandon "S17 : fin de S16" >/dev/null
rc=0; OUT17="$(bash "$TMP/home-link/.claude/skills/ezk-sprint/scripts/sprint.sh" start --lot "$A" --objective "Lien" 2>/dev/null)" || rc=$?
ok "start s'ouvre depuis le chemin installé (OPENED sprint=12)" '[ "$rc" = 0 ] && printf "%s\n" "$OUT17" | grep -qx "START: OPENED sprint=12 stories=1"'
ok "titre lu par le loader du catalogue, sans WARN" '! printf "%s\n" "$OUT17" | grep -q "^WARN:" && grep -qx -- "- \[ \] $A — Alpha" "$J"'

echo "S18 — les ids non livrés (reportés, restés ouverts) traversent le prochain start"
# Retour Codex (PR #275, P2) : chaque start REMPLACE le lot, et la ligne scellée ne nommait que les stories livrées.
# L'id d'une story reportée ou abandonnée disparaissait du savoir de session, alors qu'ezk-archive en tire
# l'entête `fiches:` du récit.
cur() { sed -nE 's/^# Sprint ([0-9]+).*/\1/p' "$J" | head -1; }
bash "$SPRINT" close --abandon "S18 : fin de S17" >/dev/null
bash "$SPRINT" start --lot "$A,$B" --objective "Reports" >/dev/null
N18="$(cur)"
edit "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (PR #30)/"
edit "s/^- \[ \] $B — Beta\$/- [~] $B — Beta (PR #31)/"
bash "$SPRINT" close >/dev/null
SEAL18="- Sprint $N18 — Reports — 1 livrée, 1 reportée : $A (PR #30) — reportée : $B (PR #31)"
ok "la ligne scellée nomme la story reportée, avec sa PR" 'grep -qxF -- "$SEAL18" "$J"'
bash "$SPRINT" start --lot "$C" --objective "Après les reports" >/dev/null
N18B="$(cur)"
ok "le lot du sprint suivant ne contient que sa story" '[ "$(grep -c "^- \[[ x~]\] " "$J")" = 1 ] && grep -qx -- "- \[ \] $C — Gamma" "$J"'
ok "l'id reporté a survécu au remplacement du lot" 'grep -qxF -- "$SEAL18" "$J"'
bash "$SPRINT" close --abandon "PO arrête" >/dev/null
bash "$SPRINT" start --lot "$A" --objective "Suite" >/dev/null
ok "abandon : l'id de la story restée ouverte est gardé aussi" 'grep -qxF -- "- Sprint $N18B — Après les reports — abandonné (PO arrête) — 0 livrée, 0 reportée, 1 ouverte — ouverte : $C" "$J"'
bash "$SPRINT" close --abandon "fin S18" >/dev/null

echo "S19 — hors dépôt git : exit 2"
mkdir "$TMP/nogit"
rc=0; (cd "$TMP/nogit" && bash "$SPRINT" close >/dev/null 2>&1) || rc=$?
ok "exit 2" '[ "$rc" = 2 ]'

echo "S20 — le journal vit hors du worktree : un dépôt hôte reste propre, sa config git est intacte (fiche 20261004181110201)"
# Avant la bascule, start écrivait SPRINT.md à la racine et devait l'exclure de git. Désormais le journal
# vit dans <git-common-dir>/ezk/, que git ne voit jamais : aucune exclusion à poser, rien à la racine.
git init -q -b main "$TMP/hote"
(
  cd "$TMP/hote"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  echo node_modules/ > .gitignore
  git add . && git commit -qm base
)
GI0="$(cksum < "$TMP/hote/.gitignore")"
HOTE_J="$(journal_of "$TMP/hote")"
(cd "$TMP/hote" && bash "$SPRINT" start --lot "$A" >/dev/null)
ok "le journal est écrit hors du worktree (dossier git commun)" '[ -f "$HOTE_J" ]'
ok "rien à la racine du worktree (pas de SPRINT.md)" '[ ! -e "$TMP/hote/SPRINT.md" ]'
ok "le dépôt hôte reste propre pour git" '[ -z "$(git -C "$TMP/hote" status --porcelain)" ]'
ok "aucun fichier du projet modifié (.gitignore intact)" '[ "$(cksum < "$TMP/hote/.gitignore")" = "$GI0" ]'
EXCL="$(git -C "$TMP/hote" rev-parse --git-path info/exclude)"
case "$EXCL" in /*) ;; *) EXCL="$TMP/hote/$EXCL" ;; esac
ok "pas d'exclusion locale posée (le journal n'est pas dans le worktree)" '[ ! -f "$EXCL" ] || ! grep -qx "/SPRINT.md" "$EXCL"'

echo "S21 — worktree neuf sur branche neuve : Sprint 1 sans héritage ; le journal survit à worktree remove et se relit"
# Critères 1 et 2 de la fiche. On part d'un dépôt avec un sprint ouvert sur main (donc un journal main.md avec
# des notes) : une branche neuve ne doit RIEN en hériter, car chaque branche a son propre fichier.
git init -q -b main "$TMP/wtbase"
(
  cd "$TMP/wtbase"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha && mkfiche "$B" "Beta" beta
  echo node_modules/ > .gitignore
  git add . && git commit -qm base
  bash "$SPRINT" start --lot "$A" --objective "Sprint sur main" >/dev/null
)
MAIN_J="$(journal_of "$TMP/wtbase")"
# une note bien à elle, sur la branche main
sed -i.bak -e 's/^## Notes \/ décisions$/## Notes \/ décisions\n- note propre à main/' "$MAIN_J" && rm -f "$MAIN_J.bak"
# worktree 1 sur une branche NEUVE, avec un « / » (comme les vraies : feat/<id>-<slug>)
git -C "$TMP/wtbase" worktree add -q -b feat/neuve "$TMP/wt1" main >/dev/null 2>&1
WT_J="$(journal_of "$TMP/wt1")"
OUT21="$(cd "$TMP/wt1" && bash "$SPRINT" start --lot "$A" --objective "Branche neuve")"
ok "une branche neuve ouvre Sprint 1" 'printf "%s\n" "$OUT21" | grep -qx "START: OPENED sprint=1 stories=1"'
ok "son journal est clé par la branche feat/neuve, hors du worktree" '[ -f "$WT_J" ] && grep -qx "Branche: feat/neuve" "$WT_J"'
ok "le « / » de la branche devient un sous-dossier (comme git range ses refs)" 'case "$WT_J" in */ezk/sprints/feat/neuve.md) true ;; *) false ;; esac'
ok "aucune note héritée de main" '! grep -q "note propre à main" "$WT_J"'
ok "le journal de main n'a pas bougé (chaque branche son récit)" 'grep -q "note propre à main" "$MAIN_J"'
# le journal survit à la suppression FORCÉE du worktree
git -C "$TMP/wtbase" worktree remove --force "$TMP/wt1"
ok "le journal de la branche survit à git worktree remove --force" '[ -f "$WT_J" ]'
# un autre worktree de LA MÊME branche le relit : le sprint ouvert est retrouvé
git -C "$TMP/wtbase" worktree add -q "$TMP/wt2" feat/neuve >/dev/null 2>&1
OUT21B="$(cd "$TMP/wt2" && bash "$SPRINT" start --lot "$B")"
ok "relu depuis un autre worktree de la même branche : le sprint ouvert est retrouvé" 'printf "%s\n" "$OUT21B" | grep -qx "START: REFUSED open_sprint sprint=1"'
git -C "$TMP/wtbase" worktree remove --force "$TMP/wt2"

echo "S22 — un SPRINT.md resté à la racine : étranger = signalé, jamais repris ; de la branche courante = repris une fois"
# Critère 3 (étranger signalé) + la reprise unique. (a) étranger, sans exclusion git préalable : il est
# signalé, non repris, et exclu pour que le dépôt reste propre.
git init -q -b main "$TMP/legacy"
(
  cd "$TMP/legacy"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  echo node_modules/ > .gitignore          # NE PAS ignorer SPRINT.md : on éprouve l'exclusion
  git add . && git commit -qm base
)
LEG_J="$(journal_of "$TMP/legacy")"
cat > "$TMP/legacy/SPRINT.md" <<'EOF'
# Sprint 5 — venu d'ailleurs
Statut: en cours   Ouvert: 2026-10-01
Branche: feat-autre-session

## Lot
- [ ] 0099 — story d'une autre branche

## Galères & gestes (labo)
- galère d'une autre session
EOF
OUT22="$(cd "$TMP/legacy" && bash "$SPRINT" start --lot "$A" --objective "Branche courante")"
ok "l'étranger est signalé (SPRINT-FOREIGN nomme l'autre branche)" 'printf "%s\n" "$OUT22" | grep -q "^SPRINT-FOREIGN:.*feat-autre-session"'
ok "non repris : un journal neuf, Sprint 1" 'printf "%s\n" "$OUT22" | grep -qx "START: OPENED sprint=1 stories=1" && [ -f "$LEG_J" ]'
ok "les notes de l'autre session ne sont PAS dans le journal" '! grep -q "autre session" "$LEG_J"'
ok "le SPRINT.md étranger reste à la racine (non supprimé) mais est exclu : dépôt propre" '[ -e "$TMP/legacy/SPRINT.md" ] && [ -z "$(git -C "$TMP/legacy" status --porcelain)" ]'
# (b) un SPRINT.md marqué de la branche courante est repris UNE fois (migré au lieu commun).
git init -q -b main "$TMP/adopt"
(
  cd "$TMP/adopt"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  printf 'SPRINT.md\n' > .gitignore
  git add . && git commit -qm base
)
ADO_J="$(journal_of "$TMP/adopt")"
cat > "$TMP/adopt/SPRINT.md" <<'EOF'
# Sprint 3 — à reprendre
Statut: clos   Ouvert: 2026-10-01   Clos: 2026-10-02
Branche: main

## Lot

## Galères & gestes (labo)
- galère de la branche courante

## Incréments scellés de la session
- Sprint 3 — à reprendre — 1 livrée, 0 reportée : 0001 (PR #1)
EOF
OUT22B="$(cd "$TMP/adopt" && bash "$SPRINT" start --lot "$A" --objective "Après reprise")"
ok "le fichier marqué de la branche courante est repris (SPRINT-MIGRATION)" 'printf "%s\n" "$OUT22B" | grep -q "^SPRINT-MIGRATION:"'
ok "repris UNE fois : plus de SPRINT.md à la racine (déplacé au lieu commun)" '[ ! -e "$TMP/adopt/SPRINT.md" ] && [ -f "$ADO_J" ]'
ok "le journal garde le labo ET l'incrément de l'ancien" 'grep -q "galère de la branche courante" "$ADO_J" && grep -q "Sprint 3 — à reprendre" "$ADO_J"'
ok "le nouveau sprint est la suite (sprint=4)" 'printf "%s\n" "$OUT22B" | grep -qx "START: OPENED sprint=4 stories=1"'

echo "S23 — garde d'appartenance : un journal commun portant une AUTRE branche est REFUSÉ, jamais écrasé (revue v0.14)"
# La sanitisation du nom de branche n'est pas injective (`a+b`/`a-b` → `a-b.md`) : une collision partagerait
# un journal. La garde compare l'en-tête `Branche:` du journal à la branche courante et refuse si elle diffère.
git init -q -b main "$TMP/owner"
(
  cd "$TMP/owner"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  printf 'SPRINT.md\n' > .gitignore
  git add . && git commit -qm base
)
OWN_J="$(journal_of "$TMP/owner")"
mkdir -p "$(dirname "$OWN_J")"
cat > "$OWN_J" <<EOF
# Sprint 1 — venu d'ailleurs
Statut: en cours   Ouvert: 2026-10-01
Branche: feat-autre-collision

## Lot
- [ ] 0099 — story d'une autre branche
EOF
OUT23="$(cd "$TMP/owner" && bash "$SPRINT" start --lot "$A")"
ok "START: REFUSED journal_mismatch (courante=main, journal=feat-autre-collision)" 'printf "%s\n" "$OUT23" | grep -qx "START: REFUSED journal_mismatch branche=main journal=feat-autre-collision"'
ok "le journal de l'autre branche n'est NI écrasé NI adopté" 'grep -q "story d.une autre branche" "$OWN_J" && ! grep -q "Alpha" "$OWN_J"'
# Un journal SANS en-tête Branche: (ancien format) est grandfathered : pas de refus.
cat > "$OWN_J" <<'EOF'
# Sprint 1 — ancien format sans branche
Statut: en cours   Ouvert: 2026-10-01

## Lot
- [ ] 0099 — story
EOF
OUT23B="$(cd "$TMP/owner" && bash "$SPRINT" start --lot "$A")"
ok "un journal sans en-tête Branche: n'est PAS refusé (grandfather)" '! printf "%s\n" "$OUT23B" | grep -q "journal_mismatch"'

echo "S24 — HEAD détaché : clé de journal STABLE ; un sprint ouvert se retrouve APRÈS un commit (revue v0.14)"
# Avant le fix, la clé `_detached/<sha-court>` bougeait à chaque commit → le sprint ouvert devenait
# introuvable à close (un sprint produit des commits). Clé stable `_detached` : close le retrouve.
git init -q -b main "$TMP/det"
(
  cd "$TMP/det"
  git config user.email test@test && git config user.name test && git config commit.gpgsign false
  mkdir -p features && mkfiche "$A" "Alpha" alpha
  printf 'SPRINT.md\n' > .gitignore
  echo base > a.txt && git add . && git commit -qm base
  git checkout -q --detach
)
DET_J="$(cd "$TMP/det" && echo "$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)/ezk/sprints/_detached.md")"
OUT24="$(cd "$TMP/det" && bash "$SPRINT" start --lot "$A" --objective "Détaché")"
ok "START: OPENED sprint=1 en détaché, clé _detached" 'printf "%s\n" "$OUT24" | grep -qx "START: OPENED sprint=1 stories=1" && [ -f "$DET_J" ]'
ok "l'en-tête porte Branche: _detached" 'grep -qx "Branche: _detached" "$DET_J"'
# le sprint produit un commit → HEAD bouge, la clé ne doit PAS bouger
(cd "$TMP/det" && echo y > y.txt && git add y.txt && git commit -qm "travail du sprint")
sed -i.bak -e "s/^- \[ \] $A — Alpha\$/- [x] $A — Alpha (local abc1234)/" "$DET_J" && rm -f "$DET_J.bak"
OUT24B="$(cd "$TMP/det" && bash "$SPRINT" close)"
ok "après un commit, close RETROUVE le sprint (clé stable), pas de REFUSED not_open" 'printf "%s\n" "$OUT24B" | grep -qx "CLOSE: SEALED sprint=1 done=1 deferred=0"'

if (( FAIL )); then
  echo "FAIL"
  exit 1
fi
echo "PASS"
