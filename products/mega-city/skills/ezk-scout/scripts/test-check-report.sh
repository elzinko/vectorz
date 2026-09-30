#!/usr/bin/env bash
# DoD exécutable de check-report.sh (fiche 20260910165637000) — fixtures jetables.
# Le rapport ezk-scout est l'artefact qu'un HUMAIN valide avant tout `ezk-backlog add` : le
# contrôle refuse un rapport dont la forme ment (comptes faux, brouillon sans reproduction,
# gravité inventée, bornes dépassées, garde find-only absente ou violée, gabarit non rempli).
# Cas : (a) rapport valide · (b..o) une seule entorse à la fois → refusé avec le bon motif ·
# (p) commentaires HTML ignorés · (q) erreurs d'usage · (r) le gabarit livré et l'exemple
# livré restent alignés sur le contrôle (anti-dérive).
set -uo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check-report.sh"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Rapport VALIDE : 2 brouillons retenus + 1 écartée = 3 trouvées.
cat > "$TMP/ok.md" <<'EOF'
# Rapport de chasse aux bugs — demo-app — 2026-09-30

## En clair

La passe a sondé l'export et le recadrage. Elle a trouvé deux défauts réels : l'export plante avec un BPM nul, et le recadrage accepte des bornes absurdes. Dis-moi lesquels entrent au backlog.

**3 trouvées · 2 fichées · 1 écartées**

« fichées » = retenues comme brouillon de fiche dans ce rapport. Aucune carte n'est créée tant que tu n'as pas validé.

## Cadre de la passe

- **Cible** : demo-app, lancée sur le port 4173
- **Lentille** : bugs
- **Bornes** : sondes 12/30 · durée 4/15 min
- **Garde find-only** : find-only : OK — 1 dépôt · demo HEAD 1234567 · arbre, refs et worktree inchangés

## Isolation de l'état

- dossier d'export : pointé vers un dossier tmp jetable
- variables d'environnement : HOME redirigé vers un dossier tmp

## Brouillons de fiche

### B1 — L'export plante (500) quand le BPM est nul

- **Type / priorité suggérés** : bug · P2
- **Gravité** : majeure
- **En clair** : Demander un export avec un BPM à 0 fait planter le serveur au lieu de refuser la demande.
- **Reproduction** (rejouable) :
  1. `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:4173/export -d '{"bpm":0}'`
- **Attendu / obtenu** : 400 avec un message clair / 500 sans message
- **Localisation probable** *(indice non garanti)* : `demo-app.mjs:21`
- **Anti-doublon** : aucune fiche équivalente dans le backlog

### B2 — Le recadrage accepte une fin avant le début

- **Type / priorité suggérés** : bug · P3
- **Gravité** : mineure
- **En clair** : Recadrer de 9 à 2 est accepté et rend un extrait vide.
- **Reproduction** (rejouable) :
  1. `curl -s -X POST localhost:4173/crop -d '{"start":9,"end":2}'`
  2. Lire la réponse : 200 et une durée négative.
- **Attendu / obtenu** : 400 / 200 avec une durée de -7
- **Capture** : captures/b2-recadrage.png
- **Anti-doublon** : voisine : 0042 — à enrichir plutôt qu'à créer

## Écartées

- Page 404 sans style — raison : hors périmètre (l'app de démonstration n'a pas d'interface)

## Pour valider (toi)

Dis quels brouillons entrent au backlog.
EOF

# Applique une transformation perl -0 au rapport valide → $TMP/<nom>.md
mutate() { # $1=nom $2=expression perl -0pe
  perl -0pe "$2" "$TMP/ok.md" > "$TMP/$1.md"
}

refuse() { # $1=label $2=nom-du-fichier $3=motif attendu dans la sortie
  out="$(bash "$CHECK" "$TMP/$2.md" 2>&1)"; rc=$?
  check "$1 → refusé (code 1)"      "[ $rc -eq 1 ]"
  check "$1 → motif « $3 »"         "printf '%s' \"\$out\" | grep -qF -- '$3'"
}

echo "Cas a (rapport valide) :"
out="$(bash "$CHECK" "$TMP/ok.md" 2>&1)"; rc=$?
check "code de sortie 0"                         "[ $rc -eq 0 ]"
check "annonce « rapport valide » + les comptes" "printf '%s' \"\$out\" | grep -q 'rapport valide.*3 trouvées · 2 fichées · 1 écartées'"

echo "Cas b (« En clair » n'ouvre pas le rapport) :"
mutate b 's/## En clair/## Préambule\n\nblabla\n\n## En clair/'
refuse "En clair pas en premier" b "En clair"

echo "Cas c (N ≠ M + K) :"
mutate c 's/\*\*3 trouvées/**4 trouvées/'
refuse "4 ≠ 2 + 1" c "trouvées"

echo "Cas d (nombre de brouillons ≠ M) :"
mutate d 's/### B2 —.*?(?=## Écartées)//s'
refuse "1 bloc pour M = 2" d "brouillons"

echo "Cas e (nombre d'écartées ≠ K) :"
mutate e 's/(- Page 404[^\n]*\n)/$1- Autre piste — raison : doublon de 0042\n/'
refuse "2 écartées pour K = 1" e "écartées"

echo "Cas f (brouillon sans reproduction) :"
mutate f 's/^  1\. `curl -s -o[^\n]*\n//m'
refuse "B1 sans étape" f "B1"

echo "Cas g (gravité inventée) :"
mutate g 's/\*\*Gravité\*\* : majeure/**Gravité** : bof/'
refuse "gravité « bof »" g "gravité"

echo "Cas h (localisation sans numéro de ligne) :"
mutate h 's/`demo-app\.mjs:21`/`demo-app.mjs`/'
refuse "fichier sans :ligne" h "localisation"

echo "Cas i (bornes dépassées) :"
mutate i 's/sondes 12\/30/sondes 31\/30/'
refuse "31 sondes pour un max de 30" i "bornes"

echo "Cas j (garde find-only violée) :"
mutate j 's/find-only : OK/find-only : VIOLÉ/'
refuse "find-only : VIOLÉ" j "find-only"

echo "Cas k (garde find-only absente) :"
mutate k 's/^- \*\*Garde find-only\*\*[^\n]*\n//m'
refuse "ligne Garde find-only retirée" k "find-only"

echo "Cas l (section Isolation absente) :"
mutate l 's/## Isolation de l.état\n.*?(?=## Brouillons)//s'
refuse "isolation retirée" l "Isolation"

echo "Cas m (gabarit non rempli) :"
mutate m 's/(### B2 — )/$1‹titre à remplir› /'
refuse "placeholder ‹…› laissé" m "gabarit"

echo "Cas n (lentille inconnue) :"
mutate n 's/\*\*Lentille\*\* : bugs/**Lentille** : zzz/'
refuse "lentille « zzz »" n "lentille"

echo "Cas o (capture déclarée mais vide) :"
mutate o 's/\*\*Capture\*\* : captures\/b2-recadrage\.png/**Capture** : /'
refuse "capture vide" o "capture"

echo "Cas p (commentaires HTML ignorés) :"
mutate p 's/(## En clair)/<!-- ‹placeholder› find-only : VIOLÉ -->\n\n$1/'
# Le commentaire est AVANT « En clair » : il ne doit ni casser l'ordre ni déclencher les motifs.
out="$(bash "$CHECK" "$TMP/p.md" 2>&1)"; rc=$?
check "commentaire HTML neutralisé → code 0" "[ $rc -eq 0 ]"

echo "Cas p2 (sections réordonnées) :"
mutate p2 's/\A(.*?)(## Cadre de la passe.*?)(## Pour valider \(toi\).*)\z/$1$3\n$2/s'
refuse "« Pour valider » placé avant « Cadre »" p2 "ordre"

echo "Cas q (erreurs d'usage) :"
bash "$CHECK" >/dev/null 2>&1; rc1=$?
check "sans argument → code 2"            "[ $rc1 -eq 2 ]"
bash "$CHECK" "$TMP/n-existe-pas.md" >/dev/null 2>&1; rc2=$?
check "fichier absent → code 2"           "[ $rc2 -eq 2 ]"
: > "$TMP/vide.md"
bash "$CHECK" "$TMP/vide.md" >/dev/null 2>&1; rc3=$?
check "fichier vide → code 2"             "[ $rc3 -eq 2 ]"

echo "Cas r (gabarit et exemple livrés alignés sur le contrôle) :"
TPL="$SKILL_DIR/assets/SCOUT_REPORT.template.md"
check "le gabarit existe"                 "[ -f '$TPL' ]"
for anchor in '## En clair' '## Cadre de la passe' "## Isolation de l'état" '## Brouillons de fiche' \
  '## Écartées' '## Pour valider (toi)' '### B1 —' '**Lentille**' '**Bornes**' '**Garde find-only**' \
  '**Type / priorité suggérés**' '**Gravité**' '**En clair**' '**Reproduction**' \
  '**Attendu / obtenu**' '**Capture**' '**Localisation probable**' '**Anti-doublon**' \
  'trouvées · ' 'fichées · ' 'écartées**'; do
  if grep -qF -- "$anchor" "$TPL"; then echo "  ok — gabarit porte « $anchor »"; else echo "  ÉCHEC — gabarit sans « $anchor »"; FAIL=1; fi
done
bash "$CHECK" "$TPL" >/dev/null 2>&1; rc4=$?
check "le gabarit NON rempli est refusé"  "[ $rc4 -eq 1 ]"
EX="$SKILL_DIR/examples/demo-report.md"
check "l'exemple livré existe"            "[ -f '$EX' ]"
out="$(bash "$CHECK" "$EX" 2>&1)"; rc5=$?
check "l'exemple livré est valide"        "[ $rc5 -eq 0 ]"

echo
if [ "$FAIL" -eq 0 ]; then echo "check-report : tous les cas passent."; else echo "check-report : ÉCHEC."; fi
exit "$FAIL"
