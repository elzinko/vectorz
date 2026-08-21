#!/usr/bin/env bash
# Câble `check-adr-ids.sh` en GATE, sur le dépôt réel.
#
# Ce qu'il empêche : qu'un ADR neuf reprenne un numéro déjà pris de l'autre côté. Le dépôt
# tient deux séries d'ADR (ombrelle vectorz + méthode mega-city) qui ont numéroté chacune
# depuis 1 sans se voir — 15 numéros (015→029) désignent aujourd'hui deux sujets sans
# rapport. Ce passé est GELÉ et toléré (les ADR sont immuables, ~1 600 renvois les citent) ;
# la gate ne fait qu'interdire d'en fabriquer un seizième.
#
# Le vérificateur lui-même est prouvé par sabotage dans `bin/test-check-adr-ids.sh`.
# Déterministe, read-only, bash pur — aucun `pnpm install` requis (utilisable tel quel en CI).
set -uo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"       # products/mega-city
ROOT="$(cd "$MC/../.." && pwd)"              # racine du repo (vectorz)

echo "── numéros d'ADR : ombrelle (docs/adr/) vs méthode (products/mega-city/docs/adr/)"
if bash "$MC/bin/check-adr-ids.sh" "$ROOT"; then
  echo
  echo "✅ test-adr-ids-repo — aucune NOUVELLE collision de numéro d'ADR"
else
  echo
  echo "❌ test-adr-ids-repo — un numéro d'ADR désigne deux sujets différents."
  echo "   Renuméroter l'ADR NEUF (jamais l'ancien : ils sont immuables et massivement cités)."
  echo "   Prochain numéro libre des deux côtés :"
  echo "     bash products/mega-city/bin/check-adr-ids.sh . --next"
  exit 1
fi
