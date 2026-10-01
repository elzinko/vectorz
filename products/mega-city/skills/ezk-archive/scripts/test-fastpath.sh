#!/usr/bin/env bash
# DoD exécutable de la fiche 20260904091853948 — la voie rapide, le bon compte, les fiches travaillées.
#
# Ce que ces cas verrouillent :
#   F  la VOIE RAPIDE : `FASTPATH: EMPTY` seulement quand il n'y a rien à sauver (verdict propre,
#      rien livré, rien travaillé, pas de SPRINT.md avec du contenu). Chaque obstacle rend
#      `FASTPATH: NO reason=…` : une session sale déroule toujours la clôture complète.
#   W  `--worked` : les fiches TRAVAILLÉES (livrées ou non) passent par le gate, pour que
#      l'agent délégué pose l'en-tête `fiches:` d'après elles, pas d'après `--shipped`.
#   C  le COMPTE JUSTE : sous le plafond, les lignes listées égalent le compte ; au-dessus,
#      le compteur dit `X/Y` (règle human-facing-lisibility, « un compte à côté d'une liste tronquée »).
#   D  `durable=` : une machine jetable (session cloud) le dit, l'humain peut le forcer.
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() { # $1=label $2=cmd (0=ok)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

new_repo() { # $1=nom → dépôt discipliné, sans remote, une fiche livrée
  cd "$TMP"
  git init -q -b main "$1" && cd "$1"
  git config user.email test@test && git config user.name test
  git config commit.gpgsign false
  mkdir -p features/done
  echo "# Backlog" > features/README.md
  printf -- '---\nid: 0042\ntitle: livrée\nstatus: shipped\npr: "#123"\n---\n' > features/done/0042-fiche-livree.md
  printf -- '---\nid: 0043\ntitle: pas livrée\nstatus: idea\npr:\n---\n' > features/0043-fiche-en-cours.md
  echo hello > a.txt
  echo "SPRINT.md" > .gitignore       # comme dans un vrai projet : le scratch du sprint n'est pas versionné
  git add . && git commit -qm "base"
}

# ── F : la voie rapide ─────────────────────────────────────────────────────────
new_repo fast
echo "F1 — rien à sauver : FASTPATH: EMPTY, verdict propre, bloc court :"
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "VERDICT: CLEAN"                          "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"
ok "FASTPATH: EMPTY"                         "echo \"\$OUT\" | grep -qx 'FASTPATH: EMPTY'"
ok "le bloc reste court (≤ 16 lignes)"       "[ \"\$(echo \"\$OUT\" | wc -l | tr -d ' ')\" -le 16 ]"
ok "exit 0"                                  "bash \"\$CHECK\" --gate --shipped none --worked none >/dev/null"

echo "F2 — sans --worked, rien ne prouve que la session n'a rien travaillé :"
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "FASTPATH: NO reason=worked_undeclared"   "echo \"\$OUT\" | grep -qx 'FASTPATH: NO reason=worked_undeclared'"
OUT="$(bash "$CHECK" --gate --worked none)"
ok "sans --shipped : shipped_undeclared"     "echo \"\$OUT\" | grep -q '^FASTPATH: NO reason=.*shipped_undeclared'"

echo "F3 — une fiche livrée ou travaillée n'est jamais « rien » :"
OUT="$(bash "$CHECK" --gate --shipped 0042 --worked 0042)"
ok "livrée : reason=shipped"                 "echo \"\$OUT\" | grep -q '^FASTPATH: NO reason=.*shipped'"
OUT="$(bash "$CHECK" --gate --shipped none --worked 0043)"
ok "travaillée : reason=worked"              "echo \"\$OUT\" | grep -qx 'FASTPATH: NO reason=worked'"

echo "F4 — un arbre sale ou une branche en vol ne se déclare jamais vide :"
echo dirty > untracked.txt
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "arbre sale : reason=verdict"             "echo \"\$OUT\" | grep -qx 'FASTPATH: NO reason=verdict'"
rm -f untracked.txt
git checkout -q -b vol && echo work > vol.txt && git add vol.txt && git commit -qm "travail en vol" && git checkout -q main
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "branche réelle : reason=verdict"         "echo \"\$OUT\" | grep -qx 'FASTPATH: NO reason=verdict'"
git branch -q -D vol

echo "F5 — SPRINT.md : du contenu bloque la voie rapide, un simple gabarit non :"
printf '# Sprint\n\n## Notes / décisions\n\n<!-- rien -->\n' > SPRINT.md
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "gabarit vide : toujours EMPTY"           "echo \"\$OUT\" | grep -qx 'FASTPATH: EMPTY'"
printf '# Sprint\n\n- [x] 0042 — une story livrée (PR #12)\n' > SPRINT.md
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "story dans le lot : reason=sprint"       "echo \"\$OUT\" | grep -qx 'FASTPATH: NO reason=sprint'"
rm -f SPRINT.md

echo "F6 — le portier reste strictement read-only :"
BEFORE="$(git status --porcelain | wc -l | tr -d ' ')"
bash "$CHECK" --gate --shipped none --worked none >/dev/null
ok "aucun fichier créé ni modifié"           "[ \"\$(git status --porcelain | wc -l | tr -d ' ')\" = \"\$BEFORE\" ]"

echo "F7 — un worktree voisin sale ne bloque pas la voie rapide, mais elle le dit :"
git worktree add -q --detach "$TMP/voisin" main
echo "travail d'un agent" > "$TMP/voisin/agent.txt"
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "EMPTY other_worktrees_dirty=1"           "echo \"\$OUT\" | grep -qx 'FASTPATH: EMPTY other_worktrees_dirty=1'"
rm -f "$TMP/voisin/agent.txt"
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "voisin redevenu propre : EMPTY nu"       "echo \"\$OUT\" | grep -qx 'FASTPATH: EMPTY'"
echo "en cours" > travail-principal.txt
OUT="$(cd "$TMP/voisin" && bash "$CHECK" --gate --shipped none --worked none)"
ok "lancé depuis le voisin propre, le principal sale est signalé" \
   "echo \"\$OUT\" | grep -qx 'FASTPATH: EMPTY other_worktrees_dirty=1'"
rm -f travail-principal.txt
git worktree remove --force "$TMP/voisin"

# ── W : les fiches travaillées ─────────────────────────────────────────────────
new_repo worked
echo "W1 — --worked est recopié sur la ligne P3_BACKLOG :"
OUT="$(bash "$CHECK" --gate --shipped none --worked 0043)"
ok "worked=0043"                             "echo \"\$OUT\" | grep -q '^P3_BACKLOG: .* worked=0043\$'"
OUT="$(bash "$CHECK" --gate --shipped 0042 --worked 0042,0043)"
ok "worked=0042,0043"                        "echo \"\$OUT\" | grep -q '^P3_BACKLOG: .* worked=0042,0043\$'"
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "worked=none"                             "echo \"\$OUT\" | grep -q '^P3_BACKLOG: .* worked=none\$'"
OUT="$(bash "$CHECK" --gate --shipped none)"
ok "non déclaré : worked=- (jamais inventé)" "echo \"\$OUT\" | grep -q '^P3_BACKLOG: .* worked=-\$'"
OUT="$(bash "$CHECK" --gate --shipped 0042 --worked none)"
ok "--worked ne change pas la preuve de --shipped" \
   "echo \"\$OUT\" | grep -q '^P3_BACKLOG: CLEAN declared=0042 all_shipped=1'"

# ── C : le compte juste ────────────────────────────────────────────────────────
new_repo count
mk_absorbed() { # $1=de $2=à → les branches abs-<de>..abs-<à>, dont le contenu a atterri sur main (squash)
  local i
  for i in $(seq "$1" "$2"); do
    git checkout -q -b "abs-$i" main
    echo "contenu $i" > "abs-$i.txt" && git add "abs-$i.txt" && git commit -qm "abs $i"
    git checkout -q main
    echo "contenu $i" > "abs-$i.txt" && git add "abs-$i.txt" && git commit -qm "squash abs $i"
  done
}
mk_real() { # une branche dont le contenu n'est PAS sur main → du vrai pending
  git checkout -q -b reelle main
  echo "pas livré" > reelle.txt && git add reelle.txt && git commit -qm "travail réel"
  git checkout -q main
}
listed() { echo "$OUT" | grep -c "^\[P2\] branch ABSORBED" || true; }

echo "C1 — sous le plafond : lignes listées == compte annoncé :"
mk_absorbed 1 3 && mk_real
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "branch_absorbed=3 (compte nu)"           "echo \"\$OUT\" | grep -q 'branch_absorbed=3 '"
ok "3 lignes ABSORBED listées"               "[ \"\$(listed)\" = 3 ]"
ok "la branche réelle est listée"            "echo \"\$OUT\" | grep -q '^\[P2\] branch REAL reelle '"

echo "C2 — au-dessus du plafond : le compteur dit X/Y :"
mk_absorbed 4 33
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
SHOWN="$(listed)"
ok "moins de lignes que de branches"         "[ \"\$SHOWN\" -lt 33 ]"
ok "branch_absorbed=<affichées>/33"          "echo \"\$OUT\" | grep -q \"branch_absorbed=\${SHOWN}/33 \""
ok "plus jamais le total nu"                 "! echo \"\$OUT\" | grep -q 'branch_absorbed=33 '"
ok "la branche réelle reste listée"          "echo \"\$OUT\" | grep -q '^\[P2\] branch REAL reelle '"
ok "la troncature est dite"                  "echo \"\$OUT\" | grep -q 'autres faits omis'"

echo "C3 — point propre : des compteurs sans liste, c'est honnête (aucune liste à côté) :"
git branch -q -D reelle
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "P2 CLEAN, branch_absorbed=33 nu"         "echo \"\$OUT\" | grep -q 'P2_PENDING: CLEAN .*branch_absorbed=33 '"
ok "aucune ligne de fait"                    "! echo \"\$OUT\" | grep -q '^\['"

# ── D : durable ────────────────────────────────────────────────────────────────
new_repo durable
echo "D1 — durable= dit si la note locale survivra :"
OUT="$(bash "$CHECK" --gate --shipped none --worked none)"
ok "poste normal : durable=1"                "echo \"\$OUT\" | grep -q '^HANDOFF: .* durable=1\$'"
OUT="$(CLAUDE_CODE_REMOTE=true bash "$CHECK" --gate --shipped none --worked none)"
ok "session cloud : durable=0"               "echo \"\$OUT\" | grep -q '^HANDOFF: .* durable=0\$'"
OUT="$(EZK_EPHEMERAL=1 bash "$CHECK" --gate --shipped none --worked none)"
ok "EZK_EPHEMERAL=1 : durable=0"             "echo \"\$OUT\" | grep -q '^HANDOFF: .* durable=0\$'"
OUT="$(CLAUDE_CODE_REMOTE=true EZK_EPHEMERAL=0 bash "$CHECK" --gate --shipped none --worked none)"
ok "EZK_EPHEMERAL=0 force durable=1"         "echo \"\$OUT\" | grep -q '^HANDOFF: .* durable=1\$'"

echo
if (( FAIL )); then echo "voie rapide / compte / worked : ÉCHEC"; exit 1; fi
echo "voie rapide / compte / worked : TOUT VERT"
