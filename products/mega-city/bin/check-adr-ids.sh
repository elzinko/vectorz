#!/usr/bin/env bash
# Vérifie qu'aucun NOUVEAU numéro d'ADR n'est attribué deux fois.
# Déterministe, read-only : aucun jugement, aucune écriture (ADR-0001 §2, le script range).
#
# LE PROBLÈME QU'IL FERME
#   Le dépôt tient DEUX séries d'ADR, dans deux dossiers, pour deux objets distincts :
#     · docs/adr/                     → l'ombrelle vectorz (cop1, packaging, monorepo…)
#     · products/mega-city/docs/adr/  → la méthode ezk-*
#   Elles ont numéroté chacune depuis 1, sans se voir. Résultat mesuré le 2026-08-21 :
#   les numéros 015 à 029 désignent QUINZE COUPLES de sujets sans rapport — « ADR-020 »
#   veut dire « dod-completion-gate » ou « capacité partagée » selon le dossier où l'on
#   regarde. C'est exactement le mal que les fiches ont soldé en passant à des ids
#   horodatés (fiche 0180) ; les ADR, eux, ne l'avaient jamais soldé.
#
# CE QU'IL NE FAIT PAS — et pourquoi
#   Il NE renumérote RIEN. Les 15 collisions sont HISTORIQUES et le resteront : elles sont
#   citées ~1 600 fois dans le dépôt, et les ADR sont immuables (docs/adr/README.md, règle
#   ADR-025 §5 : « bannière, jamais de suppression »). Renuméroter casserait plus qu'il ne
#   répare. On gèle donc le passé et on ferme l'avenir.
#
# LA RÈGLE QU'IL FAIT RESPECTER
#   Les deux dossiers partagent DÉSORMAIS UNE SEULE SÉQUENCE. Le prochain ADR — quel que
#   soit son dossier — prend le premier numéro libre des DEUX côtés. Un numéro ne désigne
#   alors plus qu'un seul sujet, et la question « lequel ? » ne se pose plus.
#
# Usage : check-adr-ids.sh [racine-vectorz] [--next]
#   (défaut) vérifie      → code 1 s'il existe une collision NON héritée
#   --next                → imprime le prochain numéro libre des deux côtés (pour créer un ADR)
#
# Sortie : une ligne par collision sur stdout, résumé sur stderr.
set -uo pipefail

ROOT="${1:-.}"
[ "${ROOT}" = "--next" ] && { ROOT="."; MODE="next"; } || MODE="${2:-check}"
[ "${MODE}" = "--next" ] && MODE="next"

cd "$ROOT" 2>/dev/null || { echo "erreur: racine introuvable : $ROOT" >&2; exit 2; }

UMBRELLA_DIR="docs/adr"
METHOD_DIR="products/mega-city/docs/adr"
for d in "$UMBRELLA_DIR" "$METHOD_DIR"; do
  [ -d "$d" ] || { echo "erreur: dossier d'ADR absent : $ROOT/$d" >&2; exit 2; }
done

# ── Collisions HÉRITÉES, gelées le 2026-08-21 ────────────────────────────────────
# Ne JAMAIS élargir cette liste : elle est le constat d'un passé qu'on ne réécrit pas.
# Toute collision hors de cette liste est une régression — c'est tout l'objet du contrôle.
LEGACY="015 016 017 018 019 020 021 022 023 024 025 026 027 028 029"

# ── Extraction des numéros (normalisés sur 3 chiffres, la forme commune) ─────────
# L'ombrelle nomme `ADR-025-slug.md`, la méthode `0025-slug.md` : on compare les NOMBRES,
# pas les graphies, sinon la collision passe inaperçue (c'est ainsi qu'elle a prospéré).
numbers_in() {
  find "$1" -maxdepth 1 -name '*.md' ! -name 'README.md' -print 2>/dev/null \
    | sed 's|.*/||' \
    | grep -oE '^(ADR-)?[0-9]+' \
    | grep -oE '[0-9]+$' \
    | sed 's/^0*//' \
    | awk 'NF {printf "%03d\n", $1}' \
    | sort -u
}

umbrella=$(numbers_in "$UMBRELLA_DIR")
method=$(numbers_in "$METHOD_DIR")
both=$(comm -12 <(printf '%s\n' "$umbrella") <(printf '%s\n' "$method"))

if [ "$MODE" = "next" ]; then
  # Premier numéro libre des DEUX côtés — c'est CE numéro qu'on donne à un nouvel ADR.
  used=$(printf '%s\n%s\n' "$umbrella" "$method" | sort -u)
  n=1
  while printf '%s\n' "$used" | grep -qx "$(printf '%03d' "$n")"; do n=$((n + 1)); done
  printf '%03d\n' "$n"
  exit 0
fi

# ── Vérification ────────────────────────────────────────────────────────────────
new=0
for n in $both; do
  case " $LEGACY " in
    *" $n "*) continue ;;   # collision héritée, gelée : on la laisse
  esac
  u=$(find "$UMBRELLA_DIR" -maxdepth 1 -name "*${n}-*.md" | head -1 | sed 's|.*/||')
  m=$(find "$METHOD_DIR"   -maxdepth 1 -name "*${n}-*.md" | head -1 | sed 's|.*/||')
  printf '%s\tombrelle: %s\tméthode: %s\n' "$n" "${u:-?}" "${m:-?}"
  new=$((new + 1))
done

legacy_count=$(printf '%s\n' "$both" | awk 'NF' | wc -l | tr -d ' ')
if [ "$new" -gt 0 ]; then
  echo "check-adr-ids: $new collision(s) NOUVELLE(S) — un numéro doit désigner UN seul sujet." >&2
  echo "               Prendre le prochain libre : bin/check-adr-ids.sh <racine> --next" >&2
  exit 1
fi
echo "check-adr-ids: 0 nouvelle collision ($legacy_count héritée(s), gelée(s))." >&2
