#!/usr/bin/env bash
# DoD exécutable — Skema migration 005 (retrait du champ `ready:`), fixtures jetables.
#
# En clair : le champ date `ready:` disparaît du front-matter, mais AUCUNE date réelle ne se perd
# (elle devient une note datée au bas de la fiche). La migration ne touche que le front-matter,
# ne change rien à une 2e exécution, refuse de tourner sur un dossier trop ancien (003 lit `ready:`).
set -euo pipefail

SKILL="$(cd "$(dirname "$0")/.." && pwd)"
APPLY="$SKILL/scripts/apply-005-retrait-champ-ready.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd (eval) — ok si exit 0
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Empreinte d'un dossier de fiches (chemin + contenu) pour prouver « rien n'a bougé ».
snap() { (cd "$1" && find features -type f | LC_ALL=C sort | xargs shasum | shasum | cut -d' ' -f1); }

mk_root() { # $1=dir $2=layout_version
  mkdir -p "$1/features/done"
  printf -- '---\nskill: ezk-backlog\nlayout_version: %s\n---\n\n# Features\n' "$2" > "$1/features/README.md"
  printf -- '---\nid: "0000"\ntitle:\nstatus: idea # idea | ready | in-progress | blocked | shipped | superseded\nready:               # YYYY-MM-DD — posée par le gate `ready <id>`\npr:\n---\n\n# modèle\n' \
    > "$1/features/feature-template.md"
}

fiche() { # $1=chemin $2=ligne ready (ou vide = pas de ligne) $3=status
  local ready_line=""
  [ -n "$2" ] && ready_line="$2"$'\n'
  printf -- '---\nid: "x"\ntitle: "fiche"\ntype: feature\npriority: P2\nstatus: %s\n%spr:\ncreated: 2026-07-01\n---\n\n# Titre\n\nCorps de la fiche.\n' \
    "$3" "$ready_line" > "$1"
}

A="$TMP/a"
mk_root "$A" 4
fiche "$A/features/20260101000000001_date.md"      'ready: 2026-08-21' ready
fiche "$A/features/20260101000000002_vide.md"      'ready:' idea
fiche "$A/features/20260101000000003_commentee.md" 'ready: 2026-08-22 # décision PO : garder X séparé' ready
fiche "$A/features/20260101000000004_boilerplate.md" 'ready: 2026-08-23 # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète)' ready
fiche "$A/features/20260101000000005_vide-commentee.md" 'ready: # YYYY-MM-DD — posée par le gate `ready <id>`' idea
fiche "$A/features/20260101000000006_sans-champ.md" '' idea
fiche "$A/features/done/20260101000000008_livree.md" 'ready: 2026-07-01' shipped
# Corps qui cite un `ready:` en début de ligne (bloc de code) : NE DOIT PAS être touché.
fiche "$A/features/20260101000000007_corps.md" 'ready: 2026-09-01' ready
printf '\n```yaml\nready: 2026-01-01\n```\n' >> "$A/features/20260101000000007_corps.md"
# Fiche SANS retour à la ligne final.
fiche "$A/features/20260101000000009_sans-newline.md" 'ready: 2026-08-30' ready
printf 'dernière ligne sans retour' >> "$A/features/20260101000000009_sans-newline.md"
# Le fichier d'origine pour comparer (copie).
cp -R "$A/features" "$TMP/orig"

echo "Cas 1 (dry-run) :"
before="$(snap "$A")"
out1="$(bash "$APPLY" "$A")"
check "dry-run : exit 0 et rien d'écrit" "[ \"\$(snap '$A')\" = '$before' ]"
check "dry-run annonce le DRY-RUN"       "printf '%s' \"\$out1\" | grep -q 'DRY-RUN'"
check "dry-run compte 6 dates + 2 vides" "printf '%s' \"\$out1\" | grep -q '6 date(s) préservée(s)' && printf '%s' \"\$out1\" | grep -q '2 champ(s) vide(s)'"

echo "Cas 2 (--apply) :"
out2="$(bash "$APPLY" --apply "$A")"
fm_ready() { awk '/^---[[:space:]]*$/{c++; next} c==1 && /^ready:/{n++} END{print n+0}' "$1"; }
no_ready=1
for f in "$A"/features/*.md "$A"/features/done/*.md; do
  case "$(basename "$f")" in README.md|feature-template.md) continue;; esac
  [ "$(fm_ready "$f")" = 0 ] || no_ready=0
done
check "plus aucun champ ready: en front-matter" "[ $no_ready = 1 ]"
check "date réelle préservée en note (fiche simple)" \
  "grep -q 'DoR (.ready.) passée le 2026-08-21' '$A/features/20260101000000001_date.md'"
check "date préservée dans done/" \
  "grep -q 'passée le 2026-07-01' '$A/features/done/20260101000000008_livree.md'"
check "commentaire d'origine utile conservé" \
  "grep -q 'garder X séparé' '$A/features/20260101000000003_commentee.md'"
check "boilerplate du gabarit NON recopié" \
  "! grep -q 'YYYY-MM-DD' '$A/features/20260101000000004_boilerplate.md' && grep -q 'passée le 2026-08-23' '$A/features/20260101000000004_boilerplate.md'"
check "fiche au champ vide : aucune note ajoutée" \
  "! grep -q 'Historique' '$A/features/20260101000000002_vide.md' && ! grep -q 'Historique' '$A/features/20260101000000005_vide-commentee.md'"
check "fiche au champ vide : seule la ligne ready: part" \
  "[ \"\$(diff '$TMP/orig/20260101000000002_vide.md' '$A/features/20260101000000002_vide.md' | grep -c '^[<>]')\" = 1 ]"
check "fiche sans champ : octet pour octet identique" \
  "cmp -s '$TMP/orig/20260101000000006_sans-champ.md' '$A/features/20260101000000006_sans-champ.md'"
check "ready: du CORPS (bloc de code) intact" \
  "grep -q '^ready: 2026-01-01$' '$A/features/20260101000000007_corps.md'"
check "rien d'autre ne disparaît : seules des lignes sont AJOUTÉES (la note)" \
  "[ \"\$(diff <(grep -v '^ready:' '$TMP/orig/20260101000000001_date.md') '$A/features/20260101000000001_date.md' | grep -c '^<')\" = 0 ]"
check "sans retour final : la note est sur sa propre ligne" \
  "tail -n1 '$A/features/20260101000000009_sans-newline.md' | grep -q '^> .*Historique' && grep -q '^dernière ligne sans retour$' '$A/features/20260101000000009_sans-newline.md'"
check "layout_version: 5 dans features/README.md" "grep -q '^layout_version: 5$' '$A/features/README.md'"
check "le gabarit déployé ne porte plus ready:" "! grep -q '^ready:' '$A/features/feature-template.md'"
check "le gabarit déployé annonce les statuts du layout 5 (sans blocked, avec merged/split) — retour Codex" \
  "grep -q '^status: idea # idea | ready | in-progress | shipped | superseded | merged | split\$' '$A/features/feature-template.md' && ! grep -q 'blocked' '$A/features/feature-template.md'"
check "le compte-rendu annonce layout_version 5" "printf '%s' \"\$out2\" | grep -q 'layout_version: 5'"

echo "Cas 3 (idempotence) :"
before3="$(snap "$A")"
out3="$(bash "$APPLY" --apply "$A")"
check "2e --apply : rien ne change" "[ \"\$(snap '$A')\" = '$before3' ]"
check "2e --apply : annonce « rien à migrer »" "printf '%s' \"\$out3\" | grep -q 'rien à migrer'"

echo "Cas 4 (garde de version) :"
B="$TMP/b"
mk_root "$B" 2
fiche "$B/features/20260101000000001_ancienne.md" 'ready: 2026-08-21' ready
before4="$(snap "$B")"
if bash "$APPLY" --apply "$B" >"$TMP/b.out" 2>"$TMP/b.err"; then rc4=0; else rc4=$?; fi
check "layout < 4 : --apply refusé (exit ≠ 0)" "[ $rc4 -ne 0 ]"
check "layout < 4 : rien n'est écrit" "[ \"\$(snap '$B')\" = '$before4' ]"
check "layout < 4 : message qui nomme la migration 003" "grep -q '003' '$TMP/b.err'"

echo "Cas 5 (dossier sans fiche à migrer) :"
C="$TMP/c"
mk_root "$C" 4
fiche "$C/features/20260101000000001_propre.md" '' idea
out5="$(bash "$APPLY" "$C")"
check "dry-run : « rien à migrer »" "printf '%s' \"\$out5\" | grep -q 'rien à migrer'"

echo "Cas 6 (date entre guillemets — revue ezk-reviewer) :"
Q="$TMP/q"
mk_root "$Q" 4
fiche "$Q/features/20260101000000001_quotee.md" 'ready: "2026-08-24"' ready
bash "$APPLY" --apply "$Q" >/dev/null
check "date quotée : la note porte la date sans guillemets" \
  "grep -q 'passée le 2026-08-24 ·' '$Q/features/20260101000000001_quotee.md' && ! grep -q 'passée le \"' '$Q/features/20260101000000001_quotee.md'"

echo "Cas 7 (statut blocked du layout v4 — retour Codex P1) :"
K="$TMP/k"
mk_root "$K" 4
F1="$K/features/20260101000000001_bloquee-datee.md"
F2="$K/features/20260101000000002_bloquee-vide.md"
F3="$K/features/20260101000000003_bloquee-sans-champ.md"
F4="$K/features/20260101000000004_bloquee-drapeau.md"
printf -- '---\nid: "b1"\ntitle: "bloquée datée"\ntype: feature\npriority: P1\nstatus: blocked\nready: 2026-08-21\npr:\ncreated: 2026-07-01\n---\n\n# Titre\n' > "$F1"
printf -- '---\nid: "b2"\ntitle: "bloquée vide"\ntype: feature\npriority: P1\nstatus: blocked\nready:\npr:\ncreated: 2026-07-01\n---\n\n# Titre\n' > "$F2"
printf -- '---\nid: "b3"\ntitle: "bloquée sans champ"\ntype: feature\npriority: P1\nstatus: blocked # attend un arbitrage\npr:\ncreated: 2026-07-01\n---\n\n# Titre\n' > "$F3"
printf -- '---\nid: "b4"\ntitle: "bloquée avec drapeau"\ntype: feature\npriority: P1\nstatus: blocked\nblocked: "ADR-030 non ratifié"\nready: 2026-08-22\npr:\ncreated: 2026-07-01\n---\n\n# Titre\n' > "$F4"
before7="$(snap "$K")"
out7="$(bash "$APPLY" "$K")"
check "dry-run : rien d'écrit" "[ \"\$(snap '$K')\" = '$before7' ]"
check "dry-run : annonce 4 statuts blocked à convertir" "printf '%s' \"\$out7\" | grep -q '4 statut(s) blocked converti(s)'"
bash "$APPLY" --apply "$K" >/dev/null
check "plus aucun status: blocked" "! grep -rq '^status: blocked' '$K/features'"
check "blocked daté → ready + drapeau + note datée" \
  "grep -q '^status: ready\$' '$F1' && grep -q '^blocked: \"ancien statut blocked' '$F1' && grep -q 'passée le 2026-08-21' '$F1'"
check "blocked au champ vide → idea + drapeau, sans note" \
  "grep -q '^status: idea\$' '$F2' && grep -q '^blocked: ' '$F2' && ! grep -q 'Historique' '$F2'"
check "blocked sans champ ready → idea + drapeau (commentaire de la ligne status retiré)" \
  "grep -q '^status: idea\$' '$F3' && grep -q '^blocked: ' '$F3' && ! grep -q 'arbitrage' '$F3'"
check "drapeau existant conservé, pas de doublon, colonne ready" \
  "[ \"\$(grep -c '^blocked:' '$F4')\" = 1 ] && grep -q '^blocked: \"ADR-030 non ratifié\"\$' '$F4' && grep -q '^status: ready\$' '$F4'"
check "le reste du front-matter est intact (id, title, created, corps)" \
  "grep -q '^id: \"b1\"\$' '$F1' && grep -q '^created: 2026-07-01\$' '$F1' && grep -q '^# Titre\$' '$F1'"
before7b="$(snap "$K")"
out7b="$(bash "$APPLY" --apply "$K")"
check "2e --apply : idempotent, « rien à migrer »" \
  "[ \"\$(snap '$K')\" = '$before7b' ] && printf '%s' \"\$out7b\" | grep -q 'rien à migrer'"

echo "Cas 8 (jamais de rétrogradation — retour Codex P2) :"
N="$TMP/n"
mk_root "$N" 6
fiche "$N/features/20260101000000001_en-avance.md" 'ready: 2026-08-21' ready
before8="$(snap "$N")"
if out8="$(bash "$APPLY" --apply "$N" 2>&1)"; then rc8=0; else rc8=$?; fi
check "layout 6 : --apply sort sans erreur et ne change RIEN" "[ $rc8 -eq 0 ] && [ \"\$(snap '$N')\" = '$before8' ]"
check "layout 6 : le marqueur reste 6 (pas ramené à 5)" "grep -q '^layout_version: 6\$' '$N/features/README.md'"
check "layout 6 : message « déjà passée »" "printf '%s' \"\$out8\" | grep -q 'déjà passée'"
out8b="$(bash "$APPLY" "$N" 2>&1)"
check "layout 6 : le dry-run ne touche rien non plus" "[ \"\$(snap '$N')\" = '$before8' ] && printf '%s' \"\$out8b\" | grep -q 'déjà passée'"
# Rejeu sur un dossier DÉJÀ en layout 5 : permis (fiche arrivée par un merge avec un vieux ready:).
M="$TMP/m"
mk_root "$M" 5
fiche "$M/features/20260101000000001_arrivee-par-merge.md" 'ready: 2026-08-25' ready
bash "$APPLY" --apply "$M" >/dev/null
check "layout 5 : le rejeu nettoie la fiche arrivée par merge (date en note)" \
  "! grep -q '^ready:' '$M/features/20260101000000001_arrivee-par-merge.md' && grep -q 'passée le 2026-08-25' '$M/features/20260101000000001_arrivee-par-merge.md'"
check "layout 5 : le marqueur reste 5" "grep -q '^layout_version: 5\$' '$M/features/README.md'"

if [ "$FAIL" = 0 ]; then echo 'test-apply-005: TOUT VERT'; else echo 'test-apply-005: ÉCHECS' >&2; exit 1; fi
