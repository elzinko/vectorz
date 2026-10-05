# shellcheck shell=bash
# lib-worktree-safety.sh — LA règle unique « copie voisine sans risque » (fiche 20261003011750521).
#
# Une copie voisine du dépôt (worktree) est SANS RISQUE quand deux choses tiennent ensemble :
#   1. son arbre est propre (aucune modification non commitée) ;
#   2. son contenu est déjà dans la base (merge-tree trivial, ou blob atterri après la fourche).
# Le checkout principal suit la même règle, sans cas à part.
#
# Sourçable par les DEUX portiers (ezk-archive/check.sh en dur, ezk-sprint/check.sh en best-effort).
# CONTRAT DE SOURCING : ce fichier ne fait QUE définir des fonctions. Aucun effet de bord au source
# (pas de `cd`, pas de `set`, aucun global posé, aucune base devinée). Chaque appelant passe ses bases
# de preuve en argument — la règle ne lit aucun global. Contrainte bash 3 / macOS (pas de `declare -A`,
# pas de `${x^^}`).
#
# API :
#   classify_ref <base> <ref>              → "ABSORBEE" | "REELLE <fichiers-non-prouvés>"
#   absorbed_by_any <ref> <base>...        → code 0 si le contenu de <ref> est dans l'une des bases
#   wt_proof_bases <base-nominale>         → imprime les refs de preuve EXISTANTES (origin/<b> puis <b>)
#   worktree_clean <chemin>                → code 0 si l'arbre de ce worktree est propre
#   worktree_safe_reason <chemin> <main> <base> <proof>... → un mot-clé, la raison :
#        principal | reserve | fusionnee            (SANS RISQUE — à ignorer / ne pas retirer)
#        dirty     | unmerged | detached-real       (À SIGNALER — vrai risque)

# --- preuve d'absorption (déplacée telle quelle depuis ezk-archive/check.sh) ------------------
# Sur un repo à convention SQUASH-MERGE, `git branch --no-merged` MENT : les commits de branche ne
# sont jamais ancêtres de la base, donc les branches restent « non-mergées » alors que 100 % de leur
# contenu est livré (fiche 0076). Classification DÉTERMINISTE (le script prouve, le LLM ne devine pas,
# ADR-0001) :
#   ABSORBÉE si (a) merger la ref ne changerait RIEN à la base (merge-tree), ou (b) chaque fichier
#   touché a son contenu exact (blob) INTRODUIT dans la base APRÈS le point de fourche (le squash a
#   atterri, même si la base a évolué depuis), les suppressions étant absentes de la base. Sinon RÉELLE.
#   ⚠ La preuve (b) est bornée à la fenêtre post-fourche mb..base ET exige qu'un commit trouvé
#   CONTIENNE le blob au MÊME CHEMIN (findings Codex PR #31 et #56) : un blob réutilisé depuis le vieil
#   historique (revert, rename pur, fichier vide) ne prouve RIEN — sans ces bornes, une branche de
#   revert serait « absorbée » à tort et sa purge perdrait du travail réel.
classify_ref() { # $1=base $2=ref → "ABSORBEE" | "REELLE <fichiers-non-prouvés>"
  local _base="$1" b="$2" mb base_tree merged_tree status path path2 blob unproven=""
  base_tree="$(git rev-parse "$_base^{tree}" 2>/dev/null)" || { echo "REELLE (base illisible)"; return; }
  # (a) fast-path : le merge ne changerait rien (git ≥ 2.38 ; sinon on passe au (b))
  merged_tree="$(git merge-tree --write-tree "$_base" "$b" 2>/dev/null | head -1)"
  if [[ -n "$merged_tree" && "$merged_tree" == "$base_tree" ]]; then echo "ABSORBEE"; return; fi
  # (b) le blob a-t-il ATTERRI dans la base après la fourche ?
  mb="$(git merge-base "$_base" "$b" 2>/dev/null)" || { echo "REELLE (merge-base introuvable)"; return; }
  blob_landed() { # $1=blob $2=chemin-au-tip-de-la-ref → 0 si prouvé dans la base
    # fast-path : contenu exact au même chemin au tip de la base (couvre aussi le rename pur)
    [[ "$(git rev-parse "$_base:$2" 2>/dev/null)" == "$1" ]] && return 0
    # sinon : un commit de la fenêtre post-fourche a-t-il porté ce contenu AU MÊME CHEMIN ?
    # La preuve doit être PATH-PRESERVING (finding Codex PR #56) : chercher le blob « n'importe où »
    # suffisait à déclarer absorbé un fichier dont le contenu existe ailleurs sous un autre nom, et
    # deux fichiers vides partagent le même blob. Vérifier le chemin exact règle aussi le cas du
    # commit qui a RETIRÉ le blob (il matche `--find-object` mais `rev-parse <commit>:<chemin>` échoue).
    local c
    while IFS= read -r c; do
      [[ -z "$c" ]] && continue
      [[ "$(git rev-parse "$c:$2" 2>/dev/null)" == "$1" ]] && return 0
    done < <(git log "$mb..$_base" --format=%H --find-object="$1" 2>/dev/null)
    return 1
  }
  while IFS=$'\t' read -r status path path2; do
    [[ -z "$status" ]] && continue
    case "$status" in
      D*) # suppression : absorbée si le fichier est absent de la base
          git cat-file -e "$_base:$path" 2>/dev/null && unproven="$unproven $path" ;;
      R*) # rename : prouver le blob au nouveau chemin
          blob="$(git rev-parse "$b:$path2" 2>/dev/null)" || { unproven="$unproven $path2"; continue; }
          blob_landed "$blob" "$path2" || unproven="$unproven $path2" ;;
      *)  blob="$(git rev-parse "$b:$path" 2>/dev/null)" || { unproven="$unproven $path"; continue; }
          blob_landed "$blob" "$path" || unproven="$unproven $path" ;;
    esac
  done < <(git diff --name-status -M "$mb" "$b" 2>/dev/null)
  if [[ -z "$unproven" ]]; then echo "ABSORBEE"; else echo "REELLE$unproven"; fi
}

# Le contenu de <ref> est-il absorbé dans AU MOINS UNE des bases passées ? (ARGUMENTÉE, pas de global.)
absorbed_by_any() { # $1=ref  $2..=bases de preuve → 0 si absorbée quelque part
  local ref="$1"; shift
  local base
  for base in "$@"; do
    [[ -z "$base" ]] && continue
    [[ "$(classify_ref "$base" "$ref")" == "ABSORBEE" ]] && return 0
  done
  return 1
}

# Les refs de preuve existantes pour une base nominale : origin/<base> d'abord (la plus à jour), puis
# la base locale. Un main local en retard ne fait plus crier « réel » dès que le contenu est sur l'une
# d'elles (fiche 20261002155911250). Ce helper ne fetch jamais : l'appelant rafraîchit origin avant.
wt_proof_bases() { # $1=base nominale (ex. "main") → imprime les refs existantes, une par ligne
  local base="$1"
  git show-ref --verify --quiet "refs/remotes/origin/$base" && echo "origin/$base"
  git show-ref --verify --quiet "refs/heads/$base" && echo "$base"
}

# L'arbre de ce worktree est-il propre ? (--no-optional-locks : ne rajeunit pas l'index d'un voisin.)
worktree_clean() { # $1=chemin du worktree → 0 si propre
  [[ -z "$(git --no-optional-locks -C "$1" status --porcelain 2>/dev/null)" ]]
}

# LA règle, rendue en un mot. `principal` = le checkout principal propre sur la base.
worktree_safe_reason() { # $1=chemin $2=chemin-principal $3=base  $4..=bases de preuve → un mot-clé
  local path="$1" main_path="$2" base="$3"; shift 3
  local br ref
  worktree_clean "$path" || { echo "dirty"; return; }
  br="$(git -C "$path" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  # Le checkout principal sur sa branche de base : le cas ultra-courant, nommé pour l'humain.
  if [[ "$path" == "$main_path" && ( "$br" == "$base" || "$br" == "main" || "$br" == "master" ) ]]; then
    echo "principal"; return
  fi
  ref="$br"; [[ -z "$ref" ]] && ref="$(git -C "$path" rev-parse HEAD 2>/dev/null)"
  if absorbed_by_any "$ref" "$@"; then
    [[ -n "$br" ]] && echo "fusionnee" || echo "reserve"
  else
    [[ -n "$br" ]] && echo "unmerged" || echo "detached-real"
  fi
}
