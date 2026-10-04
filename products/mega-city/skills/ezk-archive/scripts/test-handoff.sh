#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — l'anneau FIFO du handoff.
#
# Ce que ces cas verrouillent :
#   H1  la borne est GARANTIE (elle ne dépend d'aucun événement externe) ET rien n'est
#       perdu : entrées vivantes + archivées = tout ce qui a été écrit ;
#   H2  `carry` rend une section bornée, pas le fichier — c'est ce qui supprime les
#       deux lectures de 20 Ko par run ;
#   H5  la note vit hors du worktree : rien n'est écrit dans le dossier de travail ni dans
#       `.gitignore` (fiche 20261003105820077) ;
#   H12-H14 (fiche 0189, session jetable) : `durable` écrit une copie versionnée, elle survit à
#       un nouveau clone, et la source la plus récente gagne (le mode local ne change pas) ;
#   H17-H20 (fiche 20261003105820077, worktree d'app) : la note vit sous `<git-common-dir>/ezk/`,
#       survit à `git worktree remove --force`, et l'ancienne note du worktree est reprise une
#       seule fois sans jamais masquer la note commune ;
#   H21-H22 (revue adverse) : des copies divergentes ne doublent aucune entrée, et une ancienne
#       note plus récente que la note commune reste visible de `carry`.
set -euo pipefail

HANDOFF="$(cd "$(dirname "$0")" && pwd)/handoff.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# mtime portable — voir la note de test-check-gate.sh : `stat -f` est du BSD, mais sur GNU
# il signifie `--file-system` et imprime des stats mouvantes (finding Codex PR #56).
if stat -c %Y . >/dev/null 2>&1; then mtime() { stat -c %Y "$1"; }   # GNU coreutils
else                                  mtime() { stat -f %m "$1"; }   # BSD / macOS
fi

cd "$TMP" && git init -q -b main repo && cd repo
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo x > a.txt && git add . && git commit -qm base

body() { # $1=n → un corps d'entrée réaliste, avec sa section Pending
  cat <<EOF
**Fait cette session :**
- **00$1** (PR #$1) — livraison numéro $1

**Pending (à ne pas perdre) :**
- report non-git numéro $1 — à traiter
EOF
}

F="$(bash "$HANDOFF" where)"
A="$(dirname "$F")/handoff.archive.md"
echo "H5 — la note vit hors du worktree, rien n'est écrit dans le dossier de travail :"
ok "where ne crée rien"                  "[ ! -e \"\$F\" ]"
body 1 | bash "$HANDOFF" add "2026-01-01 — entrée 1" >/dev/null
ok "la note est écrite sous git-common-dir/ezk/" "[ -f \"\$F\" ] && [ \"\$F\" = \"\$(cd \"\$(git rev-parse --path-format=absolute --git-common-dir)\" && pwd -P)/ezk/handoff.md\" ]"
ok "aucun .claude/ dans le worktree"     "[ ! -e .claude ]"
ok "aucun .gitignore écrit"              "[ ! -e .gitignore ]"
ok "git status reste propre"             "[ -z \"\$(git status --porcelain)\" ]"

echo "H1 — anneau FIFO : borne garantie, et rien de perdu :"
for i in 2 3 4 5; do body $i | bash "$HANDOFF" add "2026-01-0$i — entrée $i" >/dev/null; done
LIVE="$(grep -c '^## ' "$F")"
ARCH="$(grep -c '^## ' "$A")"
ok "3 entrées vivantes (KEEP par défaut)"     "[ \"\$LIVE\" = 3 ]"
ok "2 entrées archivées"                      "[ \"\$ARCH\" = 2 ]"
ok "union = 5 : aucune entrée perdue"         "[ \$(( LIVE + ARCH )) = 5 ]"
ok "la plus récente est en tête"              "grep -m1 '^## ' \"\$F\" | grep -q 'entrée 5'"
ok "les archivées sont les plus anciennes"    "grep -q 'entrée 1' \"\$A\" && grep -q 'entrée 2' \"\$A\""
ok "l'archive a un en-tête unique"            "[ \"\$(grep -c '^# Handoff — archive' \"\$A\")\" = 1 ]"
ok "le fichier vivant garde son en-tête unique" "[ \"\$(grep -c '^# Handoff' \"\$F\")\" = 1 ]"

echo "H2 — carry : la section Pending de la SEULE entrée la plus récente :"
CARRY="$(bash "$HANDOFF" carry)"
ok "contient le report de l'entrée 5"     "echo \"\$CARRY\" | grep -q 'report non-git numéro 5'"
ok "ne contient PAS celui de l'entrée 4"  "! echo \"\$CARRY\" | grep -q 'report non-git numéro 4'"
ok "ne contient pas la section « Fait »"  "! echo \"\$CARRY\" | grep -q 'Fait cette session'"
ok "borné à 40 lignes"                    "[ \"\$(echo \"\$CARRY\" | wc -l | tr -d ' ')\" -le 40 ]"
ok "carry ne modifie rien (read-only)" \
   "M1=\$(mtime \"\$F\"); bash \"\$HANDOFF\" carry >/dev/null; M2=\$(mtime \"\$F\"); [ \"\$M1\" = \"\$M2\" ] && echo \"\$M1\" | grep -qE '^[0-9]+\$'"

echo "H10 — carry saute les entrées SANS section Pending (trouvé en dogfoodant) :"
# Toutes les entrées n'ont pas de section Pending : une note courte de correction n'en a
# pas. Si `carry` s'arrêtait à la première entrée, il rendait du vide et TOUS les reports
# non-git de l'entrée précédente étaient perdus au tour suivant — dans le cas réel, deux
# décisions PO en attente sur des branches, plus une fiche reportée.
bash "$HANDOFF" add "2026-05-01 — note de correction sans section Pending" <<'EOF' >/dev/null
**Résout** un point de l'entrée précédente. Rien d'autre à signaler.
EOF
CARRY2="$(bash "$HANDOFF" carry)"
ok "carry remonte la section Pending la plus récente QUI EXISTE" \
   "echo \"\$CARRY2\" | grep -q 'report non-git numéro 5'"
ok "…et ne rend pas du vide à cause de l'entrée sans Pending" "[ -n \"\$CARRY2\" ]"
ok "il ne remonte pas AUSSI une section plus ancienne (une seule section rendue)" \
   "[ \"\$(echo \"\$CARRY2\" | grep -c '^\*\*Pending')\" = 1 ]"
ok "il ne déborde pas sur le corps de l'entrée qui la contient" \
   "! echo \"\$CARRY2\" | grep -q 'Fait cette session'"

echo "H3 — carry sur fichier absent : silencieux, exit 0 :"
mkdir -p "$TMP/vide" && cd "$TMP/vide" && git init -q -b main v && cd v
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo x > a.txt && git add . && git commit -qm base
ok "sortie vide"  "[ -z \"\$(bash \"\$HANDOFF\" carry)\" ]"
ok "exit 0"       "bash \"\$HANDOFF\" carry >/dev/null"
ok "path crée le fichier avec son en-tête" \
   "PF=\$(bash \"\$HANDOFF\" path) && [ -f \"\$PF\" ] && grep -q '^# Handoff' \"\$PF\""
cd "$TMP/repo"

echo "H4 — append-only : deux corps identiques font deux entrées :"
# Assertion en DELTA, pas en total absolu : un total codé en dur se décale dès qu'un cas
# est insété plus haut dans le fichier, et l'échec pointe alors le mauvais coupable.
total_entries() { echo $(( $(grep -c '^## ' "$F" 2>/dev/null || echo 0) \
                         + $(grep -c '^## ' "$A" 2>/dev/null || echo 0) )); }
BEFORE="$(total_entries)"
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
ok "toujours 3 vivantes (l'anneau tient)"  "[ \"\$(grep -c '^## ' \"\$F\")\" = 3 ]"
ok "les deux entrées identiques ont bien été écrites (+2, aucune fusion silencieuse)" \
   "[ \$(( \$(total_entries) - BEFORE )) = 2 ]"

echo "H6 — stationnaire : 20 ajouts de 60 lignes ne font pas grossir le fichier vivant :"
for i in $(seq 1 20); do
  { echo "**Fait cette session :**"; for j in $(seq 1 55); do echo "- ligne de contenu $j"; done
    echo "**Pending (à ne pas perdre) :**"; echo "- report $i"; } \
  | bash "$HANDOFF" add "2026-02-$(printf %02d $i) — charge $i" >/dev/null
done
L="$(wc -l < "$F" | tr -d ' ')"
ok "fichier vivant < 250 lignes (il est stationnaire, pas croissant)" "[ \"\$L\" -lt 250 ]"
ok "toujours exactement 3 entrées"     "[ \"\$(grep -c '^## ' \"\$F\")\" = 3 ]"
ok "l'archive, elle, a tout gardé (≥ 20)" "[ \"\$(grep -c '^## ' \"\$A\")\" -ge 20 ]"
ok "carry rend toujours le dernier report" "bash \"\$HANDOFF\" carry | grep -q 'report 20'"

echo "H7 — EZK_HANDOFF_KEEP est respecté :"
rm -f "$F" "$A"
for i in 1 2 3 4 5; do body $i | EZK_HANDOFF_KEEP=1 bash "$HANDOFF" add "2026-03-0$i — k$i" >/dev/null; done
ok "KEEP=1 ⇒ une seule entrée vivante"  "[ \"\$(grep -c '^## ' \"\$F\")\" = 1 ]"
ok "les 4 autres sont archivées"        "[ \"\$(grep -c '^## ' \"\$A\")\" = 4 ]"

echo "H9 — écritures CONCURRENTES : aucune entrée perdue (finding Codex PR #56) :"
# `add` est un read-modify-write. Sans verrou, deux sessions parallèles — le cas du PO,
# qui travaille en worktrees — lisent le même instantané et le dernier `mv` écrase l'entrée
# de l'autre : perte de données dans le scénario même que la persistance doit couvrir.
rm -f "$F" "$A"
for i in $(seq 1 8); do
  ( body "$i" | bash "$HANDOFF" add "2026-04-0$i — concurrent $i" >/dev/null 2>&1 ) &
done
wait
LIVE="$(grep -c '^## ' "$F" 2>/dev/null || echo 0)"
ARCH="$(grep -c '^## ' "$A" 2>/dev/null || echo 0)"
ok "8 ajouts concurrents ⇒ 8 entrées au total (vivantes + archivées)" "[ \$(( LIVE + ARCH )) = 8 ]"
ok "l'anneau tient malgré la concurrence (3 vivantes)"                "[ \"\$LIVE\" = 3 ]"
ok "chaque entrée est intacte et distincte" \
   "[ \"\$(cat \"\$F\" \"\$A\" | grep -c 'concurrent ')\" = 8 ]"
ok "aucun verrou laissé derrière" \
   "[ ! -d \"\$(git rev-parse --git-common-dir)/ezk-handoff.lock\" ]"

echo "H8 — refus des entrées vides et des verbes inconnus :"
ok "corps vide ⇒ exit 2, rien écrit"   "! printf '   \n' | bash \"\$HANDOFF\" add 'titre' >/dev/null 2>&1"
ok "titre manquant ⇒ exit 2"           "! echo corps | bash \"\$HANDOFF\" add >/dev/null 2>&1"
ok "verbe inconnu ⇒ exit 2"            "! bash \"\$HANDOFF\" nawak >/dev/null 2>&1"
ok "help n'écrit rien"                 "bash \"\$HANDOFF\" help | grep -q 'RANGEUR'"

# ── fiche 0189 : le handoff doit survivre à une session éphémère ──────────────────────
cd "$TMP" && git init -q -b main repo2 && cd repo2
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p .claude && echo '{}' > .claude/settings.json
echo x > a.txt && git add . && git commit -qm base

echo "H12 — durable : une copie versionnée, jamais écrasée :"
P1="$(body 7 | bash "$HANDOFF" durable "2026-10-01 — clôture cloud")"
ok "écrite sous docs/sessions/"                 "case \"\$P1\" in */docs/sessions/*-handoff-*.md) true ;; *) false ;; esac"
ok "porte le titre et le corps"                 "grep -q 'clôture cloud' \"\$P1\" && grep -q 'report non-git numéro 7' \"\$P1\""
ok "n'est PAS ignorée (elle est faite pour être commitée)" "! git check-ignore -q \"\$P1\""
P2="$(body 8 | bash "$HANDOFF" durable "2026-10-01 — clôture cloud")"
ok "un 2ᵉ appel le même jour n'écrase rien"     "[ \"\$P2\" != \"\$P1\" ] && [ -f \"\$P1\" ] && [ -f \"\$P2\" ]"
ok "l'ordre des noms est l'ordre du temps"      "[ \"\$(printf '%s\n%s\n' \"\$P1\" \"\$P2\" | sort | tail -1)\" = \"\$P2\" ]"
ok "corps vide ⇒ exit 2"                        "! printf '  \n' | bash \"\$HANDOFF\" durable 'titre' >/dev/null 2>&1"
ok "titre manquant ⇒ exit 2"                    "! echo corps | bash \"\$HANDOFF\" durable >/dev/null 2>&1"

echo "H13 — la note survit à un nouveau clone (conteneur jetable) :"
git add docs/sessions && git commit -qm "handoff durable"
cd "$TMP" && git clone -q repo2 clone2 && cd clone2
ok "le clone n'a pas la note locale"            "[ ! -f \"\$(bash \"\$HANDOFF\" where)\" ]"
CARRIED="$(bash "$HANDOFF" carry)"
ok "carry relit le Pending de la copie la plus récente" "echo \"\$CARRIED\" | grep -q 'report non-git numéro 8'"
ok "sans copie versionnée ni note locale : rien, sans erreur" \
   "cd \"\$TMP\" && git init -q -b main vide && cd vide && [ -z \"\$(bash \"\$HANDOFF\" carry)\" ]"

echo "H14 — mode local inchangé : la plus récente des deux sources gagne :"
cd "$TMP/repo2"
touch -t 202601010000 docs/sessions/*-handoff-*.md
body 9 | bash "$HANDOFF" add "2026-10-02 — note locale" >/dev/null
ok "note locale plus récente : carry lit la note locale" "bash \"\$HANDOFF\" carry | grep -q 'numéro 9'"
touch -t 203001010000 docs/sessions/*-handoff-*.md
ok "copie versionnée plus récente : carry lit la copie" "bash \"\$HANDOFF\" carry | grep -q 'numéro 8'"

echo "H16 — durable : jamais d'écrasement, même avec plusieurs processus à la fois :"
cd "$TMP/repo2"
for i in 1 2 3 4 5 6; do ( body "$i" | bash "$HANDOFF" durable "meme titre concurrent" >/dev/null 2>&1 ) & done
wait
ok "6 appels simultanés, 6 fichiers distincts" \
   "[ \"\$(ls docs/sessions/*-handoff-*-meme-titre-concurrent.md 2>/dev/null | wc -l | tr -d ' ')\" = 6 ]"
ok "chaque fichier porte son propre corps" \
   "[ \"\$(cat docs/sessions/*-handoff-*-meme-titre-concurrent.md | grep -c 'report non-git numéro')\" = 6 ]"

# ── fiche 20261003105820077 : la note survit à la suppression d'un worktree d'app ─────────
cd "$TMP" && git init -q -b main wt && cd wt
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo x > a.txt && git add . && git commit -qm base
git worktree add -q "$TMP/wt-a" -b a && git worktree add -q "$TMP/wt-b" -b b
COMMON_EXPECTED="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)/ezk/handoff.md"

echo "H17 — path rend le même chemin commun, du dossier principal comme d'un worktree :"
ok "depuis le dossier principal" "[ \"\$(bash \"\$HANDOFF\" path)\" = \"\$COMMON_EXPECTED\" ]"
ok "depuis un worktree"          "[ \"\$(cd \"\$TMP/wt-a\" && bash \"\$HANDOFF\" path)\" = \"\$COMMON_EXPECTED\" ]"

echo "H18 — une note écrite depuis un worktree survit à sa suppression forcée :"
( cd "$TMP/wt-a" && body 31 | bash "$HANDOFF" add "2026-10-04 — depuis wt-a" >/dev/null )
echo sale > "$TMP/wt-a/non-valide.txt"          # l'app supprime un worktree qui porte des fichiers non validés
git worktree remove --force "$TMP/wt-a"
ok "le worktree a bien disparu"               "[ ! -d \"\$TMP/wt-a\" ]"
ok "carry la relit depuis un autre worktree"  "(cd \"\$TMP/wt-b\" && bash \"\$HANDOFF\" carry) | grep -q 'report non-git numéro 31'"

echo "H19 — l'ancienne note du worktree est reprise une fois, puis ignorée :"
mkdir -p "$TMP/wt-b/.claude"
{ echo "# Handoff — ancien"; echo; echo "## 2026-09-21 — ancienne entrée"; echo
  echo "**Pending (à ne pas perdre) :**"; echo "- report hérité de l'ancien lieu"; } > "$TMP/wt-b/.claude/handoff.md"
( cd "$TMP/wt-b" && body 32 | bash "$HANDOFF" add "2026-10-04 — depuis wt-b" >/dev/null 2>&1 )
COUNT_OLD() { cat "$COMMON_EXPECTED" "$(dirname "$COMMON_EXPECTED")/handoff.archive.md" 2>/dev/null | grep -c 'ancienne entrée'; }
ok "l'ancienne entrée est reprise dans la note commune" "[ \"\$(COUNT_OLD)\" = 1 ]"
( cd "$TMP/wt-b" && body 33 | bash "$HANDOFF" add "2026-10-04 — encore wt-b" >/dev/null 2>&1 )
ok "un 2ᵉ add ne la reprend pas une 2ᵉ fois"           "[ \"\$(COUNT_OLD)\" = 1 ]"
git worktree add -q "$TMP/wt-c" -b c
mkdir -p "$TMP/wt-c/.claude" && cp "$TMP/wt-b/.claude/handoff.md" "$TMP/wt-c/.claude/handoff.md"   # la copie que l'app pose
( cd "$TMP/wt-c" && body 34 | bash "$HANDOFF" add "2026-10-04 — depuis wt-c" >/dev/null 2>&1 )
ok "la même copie dans un worktree neuf n'est pas reprise" "[ \"\$(COUNT_OLD)\" = 1 ]"

echo "H20 — la copie posée dans un worktree neuf ne masque jamais la note commune :"
git worktree add -q "$TMP/wt-d" -b d
mkdir -p "$TMP/wt-d/.claude" && cp "$TMP/wt-b/.claude/handoff.md" "$TMP/wt-d/.claude/handoff.md"
touch -t 203001010000 "$TMP/wt-d/.claude/handoff.md"   # même plus récente, elle ne gagne pas
ok "carry lit la note commune, pas la copie périmée" \
   "(cd \"\$TMP/wt-d\" && bash \"\$HANDOFF\" carry) | grep -q 'report non-git numéro 34'"
ok "dépôt jamais repris : carry lit encore l'ancien lieu" \
   "cd \"\$TMP\" && git init -q -b main ancien && mkdir -p ancien/.claude && cp \"\$TMP/wt-b/.claude/handoff.md\" ancien/.claude/ && cd ancien && bash \"\$HANDOFF\" carry | grep -q 'report hérité'"

echo "H21 — deux copies divergentes de l'ancienne note : chaque entrée n'est reprise qu'une fois :"
cd "$TMP/wt"
git worktree add -q "$TMP/wt-e" -b e && git worktree add -q "$TMP/wt-f" -b f
mkdir -p "$TMP/wt-e/.claude" "$TMP/wt-f/.claude"
{ echo "# Handoff"; echo; echo "## 2026-08-01 — commune E1"; echo; echo "- corps E1"; } > "$TMP/wt-e/.claude/handoff.md"
{ echo "# Handoff"; echo; echo "## 2026-08-02 — E2"; echo; echo "- corps E2"; echo
  echo "## 2026-08-01 — commune E1"; echo; echo "- corps E1"; echo; } > "$TMP/wt-f/.claude/handoff.md"
( cd "$TMP/wt-e" && body 41 | bash "$HANDOFF" add "2026-10-05 — depuis wt-e" >/dev/null 2>&1 )
( cd "$TMP/wt-f" && body 42 | bash "$HANDOFF" add "2026-10-05 — depuis wt-f" >/dev/null 2>&1 )
COUNT_E1() { cat "$COMMON_EXPECTED" "$(dirname "$COMMON_EXPECTED")/handoff.archive.md" | grep -c 'commune E1'; }
ok "E1, dernière d'une copie et au milieu de l'autre, n'est reprise qu'une fois" "[ \"\$(COUNT_E1)\" = 1 ]"

echo "H22 — une ancienne note plus récente que la note commune reste visible :"
git worktree add -q "$TMP/wt-g" -b g
mkdir -p "$TMP/wt-g/.claude"
{ echo "# Handoff"; echo; echo "## 2030-01-01 — écrite avant la bascule"; echo
  echo "**Pending (à ne pas perdre) :**"; echo "- report du worktree non repris"; } > "$TMP/wt-g/.claude/handoff.md"
ok "legacy la signale tant qu'elle n'est pas reprise" "(cd \"\$TMP/wt-g\" && bash \"\$HANDOFF\" legacy) | grep -q 'wt-g/.claude/handoff.md'"
ok "carry rend son Pending avant la reprise"           "(cd \"\$TMP/wt-g\" && bash \"\$HANDOFF\" carry) | grep -q 'report du worktree non repris'"
( cd "$TMP/wt-g" && bash "$HANDOFF" add "2026-10-06 — sans Pending" >/dev/null 2>&1 <<<"Note courte." )
ok "après add, elle est en tête des entrées reprises, pas enterrée en archive" \
   "grep -q 'écrite avant la bascule' \"\$COMMON_EXPECTED\""
ok "carry rend toujours son Pending"                   "(cd \"\$TMP/wt-g\" && bash \"\$HANDOFF\" carry) | grep -q 'report du worktree non repris'"
ok "legacy ne la signale plus"                         "[ -z \"\$(cd \"\$TMP/wt-g\" && bash \"\$HANDOFF\" legacy)\" ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-handoff: TOUT VERT"; else echo "test-handoff: ÉCHECS"; exit 1; fi
