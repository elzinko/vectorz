#!/usr/bin/env bash
# DoD exécutable de check-links.sh — fixtures jetables, aucun accès au dépôt réel.
# Cas : A périmètre sain · B profondeur relative fausse · C cible déplacée au ship
# (dans les DEUX sens) · D aucun faux positif (URL, ancre, titre, image, autolien)
# · E blocs de code ignorés · F définitions de référence · G `x.ts:75` n'est pas une URL
# · H paramétrage racine + chemins supplémentaires · I périmètre invalide.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-links.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

md() { # $1=chemin $2…=lignes
  mkdir -p "$(dirname "$1")"
  local f="$1"; shift
  printf '%s\n' "$@" > "$f"
}

# ── Cas A : périmètre sain → vert, code 0 ────────────────────────────────────────
A="$TMP/a"
md "$A/features/0001-alpha.md"      '# alpha' 'voir [0002](0002-beta.md) et [ADR](../docs/adr/0001-x.md).'
md "$A/features/0002-beta.md"       '# beta'  'retour [0001](0001-alpha.md).'
md "$A/features/done/0003-gamma.md" '# gamma' 'actif [0001](../0001-alpha.md), ADR [x](../../docs/adr/0001-x.md).'
md "$A/docs/adr/0001-x.md"          '# ADR x' 'fiche [0003](../../features/done/0003-gamma.md).'
out_a="$("$SCRIPT" "$A" 2>"$TMP/a.err")"; rc_a=$?
echo "Cas A (périmètre sain) :"
check "code de sortie 0"        "[ $rc_a -eq 0 ]"
check "aucun lien signalé"      "[ -z \"\$out_a\" ]"
check "6 liens vérifiés"        "grep -q '6 lien(s) relatif(s)' '$TMP/a.err'"
check "résumé « 0 cassé(s) »"   "grep -q '0 cassé(s)' '$TMP/a.err'"

# ── Cas B : profondeur relative fausse ───────────────────────────────────────────
# `../docs/adr/` écrit depuis features/done/ vise features/docs/adr/ — le défaut réel
# des fiches mega-city 0004/0019/0021 et racine 0025/0026.
B="$TMP/b"
md "$B/features/done/0003-gamma.md" '# gamma' 'ADR [x](../docs/adr/0001-x.md).'
md "$B/docs/adr/0001-x.md"          '# ADR x'
out_b="$("$SCRIPT" "$B" 2>"$TMP/b.err")"; rc_b=$?
echo "Cas B (profondeur relative fausse) :"
check "code de sortie 1"        "[ $rc_b -eq 1 ]"
check "1 cassé"                 "grep -q '1 cassé(s)' '$TMP/b.err'"
check "fichier:ligne exacts"    "printf '%s' \"\$out_b\" | grep -q '^features/done/0003-gamma.md:2	'"
check "résolution lexicale montrée (features/docs/adr/…)" \
  "printf '%s' \"\$out_b\" | grep -q '→ features/docs/adr/0001-x.md$'"

# ── Cas C : cible déplacée au ship, dans les deux sens ───────────────────────────
# C1 : la fiche active pointe une sœur désormais dans done/ (features/0034 → 0035).
# C2 : la fiche livrée pointe une sœur restée active (done/0035 → 0034).
C="$TMP/c"
md "$C/features/0001-alpha.md"      '# alpha' 'fille [0003](0003-gamma.md).'
md "$C/features/done/0003-gamma.md" '# gamma' 'parent [0001](0001-alpha.md).'
md "$C/docs/adr/0001-x.md"          '# ADR x'
out_c="$("$SCRIPT" "$C" 2>"$TMP/c.err")"; rc_c=$?
echo "Cas C (cible déplacée au ship) :"
check "code de sortie 1"        "[ $rc_c -eq 1 ]"
check "2 cassés (les deux sens)" "grep -q '2 cassé(s)' '$TMP/c.err'"
check "sens actif → done/"      "printf '%s' \"\$out_c\" | grep -q '^features/0001-alpha.md:2.*→ features/0003-gamma.md$'"
check "sens done/ → actif"      "printf '%s' \"\$out_c\" | grep -q '^features/done/0003-gamma.md:2.*→ features/done/0001-alpha.md$'"

# ── Cas D : aucun faux positif ───────────────────────────────────────────────────
D="$TMP/d"
md "$D/features/0001-alpha.md" \
  '# alpha' \
  '[web](https://example.org/x.md) [mail](mailto:a@b.c) [tel](tel:+33100000000)' \
  '[section](#un-titre) [ancre-fichier](0002-beta.md#L75)' \
  '[titre](0002-beta.md "un titre") [autolien](<0002-beta.md>)' \
  '![image](img.png)' \
  '' \
  '## un titre'
md "$D/features/0002-beta.md" '# beta'
: > "$D/features/img.png"
md "$D/docs/adr/0001-x.md" '# ADR x'
out_d="$("$SCRIPT" "$D" 2>"$TMP/d.err")"; rc_d=$?
echo "Cas D (aucun faux positif) :"
check "code de sortie 0"                 "[ $rc_d -eq 0 ]"
check "rien signalé"                     "[ -z \"\$out_d\" ]"
check "4 liens relatifs comptés (URL et ancre pure exclues)" \
  "grep -q '4 lien(s) relatif(s)' '$TMP/d.err'"

# ── Cas E : blocs de code clôturés ignorés ───────────────────────────────────────
E="$TMP/e"
md "$E/features/0001-alpha.md" \
  '# alpha' \
  'exemple :' \
  '```markdown' \
  '[faux](fiche-inexistante.md)' \
  '```' \
  'et aussi :' \
  '~~~' \
  '[faux2](autre-inexistante.md)' \
  '~~~' \
  'vrai [beta](0002-beta.md).'
md "$E/features/0002-beta.md" '# beta'
md "$E/docs/adr/0001-x.md" '# ADR x'
out_e="$("$SCRIPT" "$E" 2>"$TMP/e.err")"; rc_e=$?
echo "Cas E (blocs de code ignorés) :"
check "code de sortie 0"          "[ $rc_e -eq 0 ]"
check "1 seul lien vérifié"       "grep -q '1 lien(s) relatif(s)' '$TMP/e.err'"
check "aucune cible du bloc lue"  "! printf '%s' \"\$out_e\" | grep -q 'inexistante'"

# ── Cas F : définitions de référence `[label]: cible` ────────────────────────────
F="$TMP/f"
md "$F/features/0001-alpha.md" '# alpha' 'voir [beta] et [ko].' '' '[beta]: 0002-beta.md' '[ko]: 0009-absente.md'
md "$F/features/0002-beta.md" '# beta'
md "$F/docs/adr/0001-x.md" '# ADR x'
out_f="$("$SCRIPT" "$F" 2>"$TMP/f.err")"; rc_f=$?
echo "Cas F (définitions de référence) :"
check "code de sortie 1"         "[ $rc_f -eq 1 ]"
check "2 liens vérifiés"         "grep -q '2 lien(s) relatif(s)' '$TMP/f.err'"
check "la définition cassée est signalée" \
  "printf '%s' \"\$out_f\" | grep -q '0001-alpha.md:5.*0009-absente.md'"

# ── Cas G : `x.ts:75` n'est PAS une URL ──────────────────────────────────────────
# Piège d'extracteur : un test de schéma générique `^[a-z]+:` avale `types.ts:75` et
# rend le contrôle aveugle au défaut réel de la fiche racine 0061.
G="$TMP/g"
md "$G/features/0001-alpha.md" '# alpha' 'chemin [a](src/types.ts:75) et NU [b](types.ts:75).'
md "$G/docs/adr/0001-x.md" '# ADR x'
out_g="$("$SCRIPT" "$G" 2>"$TMP/g.err")"; rc_g=$?
echo "Cas G (« x.ts:75 » n'est pas une URL) :"
check "code de sortie 1"          "[ $rc_g -eq 1 ]"
check "cible avec dossier signalée" \
  "printf '%s' \"\$out_g\" | grep -q 'features/src/types.ts:75$'"
# Le cas discriminant : sans `/` avant le `:`, un test de schéma générique `^[a-z.]+:`
# prend `types.ts:75` pour une URL et l'ignore en silence. Un `src/` suffit à masquer
# le défaut — d'où les deux formes.
check "cible NUE signalée (le schéma générique l'avalerait)" \
  "printf '%s' \"\$out_g\" | grep -q 'features/types.ts:75$'"
check "les 2 comptées comme liens relatifs" "grep -q '2 lien(s) relatif(s)' '$TMP/g.err'"

# ── Cas H : racine + chemins supplémentaires ─────────────────────────────────────
H="$TMP/h"
md "$H/features/0001-alpha.md" '# alpha' 'ok [x](../docs/adr/0001-x.md).'
md "$H/docs/adr/0001-x.md" '# ADR x'
md "$H/docs/captures/note.md" '# note' 'fiche [0001](../../features/0009-absente.md).'
md "$H/docs/guide.md" '# guide' 'fiche [0001](../features/0009-absente.md).'
out_h1="$("$SCRIPT" "$H" 2>"$TMP/h1.err")"; rc_h1=$?
out_h2="$("$SCRIPT" "$H" features docs/adr docs/captures docs/guide.md 2>"$TMP/h2.err")"; rc_h2=$?
echo "Cas H (racine + chemins supplémentaires) :"
check "périmètre par défaut : vert (captures et guide hors champ)" "[ $rc_h1 -eq 0 ]"
check "périmètre étendu : rouge"      "[ $rc_h2 -eq 1 ]"
check "dossier supplémentaire scanné" "printf '%s' \"\$out_h2\" | grep -q '^docs/captures/note.md:2'"
check "fichier isolé scanné"          "printf '%s' \"\$out_h2\" | grep -q '^docs/guide.md:2'"

# ── Cas I : périmètre invalide → code 2, distinct d'« un lien cassé » ────────────
echo "Cas I (périmètre invalide) :"
"$SCRIPT" "$A" features docs/inexistant >/dev/null 2>"$TMP/i.err"; rc_i=$?
check "code de sortie 2"          "[ $rc_i -eq 2 ]"
check "message explicite"         "grep -q 'chemin absent' '$TMP/i.err'"
"$SCRIPT" "$TMP/racine-absente" >/dev/null 2>"$TMP/i2.err"; rc_i2=$?
check "racine absente → code 2"   "[ $rc_i2 -eq 2 ]"

echo
if [ "$FAIL" -eq 0 ]; then echo "check-links : tous les cas passent."; else echo "check-links : ÉCHEC."; fi
exit "$FAIL"
