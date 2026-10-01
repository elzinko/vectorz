#!/usr/bin/env bash
# DoD exécutable de la fiche 20260904091853974 — teste journal-add.sh (journal des difficultés,
# artefact INDÉPENDANT : écrit pendant le dev, hors SPRINT.md, un fichier par session, tagué par
# fiche) sur fixtures jetables. Calqué sur test-ezk-chef-extract.sh.
# Cas : A entrée basique (fichier durable, format, indépendance du labo) · B 2ᵉ entrée même session
# (même fichier) · C deux sessions = deux fichiers (parallélisme) · D lecture par feature (grep) ·
# E refus nets (id non numérique, argument vide ou manquant) · F retours à la ligne aplatis ·
# G slug hostile assaini (pas d'évasion du dossier) · H branche détachée / hors dépôt git ·
# I deux noms qui s'assainissent pareil (feat/x, feat-x) restent deux fichiers.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/journal-add.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# Dépôt git jetable dont la branche (même non née) porte un nom donné.
fixture_repo() { # $1=dir $2=branche
  mkdir -p "$1"
  git -C "$1" init -q
  git -C "$1" symbolic-ref HEAD "refs/heads/$2"
}

ID="20260930000000301"
AUTRE="20260930000000302"

# ── Cas A : une entrée → fichier durable docs/journal/<date>-<branche>.md, hors SPRINT.md ────
A="$TMP/a"
fixture_repo "$A" "feat/x-1"
out_a="$(cd "$A" && "$SCRIPT" "$ID" "Root Directory oublié" "le déploiement servait un 404" "renseigner le sous-dossier dans les réglages" "le monorepo n'a pas de racine web")"
file_a="$A/$out_a"
echo "Cas A (entrée basique) :"
check "chemin imprimé = docs/journal/<date>-feat-x-1-<condensat>.md" "[[ '$out_a' =~ ^docs/journal/[0-9]{4}-[0-9]{2}-[0-9]{2}-feat-x-1-[0-9a-f]{8}\.md\$ ]]"
check "fichier durable créé"                    "test -s '$file_a'"
check "en-tête du journal (nom d'origine)"      "head -1 '$file_a' | grep -q '^# Journal des difficultés — feat/x-1\$'"
check "titre taggé par fiche"                   "grep -q '^## \[$ID\] Root Directory oublié\$' '$file_a'"
check "puce Coincé"                             "grep -q '^- \*\*Coincé\*\* : le déploiement servait un 404\$' '$file_a'"
check "puce Réglé"                              "grep -q '^- \*\*Réglé\*\* : renseigner le sous-dossier dans les réglages\$' '$file_a'"
check "puce Pourquoi (facultative, fournie)"    "grep -q '^- \*\*Pourquoi\*\* : le monorepo n.a pas de racine web\$' '$file_a'"
check "aucun SPRINT.md touché ni créé"          "! test -e '$A/SPRINT.md'"
check "indépendance : aucun recipes/ requis"    "! test -e '$A/recipes'"

# ── Cas B : 2ᵉ entrée, même session → MÊME fichier, en-tête une seule fois ────────────────────
out_b="$(cd "$A" && "$SCRIPT" "$ID" "Seconde galère" "le DNS ne répondait pas" "attendre la propagation")"
echo "Cas B (2ᵉ entrée, même session) :"
check "même fichier que l'entrée A"             "[[ '$out_b' == '$out_a' ]]"
check "deux entrées dans le fichier"            "[[ \$(grep -c '^## \[' '$file_a') == 2 ]]"
check "en-tête présent une seule fois"          "[[ \$(grep -c '^# Journal des difficultés' '$file_a') == 1 ]]"
check "sans « pourquoi » : pas de puce Pourquoi vide" \
  "! awk '/^## \[$ID\] Seconde galère/{p=1;next} /^## /{p=0} p' '$file_a' | grep -q 'Pourquoi'"

# ── Cas C : deux sessions (deux branches) en parallèle → DEUX fichiers distincts ───────────────
out_c="$(cd "$A" && "$SCRIPT" --slug autre-session "$AUTRE" "Galère d'une autre session" "x" "y")"
B2="$TMP/a2"
fixture_repo "$B2" "feat/y-2"
out_c2="$(cd "$B2" && "$SCRIPT" "$ID" "Même fiche, autre worktree" "x" "y")"
echo "Cas C (parallélisme) :"
check "--slug explicite → fichier distinct"     "[[ '$out_c' != '$out_a' && '$out_c' == *autre-session.md ]]"
check "autre branche → autre fichier"           "[[ '$out_c2' == *feat-y-2-*.md ]]"
check "le fichier de la session A est inchangé" "[[ \$(grep -c '^## \[' '$file_a') == 2 ]]"

# ── Cas D : lecture par feature — « une capture, deux lectures » ───────────────────────────────
echo "Cas D (lecture par feature) :"
check "grep -rl <id> rend le fichier de la session" "grep -rl '$ID' '$A/docs/journal/' | grep -q 'feat-x-1-'"
check "grep -rl d'un autre id ne rend pas feat-x-1" "! grep -rl '$AUTRE' '$A/docs/journal/' | grep -q 'feat-x-1-'"
check "grep -A4 sort les 3 puces de l'entrée" \
  "[[ \$(grep -h -A4 '^## \[$ID\] Root Directory' '$file_a' | grep -c '^- \*\*') == 3 ]]"

# ── Cas E : refus nets, rien d'écrit ───────────────────────────────────────────────────────────
E="$TMP/e"
fixture_repo "$E" "feat/e"
echo "Cas E (refus nets) :"
check "id non numérique refusé"        "! (cd '$E' && '$SCRIPT' abc 't' 'c' 'r' 2>/dev/null)"
check "titre vide refusé"              "! (cd '$E' && '$SCRIPT' $ID '' 'c' 'r' 2>/dev/null)"
check "« coincé » vide refusé"         "! (cd '$E' && '$SCRIPT' $ID 't' '   ' 'r' 2>/dev/null)"
check "argument manquant refusé"       "! (cd '$E' && '$SCRIPT' $ID 't' 'c' 2>/dev/null)"
check "option inconnue refusée"        "! (cd '$E' && '$SCRIPT' --nope $ID 't' 'c' 'r' 2>/dev/null)"
check "aucun fichier créé par les refus" "! ls '$E/docs/journal'/*.md >/dev/null 2>&1"

# ── Cas F : retours à la ligne aplatis → une puce = une ligne ─────────────────────────────────
F="$TMP/f"
fixture_repo "$F" "feat/f"
TAB="$(printf '\t')"
out_f="$(cd "$F" && "$SCRIPT" "$ID" $'Titre\nsur deux lignes' $'coincé ligne 1\nligne 2' "réglé${TAB}avec tabulation")"
echo "Cas F (retours à la ligne, tabulations) :"
check "titre aplati sur une ligne"     "grep -q '^## \[$ID\] Titre sur deux lignes\$' '$F/$out_f'"
check "puce aplatie sur une ligne"     "grep -q '^- \*\*Coincé\*\* : coincé ligne 1 ligne 2\$' '$F/$out_f'"
check "tabulation aplatie en espace"   "grep -q '^- \*\*Réglé\*\* : réglé avec tabulation\$' '$F/$out_f'"
check "aucune tabulation dans le fichier" "! grep -q '$TAB' '$F/$out_f'"

# ── Cas G : slug hostile assaini — le fichier reste DANS docs/journal ────────────────────────
G="$TMP/g"
fixture_repo "$G" "feat/g"
out_g="$(cd "$G" && "$SCRIPT" --slug '../evil slug' "$ID" "t" "c" "r")"
echo "Cas G (slug hostile) :"
check "fichier sous docs/journal/ et nom assaini" "[[ '$out_g' =~ ^docs/journal/[0-9]{4}-[0-9]{2}-[0-9]{2}-evil-slug-[0-9a-f]{8}\.md\$ ]]"
check "rien écrit hors du dossier journal"        "! test -e '$G/evil slug.md' && ! test -e '$TMP/evil slug.md'"

# ── Cas H : branche détachée et dossier hors dépôt git → slug « session » ──────────────────────
H="$TMP/h"
fixture_repo "$H" "feat/h"
git -C "$H" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
git -C "$H" checkout -q --detach
out_h="$(cd "$H" && "$SCRIPT" "$ID" "t" "c" "r")"
NOGIT="$TMP/nogit"
mkdir -p "$NOGIT"
out_h2="$("$SCRIPT" --root "$NOGIT" "$ID" "t" "c" "r")"
echo "Cas H (HEAD détaché, hors dépôt) :"
check "HEAD détaché → slug « session »"  "[[ '$out_h' == *-session.md ]]"
check "hors dépôt git avec --root → slug « session »" "[[ '$out_h2' == *-session.md && -s '$NOGIT/$out_h2' ]]"

# ── Cas I : deux noms qui s'assainissent pareil → deux fichiers (retour Codex, PR #290) ─────────
# feat/x et feat-x donneraient le même fichier daté si on se contentait de remplacer les
# caractères : deux worktrees du même jour recréeraient le conflit add/add que le journal évite.
I="$TMP/i"
fixture_repo "$I" "feat/i"
out_i1="$(cd "$I" && "$SCRIPT" --slug 'feat/x' "$ID" "t" "c" "r")"
out_i2="$(cd "$I" && "$SCRIPT" --slug 'feat-x' "$ID" "t" "c" "r")"
out_i3="$(cd "$I" && "$SCRIPT" --slug 'feat x' "$ID" "t" "c" "r")"
out_i4="$(cd "$I" && "$SCRIPT" --slug 'feat/x' "$ID" "t2" "c" "r")"
echo "Cas I (noms qui s'assainissent pareil) :"
check "feat/x et feat-x donnent deux fichiers"         "[[ '$out_i1' != '$out_i2' ]]"
check "feat/x et « feat x » donnent deux fichiers"     "[[ '$out_i1' != '$out_i3' ]]"
check "un nom déjà propre garde son nom lisible"       "[[ '$out_i2' =~ -feat-x\.md\$ ]]"
check "le même nom d'origine retombe sur son fichier"  "[[ '$out_i4' == '$out_i1' ]]"

if [ "$FAIL" = 0 ]; then echo 'test-journal-add: TOUT VERT'; else echo 'test-journal-add: ÉCHECS' >&2; exit 1; fi
