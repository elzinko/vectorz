#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — l'anneau FIFO du handoff.
#
# Ce que ces cas verrouillent :
#   H1  la borne est GARANTIE (elle ne dépend d'aucun événement externe) ET rien n'est
#       perdu : entrées vivantes + archivées = tout ce qui a été écrit ;
#   H2  `carry` rend une section bornée, pas le fichier — c'est ce qui supprime les
#       deux lectures de 20 Ko par run ;
#   H5  `.gitignore` est garanti AVANT la première écriture (éphémère personnel).
#   H11-H14 (fiche 0189, session jetable) : `.claude/` n'est plus ignoré en entier, `durable`
#       écrit une copie versionnée, elle survit à un nouveau clone, et la source la plus
#       récente gagne (le mode local ne change pas).
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
   "F=\$(bash \"\$HANDOFF\" path) && [ -f \"\$F\" ] && grep -q '^# Handoff' \"\$F\""
cd "$TMP/repo"

echo "H4 — append-only : deux corps identiques font deux entrées :"
# Assertion en DELTA, pas en total absolu : un total codé en dur se décale dès qu'un cas
# est insété plus haut dans le fichier, et l'échec pointe alors le mauvais coupable.
total_entries() { echo $(( $(grep -c '^## ' .claude/handoff.md 2>/dev/null || echo 0) \
                         + $(grep -c '^## ' .claude/handoff.archive.md 2>/dev/null || echo 0) )); }
BEFORE="$(total_entries)"
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
body 9 | bash "$HANDOFF" add "2026-01-09 — doublon" >/dev/null
ok "toujours 3 vivantes (l'anneau tient)"  "[ \"\$(grep -c '^## ' .claude/handoff.md)\" = 3 ]"
ok "les deux entrées identiques ont bien été écrites (+2, aucune fusion silencieuse)" \
   "[ \$(( \$(total_entries) - BEFORE )) = 2 ]"

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

# ── fiche 0189 : le handoff doit survivre à une session éphémère ──────────────────────
cd "$TMP" && git init -q -b main repo2 && cd repo2
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p .claude && echo '{}' > .claude/settings.json
echo x > a.txt && git add . && git commit -qm base

echo "H11 — .claude/ n'est plus ignoré en entier (il peut être versionné) :"
body 1 | bash "$HANDOFF" add "2026-01-01 — entrée 1" >/dev/null
ok "handoff.md est ignoré"                      "git check-ignore -q .claude/handoff.md"
ok "handoff.archive.md est ignoré"              "git check-ignore -q .claude/handoff.archive.md"
ok ".claude/settings.json reste versionnable"   "! git check-ignore -q .claude/settings.json"
ok ".gitignore ne contient pas « .claude/ » seul" "! grep -qxE '\\.claude/?' .gitignore"

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
ok "le clone n'a pas la note locale"            "[ ! -f .claude/handoff.md ]"
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

echo "H15 — l'ancienne entrée « .claude/ » de la méthode est migrée, celle du projet reste :"
cd "$TMP" && git init -q -b main repo3 && cd repo3
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p .claude && echo '{}' > .claude/settings.json
printf '# note de handoff ezk-archive — éphémère personnel, jamais committée\n.claude/\n' > .gitignore
echo x > a.txt && git add -f .gitignore a.txt .claude/settings.json && git commit -qm base
body 1 | bash "$HANDOFF" add "2026-01-01 — entrée 1" >/dev/null 2>&1
ok ".claude/settings.json n'est plus ignoré"         "! git check-ignore -q .claude/settings.json"
ok "handoff.md reste ignoré"                         "git check-ignore -q .claude/handoff.md"
ok "plus de « .claude/ » seul dans .gitignore"       "! grep -qxE '\\.claude/?' .gitignore"
cd "$TMP" && git init -q -b main repo4 && cd repo4
git config user.email t@t && git config user.name t && git config commit.gpgsign false
printf '.claude/\n' > .gitignore          # posé par le projet, sans le commentaire de la méthode
echo x > a.txt && git add .gitignore a.txt && git commit -qm base
body 1 | bash "$HANDOFF" add "2026-01-01 — entrée 1" >/dev/null 2>&1
ok "une entrée « .claude/ » du projet reste en place" "grep -qxF '.claude/' .gitignore"

echo "H16 — durable : jamais d'écrasement, même avec plusieurs processus à la fois :"
cd "$TMP/repo2"
for i in 1 2 3 4 5 6; do ( body "$i" | bash "$HANDOFF" durable "meme titre concurrent" >/dev/null 2>&1 ) & done
wait
ok "6 appels simultanés, 6 fichiers distincts" \
   "[ \"\$(ls docs/sessions/*-handoff-*-meme-titre-concurrent.md 2>/dev/null | wc -l | tr -d ' ')\" = 6 ]"
ok "chaque fichier porte son propre corps" \
   "[ \"\$(cat docs/sessions/*-handoff-*-meme-titre-concurrent.md | grep -c 'report non-git numéro')\" = 6 ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-handoff: TOUT VERT"; else echo "test-handoff: ÉCHECS"; exit 1; fi
