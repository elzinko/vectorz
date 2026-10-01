#!/usr/bin/env bash
# Déploie le lanceur universel dans un projet (idempotent) — voir recipes/lanceur-dev-universel.md
#
#   install.sh <racine-du-projet>            installe ou met à jour
#   install.sh --check <racine-du-projet>    ne modifie rien ; code 1 s'il y a un écart
#
# Pose, dans le projet : scripts/dev-branch.sh (copie versionnée, écrasée à la mise à jour),
# scripts/dev-branch.conf (créée si absente, JAMAIS écrasée), l'entrée package.json `dev:branch`
# (si le projet a un package.json) et les lignes .gitignore utiles.
set -uo pipefail

SRC="$(cd "$(dirname "$0")" && pwd -P)"
check=0
if [ "${1:-}" = "--check" ]; then check=1; shift; fi
[ $# -eq 1 ] || { echo "usage: install.sh [--check] <racine-du-projet>" >&2; exit 1; }
PROJ="$(cd "$1" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)" || { echo "erreur: $1 n'est pas dans un dépôt git" >&2; exit 1; }
PROJ="$(cd "$PROJ" && pwd -P)"
DEST="$PROJ/scripts/dev-branch.sh"
CONF="$PROJ/scripts/dev-branch.conf"
drift=0

note() { printf '%s\n' "$*"; }
gap()  { drift=1; note "$*"; }

version_of() { sed -n '2s/^# vectorz-launcher //p' "$1" 2>/dev/null; }

# 1. Le script : copie à l'identique.
if [ ! -f "$DEST" ]; then
  if [ "$check" = 1 ]; then gap "script: absent (scripts/dev-branch.sh)"; else
    mkdir -p "$PROJ/scripts"; cp "$SRC/dev-branch.sh" "$DEST"; chmod +x "$DEST"; note "script: installé ($(version_of "$DEST"))"; fi
elif cmp -s "$SRC/dev-branch.sh" "$DEST"; then
  note "script: à jour ($(version_of "$DEST"))"
elif [ "$check" = 1 ]; then
  gap "script: périmé ($(version_of "$DEST") installé, $(version_of "$SRC/dev-branch.sh") disponible) — relance install.sh"
else
  old="$(version_of "$DEST")"; cp "$SRC/dev-branch.sh" "$DEST"; chmod +x "$DEST"; note "script: mis à jour ($old -> $(version_of "$DEST"))"
fi

# 2. La déclaration : créée une fois, jamais touchée ensuite.
if [ -f "$CONF" ]; then note "déclaration: présente (scripts/dev-branch.conf, non modifiée)"
elif [ "$check" = 1 ]; then gap "déclaration: absente (scripts/dev-branch.conf)"
else mkdir -p "$PROJ/scripts"; cp "$SRC/dev-branch.conf.example" "$CONF"; note "déclaration: créée VIDE (scripts/dev-branch.conf) — à remplir, puis : bash scripts/dev-branch.sh doctor"; fi

# 3. L'entrée package.json `dev:branch` : insertion textuelle, la mise en forme du fichier est conservée.
if [ -f "$PROJ/package.json" ]; then
  res="$(node -e '
    const fs=require("fs");const p=process.argv[1];const dry=process.argv[2]==="1";const t=fs.readFileSync(p,"utf8");
    const m=/"scripts"\s*:\s*\{/.exec(t);if(!m){console.log("noscripts");process.exit(0)}
    let i=m.index+m[0].length,d=1,s=false,e=false,end=-1;
    for(;i<t.length;i++){const c=t[i];if(s){if(e)e=false;else if(c==="\\")e=true;else if(c==="\"")s=false;continue}
      if(c==="\""){s=true;continue}if(c==="{")d++;else if(c==="}"){d--;if(d===0){end=i;break}}}
    if(end<0){console.log("unparsed");process.exit(0)}
    const start=m.index+m[0].length,body=t.slice(start,end);
    if(/"dev:branch"\s*:/.test(body)){console.log("present");process.exit(0)}
    if(dry){console.log("absent");process.exit(0)}
    const trimmed=body.replace(/\s+$/,"");const indent=(body.match(/\n([ \t]+)"/)||[0,"  "])[1];
    const entry="\"dev:branch\": \"bash scripts/dev-branch.sh\"";
    const next=trimmed===""?"\n"+indent+entry+body.slice(trimmed.length):trimmed+",\n"+indent+entry+body.slice(trimmed.length);
    fs.writeFileSync(p,t.slice(0,start)+next+t.slice(end));console.log("added")
  ' "$PROJ/package.json" "$check" 2>/dev/null)"
  case "$res" in
    added)   note "package.json: entrée dev:branch ajoutée";;
    present) note "package.json: entrée dev:branch présente";;
    absent)  gap "package.json: entrée dev:branch absente";;
    *)       note "package.json: pas de bloc scripts exploitable — appelle : bash scripts/dev-branch.sh";;
  esac
else
  note "package.json: aucun — appelle : bash scripts/dev-branch.sh (ou ajoute-le à ton Makefile)"
fi

# 4. .gitignore : l'état d'exécution et les arbres de run ne doivent jamais être suivis.
trees=".worktrees"
if [ -f "$CONF" ]; then t="$( ( DEV_TREES_DIR=.worktrees; . "$CONF" >/dev/null 2>&1; printf '%s' "$DEV_TREES_DIR" ) )"; [ -z "$t" ] || trees="$t"; fi
for d in ".vectorz/run" "$trees"; do
  case "$d" in /*) continue;; esac
  if git -C "$PROJ" check-ignore -q "$d/x" 2>/dev/null; then note ".gitignore: $d déjà ignoré"
  elif [ "$check" = 1 ]; then gap ".gitignore: $d n'est pas ignoré"
  else printf '%s/\n' "$d" >>"$PROJ/.gitignore"; note ".gitignore: $d/ ajouté"; fi
done

if [ "$check" = 1 ] && [ "$drift" = 1 ]; then exit 1; fi
exit 0
