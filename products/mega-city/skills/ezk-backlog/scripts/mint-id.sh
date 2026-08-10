#!/usr/bin/env bash
# mint-id.sh — émet un id de fiche horodaté `AAAAMMDDHHMMSSmmm` (17 chiffres, à la
# milliseconde), généré LOCALEMENT sans coordination. cf. fiche 0180.
#
# Pourquoi : `max+1` sur deux branches parties du même `main` collisionne à coup
# sûr (même à des heures d'écart) ; un timestamp ne collisionne que dans la même
# milliseconde — et deux branches ne se voyant pas avant le merge, seule l'entropie
# (la ms) protège, pas un check d'existence. cf. 0180 « Granularité ».
#
# Portable : BSD `date` (macOS) ne connaît pas %N/%3N — on tombe alors sur gdate,
# puis python3, puis perl. Dernier recours dégradé : seconde + `000` (documenté).
#
# Usage : scripts/mint-id.sh            → 20260810143052123
#         id="$(scripts/mint-id.sh)"
set -euo pipefail

# 1) GNU date (Linux) : %3N = millisecondes sur 3 chiffres.
if [ "$(date +%3N 2>/dev/null || true)" != '%3N' ] \
   && date +%3N 2>/dev/null | grep -qE '^[0-9]{3}$'; then
  date +%Y%m%d%H%M%S%3N
  exit 0
fi

# 2) gdate (coreutils via Homebrew sur macOS).
if command -v gdate >/dev/null 2>&1; then
  gdate +%Y%m%d%H%M%S%3N
  exit 0
fi

# 3) python3 — présent par défaut sur macOS récent.
if command -v python3 >/dev/null 2>&1; then
  python3 -c 'import time; t=time.time(); print(time.strftime("%Y%m%d%H%M%S", time.localtime(t)) + "%03d" % (int(t*1000)%1000))'
  exit 0
fi

# 4) perl — présent par défaut sur macOS.
if command -v perl >/dev/null 2>&1; then
  perl -MTime::HiRes=time -MPOSIX=strftime -e 'my $t=time; printf "%s%03d\n", strftime("%Y%m%d%H%M%S", localtime($t)), int(($t-int $t)*1000)'
  exit 0
fi

# 5) Dégradé : pas de sous-seconde disponible → `000`. La collision même-seconde
#    redevient possible ; l'appelant doit alors désambiguïser (rare).
echo "mint-id: pas de source milliseconde (date/%3N, gdate, python3, perl) — id dégradé à la seconde (+000)" >&2
date +%Y%m%d%H%M%S000
