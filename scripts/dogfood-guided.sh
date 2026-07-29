#!/usr/bin/env bash
# Dogfood guidé époque 2 — smoke + Moniteur (Playwright) + pauses humaines.
# Usage (racine vectorz) : bash scripts/dogfood-guided.sh
# Non-interactif (CI / dry) : DOGFOOD_NONINTERACTIVE=1 bash scripts/dogfood-guided.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="${DOGFOOD_REPORT_DIR:-$ROOT/docs/dogfood-reports/$STAMP}"
MONITEUR_URL="${DOGFOOD_MONITEUR_URL:-http://localhost:5173/}"
DAEMON_CLI="$ROOT/products/cop1/packages/app/dist/cli/index.js"
WATCH_ROOT="${DOGFOOD_WATCH_ROOT:-$ROOT}"
NONINTERACTIVE="${DOGFOOD_NONINTERACTIVE:-0}"

mkdir -p "$REPORT_DIR"
RESULTS_JSON="$REPORT_DIR/dogfood-report.json"
RESULTS_MD="$REPORT_DIR/dogfood-report.md"
: >"$REPORT_DIR/steps.log"

# step_id|status|detail  (status: OK|KO|SKIP|PENDING)
declare -a STEPS=()

log() { printf '%s\n' "$*" | tee -a "$REPORT_DIR/steps.log"; }
hr() { log "────────────────────────────────────────"; }

record() {
  local id="$1" status="$2" detail="${3:-}"
  STEPS+=("${id}|${status}|${detail}")
  log "[$status] $id — $detail"
}

pause_human() {
  local msg="$1"
  hr
  log "👉 $msg"
  if [[ "$NONINTERACTIVE" == "1" ]]; then
    log "(DOGFOOD_NONINTERACTIVE=1 — pause ignorée)"
    return 0
  fi
  read -r -p "   Appuie Entrée quand c'est fait… " _
}

url_up() {
  local url="$1"
  curl -fsS --max-time 3 -o /dev/null "$url" 2>/dev/null
}

daemon_up() {
  [[ -f "$DAEMON_CLI" ]] || return 1
  local out
  out="$(node "$DAEMON_CLI" status 2>&1 || true)"
  [[ "$out" == running* ]]
}

# Exécute une commande ; préfixe timeout/gtimeout si disponible (macOS souvent sans).
# Évite "${arr[@]}" vide sous set -u (bash 4.4+ / unbound variable).
run_maybe_timeout() {
  if command -v timeout >/dev/null 2>&1; then
    timeout 120 "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout 120 "$@"
  else
    "$@"
  fi
}

take_screenshot() {
  local label="$1" outfile="$2"
  if ! url_up "$MONITEUR_URL"; then
    record "screenshot:$label" SKIP "Moniteur injoignable ($MONITEUR_URL)"
    return 0
  fi
  log "Capture Playwright ($label)…"
  if run_maybe_timeout npx --yes -p playwright node "$ROOT/scripts/dogfood-screenshot.mjs" \
    "$MONITEUR_URL" "$outfile" >>"$REPORT_DIR/steps.log" 2>&1; then
    record "screenshot:$label" OK "$outfile"
    log "   Capture OK — ouvre le PNG : $outfile"
  else
    record "screenshot:$label" SKIP "Playwright indisponible ou page KO — voir steps.log"
  fi
}

count_events_jsonl() {
  local root="$1"
  if [[ ! -d "$root/.supervision/runs" ]]; then
    echo 0
    return 0
  fi
  # find exit≠0 si chemin absent — ne doit pas tuer le script (set -e / pipefail)
  local n
  n="$(find "$root/.supervision/runs" -name 'events.jsonl' -type f 2>/dev/null | wc -l | tr -d ' ')" || n=0
  echo "${n:-0}"
}

write_reports() {
  local overall="OK"
  local line id status detail
  local has_ko=0 has_partial=0
  for line in "${STEPS[@]}"; do
    IFS='|' read -r id status detail <<<"$line"
    if [[ "$status" == "KO" ]]; then
      has_ko=1
    fi
    # Preuve humaine absente = PARTIAL (pas un faux vert dogfood)
    if [[ "$status" == "SKIP" && ( "$id" == "humain:demo" || "$id" == "events:apres" || "$id" == "humain:mcp" ) ]]; then
      has_partial=1
    fi
  done
  if [[ "$has_ko" -eq 1 ]]; then
    overall="KO"
  elif [[ "$has_partial" -eq 1 ]]; then
    overall="PARTIAL"
  fi

  {
    echo "# Rapport dogfood guidé — $STAMP"
    echo
    echo "- **Verdict global :** $overall"
    echo "- **Repo :** \`$ROOT\`"
    echo "- **Moniteur :** $MONITEUR_URL"
    echo "- **Watch root :** \`$WATCH_ROOT\`"
    if [[ "$overall" == "PARTIAL" ]]; then
      echo "- **Note :** mécanique OK ou partielle ; **pas** une preuve dogfood humaine complète."
    fi
    echo
    echo "| Étape | Statut | Détail |"
    echo "| --- | --- | --- |"
    for line in "${STEPS[@]}"; do
      IFS='|' read -r id status detail <<<"$line"
      detail="${detail//|/\\|}"
      echo "| \`$id\` | **$status** | ${detail:-—} |"
    done
    echo
    echo "## Checklist visuelle"
    echo
    echo "1. Ouvre le rapport / les PNG dans \`$REPORT_DIR\`."
    echo "2. Si \`screenshot:apres\` = OK : une carte de run doit apparaître dans le Moniteur."
    echo "3. Si \`analyze\` = KO : lis \`analyze/analyze-report.md\` (ou \`/supervision-analyze\`)."
    echo "4. Si une étape humaine a été SKIP (non-interactif) : ce n'est **pas** une preuve dogfood."
    echo
    echo "Guide : \`docs/DOGFOOD.md\`"
  } >"$RESULTS_MD"

  {
    echo "{"
    echo "  \"stamp\": \"$STAMP\","
    echo "  \"overall\": \"$overall\","
    echo "  \"root\": \"$ROOT\","
    echo "  \"moniteur_url\": \"$MONITEUR_URL\","
    echo "  \"watch_root\": \"$WATCH_ROOT\","
    echo "  \"steps\": ["
    local first=1
    for line in "${STEPS[@]}"; do
      IFS='|' read -r id status detail <<<"$line"
      detail="${detail//\\/\\\\}"
      detail="${detail//\"/\\\"}"
      [[ $first -eq 1 ]] || echo ","
      first=0
      printf '    {"id":"%s","status":"%s","detail":"%s"}' "$id" "$status" "$detail"
    done
    echo
    echo "  ]"
    echo "}"
  } >"$RESULTS_JSON"

  hr
  log "Rapport → $RESULTS_MD"
  log "JSON    → $RESULTS_JSON"
  log "Verdict global : $overall"
  # Exit 1 seulement sur KO (échec mécanique / preuve absente après étape humaine)
  [[ "$overall" != "KO" ]]
}

# ─── 0. Intro ───────────────────────────────────────────────
hr
log "== dogfood-guided =="
log ""
log "Tu n'as rien à faire jusqu'à ce qu'on affiche 👉"
log "Les étapes auto (build, smoke, Moniteur, captures) tournent seules."
log "Quand 👉 apparaît : lis l'instruction, fais l'action, puis appuie Entrée."
log ""
log "Rapports : $REPORT_DIR"
log "Doc      : docs/DOGFOOD.md"
hr

# ─── 1. Build check ─────────────────────────────────────────
log "Étape 1/6 — build (automatique)"
if [[ -f "$DAEMON_CLI" ]] && [[ -d "$ROOT/products/cop1/packages/journal-validator/dist" ]]; then
  record "build" OK "artefacts CLI / journal-validator présents"
else
  log "Build manquant — lancement pnpm build…"
  if pnpm build >>"$REPORT_DIR/build.log" 2>&1; then
    record "build" OK "pnpm build OK"
  else
    record "build" KO "pnpm build a échoué — voir $REPORT_DIR/build.log"
    write_reports || true
    exit 1
  fi
fi

# ─── 2. Smoke mécanique ─────────────────────────────────────
log "Étape 2/6 — smoke mécanique (automatique, sans Claude / sans UI)"
if bash "$ROOT/scripts/dogfood-smoke.sh" >>"$REPORT_DIR/smoke.log" 2>&1; then
  record "smoke" OK "scripts/dogfood-smoke.sh"
  hr
  log "Mécanique OK (link, probe, journal démo, validateur)."
  log "Ensuite : on vérifie le Moniteur (auto + capture), puis Claude Code (toi)."
  hr
else
  record "smoke" KO "voir $REPORT_DIR/smoke.log"
  write_reports || true
  exit 1
fi

# ─── 3. Moniteur (daemon + web) ──────────────────────────────
log "Étape 3/6 — Moniteur (automatique si possible)"
WE_STARTED_DAEMON=0

if [[ ! -f "$ROOT/cop1.config.yaml" ]]; then
  cp "$ROOT/cop1.config.example.yaml" "$ROOT/cop1.config.yaml"
  # Injecte watch_roots (YAML simple) — config locale gitignorée
  if grep -q 'watch_roots: \[\]' "$ROOT/cop1.config.yaml"; then
    # macOS / BSD sed
    if sed --version >/dev/null 2>&1; then
      sed -i "s|watch_roots: \[\]|watch_roots: [\"$WATCH_ROOT\"]|" "$ROOT/cop1.config.yaml"
    else
      sed -i '' "s|watch_roots: \[\]|watch_roots: [\"$WATCH_ROOT\"]|" "$ROOT/cop1.config.yaml"
    fi
  fi
  record "config" OK "cop1.config.yaml créé (watch_roots=$WATCH_ROOT)"
else
  record "config" OK "cop1.config.yaml déjà présent (vérifie watch_roots si besoin)"
fi

if daemon_up; then
  record "daemon" OK "déjà up"
else
  if [[ -f "$DAEMON_CLI" ]]; then
    log "Démarrage daemon…"
    if node "$DAEMON_CLI" start >>"$REPORT_DIR/daemon.log" 2>&1; then
      WE_STARTED_DAEMON=1
      sleep 1
      if daemon_up || node "$DAEMON_CLI" status >>"$REPORT_DIR/daemon.log" 2>&1; then
        record "daemon" OK "démarré par ce script"
      else
        record "daemon" SKIP "start lancé mais status ambigu — voir daemon.log"
      fi
    else
      record "daemon" SKIP "échec start — lance manuellement : node products/cop1/packages/app/dist/cli/index.js start"
    fi
  else
    record "daemon" SKIP "CLI absente — pnpm build puis start"
  fi
fi

if url_up "$MONITEUR_URL"; then
  record "web" OK "$MONITEUR_URL répond"
else
  record "web" SKIP "UI down — lance : pnpm --filter @cop1/web dev  → $MONITEUR_URL"
  if [[ "$NONINTERACTIVE" != "1" ]]; then
    pause_human "Démarre l'UI Moniteur : \`pnpm --filter @cop1/web dev\` dans un autre terminal. Succès = $MONITEUR_URL s'ouvre dans le navigateur. Puis Entrée."
    if url_up "$MONITEUR_URL"; then
      record "web:retry" OK "$MONITEUR_URL répond"
    else
      record "web:retry" SKIP "toujours down — captures seront SKIP"
    fi
  fi
fi

BEFORE_COUNT="$(count_events_jsonl "$WATCH_ROOT")"
record "events:avant" OK "events.jsonl count=$BEFORE_COUNT sous $WATCH_ROOT/.supervision/runs"

take_screenshot "avant" "$REPORT_DIR/01-moniteur-avant.png"

# ─── 4. Humain : Claude Code + MCP ──────────────────────────
log "Étape 4/7 — intervention humaine (Claude Code)"
if [[ "$NONINTERACTIVE" == "1" ]]; then
  record "humain:mcp" SKIP "non-interactif — pas de preuve MCP"
else
  pause_human "Ouvre Claude Code sur ce repo ($ROOT). Succès = le MCP « supervision » est connecté (outils visibles dans Claude). Puis Entrée."
  record "humain:mcp" OK "opérateur a confirmé (Entrée)"
fi

# ─── 5. Humain : supervision-demo ────────────────────────────
log "Étape 5/7 — /supervision-demo (ou sprint trivial)"
if [[ "$NONINTERACTIVE" == "1" ]]; then
  record "humain:demo" SKIP "non-interactif — pas de démo LLM"
else
  pause_human "Dans Claude Code, tape /supervision-demo (ou un sprint trivial ezk-sprint). Succès = la commande se termine sans erreur. Puis Entrée."
  record "humain:demo" OK "opérateur a confirmé (Entrée)"
fi

AFTER_COUNT="$(count_events_jsonl "$WATCH_ROOT")"
EVENTS_APRES_STATUS="KO"
if [[ "$NONINTERACTIVE" == "1" ]]; then
  EVENTS_APRES_STATUS="SKIP"
  record "events:apres" SKIP "count=$AFTER_COUNT (pas de preuve humaine)"
elif [[ "$AFTER_COUNT" -gt "$BEFORE_COUNT" ]]; then
  EVENTS_APRES_STATUS="OK"
  record "events:apres" OK "nouveau(x) events.jsonl (avant=$BEFORE_COUNT → après=$AFTER_COUNT)"
elif [[ "$AFTER_COUNT" -gt 0 ]]; then
  # Pas d'augmentation nette (déjà des runs) — on vérifie mtime récent
  RECENT="$(find "$WATCH_ROOT/.supervision/runs" -name 'events.jsonl' -type f -mmin -30 2>/dev/null | head -1 || true)"
  if [[ -n "$RECENT" ]]; then
    EVENTS_APRES_STATUS="OK"
    record "events:apres" OK "events.jsonl récent (<30 min) : $RECENT"
  else
    record "events:apres" KO "aucun events.jsonl nouveau/récent — la démo n'a peut‑être pas émis"
  fi
else
  record "events:apres" KO "aucun events.jsonl sous $WATCH_ROOT/.supervision/runs"
fi

take_screenshot "apres" "$REPORT_DIR/02-moniteur-apres.png"

# ─── 5b. Analyze post-mortem (fiche 0104) ────────────────────
log "Étape 5b/7 — supervision:analyze (automatique)"
# Un seul run : le plus récent (évite KO à cause d'orphans anciens hors démo).
ANALYZE_OUT="$REPORT_DIR/analyze"
ANALYZE_RC=0
# Plus récent d’abord (noms ISO-ish + mtime via ls -t) — portable macOS/Linux.
LATEST_RUN="$(ls -1t "$WATCH_ROOT/.supervision/runs" 2>/dev/null | head -1 || true)"
set +e
if [[ -n "$LATEST_RUN" ]]; then
  pnpm --dir products/mega-city supervision:analyze "$ROOT" --run "$LATEST_RUN" --out "$ANALYZE_OUT" \
    >>"$REPORT_DIR/analyze.log" 2>&1
  ANALYZE_RC=$?
else
  pnpm --dir products/mega-city supervision:analyze "$ROOT" --since 2h --out "$ANALYZE_OUT" \
    >>"$REPORT_DIR/analyze.log" 2>&1
  ANALYZE_RC=$?
fi
set -e
if [[ "$ANALYZE_RC" -eq 0 ]]; then
  record "analyze" OK "${LATEST_RUN:+run=$LATEST_RUN · }$ANALYZE_OUT/analyze-report.md"
elif [[ "$EVENTS_APRES_STATUS" != "OK" ]]; then
  # Sans démo fraîche, des orphan runs anciens → silence_explained : informatif, pas KO dogfood
  record "analyze" SKIP "verdicts non-verts sans preuve humaine fraîche — $ANALYZE_OUT (voir analyze.log)"
else
  record "analyze" KO "verdicts problème après démo — ouvre $ANALYZE_OUT/analyze-report.md (skill /supervision-analyze)"
fi

# ─── 6. Optionnel archive ────────────────────────────────────
log "Étape 6/7 — optionnel archive"
if [[ "$NONINTERACTIVE" == "1" ]]; then
  record "humain:archive" SKIP "non-interactif"
else
  hr
  log "👉 (Optionnel) Lance /ezk-archive dans Claude Code (défaut = check)."
  log "   Succès = portier VERDICT: CLEAN. Sinon ignore."
  read -r -p "   Appuie Entrée pour continuer (skip OK)… " _
  record "humain:archive" OK "opérateur a passé l'étape (manuel / skip)"
fi

# ─── Rapport ────────────────────────────────────────────────
write_reports
EXIT=$?

hr
log "Terminé. Ouvre le rapport et les PNG dans :"
log "  $REPORT_DIR"
if [[ "$WE_STARTED_DAEMON" == "1" ]]; then
  log "Note : daemon démarré par ce script — \`node products/cop1/packages/app/dist/cli/index.js stop\` pour l'arrêter."
fi

exit "$EXIT"
