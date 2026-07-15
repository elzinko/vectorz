#!/usr/bin/env bash
# ezk-diagram — PUBLIE un diagramme en vues partageables (ADR-0001 : le LLM génère le
# .mmd, le script rend/publie). Deux vues DÉTERMINISTES dérivées du seul `diagram.mmd`,
# que le LLM ne fabrique jamais à la main :
#
#   A. README.md  — dans le dossier du diagramme, avec un bloc ```mermaid rendu
#      NATIVEMENT par GitHub (ouvrir l'URL du dossier affiche le diagramme inline,
#      sans aucun service tiers). C'est le moyen recommandé « ouvrir & visualiser ».
#   B. liens mermaid.live (édition) / mermaid.ink (image) — encodage `pako:` du .mmd,
#      imprimés sur stdout pour que l'appelant les surface + les range dans meta.yaml.
#      ⚠ B sort de l'écosystème (service externe) : le diagramme voyage dans l'URL.
#      Exception opt-in au garde-fou « zéro service externe » — cf. SKILL.md §Garde-fous.
#
# usage : publish.sh <diagram-dir | diagram.mmd>
#   - <arg> = dossier diagrams/<slug>/  OU  le fichier .mmd directement.
#   - écrit  <dir>/README.md
#   - stdout : lignes "KEY<TAB>URL" (github_dir_hint, edit, view, img) pour capture.
#   - fallback gracieux : si node absent, README produit quand même (bloc mermaid seul),
#     liens B ignorés avec un message sur stderr (exit 0 : le README suffit à visualiser).
set -euo pipefail

usage() { echo "usage: publish.sh <diagram-dir | diagram.mmd>" >&2; exit 2; }
[ "$#" -ge 1 ] || usage

ARG="$1"
if [ -d "$ARG" ]; then
  DIR="${ARG%/}"
  MMD="$DIR/diagram.mmd"
elif [ -f "$ARG" ] && [ "${ARG##*.}" = "mmd" ]; then
  MMD="$ARG"
  DIR="$(cd "$(dirname "$ARG")" && pwd)"
else
  echo "publish: attendu un dossier diagrams/<slug>/ ou un fichier .mmd (reçu: $ARG)" >&2
  exit 1
fi
[ -f "$MMD" ] || { echo "publish: .mmd introuvable: $MMD" >&2; exit 1; }

SLUG="$(basename "$DIR")"
META="$DIR/meta.yaml"
README="$DIR/README.md"

# Titre : depuis meta.yaml si présent, sinon le slug.
TITLE="$SLUG"
if [ -f "$META" ]; then
  t="$(sed -n 's/^title:[[:space:]]*//p' "$META" | head -1)"
  [ -n "$t" ] && TITLE="$t"
fi

# --- B. liens pako (déterministe, via node/zlib — aucune dépendance npm) --------------
EDIT="" ; VIEW="" ; IMG=""
if command -v node >/dev/null 2>&1; then
  PAKO="$(node -e '
    const zlib = require("zlib"), fs = require("fs");
    const code = fs.readFileSync(process.argv[1], "utf8");
    const state = { code, mermaid: JSON.stringify({ theme: "default" }, null, 2), autoSync: true, updateDiagram: true };
    const data = zlib.deflateSync(Buffer.from(JSON.stringify(state)), { level: 9 });
    process.stdout.write("pako:" + data.toString("base64").replace(/\+/g,"-").replace(/\//g,"_"));
  ' "$MMD" 2>/dev/null || true)"
  if [ -n "$PAKO" ]; then
    EDIT="https://mermaid.live/edit#$PAKO"
    VIEW="https://mermaid.live/view#$PAKO"
    IMG="https://mermaid.ink/img/$PAKO"
  fi
fi
[ -n "$EDIT" ] || echo "publish: node absent ou échec d'encodage — README produit sans liens mermaid.live (B)." >&2

# --- A. README.md avec bloc ```mermaid (rendu natif GitHub) --------------------------
{
  printf '# %s\n\n' "$TITLE"
  printf '> Diagramme généré par **ezk-diagram**. Source de vérité : [`description.md`](description.md) (prose).\n'
  printf '> Ce fichier est **généré** depuis `diagram.mmd` — ne pas l’éditer à la main (il serait écrasé au prochain rendu).\n\n'
  printf '```mermaid\n'
  cat "$MMD"
  printf '\n```\n'
  if [ -n "$EDIT" ]; then
    printf '\n**Vues partageables** · [Éditer sur mermaid.live](%s) · [Image PNG (mermaid.ink)](%s)\n' "$EDIT" "$IMG"
    printf '\n<sub>Les liens mermaid.live/mermaid.ink encodent le diagramme dans l’URL (service externe) — pratique pour partager/éditer vite ; la vue sans service tiers reste ce README rendu par GitHub.</sub>\n'
  fi
} > "$README"

echo "publish: README.md écrit → $README" >&2

# --- stdout : lignes capturables par l'appelant (LLM) -------------------------------
printf 'github_dir_hint\t%s\n' "diagrams/$SLUG/  (ouvrir l'URL de ce dossier sur GitHub → README rendu inline)"
[ -n "$EDIT" ] && printf 'edit\t%s\n' "$EDIT"
[ -n "$VIEW" ] && printf 'view\t%s\n' "$VIEW"
[ -n "$IMG" ]  && printf 'img\t%s\n'  "$IMG"
exit 0
