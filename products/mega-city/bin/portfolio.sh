#!/usr/bin/env bash
# Génère une VUE PORTFOLIO transverse (par produit) → PORTFOLIO.md à la racine.
# Lecture seule sur les front-matters (source de vérité) — ne modifie aucun backlog.
# Liste UNIQUE `features/` depuis la fiche 0064 (ADR-0017 A14) ; le produit vient du champ
# `product:` de chaque fiche. Cette vue regroupe / trie / compte les fiches par produit.
# Doctrine ADR-0001 : le script agrège/trie, le LLM juge. NE PAS éditer PORTFOLIO.md à la main.
#
# Usage : portfolio.sh [racine-vectorz]   (défaut : parent de products/, déduit de bin/)
set -euo pipefail

# Dossier de mega-city (parent de bin/), résolu AVANT le cd : $0 peut être relatif.
MC="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-"$(cd "$(dirname "$0")/../../.." && pwd)"}"
cd "$ROOT"
[ -d features ] || { echo "erreur: pas de features/ à la racine ${ROOT}" >&2; exit 1; }

SEP=$'\x1f'
OUT="PORTFOLIO.md"

# Lecture des fiches : par le loader testé (règle development/fiche-read-via-loader), jamais par un
# awk maison. `bin/fiche-rows.ts` imprime une ligne par fiche : id, title, type, prio, status, pr,
# created, version, PRODUIT, milestone (séparés par \x1f). Le produit vient du front-matter
# `product:` (liste unifiée `features/`, ADR-0017 A14) ; « vectorz » n'est qu'un repli si le champ
# manque (sinon toute fiche mega-city de la liste racine était comptée vectorz, retour Codex #128).
TSX="$MC/node_modules/.bin/tsx"
[ -x "$TSX" ] || { echo "erreur: tsx introuvable (${TSX}) — lancer « pnpm install »" >&2; exit 1; }

files=()
for f in features/[0-9]*.md; do
  if [ -e "$f" ]; then files+=("$f"); fi
done
rows=""
if [ "${#files[@]}" -gt 0 ]; then
  rows="$("$TSX" "$MC/bin/fiche-rows.ts" --default-product vectorz "${files[@]}")"$'\n'
fi

# Schéma des statuts — MIROIR de src/core/fiche-schema.ts (STATUT_DEFS), comme dans regen-backlog.sh.
# Gardé par le test de contrat src/__tests__/fiche-schema-contract.test.ts (ajouter un statut au schéma
# sans le mettre ici fait échouer la suite).
STATUT_LABELS='idea=💡 idea|ready=🔵 ready|in-progress=🟠 in-progress|shipped=✅ shipped|superseded=🗑️ superseded|merged=🔀 merged|split=🧩 split'

st_label() { # $1=statut → « emoji statut » ; « ❓ statut » si inconnu (le validateur le signale)
  local s="|${STATUT_LABELS}"
  case "$s" in
    *"|$1="*) s="${s#*"|$1="}"; echo "${s%%|*}";;
    *) echo "❓ $1";;
  esac
}

# emit_table : lit les lignes filtrées sur stdin, colonne Produit, tri déjà fait par l'appelant
emit_table() {
  echo '| Prod | # | Titre | Type | Prio | Statut | PR |'
  echo '|------|---|-------|------|------|--------|----|'
  while IFS="$SEP" read -r id title type prio status pr created version product milestone; do
    [ -z "$id" ] && continue
    title="${title//|/\\|}"; pr="${pr//|/\\|}"
    echo "| ${product} | ${id} | ${title} | ${type} | ${prio} | $(st_label "$status") | ${pr} |"
  done
}

{
  echo "# 🗂️ Portfolio Vectorz — vue transverse par produit"
  echo ''
  echo '> **Vue de LECTURE auto-générée** (`products/mega-city/bin/portfolio.sh`) par-dessus le'
  echo '> backlog **unique** `features/` (liste unifiée depuis la fiche 0064, ADR-0017 A14),'
  echo '> regroupé par `product:` (vectorz / cop1 / mega-city). **Ne pas éditer à la main.**'
  echo '> Source de vérité = le front-matter de chaque fiche ; index du backlog = `features/BACKLOG.md`.'
  echo ''

  echo '## 🎯 Tirables maintenant (`ready`, tous backlogs confondus)'
  echo ''
  echo 'Les fiches `ready` (DoR passée), dans l’ordre de tirage (P0→P3, puis produit, puis id).'
  echo ''
  readies="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="ready"' | sort -t"$SEP" -k4,4 -k9,9 -k1,1)"
  if [ -n "$readies" ]; then printf '%s\n' "$readies" | emit_table; else echo '_Aucune fiche ready — flux gelé, groomer une tête de file._'; fi
  echo ''

  echo '## 🟠 En cours (branche `feat/<id>-…` ouverte)'
  echo ''
  # « En cours » est CALCULÉ des branches ouvertes (ADR-0077), jamais lu du champ `status` écrit (il ne
  # l'est plus : lire `$5=="in-progress"` montrait toujours 0, fiche 20261015213921062). Le bin partage
  # le signal avec la vue web process et `ezk dor health`. git absent → liste vide (« rien en cours »).
  inprog_ids="$("$TSX" "$MC/bin/in-progress-ids.ts" 2>/dev/null || true)"
  if [ -n "$inprog_ids" ]; then
    inprog="$(printf '%s' "$rows" | awk -F"$SEP" -v ids="$inprog_ids" '
      BEGIN { n = split(ids, a, "\n"); for (i = 1; i <= n; i++) if (a[i] != "") want[a[i]] = 1 }
      ($1 in want)' | sort -t"$SEP" -k4,4 -k9,9 -k1,1)"
  else
    inprog=""
  fi
  if [ -n "$inprog" ]; then printf '%s\n' "$inprog" | emit_table; else echo '_Rien en cours._'; fi
  echo ''

  echo '## 📋 Actionnable (ready + blocked, hors idées et épics)'
  echo ''
  echo 'Tri P0→P3, puis produit, puis id. `blocked` inclus (dépendance dure — voir la fiche).'
  echo ''
  printf '%s' "$rows" | awk -F"$SEP" '$5=="ready" || $5=="blocked"' \
    | sort -t"$SEP" -k4,4 -k9,9 -k1,1 | emit_table
  echo ''

  echo '## 💡 Idées (non groomées, hors flux P0→P3)'
  echo ''
  ideas="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="idea" && $10!="parked"' | sort -t"$SEP" -k4,4 -k9,9 -k1,1)"
  if [ -n "$ideas" ]; then printf '%s\n' "$ideas" | emit_table; else echo '_Aucune idée en attente._'; fi
  echo ''

  # Parkées : idea + `milestone: parked` = jalon fermé par le PO, hors flux (cohérent avec le
  # bloc « Parkées » de features/BACKLOG.md et l'exclusion du board d'avancement).
  parked="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="idea" && $10=="parked"' | sort -t"$SEP" -k4,4 -k9,9 -k1,1)"
  if [ -n "$parked" ]; then
    echo '## ⏸️ Parkées (hors flux — jalon fermé par le PO, à rouvrir pour tirer)'
    echo ''
    printf '%s\n' "$parked" | emit_table
    echo ''
  fi

  # Compteurs déterministes par produit (le script compte, le LLM juge — ADR-0001).
  echo '## 📊 Compteurs (déterministes)'
  echo ''
  printf '%s' "$rows" | awk -F"$SEP" '
    NF {
      p=$9; tot[p]++; totall++
      if ($5=="idea" && $10=="parked") { parked[p]++; next }
      st[p"/"$5]++
    }
    END {
      printf "| Produit | Total | 🔵 ready | 🟠 in-prog | ⛔ blocked | 💡 idea | ⏸️ parked |\n"
      printf "|---------|-------|----------|-----------|-----------|---------|-----------|\n"
      split("vectorz mega-city", order, " ")
      for (i=1;i<=2;i++){ p=order[i];
        printf "| %s | %d | %d | %d | %d | %d | %d |\n", p, tot[p]+0, \
          st[p"/ready"]+0, st[p"/in-progress"]+0, st[p"/blocked"]+0, st[p"/idea"]+0, parked[p]+0 }
    }'
  echo ''
  echo '> Ne compte pas les fiches livrées (`done/`) — voir chaque `BACKLOG.md` de backlog pour l’historique.'
} > "$OUT"

echo "${OUT} régénéré."
