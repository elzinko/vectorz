#!/usr/bin/env bash
# Fiche 0101 — câble `check-links.sh` en GATE, sur les DEUX racines réelles du repo.
# Un lien markdown relatif cassé (fiche/ADR déplacée par `ship`, profondeur fausse) fait
# rougir la gate — au lieu de dormir jusqu'à ce qu'un humain pense à lancer le contrôle.
# Le vérificateur lui-même est prouvé par sabotage dans `bin/test-check-links.sh`.
#
# Deux périmètres, tous deux vérifiés verts à l'écriture (2026-08-13) :
#   1. mega-city           → `check-links.sh` (défaut : features/ docs/adr/ du produit) ;
#   2. racine vectorz      → `check-links.sh <root> features docs/adr docs/captures`.
# Déterministe, read-only. Aucun `pnpm install` requis : bash pur (utilisable tel quel en CI).
set -uo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"       # products/mega-city
ROOT="$(cd "$MC/../.." && pwd)"              # racine du repo (vectorz)
fail=0

echo "── mega-city (features/ docs/adr/)"
bash "$MC/bin/check-links.sh" || fail=1

echo "── racine vectorz (features docs/adr docs/captures)"
bash "$MC/bin/check-links.sh" "$ROOT" features docs/adr docs/captures || fail=1

echo
if [ "$fail" -eq 0 ]; then
  echo "✅ test-links-repo — 0 lien relatif cassé (2 racines)"
else
  echo "❌ test-links-repo — liens cassés (voir fichier:ligne ci-dessus)"
  exit 1
fi
