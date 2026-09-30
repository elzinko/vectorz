#!/usr/bin/env bash
# check-report.sh — contrôle de FORME du rapport ezk-scout (fiche 20260910165637000).
# Le rapport est ce qu'un humain valide avant tout `ezk-backlog add` : il ne doit pas mentir
# par sa forme. Ce script ne juge pas si un bug est vrai (c'est le travail de la passe), il
# refuse un rapport incomplet ou incohérent :
#   - « En clair » n'ouvre pas le rapport, les sections ne suivent pas l'ordre du gabarit, ou la
#     ligne de synthèse manque / est mal formée ;
#   - les comptes mentent : N = M + K, M = nombre de brouillons, K = nombre d'écartées ;
#   - un brouillon n'a pas de reproduction numérotée, de gravité valide, d'attendu/obtenu,
#     d'anti-doublon ; une capture ou une localisation déclarée est vide / sans `fichier:ligne` ;
#   - les bornes sont dépassées, la lentille est inconnue, la garde find-only est absente ou violée ;
#   - la section d'isolation de l'état manque ;
#   - un ‹placeholder› du gabarit est resté en place.
# Les commentaires HTML sont retirés AVANT l'analyse (ils ne prouvent ni ne cassent rien).
#
# Usage : bash check-report.sh <rapport.md>
# Codes : 0 valide · 1 refusé (liste des motifs) · 2 erreur d'usage (fichier absent/vide).
set -uo pipefail

usage() { echo "Usage : check-report.sh <rapport.md>" >&2; }

[ $# -eq 1 ] || { usage; exit 2; }
f="$1"
[ -f "$f" ] || { echo "check-report : fichier introuvable : $f" >&2; exit 2; }
[ -s "$f" ] || { echo "check-report : fichier vide : $f" >&2; exit 2; }

perl -0pe 's/<!--.*?-->//gs' "$f" | awk '
function err(m) { printf "✗ %s\n", m; errs++ }
function trim(s) { sub(/^[[:space:]]+/, "", s); sub(/[[:space:]]+$/, "", s); return s }
# Valeur après le premier « : » d une ligne « - **Libellé** … : valeur ».
function val(s,   i) { i = index(s, " : "); return i ? trim(substr(s, i + 3)) : "" }

function reset_block() {
  f_type = 0; f_grav = 0; f_clair = 0; f_repro = 0; steps = 0; f_ao = 0; f_dup = 0
  has_cap = 0; cap_val = ""; has_loc = 0; loc_val = ""; in_repro = 0
  v_type = ""; v_grav = ""; v_clair = ""; v_ao = ""; v_dup = ""
}

function close_block(   p) {
  if (!blk) return
  p = "brouillon " bid " — "
  if (!f_type || v_type !~ /^(bug|feature|chore|refactor)[[:space:]]+·[[:space:]]+P[0-3]$/)
    err(p "« Type / priorité suggérés » attendu sous la forme « bug · P2 »")
  if (!f_grav || (v_grav != "critique" && v_grav != "majeure" && v_grav != "mineure"))
    err(p "gravité « " v_grav " » invalide (critique | majeure | mineure)")
  if (!f_clair || v_clair == "") err(p "« En clair » vide ou absent")
  if (!f_repro || steps < 1) err(p "reproduction : au moins une étape numérotée rejouable attendue")
  if (!f_ao || v_ao == "") err(p "« Attendu / obtenu » vide ou absent")
  if (!f_dup || v_dup == "") err(p "« Anti-doublon » vide ou absent")
  if (has_cap && cap_val == "") err(p "capture déclarée mais vide (retire la ligne ou donne le chemin)")
  if (has_loc && loc_val !~ /`[^`]+:[0-9]+`/)
    err(p "localisation attendue sous la forme `fichier:ligne`")
  blk = 0
}

BEGIN { errs = 0; nh2 = 0; nblk = 0; nec = 0; niso = 0; nsum = 0; blk = 0; title = 0 }

/‹|›/ { if (ph == "") ph = substr(trim($0), 1, 70) }
/find-only : VIOLÉ/ { violated = 1 }

/^# / && !title { title = 1; next }

/^## / {
  close_block()
  sec = trim(substr($0, 4)); nh2++; order[nh2] = sec; seen[sec] = 1
  next
}

sec == "En clair" && /^\*\*[0-9]+ trouvées? · [0-9]+ fichées? · [0-9]+ écartées?\*\*$/ {
  s = $0; gsub(/[^0-9]+/, " ", s); split(trim(s), nums, " ")
  nsum++; sN = nums[1] + 0; sM = nums[2] + 0; sK = nums[3] + 0
  next
}

sec == "Cadre de la passe" && /^- \*\*/ {
  v = val($0)
  if ($0 ~ /^- \*\*Cible\*\*/) { has_cible = 1; if (v == "") err("cadre : « Cible » vide") }
  else if ($0 ~ /^- \*\*Lentille\*\*/) {
    has_len = 1
    if (v != "bugs") err("lentille « " v " » inconnue (attendu : bugs)")
  }
  else if ($0 ~ /^- \*\*Bornes\*\*/) {
    has_bornes = 1
    if (match(v, /sondes[[:space:]]+[0-9]+\/[0-9]+/)) {
      t = substr(v, RSTART, RLENGTH); sub(/^sondes[[:space:]]+/, "", t); split(t, u, "/")
      if (u[2] + 0 <= 0) err("bornes : maximum de sondes à renseigner (> 0)")
      else if (u[1] + 0 > u[2] + 0) err("bornes : sondes " u[1] "/" u[2] " dépasse le maximum")
    } else err("bornes : « sondes utilisées/max » attendu (ex. sondes 12/30)")
    if (match(v, /durée[[:space:]]+[0-9]+\/[0-9]+/)) {
      t = substr(v, RSTART, RLENGTH); sub(/^durée[[:space:]]+/, "", t); split(t, u, "/")
      if (u[2] + 0 <= 0) err("bornes : durée maximale à renseigner (> 0)")
      else if (u[1] + 0 > u[2] + 0) err("bornes : durée " u[1] "/" u[2] " dépasse le maximum")
    } else err("bornes : « durée utilisée/max min » attendu (ex. durée 4/15 min)")
  }
  else if ($0 ~ /^- \*\*Garde find-only\*\*/) {
    has_guard = 1
    if (v !~ /find-only : OK/) err("garde find-only : la ligne doit reprendre « find-only : OK — … » de find-only-guard.sh verify")
  }
  next
}

sec == "Isolation de l\047état" && /^- / { niso++; next }

sec == "Brouillons de fiche" && /^### / {
  close_block()
  nblk++; blk = 1; reset_block()
  bid = $0; sub(/^### /, "", bid); split(bid, tk, " "); bid = tk[1]
  next
}

sec == "Brouillons de fiche" && blk {
  if ($0 ~ /^- \*\*Type \/ priorité suggérés\*\*/) { f_type = 1; v_type = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*Gravité\*\*/) { f_grav = 1; v_grav = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*En clair\*\*/) { f_clair = 1; v_clair = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*Reproduction\*\*/) { f_repro = 1; in_repro = 1 }
  else if ($0 ~ /^- \*\*Attendu \/ obtenu\*\*/) { f_ao = 1; v_ao = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*Capture\*\*/) { has_cap = 1; cap_val = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*Localisation probable\*\*/) { has_loc = 1; loc_val = val($0); in_repro = 0 }
  else if ($0 ~ /^- \*\*Anti-doublon\*\*/) { f_dup = 1; v_dup = val($0); in_repro = 0 }
  else if (in_repro && $0 ~ /^[[:space:]]+[0-9]+\. [^[:space:]]/) steps++
  next
}

sec == "Écartées" && /^- / { if ($0 !~ /^- \(?aucune\)?/) nec++; next }

END {
  close_block()
  if (order[1] != "En clair") err("« En clair » doit ouvrir le rapport (première section après le titre)")
  n = split("En clair|Cadre de la passe|Isolation de l\047état|Brouillons de fiche|Écartées|Pour valider (toi)", req, "|")
  for (i = 1; i <= n; i++) if (!(req[i] in seen)) err("section « " req[i] " » absente")
  # Ordre du gabarit : le rapport se lit dans le même sens que le gabarit (revue adverse, P2).
  prev = 0; prevname = ""
  for (i = 1; i <= n; i++) {
    pos = 0
    for (j = 1; j <= nh2; j++) if (order[j] == req[i]) { pos = j; break }
    if (pos == 0) continue
    if (prev && pos < prev) err("ordre des sections : « " req[i] " » doit venir après « " prevname " » (ordre du gabarit)")
    else { prev = pos; prevname = req[i] }
  }
  if (nsum != 1) err("synthèse : une (et une seule) ligne « **N trouvées · M fichées · K écartées** » attendue dans « En clair »")
  else {
    if (sN != sM + sK) err("synthèse : " sN " trouvées ≠ " sM " fichées + " sK " écartées")
    if (nblk != sM) err("synthèse : " sM " fichées annoncées mais " nblk " brouillons de fiche dans le rapport")
    if (nec != sK) err("synthèse : " sK " écartées annoncées mais " nec " dans la section « Écartées »")
  }
  if (("Isolation de l\047état" in seen) && niso < 1) err("section « Isolation de l\047état » vide : une ligne par état mutable (isolé, ou NON ISOLÉ)")
  if (!has_cible) err("cadre : ligne « Cible » absente")
  if (!has_len) err("cadre : ligne « Lentille » absente (lentille : bugs)")
  if (!has_bornes) err("cadre : ligne « Bornes » absente (sondes U/M · durée U/M min)")
  if (!has_guard) err("garde find-only : ligne « Garde find-only » absente du cadre de la passe")
  if (violated) err("find-only : VIOLÉ — une passe qui modifie la cible est invalide, ne rapporte pas")
  if (ph != "") err("gabarit non rempli : un ‹placeholder› est resté en place : « " ph " »")
  if (errs > 0) { printf "\ncheck-report : REFUSÉ (%d motif(s)).\n", errs; exit 1 }
  printf "✓ rapport valide — %d trouvées · %d fichées · %d écartées\n", sN, sM, sK
}
'
exit $?
