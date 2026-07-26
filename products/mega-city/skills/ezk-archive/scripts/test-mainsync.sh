#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — la garde anti-faux-positif `main` vs `origin/main`.
#
# LE cas à empêcher, c'est M3. Deux fois en deux jours (2026-07-24 et 2026-07-25), la
# clôture a rapporté « main local diverge RÉELLEMENT d'origin/main, NE PAS resync » —
# deux fois à tort, chaque réfutation coûtant ~6 commandes de plus. Cause : sur un dépôt
# 100 % squash-merge, une ref livrée diverge TEXTUELLEMENT par construction ; « diverge »
# et « a du contenu unique » sont deux choses différentes.
#
# La garde applique à `main` le test de contenu déjà écrit et déjà testé pour les
# branches (classify_ref, fiche 0076) : ce n'est pas un algorithme neuf, c'est un 2ᵉ appel.
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# Chaque cas a son propre dépôt : l'isolation évite qu'un cas pollue le suivant.
mk() { # $1=nom → crée $TMP/$1/{origin.git,work} et cd dans work
  local n="$1"
  mkdir -p "$TMP/$n" && cd "$TMP/$n"
  # `-b main` explicite : sans lui, le bare hérite de `init.defaultBranch` de la MACHINE
  # (« master » par défaut, notamment sur les runners GitHub), son HEAD pointe une ref qui
  # ne naîtra jamais, et le clone final ne sort aucune branche — la fixture teste alors
  # un repo sans `main` et tous les cas tombent en MAINSYNC: NA. Le test doit être
  # hermétique : il ne lit AUCUNE config git globale (cf. le commentaire de ci.yml).
  git init -q --bare -b main origin.git
  git clone -q origin.git seed 2>/dev/null && cd seed   # 2>/dev/null : « cloned an empty repository »
  git config user.email t@t && git config user.name t && git config commit.gpgsign false
  printf 'base\n' > a.txt && git add . && git commit -qm "base"
  git push -q origin HEAD:main && cd .. && rm -rf seed
  git clone -q origin.git work && cd work
  git config user.email t@t && git config user.name t && git config commit.gpgsign false
}
# Simule ce qui se passe « de l'autre côté » (la PR squash-mergée sur GitHub).
upstream() { # $1=contenu de a.txt  $2=message
  local d; d="$(mktemp -d)"
  git clone -q "$TMP/$CASE/origin.git" "$d/u" >/dev/null 2>&1
  ( cd "$d/u" && git config user.email t@t && git config user.name t && git config commit.gpgsign false
    printf '%s' "$1" > a.txt && git commit -qam "$2" && git push -q origin HEAD:main )
  rm -rf "$d"
}

echo "M1 — à jour :"
CASE=m1; mk m1
git fetch -q origin
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "MAINSYNC: IN_SYNC ahead=0 behind=0" "echo \"\$OUT\" | grep -q '^MAINSYNC: IN_SYNC ahead=0 behind=0'"
ok "VERDICT: CLEAN"                     "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"

echo "M2 — origin a avancé, rien en local : EN RETARD, jamais « diverge » :"
CASE=m2; mk m2
upstream $'base\nupstream\n' "chore: origin avance seul"
git fetch -q origin
OUT="$(bash "$CHECK" --gate --shipped none)"
FULL="$(bash "$CHECK" --full --shipped none)"
ok "MAINSYNC: BEHIND ahead=0"            "echo \"\$OUT\" | grep -q '^MAINSYNC: BEHIND ahead=0 behind=1'"
ok "VERDICT reste CLEAN (rien de local à perdre)" "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"
ok "le mot « diverge » est ABSENT du rapport"     "! echo \"\$FULL\" | grep -qi 'diverge'"

echo "M3 — ⚠ LE FAUX POSITIF : contenu local livré par squash, PUIS origin ré-évolue :"
CASE=m3; mk m3
printf 'base\nligne1\n' > a.txt && git commit -qam "wip 1"
printf 'base\nligne1\nligne2\n' > a.txt && git commit -qam "wip 2"     # main local ahead=2
upstream $'base\nligne1\nligne2\n' "feat: la PR squash-mergée"          # même CONTENU, autre commit
upstream $'base\nligne1\nligne2\nligne3\n' "chore: origin évolue après le squash"
git fetch -q origin
OUT="$(bash "$CHECK" --gate --shipped none)"
FULL="$(bash "$CHECK" --full --shipped none)"
ok "ahead=2 : la divergence TEXTUELLE est bien là"  "echo \"\$OUT\" | grep -q 'ahead=2'"
ok "…mais le verdict est AHEAD_ABSORBED, pas DIVERGED" \
   "echo \"\$OUT\" | grep -q '^MAINSYNC: AHEAD_ABSORBED'"
ok "resync_safe=1 est émis"              "echo \"\$OUT\" | grep -q 'resync_safe=1'"
ok "VERDICT: CLEAN (la 3ᵉ occurrence du faux positif est impossible)" \
   "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"
ok "le rapport humain dit explicitement de NE PAS crier au loup" \
   "echo \"\$FULL\" | grep -q 'Ne PAS rapporter'"

echo "M4 — du vrai contenu local jamais livré : là, il FAUT alerter :"
CASE=m4; mk m4
echo "travail jamais poussé" > neuf.txt && git add neuf.txt && git commit -qm "feat: travail local"
upstream $'base\nupstream\n' "chore: origin avance de son côté"
git fetch -q origin
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "MAINSYNC: DIVERGED_UNPROVEN"         "echo \"\$OUT\" | grep -q '^MAINSYNC: DIVERGED_UNPROVEN'"
ok "le fichier non prouvé est nommé"     "echo \"\$OUT\" | grep -q 'unproven=neuf.txt'"
ok "VERDICT: DIRTY points=2 (non-régression : on trouve toujours le vrai pending)" \
   "echo \"\$OUT\" | grep -q '^VERDICT: DIRTY points=.*2'"
ok "le diffstat est émis en FAIT, étiqueté comme ne décidant pas" \
   "echo \"\$OUT\" | grep -q 'diffstat(heuristique, ne decide pas)'"

echo "M5 — revert local (adverse du finding Codex PR #31) : blob pré-fourche ≠ preuve :"
CASE=m5; mk m5
upstream $'base\nupstream\n' "chore: origin modifie a.txt"
git fetch -q origin && git merge -q --ff-only origin/main
printf 'base\n' > a.txt && git commit -qam "revert: a.txt revient à la version base"
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "MAINSYNC: DIVERGED_UNPROVEN (le revert n'est PAS « absorbé »)" \
   "echo \"\$OUT\" | grep -q '^MAINSYNC: DIVERGED_UNPROVEN'"
ok "a.txt est cité comme non prouvé"     "echo \"\$OUT\" | grep -q 'unproven=a.txt'"

echo "M6 — pas de remote : sans objet, et zéro bruit :"
mkdir -p "$TMP/m6" && cd "$TMP/m6"
git init -q -b main solo && cd solo
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo x > a.txt && git add . && git commit -qm base
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "MAINSYNC: NA"                        "echo \"\$OUT\" | grep -q '^MAINSYNC: NA'"
ok "VERDICT: CLEAN"                      "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"
ok "aucun fait [MAINSYNC] émis"          "! echo \"\$OUT\" | grep -q '\[MAINSYNC\]'"

echo "M7 — vue périmée + commits locaux : on refuse de conclure plutôt que conclure faux :"
CASE=m7; mk m7
printf 'base\nligne1\n' > a.txt && git commit -qam "wip local"
upstream $'base\nligne1\n' "feat: squash upstream"
git fetch -q origin
touch -t 202001010000 "$(git rev-parse --git-common-dir)/FETCH_HEAD"
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "MAINSYNC: UNKNOWN (jamais AHEAD_ABSORBED sur une ref périmée)" \
   "echo \"\$OUT\" | grep -q '^MAINSYNC: UNKNOWN'"
ok "stale_ref=1 est signalé"             "echo \"\$OUT\" | grep -q 'stale_ref=1'"
ok "VERDICT: DIRTY (UNKNOWN ⇒ DIRTY : CLEAN uniquement sur preuve positive)" \
   "echo \"\$OUT\" | grep -q '^VERDICT: DIRTY'"

echo "Read-only (le portier ne fetch jamais de lui-même) :"
CASE=m8; mk m8
upstream $'base\nupstream\n' "chore: origin avance"
BEFORE="$(git rev-parse origin/main)"
bash "$CHECK" --gate --shipped none >/dev/null
bash "$CHECK" --full --shipped none >/dev/null
ok "origin/main n'a PAS été rafraîchi par le portier" "[ \"\$BEFORE\" = \"\$(git rev-parse origin/main)\" ]"
ok "working tree intact"                              "[ -z \"\$(git status --porcelain)\" ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-mainsync: TOUT VERT"; else echo "test-mainsync: ÉCHECS"; exit 1; fi
