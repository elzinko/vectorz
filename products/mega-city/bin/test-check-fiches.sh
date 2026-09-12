#!/usr/bin/env bash
# test-check-fiches.sh — DoD de la bascule BLOQUANTE du validateur de statut
# (fiche 652, étape 3 de l'ADR-0040).
#
# En clair : `fiches:check --strict` doit ÉCHOUER (exit 1) sur une fiche hors-schéma
# (statut inconnu), rester VERT (exit 0) sur un corpus conforme, et le VRAI repo doit
# être à 0 anomalie (la gate réelle branchée dans test-scripts.sh / CI).
#
# Le sabotage tourne sur un dossier JETABLE via `--root`, jamais sur le vrai backlog.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MC="$(cd "$HERE/.." && pwd)"
FAIL=0
fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Lance le validateur en mode strict sur une racine donnée ; renvoie son code de sortie.
strict_root() { ( cd "$MC" && pnpm -s exec tsx bin/check-fiches.ts --strict --root "$1" >/dev/null 2>&1 ); }

mk_fiche() {  # $1=racine  $2=statut
  mkdir -p "$1/features"
  cat > "$1/features/20260101000000000_fixture.md" <<EOF
---
id: "20260101000000000"
title: "fixture jetable"
type: feature
priority: P2
status: $2
---
# fixture
EOF
}

echo "=== Cas 1 — fiche hors-schéma (statut inconnu) : --strict ÉCHOUE (exit 1) ==="
mk_fiche "$WORK/bad" "pas-un-statut"
if strict_root "$WORK/bad"; then
  fail "--strict a accepté une fiche au statut hors-enum (devrait bloquer)"
else
  ok "--strict bloque (exit 1) sur un statut hors-enum"
fi

echo "=== Cas 2 — corpus conforme : --strict reste VERT (exit 0) ==="
mk_fiche "$WORK/good" "idea"
if strict_root "$WORK/good"; then
  ok "--strict passe (exit 0) sur un corpus conforme"
else
  fail "--strict a bloqué un corpus pourtant conforme"
fi

echo "=== Cas 3 — VRAI repo : --strict est VERT (0 anomalie mesurée, gate réelle) ==="
if ( cd "$MC" && pnpm -s exec tsx bin/check-fiches.ts --strict >/dev/null 2>&1 ); then
  ok "le backlog réel passe --strict (0 anomalie) — la gate peut rester bloquante"
else
  fail "le backlog réel échoue --strict : une fiche est hors-schéma, à corriger AVANT la bascule"
fi

if (( FAIL )); then
  echo "❌ test-check-fiches — ÉCHEC"
  exit 1
fi
echo "✅ test-check-fiches — TOUT VERT"
