#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — l'anneau FIFO du handoff.
#
# Ce que ces cas verrouillent :
#   H1  la borne est GARANTIE (elle ne dépend d'aucun événement externe) ET rien n'est
#       perdu : entrées vivantes + archivées = tout ce qui a été écrit ;
#   H2  `carry` rend une section bornée, pas le fichier — c'est ce qui supprime les
#       deux lectures de 20 Ko par run ;
#   H5  `.gitignore` est garanti AVANT la première écriture (éphémère personnel).
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

echo "H5 — .gitignore garanti AVANT la première écriture :"
ok ".claude/ n'est pas encore ignoré"  "! git check-ignore -q .claude/handoff.md"
body 1 | bash "$HANDOFF" add "2026-01-01 — entrée 1" >/dev/null
ok ".claude/ est désormais ignoré"     "git check-ignore -q .claude/handoff.md"
ok "le fichier n'est pas suivi par git" "[ -z \"\$(git status --porcelain .claude 2>/dev/null)\" ]"

echo "H1 — anneau FIFO : borne garantie, et rien de perdu :"
for i in 2 3 4 5; do body $i | bash "$HANDOFF" add "2026-01-0$i — entrée $i" >/dev/null; done
LIVE="$(grep -c '^## ' .claude/handoff.md)"
ARCH="$(grep -c '^## ' .claude/handoff.archive.md)"
ok "3 entrées vivantes (KEEP par défaut)"     "[ \"\$LIVE\" = 3 ]"
ok "2 entrées archivées"                      "[ \"\$ARCH\" = 2 ]"
ok "union = 5 : aucune entrée perdue"         "[ \$(( LIVE + ARCH )) = 5 ]"
ok "la plus récente est en tête"              "grep -m1 '^## ' .claude/handoff.md | grep -q 'entrée 5'"
ok "les archivées sont les plus anciennes"    "grep -q 'entrée 1' .claude/handoff.archive.md && grep -q 'entrée 2' .claude/handoff.archive.md"
ok "l'archive a un en-tête unique"            "[ \"\$(grep -c '^# Handoff — archive' .claude/handoff.archive.md)\" = 1 ]"
ok "le fichier vivant garde son en-tête unique" "[ \"\$(grep -c '^# Handoff' .claude/handoff.md)\" = 1 ]"

echo "H2 — carry : la section Pending de la SEULE entrée la plus récente :"
CARRY="$(bash "$HANDOFF" carry)"
ok "contient le report de l'entrée 5"     "echo \"\$CARRY\" | grep -q 'report non-git numéro 5'"
ok "ne contient PAS celui de l'entrée 4"  "! echo \"\$CARRY\" | grep -q 'report non-git numéro 4'"
ok "ne contient pas la section « Fait »"  "! echo \"\$CARRY\" | grep -q 'Fait cette session'"
ok "borné à 40 lignes"                    "[ \"\$(echo \"\$CARRY\" | wc -l | tr -d ' ')\" -le 40 ]"
ok "carry ne modifie rien (read-only)" \
   "M1=\$(mtime .claude/handoff.md); bash \"\$HANDOFF\" carry >/dev/null; M2=\$(mtime .claude/handoff.md); [ \"\$M1\" = \"\$M2\" ] && echo \"\$M1\" | grep -qE '^[0-9]+\$'"

echo "H3 — carry sur fichier absent : silencieux, exit 0 :"
mkdir -p "$TMP/vide" && cd "$TMP/vide" && git init -q -b main v && cd v
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo x > a.txt && git add . && git commit -qm base
ok "sortie vide"  "[ -z \"\$(bash \"\$HANDOFF\" carry)\" ]"
ok "exit 0"       "bash \"\$HANDOFF\" carry >/dev/null"
ok "path crée le fichier avec son en-tête" \
   "F=\$(bash \"\$HANDOFF\" path) && [ -f \"\$F\" ] && grep -q '^# Handoff' \"\$F\""
cd "$TMP/repo"

echo "H4 — append-only : deux corps identiques font deux entrées :"
BEFORE="$(grep -c '^## ' .claude/handoff.md)"
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
ok "toujours 3 vivantes (l'anneau tient)"  "[ \"\$(grep -c '^## ' .claude/handoff.md)\" = 3 ]"
ok "les deux ont bien été écrites (archive à 4)" "[ \"\$(grep -c '^## ' .claude/handoff.archive.md)\" = 4 ]"

echo "H6 — stationnaire : 20 ajouts de 60 lignes ne font pas grossir le fichier vivant :"
for i in $(seq 1 20); do
  { echo "**Fait cette session :**"; for j in $(seq 1 55); do echo "- ligne de contenu $j"; done
    echo "**Pending (à ne pas perdre) :**"; echo "- report $i"; } \
  | bash "$HANDOFF" add "2026-02-$(printf %02d $i) — charge $i" >/dev/null
done
L="$(wc -l < .claude/handoff.md | tr -d ' ')"
ok "fichier vivant < 250 lignes (il est stationnaire, pas croissant)" "[ \"\$L\" -lt 250 ]"
ok "toujours exactement 3 entrées"     "[ \"\$(grep -c '^## ' .claude/handoff.md)\" = 3 ]"
ok "l'archive, elle, a tout gardé (≥ 20)" "[ \"\$(grep -c '^## ' .claude/handoff.archive.md)\" -ge 20 ]"
ok "carry rend toujours le dernier report" "bash \"\$HANDOFF\" carry | grep -q 'report 20'"

echo "H7 — EZK_HANDOFF_KEEP est respecté :"
rm -f .claude/handoff.md .claude/handoff.archive.md
for i in 1 2 3 4 5; do body $i | EZK_HANDOFF_KEEP=1 bash "$HANDOFF" add "2026-03-0$i — k$i" >/dev/null; done
ok "KEEP=1 ⇒ une seule entrée vivante"  "[ \"\$(grep -c '^## ' .claude/handoff.md)\" = 1 ]"
ok "les 4 autres sont archivées"        "[ \"\$(grep -c '^## ' .claude/handoff.archive.md)\" = 4 ]"

echo "H9 — écritures CONCURRENTES : aucune entrée perdue (finding Codex PR #56) :"
# `add` est un read-modify-write. Sans verrou, deux sessions parallèles — le cas du PO,
# qui travaille en worktrees — lisent le même instantané et le dernier `mv` écrase l'entrée
# de l'autre : perte de données dans le scénario même que la persistance doit couvrir.
rm -f .claude/handoff.md .claude/handoff.archive.md
for i in $(seq 1 8); do
  ( body "$i" | bash "$HANDOFF" add "2026-04-0$i — concurrent $i" >/dev/null 2>&1 ) &
done
wait
LIVE="$(grep -c '^## ' .claude/handoff.md 2>/dev/null || echo 0)"
ARCH="$(grep -c '^## ' .claude/handoff.archive.md 2>/dev/null || echo 0)"
ok "8 ajouts concurrents ⇒ 8 entrées au total (vivantes + archivées)" "[ \$(( LIVE + ARCH )) = 8 ]"
ok "l'anneau tient malgré la concurrence (3 vivantes)"                "[ \"\$LIVE\" = 3 ]"
ok "chaque entrée est intacte et distincte" \
   "[ \"\$(cat .claude/handoff.md .claude/handoff.archive.md | grep -c 'concurrent ')\" = 8 ]"
ok "aucun verrou laissé derrière" \
   "[ ! -d \"\$(git rev-parse --git-common-dir)/ezk-handoff.lock\" ]"

echo "H8 — refus des entrées vides et des verbes inconnus :"
ok "corps vide ⇒ exit 2, rien écrit"   "! printf '   \n' | bash \"\$HANDOFF\" add 'titre' >/dev/null 2>&1"
ok "titre manquant ⇒ exit 2"           "! echo corps | bash \"\$HANDOFF\" add >/dev/null 2>&1"
ok "verbe inconnu ⇒ exit 2"            "! bash \"\$HANDOFF\" nawak >/dev/null 2>&1"
ok "help n'écrit rien"                 "bash \"\$HANDOFF\" help | grep -q 'RANGEUR'"

echo
if [ "$FAIL" = 0 ]; then echo "test-handoff: TOUT VERT"; else echo "test-handoff: ÉCHECS"; exit 1; fi
