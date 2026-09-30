#!/usr/bin/env bash
# find-only-guard.sh — preuve MÉCANIQUE qu'une passe ezk-scout n'a rien modifié
# (fiche 20260910165637000). Trouver et rapporter, jamais corriger : ce script prend une
# photo du ou des dépôts AVANT la passe, puis la rejoue APRÈS et compare.
#
# Ce que la photo contient (pourquoi un simple `git status` ne suffit pas : si la passe
# COMMITTE, le worktree paraît propre alors que le contrat est violé) :
#   head / tree — le commit et l'arbre courants ;
#   refs        — toutes les branches et tags locaux (attrape un commit sur une autre branche) ;
#   status      — chaque fichier suivi modifié/supprimé et chaque fichier non suivi (donc toute
#                 fiche créée dans features/), avec le hash de son contenu : un WIP qui existait
#                 déjà est toléré tant qu'il ne bouge pas.
# Les fichiers IGNORÉS par git (état applicatif, caches, logs) ne comptent pas : ce n'est pas
# du code produit. Surveille aussi le dépôt du backlog s'il est distinct de la cible.
#
# Usage :
#   find-only-guard.sh snapshot <dépôt>... > instantané.txt   # AVANT la passe
#   find-only-guard.sh verify   instantané.txt                # APRÈS — code 0 = OK, 1 = VIOLÉ
# Sortie de verify : UNE ligne « find-only : OK — … » ou « find-only : VIOLÉ — … » + le détail.
# Codes : 0 OK · 1 violation · 2 erreur d'usage ou d'environnement.
set -uo pipefail

# Lecture seule : ne pas rafraîchir l'index (évite de gêner une session git concurrente).
export GIT_OPTIONAL_LOCKS=0

HEADER='# ezk-scout find-only snapshot v1'

die() { echo "find-only-guard : $*" >&2; exit 2; }

usage() {
  cat >&2 <<'EOF'
Usage : find-only-guard.sh snapshot <dépôt>...   (écrit l'instantané sur stdout)
        find-only-guard.sh verify <instantané>   (compare à l'état actuel)
EOF
}

# Bloc canonique de l'état d'un dépôt (racine absolue en argument), sur stdout.
canon() {
  local top="$1" head tree refs xy path h
  head="$(git -C "$top" rev-parse --verify -q HEAD 2>/dev/null || echo NONE)"
  tree="$(git -C "$top" rev-parse --verify -q 'HEAD^{tree}' 2>/dev/null || echo NONE)"
  refs="$(git -C "$top" for-each-ref --format='%(refname) %(objectname)' refs/heads refs/tags \
    | git hash-object --stdin)"
  echo "repo=$top"
  echo "head=$head"
  echo "tree=$tree"
  echo "refs=$refs"
  git -C "$top" status --porcelain=v1 -z --no-renames --untracked-files=all \
    | while IFS= read -r -d '' rec; do
        xy="${rec:0:2}"
        xy="${xy// /_}" # ' M' -> '_M' : un code sans espace reste un seul champ pour awk
        path="${rec:3}"
        if [ -f "$top/$path" ] || [ -L "$top/$path" ]; then
          h="$(git -C "$top" hash-object -- "$path" 2>/dev/null || echo ILLISIBLE)"
        else
          h=ABSENT
        fi
        echo "status $xy $h $path"
      done | LC_ALL=C sort
  echo "end"
}

cmd_snapshot() {
  [ $# -ge 1 ] || { usage; exit 2; }
  local d top
  echo "$HEADER"
  for d in "$@"; do
    top="$(git -C "$d" rev-parse --show-toplevel 2>/dev/null)" \
      || die "« $d » n'est pas un dépôt git"
    canon "$top"
  done
}

# Compare deux états canoniques ($1 = avant, $2 = après, en texte) et liste les écarts lisibles.
explain() {
  { printf '%s\n' "$1"; echo '@@APRES@@'; printf '%s\n' "$2"; } | awk '
    BEGIN { side = 1 }
    function short(s) { return substr(s, 1, 7) }
    /^@@APRES@@$/ { side = 2; next }
    /^repo=/ { repo = substr($0, 6); repos[repo] = 1; next }
    /^(head|tree|refs)=/ {
      k = $0; sub(/=.*/, "", k); v = $0; sub(/^[a-z]+=/, "", v); val[side, repo, k] = v; next
    }
    /^status / {
      xy = $2; h = $3; p = $0; sub(/^status [^ ]+ [^ ]+ /, "", p)
      st[side, repo, p] = xy " " h; paths[repo, p] = 1; next
    }
    END {
      for (r in repos) {
        if (val[1, r, "head"] != val[2, r, "head"])
          printf "  %s : head %s -> %s (un commit a été créé ou la branche a bougé)\n", r, short(val[1, r, "head"]), short(val[2, r, "head"])
        if (val[1, r, "tree"] != val[2, r, "tree"])
          printf "  %s : arbre du commit changé\n", r
        if (val[1, r, "refs"] != val[2, r, "refs"])
          printf "  %s : refs locales changées (branche ou tag créé, déplacé ou supprimé)\n", r
      }
      for (key in paths) {
        split(key, parts, SUBSEP); r = parts[1]; p = parts[2]
        a = st[1, r, p]; b = st[2, r, p]
        if (a == b) continue
        if (a == "") {
          split(b, bb, " ")
          what = (bb[1] == "??") ? "ajouté (fichier non suivi)" : (bb[1] ~ /D/) ? "supprimé" : "modifié"
          printf "  %s : %s %s\n", r, p, what
        }
        else if (b == "") printf "  %s : %s — les modifications d origine ont été défaites\n", r, p
        else printf "  %s : %s modifié de nouveau\n", r, p
      }
    }' | LC_ALL=C sort
}

cmd_verify() {
  local snap="${1:-}" repos top before now="" n=0 label summary details
  [ -n "$snap" ] || { usage; exit 2; }
  [ -f "$snap" ] || die "instantané introuvable : $snap"
  [ "$(head -1 "$snap")" = "$HEADER" ] || die "instantané illisible (en-tête inattendu) : $snap"
  repos="$(grep '^repo=' "$snap" | sed 's/^repo=//')"
  [ -n "$repos" ] || die "instantané sans dépôt : $snap"
  before="$(grep -v '^#' "$snap")"
  summary=""
  while IFS= read -r top; do
    [ -d "$top" ] || die "le dépôt « $top » n'existe plus"
    now="$now$(canon "$top")"$'\n'
    n=$((n + 1))
    label="$(basename "$top") HEAD $(git -C "$top" rev-parse --short=7 HEAD 2>/dev/null || echo sans-commit)"
    summary="${summary:+$summary · }$label"
  done <<EOF
$repos
EOF
  now="${now%$'\n'}"
  if [ "$before" = "$now" ]; then
    echo "find-only : OK — $n dépôt$([ "$n" -gt 1 ] && echo s) · $summary · arbre, refs et worktree inchangés"
    exit 0
  fi
  details="$(explain "$before" "$now")"
  echo "find-only : VIOLÉ — la passe a modifié ce qu'elle devait seulement observer :"
  if [ -n "$details" ]; then printf '%s\n' "$details"; else echo "  (écart détecté mais non localisé)"; fi
  echo "  -> une passe ezk-scout trouve et rapporte, elle ne corrige ni ne committe ni ne crée de fiche."
  echo "  -> un fichier apparu dans le dépôt = l'app y écrit son état : pointe-le vers un dossier tmp."
  exit 1
}

case "${1:-}" in
  snapshot) shift; cmd_snapshot "$@" ;;
  verify)   shift; cmd_verify "$@" ;;
  *)        usage; exit 2 ;;
esac
