#!/usr/bin/env bash
# ezk-archive — LE PORTIER : diagnostics de clôture READ-ONLY.
#
# Deux modes, UNE SEULE collecte (c'est ce qui empêche les deux vues de diverger) :
#   --gate (défaut) : bloc machine borné, consommé par le skill `/ezk-archive`. Le skill
#                     lit `VERDICT:` et décide s'il traite la clôture lui-même (CLEAN) ou
#                     s'il délègue au sous-agent, scopé aux points signalés (DIRTY).
#   --full          : le rapport humain lisible — mêmes faits, autre rendu.
#
# CONTRAT DU GATE v1 (cf. fiche mega-city 0088) :
#   VERDICT: CLEAN                ⟺ P1..P4 tous CLEAN ET MAINSYNC ∈ {IN_SYNC,BEHIND,AHEAD_ABSORBED,NA}
#   VERDICT: DIRTY points=<n,…>   sous-ensemble croissant de {1,2,3,4}
#   Aucune ligne de fait `[Pn]` n'est émise pour un point CLEAN → ~12 lignes sur
#   une session disciplinée, au lieu des 120 de la version précédente.
#   Les libellés du gate sont ASCII (aucun piège d'encodage au `grep`) ; seules les
#   DONNÉES citées (chemins, titres de PR) gardent leurs accents. Les accents de
#   présentation sont réservés à `--full`.
#
#   ⚠ Exit 0 pour CLEAN COMME pour DIRTY ; exit 2 uniquement « pas un dépôt git ».
#     Le verdict passe par stdout, jamais par le code retour : un exit ≠ 0 serait rendu
#     comme une *erreur* par l'outil Bash et inviterait le LLM à enquêter — exactement
#     le gaspillage que ce portier supprime.
#
# RÈGLE CENTRALE — CLEAN uniquement sur PREUVE POSITIVE :
#   tout UNKNOWN, toute sonde en erreur, tout dépassement de borne ⇒ DIRTY.
#   Un faux CLEAN ferait sauter la délégation ET son rattrapage : c'est le seul risque grave.
#
# Usage : bash check.sh [--gate|--full] [--base <ref>] [--shipped <ids>] [--point <n>] [base]
#
# Strictement read-only : lectures git/gh uniquement. Ne commite, push, merge — ni
# **fetch** — JAMAIS : un fetch écrirait des refs et casserait la propriété que le DoD
# assert (test-check-gate.sh G7). Rafraîchir les refs est au skill ou à l'humain.

set -uo pipefail

# --- options ------------------------------------------------------------------
MODE="gate"; BASE=""; SHIPPED=""; ONLY_POINT=""
usage() {
  cat <<'USAGE'
check.sh — portier de clôture ezk-archive (read-only)

  --gate            bloc machine (DÉFAUT) : VERDICT + compteurs + faits des points DIRTY
  --full            rapport humain lisible
  --base <ref>      base de comparaison (défaut : main → master → HEAD)
  --shipped <ids>   ids de fiches livrées DÉCLARÉS par l'appelant (ex. 0089,0097)
                    « none » = déclaration explicite de « rien livré cette session ».
                    ABSENT ⇒ P3_BACKLOG: UNKNOWN ⇒ VERDICT: DIRTY (non-régression :
                    une session qui n'a pas tenu ses comptes ne peut pas déclarer,
                    donc elle tombe toujours dans le rituel complet).
  --point <n>       n'émet que les faits du point n (1..4) — usage du sous-agent
  -h, --help        cette aide
USAGE
}
while (( $# )); do
  case "$1" in
    --gate)    MODE="gate" ;;
    --full)    MODE="full" ;;
    --base)    BASE="${2:-}"; shift ;;
    --shipped) SHIPPED="${2:-}"; shift ;;
    --point)   ONLY_POINT="${2:-}"; shift ;;
    -h|--help) usage; exit 0 ;;
    --*)       echo "check.sh : option inconnue « $1 »" >&2; usage >&2; exit 2 ;;
    *)         [[ -z "$BASE" ]] && BASE="$1" ;;   # positionnel legacy conservé
  esac
  shift
done

# --- localiser le dépôt -------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2
  exit 2
fi
cd "$(git rev-parse --show-toplevel)" || exit 2
REPO="$(pwd)"

# --- branche de base + branche courante --------------------------------------
if [[ -z "$BASE" ]]; then
  for b in main master; do
    if git show-ref --verify --quiet "refs/heads/$b"; then BASE="$b"; break; fi
  done
fi
[[ -z "$BASE" ]] && BASE="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo HEAD)"
CUR="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse --short HEAD)"

HAS_REMOTE=0; [[ -n "$(git remote 2>/dev/null)" ]] && HAS_REMOTE=1
HAS_GH=0; command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1 && HAS_GH=1
# Un remote n'implique PAS des pull requests : un bare local (`file://`), un serveur git
# perso ou un GitLab n'en ont aucune que `gh` puisse lire. Sans cette distinction, on
# confond « je ne peux pas lire les PRs » (⇒ UNKNOWN, prudent) et « il n'y a pas de PRs
# à lire » (⇒ rien à prouver), et tout dépôt à remote non-GitHub tombe en DIRTY perpétuel.
HAS_PR_HOST=0
[[ "$HAS_REMOTE" -eq 1 ]] && git remote -v 2>/dev/null | grep -qE 'github\.com|github\.' && HAS_PR_HOST=1

# --- helpers d'accumulation ---------------------------------------------------
# Deux bornes, car une seule ne suffit pas : celle par point empêche un point bavard de
# noyer les autres, la globale garantit la taille totale de la sortie (4 points × 25
# feraient 100 lignes). Une sortie tronquée le DIT — un portier qui masque silencieusement
# ce qu'il a vu produirait exactement le faux CLEAN qu'on cherche à rendre impossible.
MAX_FACTS=25                  # borne par point
MAX_TOTAL_FACTS=47            # borne globale (+ 12 d'en-tête + 1 de troncature = 60 max)
add_fact() { # $1=tag (P1/P2/P3/P4/MAINSYNC) $2=texte
  local var="FACTS_$1"
  printf -v "$var" '%s%s\n' "${!var:-}" "[$1] $2"
}
bounded() { # $1=texte multi-lignes → tronqué à MAX_FACTS avec un compteur du reste
  local txt="$1" n
  [[ -z "$txt" ]] && return 0
  n="$(printf '%s' "$txt" | grep -c '' )"
  if (( n > MAX_FACTS )); then
    printf '%s' "$txt" | head -n "$MAX_FACTS"
    echo "[...] +$(( n - MAX_FACTS )) autres faits omis (borne MAX_FACTS=$MAX_FACTS)"
  else
    printf '%s' "$txt"
  fi
}

FACTS_P1=""; FACTS_P2=""; FACTS_P3=""; FACTS_P4=""; FACTS_MAINSYNC=""

# ==============================================================================
# COLLECTE
# ==============================================================================

# --- 1. working tree ----------------------------------------------------------
# -uall : déplie les dossiers untracked (un ADR dans un dossier neuf reste visible
# fichier-par-fichier, pas replié en `?? dir/`) — cohérent avec « ne rien perdre ».
PORC="$(git status --porcelain -uall 2>/dev/null)"
STASH="$(git stash list 2>/dev/null)"
P1_MOD="$(printf '%s' "$PORC" | grep -cv '^??' 2>/dev/null || true)"
P1_UNTRACKED="$(printf '%s' "$PORC" | grep -c '^??' 2>/dev/null || true)"
[[ -z "$PORC" ]] && { P1_MOD=0; P1_UNTRACKED=0; }
P1_STASH="$(printf '%s' "$STASH" | grep -c '' 2>/dev/null || true)"
[[ -z "$STASH" ]] && P1_STASH=0
if (( P1_MOD == 0 && P1_UNTRACKED == 0 && P1_STASH == 0 )); then P1_STATE="CLEAN"; else P1_STATE="DIRTY"; fi
if [[ "$P1_STATE" == "DIRTY" ]]; then
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P1 "worktree $l"; done <<< "$PORC"
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P1 "stash $l"; done <<< "$STASH"
fi

# --- 2. PRs & branches non-mergées -------------------------------------------
# Sur un repo à convention SQUASH-MERGE, `git branch --no-merged` MENT : les commits
# de branche ne sont jamais ancêtres de la base, donc les branches restent signalées
# « non-mergées » alors que 100 % de leur contenu est livré (fiche 0076). Classification
# DÉTERMINISTE (le script prouve, le LLM ne devine pas — ADR-0001) :
#   ABSORBÉE si (a) merger la ref ne changerait RIEN à la base (merge-tree), ou
#   (b) chaque fichier touché a son contenu exact (blob) INTRODUIT dans la base APRÈS
#   le point de fourche (= le squash a atterri, même si la base a évolué depuis), les
#   suppressions étant absentes de la base. Sinon RÉELLE.
#   ⚠ La preuve (b) est bornée à la fenêtre post-fourche mb..base ET exige qu'un commit
#   trouvé CONTIENNE le blob (finding Codex PR #31) : un blob réutilisé depuis le vieil
#   historique (revert, rename pur, contenu dupliqué) ne prouve RIEN — sans ces bornes,
#   une branche de revert serait « absorbée » à tort et sa purge perdrait du travail réel.
#
# PARAMÉTRÉE en <base> <ref> (elle était figée sur $BASE) : c'est ce qui permet de
# réutiliser TEL QUEL cet algorithme déjà testé pour la garde `main` vs `origin/main`
# ci-dessous — la garde anti-faux-positif n'est donc pas du code neuf, mais un 2ᵉ appel.
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
    #
    # ⚠ La preuve doit être PATH-PRESERVING (finding Codex PR #56). Chercher le blob
    # « n'importe où dans l'arbre » suffisait à déclarer absorbé un fichier dont le contenu
    # existe ailleurs sous un AUTRE nom — et deux fichiers VIDES partagent le même blob,
    # donc n'importe quel fichier vide en amont « prouvait » n'importe quel fichier vide
    # local. Sur MAINSYNC, ça produisait un `resync_safe=1` dont le reset --hard aurait
    # supprimé un fichier local unique : une perte de données recommandée par l'outil.
    #
    # Vérifier le chemin exact règle au passage le cas du commit qui a RETIRÉ le blob
    # (il matche `--find-object` mais `rev-parse <commit>:<chemin>` échoue), ce que
    # l'ancien `ls-tree | grep` traitait de façon détournée.
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

P2_PR_OPEN=0; P2_REAL=0; P2_ABSORBED=0; P2_WT_PRUNABLE=0
# Deux accumulateurs pour la MÊME collecte : `*_LIST` = rendu humain multi-lignes
# (--full, dont les libellés sont assertés par test-check-branches.sh), `*_FACTS` =
# une ligne par branche pour le gate, avec `unproven=` inline (contrat v1).
PR_LIST=""; REAL_LIST=""; ABSORBED_LIST=""; P2_NOTE=""
REAL_FACTS=""; ABSORBED_FACTS=""
P2_UNVERIFIABLE=0        # 1 = des PRs peuvent exister et on ne peut pas les lire
if [[ "$HAS_PR_HOST" -eq 1 && "$HAS_GH" -eq 1 ]]; then
  # ⚠ Le CODE RETOUR compte autant que la sortie (finding Codex PR #56) : une panne
  # réseau, un droit manquant ou un remote non résolvable rendent `gh pr list` vide en
  # échec — indiscernable d'un « aucune PR ouverte » si on ne regarde que stdout. On
  # aurait alors un CLEAN non prouvé, exactement ce que ce portier interdit.
  if PR_LIST="$(gh pr list --state open \
        --json number,title,headRefName,isDraft \
        --jq '.[] | "#\(.number) \(.headRefName) — \(.title)\(if .isDraft then " [draft]" else "" end)"' \
        2>/dev/null)"; then
    [[ -n "$PR_LIST" ]] && P2_PR_OPEN="$(printf '%s' "$PR_LIST" | grep -c '')"
  else
    PR_LIST=""
    P2_UNVERIFIABLE=1
    P2_NOTE="gh pr list a ECHOUE (reseau / droits / remote non resolvable) — PRs NON verifiees"
  fi
elif [[ "$HAS_PR_HOST" -eq 1 ]]; then
  # Seul cas réellement indécidable : l'hôte a des PRs, mais on n'a pas de quoi les lire.
  P2_UNVERIFIABLE=1
  P2_NOTE="remote GitHub mais gh indisponible/non authentifie — PRs NON verifiees"
elif [[ "$HAS_REMOTE" -eq 1 ]]; then
  P2_NOTE="remote non-GitHub — aucune PR a verifier ; on s'appuie sur les branches locales"
else
  P2_NOTE="repo local-only (pas de remote) — pas de PRs ; on s'appuie sur les branches locales"
fi

# NB `+` = branche tenue par un AUTRE worktree (git branch la préfixe ainsi) : on la
# classe comme les autres, mais sa suppression exige d'abord `git worktree remove`.
UNMERGED="$(git branch --no-merged "$BASE" 2>/dev/null | sed 's/^[*+ ] *//' | grep -v "^$BASE$" || true)"
WT_HELD="$(git branch --no-merged "$BASE" 2>/dev/null | grep '^+' | sed 's/^+ *//' || true)"
if [[ -n "$UNMERGED" ]]; then
  while IFS= read -r b; do
    [[ -z "$b" ]] && continue
    verdict="$(classify_ref "$BASE" "$b")"
    last="$(git log -1 --format='%h %s (%cr)' "$b" 2>/dev/null)"
    wtmark=""
    grep -qx "$b" <<< "$WT_HELD" && wtmark=" [worktree — remove d'abord]"
    wtflag=""; [[ -n "$wtmark" ]] && wtflag=" worktree_held=1"
    if [[ "$verdict" == "ABSORBEE" ]]; then
      P2_ABSORBED=$(( P2_ABSORBED + 1 ))
      ABSORBED_LIST="${ABSORBED_LIST}    $b${wtmark} — $last"$'\n'
      ABSORBED_FACTS="${ABSORBED_FACTS}branch ABSORBED $b $last${wtflag} safe_delete=1"$'\n'
    else
      P2_REAL=$(( P2_REAL + 1 ))
      REAL_LIST="${REAL_LIST}    $b${wtmark} — $last"$'\n'
      unproven_csv=""
      [[ "$verdict" != "REELLE" ]] && {
        REAL_LIST="${REAL_LIST}        non prouvé dans $BASE :${verdict#REELLE}"$'\n'
        unproven_csv=" unproven=$(echo ${verdict#REELLE} | tr ' ' ',')"
      }
      REAL_FACTS="${REAL_FACTS}branch REAL $b $last${wtflag}${unproven_csv}"$'\n'
    fi
  done <<< "$UNMERGED"
fi

# worktrees orphelins (read-only : --dry-run n'écrit rien)
WT_PRUNE="$(git worktree prune --dry-run -v 2>/dev/null)"
[[ -n "$WT_PRUNE" ]] && P2_WT_PRUNABLE="$(printf '%s' "$WT_PRUNE" | grep -c '')"

# Une PR ouverte ou une branche RÉELLE = du pending à ne pas perdre ⇒ DIRTY.
# Une branche ABSORBÉE n'est PAS du pending (c'est la fausse alerte que la fiche 0076
# a tuée) : elle est signalée pour purge, mais ne dégrade pas le verdict.
if (( P2_UNVERIFIABLE == 1 )); then
  P2_STATE="UNKNOWN"          # des PRs peuvent exister sans qu'on puisse les lire ⇒ pas de preuve
elif (( P2_PR_OPEN == 0 && P2_REAL == 0 )); then
  P2_STATE="CLEAN"
else
  P2_STATE="DIRTY"
fi
if [[ "$P2_STATE" != "CLEAN" ]]; then
  [[ -n "$P2_NOTE" ]] && add_fact P2 "note $P2_NOTE"
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P2 "pr $l"; done <<< "$PR_LIST"
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P2 "$l"; done <<< "$REAL_FACTS"
  # Absorbées et worktrees orphelins : ce ne sont PAS du pending (c'est la fausse alerte
  # que la fiche 0076 a tuée, elles ne dégradent pas le verdict) — mais puisqu'on délègue
  # de toute façon, autant donner au sous-agent les purges sûres qu'il peut faire.
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P2 "$l"; done <<< "$ABSORBED_FACTS"
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P2 "worktree PRUNABLE $l"; done <<< "$WT_PRUNE"
fi
# Si P2 est CLEAN, les compteurs `branch_absorbed=` / `worktree_prunable=` de la ligne
# P2_PENDING suffisent : le contrat interdit toute ligne de fait pour un point CLEAN.

# --- MAINSYNC : la garde anti-faux-positif `main` vs `origin/main` -------------
# Deux occurrences en deux jours d'un verdict « main diverge RÉELLEMENT, ne pas resync »
# qui était faux (fiche 0088). Cause : sur un repo 100 % squash-merge, toute ref livrée
# diverge TEXTUELLEMENT par construction. On applique donc à `main` le test de contenu
# déjà écrit et déjà testé pour les branches (classify_ref) :
#   volet A — position  : ahead=0 ⇒ le mot « diverge » est structurellement impossible.
#   volet B — contenu   : ahead>0 ⇒ le contenu local a-t-il ATTERRI dans origin ?
MS_AHEAD=0; MS_BEHIND=0; MS_STALE=0; MAINSYNC_STATE="NA"
if [[ "$HAS_REMOTE" -eq 1 ]] && git rev-parse --verify --quiet "origin/$BASE" >/dev/null 2>&1 \
   && git show-ref --verify --quiet "refs/heads/$BASE"; then
  read -r MS_BEHIND MS_AHEAD < <(git rev-list --left-right --count "origin/$BASE...$BASE" 2>/dev/null || echo "0 0")
  # fraîcheur de la ref : sans fetch récent, « ahead » peut n'être qu'un retard de vue.
  GITCOMMON="$(git rev-parse --git-common-dir 2>/dev/null)"
  if [[ ! -f "$GITCOMMON/FETCH_HEAD" ]] \
     || [[ -n "$(find "$GITCOMMON" -maxdepth 1 -name FETCH_HEAD -mtime +0 2>/dev/null)" ]]; then
    MS_STALE=1
  fi
  if (( MS_AHEAD == 0 && MS_BEHIND == 0 )); then
    MAINSYNC_STATE="IN_SYNC"
  elif (( MS_AHEAD == 0 )); then
    MAINSYNC_STATE="BEHIND"          # jamais « diverge » : rien de local à perdre
  elif (( MS_STALE == 1 )); then
    MAINSYNC_STATE="UNKNOWN"         # ahead sur une vue périmée ⇒ on ne conclut pas
    add_fact MAINSYNC "stale_ref=1 (FETCH_HEAD absent ou > 24 h) — fetch avant de conclure"
  elif (( MS_AHEAD > 50 )); then
    MAINSYNC_STATE="UNKNOWN"
    add_fact MAINSYNC "too_large ahead=$MS_AHEAD (> 50) — preuve de contenu non tentee"
  else
    MS_MB="$(git merge-base "origin/$BASE" "$BASE" 2>/dev/null)"
    MS_NFILES="$(git diff --name-only -M "$MS_MB" "$BASE" 2>/dev/null | grep -c '' || true)"
    if (( MS_NFILES > 200 )); then
      MAINSYNC_STATE="UNKNOWN"
      add_fact MAINSYNC "too_large files=$MS_NFILES (> 200) — preuve de contenu non tentee"
    else
      MS_VERDICT="$(classify_ref "origin/$BASE" "$BASE")"
      if [[ "$MS_VERDICT" == "ABSORBEE" ]]; then
        MAINSYNC_STATE="AHEAD_ABSORBED"
        add_fact MAINSYNC "resync_safe=1 — tout le contenu local a atterri dans origin/$BASE"
      else
        MAINSYNC_STATE="DIVERGED_UNPROVEN"
        MS_UNPROVEN="${MS_VERDICT#REELLE}"
        add_fact MAINSYNC "unproven=$(echo $MS_UNPROVEN | tr ' ' ',')"
        # Corroboration two-dot, émise comme FAIT et jamais comme décision :
        # le diffstat est une HEURISTIQUE (mise en défaut par un changement qui ajoute
        # ET supprime) ; seule la preuve blob-landed ci-dessus décide.
        MS_STAT="$(git diff --shortstat "origin/$BASE" "$BASE" -- $MS_UNPROVEN 2>/dev/null)"
        [[ -n "$MS_STAT" ]] && add_fact MAINSYNC "diffstat(heuristique, ne decide pas) :$MS_STAT"
      fi
    fi
  fi
fi

# --- 3. Backlog : les fiches DÉCLARÉES livrées le sont-elles vraiment ? --------
# Le portier ne DÉCOUVRE pas ce qui aurait dû être shippé (ça, c'est du jugement, et
# c'est le travail d'ezk-backlog) : il VÉRIFIE ce que l'appelant AFFIRME. Sans
# déclaration, il n'a aucune preuve ⇒ UNKNOWN ⇒ DIRTY (fiche 0088, piste 1).
# `declared=-` (rien déclaré) est distinct de `declared=none` (« rien livré », déclaré).
P3_STATE="UNKNOWN"; P3_DECLARED="${SHIPPED:--}"
if [[ -z "$SHIPPED" ]]; then
  add_fact P3 "aucun --shipped fourni : impossible de prouver la coherence du backlog"
elif [[ "$SHIPPED" == "none" ]]; then
  P3_STATE="CLEAN"; P3_DECLARED="none"
else
  P3_STATE="CLEAN"
  # Les numéros ne sont PAS uniques dans un monorepo à plusieurs backlogs : 62 numéros
  # existent des DEUX côtés ici (`features/0005-…` et `products/mega-city/features/0005-…`).
  # Jeter le préfixe et prendre le premier match global validait donc potentiellement la
  # MAUVAISE fiche — et déclarait CLEAN un backlog non réparé (finding Codex PR #56).
  #
  # Convention du dépôt (miroir de bin/plan-head.ts, ADR-0017 A13) : l'EMPLACEMENT fait le
  # produit, le préfixe distingue l'id. Sans préfixe ⇒ backlog racine ; `xx-` ⇒ le backlog
  # produit dont les initiales du nom donnent `xx` (mega-city → mc). Toute résolution
  # ambiguë ou inconnue est refusée plutôt que devinée.
  backlog_dir_for() { # $1=préfixe sans tiret ("" = racine) → chemin, ou "" si non résolu
    # Layout v2+ : BACKLOG.md = index généré ; README.md = guide (ou index legacy v1).
    local want="$1" d name init hits="" seen="|"
    _has_root_backlog() {
      { git ls-files 'features/BACKLOG.md' 2>/dev/null | grep -q . && [[ -f features/BACKLOG.md ]]; } \
        || { git ls-files 'features/README.md' 2>/dev/null | grep -q . && [[ -f features/README.md ]]; }
    }
    if [[ -z "$want" ]]; then
      _has_root_backlog && { echo "features"; return; }
      echo ""; return
    fi
    while IFS= read -r d; do
      [[ -z "$d" ]] && continue
      d="${d%/BACKLOG.md}"; d="${d%/README.md}"
      [[ "$d" == "features" ]] && continue                 # la racine n'a pas de préfixe
      [[ "$seen" == *"|$d|"* ]] && continue                # BACKLOG+README même dossier
      seen="${seen}${d}|"
      name="$(basename "$(dirname "$d")")"                 # products/<name>/features → <name>
      init="$(printf '%s' "$name" | awk -F- '{for(i=1;i<=NF;i++) printf substr($i,1,1)}')"
      [[ "$init" == "$want" ]] && hits="$hits $d"
    done < <(git ls-files '*features/BACKLOG.md' '*features/README.md' 2>/dev/null)
    set -- $hits
    (( $# == 1 )) && { echo "$1"; return; }                # non ambigu uniquement
    echo ""
  }
  IFS=',' read -ra _IDS <<< "$SHIPPED"
  for raw in "${_IDS[@]}"; do
    id="$(printf '%s' "$raw" | tr -d '[:space:]')"
    [[ -z "$id" ]] && continue
    num="${id##*-}"
    pfx=""; [[ "$id" == *-* ]] && pfx="${id%-*}"
    dir="$(backlog_dir_for "$pfx")"
    if [[ -z "$dir" ]]; then
      P3_STATE="DIRTY"
      add_fact P3 "declared $id : prefixe '${pfx:-<racine>}' non resolu en un backlog unique — id ambigu, verification impossible"
      continue
    fi
    found="$(git ls-files "$dir/done/${num}-*.md" 2>/dev/null | head -1)"
    if [[ -z "$found" ]]; then
      stray="$(git ls-files "$dir/${num}-*.md" 2>/dev/null | head -1)"
      P3_STATE="DIRTY"
      if [[ -n "$stray" ]]; then
        st="$(grep -m1 '^status:' "$stray" 2>/dev/null | sed 's/^status: *//;s/ *#.*//')"
        add_fact P3 "declared $id not shipped: found=$stray status=${st:-?} (attendu: $dir/done/ + status: shipped)"
      else
        add_fact P3 "declared $id introuvable dans $dir/"
      fi
    else
      st="$(grep -m1 '^status:' "$found" 2>/dev/null | sed 's/^status: *//;s/ *#.*//')"
      pr="$(grep -m1 '^pr:' "$found" 2>/dev/null | sed 's/^pr: *//')"
      if [[ "$st" != "shipped" ]]; then
        P3_STATE="DIRTY"; add_fact P3 "declared $id en done/ mais status=$st (attendu shipped) — $found"
      elif [[ -z "$pr" ]]; then
        P3_STATE="DIRTY"; add_fact P3 "declared $id shipped mais champ pr: vide — $found"
      fi
    fi
  done
fi

# --- 4. ADR de la session -----------------------------------------------------
# (les points 5/6/7 = jugement/écriture, hors du ressort de ce helper read-only)
adr_filter='(^|/)(adr|adrs|decisions)/|(^|/)adr[-_][^/]*\.md$|[-_]adr\.md$'
COMMITTED_ADR="$(git log "$BASE"..HEAD --name-only --pretty=format: 2>/dev/null \
                 | grep -Ei "$adr_filter" | sort -u || true)"
WT_ADR="$( { git diff --name-only 2>/dev/null; \
             git diff --name-only --cached 2>/dev/null; \
             git ls-files --others --exclude-standard 2>/dev/null; } \
           | grep -Ei "$adr_filter" | sort -u || true)"
P4_COMMITTED=0; P4_UNCOMMITTED=0
[[ -n "$COMMITTED_ADR" ]] && P4_COMMITTED="$(printf '%s' "$COMMITTED_ADR" | grep -c '')"
[[ -n "$WT_ADR" ]] && P4_UNCOMMITTED="$(printf '%s' "$WT_ADR" | grep -c '')"
if (( P4_COMMITTED == 0 && P4_UNCOMMITTED == 0 )); then P4_STATE="CLEAN"; else P4_STATE="DIRTY"; fi
if [[ "$P4_STATE" == "DIRTY" ]]; then
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P4 "uncommitted $l"; done <<< "$WT_ADR"
  while IFS= read -r l; do [[ -n "$l" ]] && add_fact P4 "pending-merge $l (commite sur $CUR, pas dans $BASE)"; done <<< "$COMMITTED_ADR"
fi

# --- Note de handoff (métadonnées seulement) ----------------------------------
# La version précédente dumpait ici toutes les « refs » du handoff via une regex : 96
# lignes sur 120 de bruit (`todo`, `main`, `run`, `INIT_CWD`…), proportionnel à la
# taille du fichier. Sa seule raison d'être — alimenter la purge « entrée entièrement
# résolue » — disparaît avec l'anneau FIFO de handoff.sh. On n'émet plus que le compte.
HANDOFF_FILE=".claude/handoff.md"
H_ENTRIES=0; H_LINES=0; H_BYTES=0; H_IGNORED=0; H_ROTATE=0
git check-ignore -q "$HANDOFF_FILE" 2>/dev/null && H_IGNORED=1
if [[ -f "$HANDOFF_FILE" ]]; then
  H_ENTRIES="$(grep -c '^## ' "$HANDOFF_FILE" 2>/dev/null || true)"
  H_LINES="$(grep -c '' "$HANDOFF_FILE" 2>/dev/null || true)"
  H_BYTES="$(wc -c < "$HANDOFF_FILE" 2>/dev/null | tr -d ' ')"
  (( H_ENTRIES >= ${EZK_HANDOFF_KEEP:-3} )) && H_ROTATE=1
fi

# ==============================================================================
# VERDICT
# ==============================================================================
POINTS=""
for n in 1 2 3 4; do
  eval "st=\$P${n}_STATE"
  [[ "$st" != "CLEAN" ]] && POINTS="${POINTS:+$POINTS,}$n"
done
# MAINSYNC n'est pas un point numéroté : une divergence non prouvée est du pending de
# ref, donc elle dégrade le point 2 (« ne rien perdre »). Les faits restent sous [MAINSYNC].
case "$MAINSYNC_STATE" in
  IN_SYNC|BEHIND|AHEAD_ABSORBED|NA) ;;
  *) [[ ",$POINTS," != *",2,"* ]] && POINTS="$(printf '%s\n' "${POINTS:+$POINTS,}2" | tr ',' '\n' | sort -n | paste -sd, -)" ;;
esac
if [[ -z "$POINTS" ]]; then VERDICT="CLEAN"; else VERDICT="DIRTY"; fi

# ==============================================================================
# ÉMISSION
# ==============================================================================
if [[ "$MODE" == "gate" ]]; then
  echo "# ezk-archive gate v1"
  if [[ "$VERDICT" == "CLEAN" ]]; then echo "VERDICT: CLEAN"; else echo "VERDICT: DIRTY points=$POINTS"; fi
  echo "REPO: $REPO"
  echo "BRANCH: $CUR   BASE: $BASE"
  echo "P1_TREE: $P1_STATE modified=$P1_MOD untracked=$P1_UNTRACKED stash=$P1_STASH"
  echo "P2_PENDING: $P2_STATE pr_open=$P2_PR_OPEN branch_real=$P2_REAL branch_absorbed=$P2_ABSORBED worktree_prunable=$P2_WT_PRUNABLE"
  P3_TAIL=""; [[ "$P3_STATE" == "CLEAN" ]] && P3_TAIL=" all_shipped=1"
  echo "P3_BACKLOG: $P3_STATE declared=${P3_DECLARED:-none}$P3_TAIL"
  echo "P4_ADR: $P4_STATE committed=$P4_COMMITTED uncommitted=$P4_UNCOMMITTED"
  echo "MAINSYNC: $MAINSYNC_STATE ahead=$MS_AHEAD behind=$MS_BEHIND stale_ref=$MS_STALE"
  echo "HANDOFF: entries=$H_ENTRIES lines=$H_LINES bytes=$H_BYTES gitignored=$H_IGNORED rotate=$H_ROTATE"
  echo "NOTE: points 5 (memoire) / 6 (handoff) / 7 (verdict) ne sont PAS couverts par ce gate"
  ALL_FACTS=""
  for tag in P1 P2 P3 P4 MAINSYNC; do
    [[ -n "$ONLY_POINT" && "$tag" != "P$ONLY_POINT" ]] && continue
    eval "f=\$FACTS_$tag"
    [[ -n "$f" ]] && ALL_FACTS="${ALL_FACTS}$(bounded "$f")"$'\n'
  done
  if [[ -n "$ALL_FACTS" ]]; then
    N_ALL="$(printf '%s' "$ALL_FACTS" | grep -c '')"
    if (( N_ALL > MAX_TOTAL_FACTS )); then
      printf '%s' "$ALL_FACTS" | head -n "$MAX_TOTAL_FACTS"
      echo "[...] +$(( N_ALL - MAX_TOTAL_FACTS )) lignes omises (borne MAX_TOTAL_FACTS=$MAX_TOTAL_FACTS) — relancer avec --point <n> pour le detail"
    else
      printf '%s' "$ALL_FACTS"
    fi
  fi
  echo "--- END ---"
  exit 0
fi

# --- rendu humain (mêmes variables, autre présentation) -----------------------
echo "# ezk-archive — rapport de clôture (read-only)"
echo "branche courante : $CUR   ·   base : $BASE"
echo

echo "## 1. Working tree"
if (( P1_MOD == 0 && P1_UNTRACKED == 0 )); then
  echo "✓ propre (rien d'uncommitted/untracked)."
else
  echo "⚠ changements non commités / non suivis :"
  echo "$PORC" | sed 's/^/    /'
fi
if (( P1_STASH > 0 )); then
  echo "⚠ stash(es) en attente :"
  echo "$STASH" | sed 's/^/    /'
else
  echo "✓ aucun stash orphelin."
fi
echo

echo "## 2. PRs & branches en attente"
if [[ "$HAS_PR_HOST" -eq 1 && "$HAS_GH" -eq 1 ]]; then
  if [[ -n "$PR_LIST" ]]; then echo "⚠ PRs ouvertes :"; echo "$PR_LIST" | sed 's/^/    /'; else echo "✓ aucune PR ouverte."; fi
elif [[ "$HAS_PR_HOST" -eq 1 ]]; then
  echo "⚠ remote GitHub mais gh indisponible/non authentifié — PRs NON vérifiées, à voir à la main."
elif [[ "$HAS_REMOTE" -eq 1 ]]; then
  echo "ℹ remote non-GitHub — aucune PR à vérifier ; on s'appuie sur les branches locales."
else
  echo "ℹ repo local-only (pas de remote) — pas de PRs ; on s'appuie sur les branches locales."
fi
if [[ -n "$UNMERGED" ]]; then
  if [[ -n "$REAL_LIST" ]]; then
    echo "⚠ branches locales avec du contenu NON livré dans $BASE (le vrai pending) :"
    printf '%s' "$REAL_LIST"
  else
    echo "✓ aucune branche locale avec du contenu non livré."
  fi
  if [[ -n "$ABSORBED_LIST" ]]; then
    echo "ℹ branches locales ABSORBÉES (contenu prouvé dans $BASE — résidu squash-merge,"
    echo "  suppression sûre : \`git branch -D <nom>\`, récupérable via reflog ~90 j) :"
    printf '%s' "$ABSORBED_LIST"
  fi
else
  echo "✓ aucune branche locale non-mergée dans $BASE."
fi
if [[ -n "$WT_PRUNE" ]]; then
  echo "ℹ worktrees orphelins (purge sûre : \`git worktree prune\`) :"
  echo "$WT_PRUNE" | sed 's/^/    /'
fi
echo

echo "## Synchro de $BASE avec origin/$BASE"
case "$MAINSYNC_STATE" in
  NA)      echo "ℹ pas de remote ou pas d'origin/$BASE — sans objet." ;;
  IN_SYNC) echo "✓ à jour (ahead=0 behind=0)." ;;
  BEHIND)  echo "ℹ en retard de $MS_BEHIND commit(s), rien de local en avance — \`git merge --ff-only\` est sûr." ;;
  AHEAD_ABSORBED)
    echo "✓ $MS_AHEAD commit(s) locaux en avance, mais TOUT leur contenu a atterri dans origin/$BASE"
    echo "  (résidu squash-merge) — resync sûr. ⚠ Ne PAS rapporter « diverge réellement »." ;;
  DIVERGED_UNPROVEN)
    echo "⚠ $MS_AHEAD commit(s) locaux dont le contenu n'est PAS prouvé dans origin/$BASE :"
    printf '%s' "$FACTS_MAINSYNC" | sed 's/^\[MAINSYNC\] /    /' ;;
  UNKNOWN)
    echo "ℹ indéterminable en l'état :"
    printf '%s' "$FACTS_MAINSYNC" | sed 's/^\[MAINSYNC\] /    /' ;;
esac
echo

echo "## 3. Backlog (fiches déclarées livrées)"
case "$P3_STATE" in
  CLEAN)   echo "✓ déclaré : ${P3_DECLARED} — tout est en features/done/ avec status: shipped." ;;
  UNKNOWN) echo "ℹ aucun --shipped fourni : cohérence du backlog non vérifiable ici (délègue à ezk-backlog)." ;;
  *)       echo "⚠ écarts entre le déclaré et le backlog :"
           printf '%s' "$FACTS_P3" | sed 's/^\[P3\] /    /' ;;
esac
echo

echo "## 4. ADR de la session"
if (( P4_COMMITTED == 0 && P4_UNCOMMITTED == 0 )); then
  echo "✓ aucun ADR créé/modifié détecté sur $BASE..HEAD ni dans le working tree."
else
  if [[ -n "$WT_ADR" ]]; then
    echo "⚠ ADR non commités (working tree) — à committer :"
    echo "$WT_ADR" | sed 's/^/    /'
  fi
  if [[ -n "$COMMITTED_ADR" ]]; then
    echo "ℹ ADR commités sur $CUR mais pas encore dans $BASE — pending tant que la branche/PR n'est pas mergée :"
    echo "$COMMITTED_ADR" | sed 's/^/    /'
  fi
fi
echo

echo "## Note de handoff (fichier persistant)"
if (( H_IGNORED == 1 )); then
  echo "✓ $HANDOFF_FILE couvert par .gitignore."
else
  echo "⚠ $HANDOFF_FILE n'est PAS ignoré — \`handoff.sh add\` ajoutera l'entrée avant d'écrire."
fi
if [[ -f "$HANDOFF_FILE" ]]; then
  echo "ℹ $H_ENTRIES entrée(s), $H_LINES lignes, $H_BYTES octets$( (( H_ROTATE == 1 )) && echo " — rotation au prochain \`add\`")."
else
  echo "ℹ $HANDOFF_FILE absent — sera créé au premier \`run\`."
fi
echo

if [[ "$VERDICT" == "CLEAN" ]]; then
  echo "— VERDICT : CLEAN. Aucun point de contrôle en suspens."
else
  echo "— VERDICT : DIRTY (points $POINTS). Voir ci-dessus."
fi
echo "— fin du rapport read-only. Aucune modification effectuée."
