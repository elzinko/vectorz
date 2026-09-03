# language: fr
# Fiche : features/20260902224608715_pr-preuve-avant-apres-outiller-la-regle.md
# Definition of Done exécutable des critères d'acceptation (AC1 à AC7 de la fiche,
# AC8 « mesure de sortie rétro » et AC9 « gate locale verte » exclus : le premier
# n'est pas testable dans le sprint, le second est la gate elle-même, pas un scénario).
# Brique testée : le champ `evidence:` (validateur pur), le script pr-evidence.sh
# (capture + rendu du bloc markdown), et le contrôle check-pr-body.sh + lentille
# ezk-reviewer.

Fonctionnalité: Outiller la règle "avant/après" des PR d'interface
  En tant que PO qui relit une PR
  Je veux voir une paire d'images avant/après quand l'interface change
  Afin de valider un écran sans relire le diff ni relancer l'app

  # ---------------------------------------------------------------------------
  # AC1 — le champ evidence: est déclaré et validé sur la fiche
  # ---------------------------------------------------------------------------

  Scénario: Une fiche déclare evidence: before-after et passe la gate
    Soit une fiche de front-matter contenant "evidence: before-after"
    Quand je lance "pnpm --dir products/mega-city fiches:check --strict"
    Alors la commande sort en code 0
    Et aucune anomalie n'est rapportée sur le champ "evidence"

  Scénario: Une fiche déclare une raison en N.A. et passe la gate
    Soit une fiche de front-matter contenant "evidence: none # pas d'écran, backend seul"
    Quand je lance "pnpm --dir products/mega-city fiches:check --strict"
    Alors la commande sort en code 0

  Scénario: Une valeur d'evidence inconnue est rejetée
    Soit une fiche de front-matter contenant "evidence: peut-etre"
    Quand je lance "pnpm --dir products/mega-city fiches:check --strict"
    Alors la commande sort en code différent de 0
    Et le message d'anomalie nomme le champ "evidence" et la valeur refusée "peut-etre"
    Et les trois valeurs acceptées "before-after", "auto", "none" sont rappelées dans le message

  # ---------------------------------------------------------------------------
  # AC2 — pr-evidence.sh capture avant/après et rend le bloc markdown
  # ---------------------------------------------------------------------------

  Scénario: capture produit une paire avant/après de même taille
    Soit une app servie localement sur une URL donnée, avant et après un changement de vue
    Quand je lance "pr-evidence.sh capture 20260902224608715 --view board --phase before --url <URL-main> --viewport 390x844"
    Et je lance "pr-evidence.sh capture 20260902224608715 --view board --phase after --url <URL-branche> --viewport 390x844"
    Alors le fichier "docs/pr-evidence/20260902224608715/board-before.png" existe
    Et le fichier "docs/pr-evidence/20260902224608715/board-after.png" existe
    Et les deux fichiers ont la même taille d'image (390x844)

  Scénario: capture sans --url échoue explicitement
    Quand je lance "pr-evidence.sh capture 20260902224608715 --view board --phase before"
    Alors la commande sort en code différent de 0
    Et le message d'erreur nomme l'option manquante "--url"
    Et aucun fichier n'est créé sous "docs/pr-evidence/20260902224608715/"

  Scénario: render produit le bloc markdown avec liens absolus par SHA
    Soit les fichiers "board-before.png" et "board-after.png" déjà présents pour la fiche 20260902224608715
    Quand je lance "pr-evidence.sh render 20260902224608715"
    Alors la sortie contient un lien absolu "https://github.com/<owner>/<repo>/blob/<sha>/docs/pr-evidence/20260902224608715/board-before.png?raw=true"
    Et la sortie contient le lien "after" équivalent avec le même "<sha>"
    Et "<sha>" correspond au commit courant, pas au nom de la branche

  Scénario: render sans images présentes échoue explicitement
    Soit aucun fichier sous "docs/pr-evidence/99999999999999/"
    Quand je lance "pr-evidence.sh render 99999999999999"
    Alors la commande sort en code différent de 0
    Et le message d'erreur nomme la fiche "99999999999999" et l'absence d'images

  # ---------------------------------------------------------------------------
  # AC3 — une fiche before-after sort avec la paire liée et la ligne à ✅
  # ---------------------------------------------------------------------------

  Scénario: Une PR ezk-sprint sur une fiche before-after porte la paire et la ligne ✅
    Soit une fiche "evidence: before-after" en cours de sprint, à l'étape 8
    Quand le sprint termine l'étape 8
    Alors "Comment vérifier" de la fiche contient les deux liens avant/après
    Et la ligne "Before / after (UI)" de la matrice Validation vaut "✅"

  # ---------------------------------------------------------------------------
  # AC4 — auto sans diff d'interface : N.A. motivé, aucune capture lancée
  # ---------------------------------------------------------------------------

  Scénario: Une fiche auto dont le diff ne touche aucun chemin d'interface sort en N.A.
    Soit une fiche "evidence: auto" et un diff de branche ne touchant que des fichiers ".ts" de test
    Quand le sprint termine l'étape 8
    Alors la ligne "Before / after (UI)" de la matrice Validation commence par "N.A. — "
    Et aucun appel à "pr-evidence.sh capture" n'a été exécuté
    Et aucun fichier n'apparaît sous "docs/pr-evidence/<id>/"

  Scénario: Une fiche auto dont le diff touche un chemin d'interface déclenche la capture
    Soit une fiche "evidence: auto" et un diff de branche touchant un fichier ".tsx" hors tests
    Quand le sprint termine l'étape 8
    Alors "pr-evidence.sh capture" est appelé pour au moins une vue
    Et la ligne "Before / after (UI)" de la matrice Validation vaut "✅"

  # ---------------------------------------------------------------------------
  # AC5 — ezk-reviewer porte la lentille et bloque sans paire liée
  # ---------------------------------------------------------------------------

  Scénario: ezk-reviewer lève un finding bloquant sur une PR d'interface sans paire
    Soit une PR modifiant une carte "ezk:map" sans lien avant/après dans son corps
    Quand "ezk-reviewer" revoit cette PR
    Alors son verdict contient un finding de sévérité au moins "P1"
    Et ce finding cite l'absence de paire avant/après

  Scénario: ezk-reviewer élève le finding en P0 quand la fiche exigeait before-after
    Soit la même PR, sur une fiche dont "evidence: before-after"
    Quand "ezk-reviewer" revoit cette PR
    Alors son verdict contient un finding de sévérité "P0"

  # ---------------------------------------------------------------------------
  # AC6 — check-pr-body.sh refuse un corps "⏳" sur un diff d'interface
  # ---------------------------------------------------------------------------

  Scénario: check-pr-body refuse la ligne Before/after restée en attente sur un diff d'interface
    Soit un corps de PR dont la ligne "Before / after (UI)" vaut "⏳"
    Et une liste de fichiers changés contenant un chemin ".vue"
    Quand je lance "check-pr-body.sh --changed-files <fichier-liste>"
    Alors la commande sort en code différent de 0
    Et le message nomme la ligne "Before / after (UI)" et le chemin d'interface en cause

  Scénario: check-pr-body accepte un N.A. motivé sur un diff d'interface
    Soit un corps de PR dont la ligne "Before / after (UI)" vaut "N.A. — app de bureau non capturable"
    Et une liste de fichiers changés contenant un chemin ".tsx"
    Quand je lance "check-pr-body.sh --changed-files <fichier-liste>"
    Alors la commande sort en code 0

  Scénario: check-pr-body accepte des liens présents sur un diff d'interface
    Soit un corps de PR dont la ligne "Before / after (UI)" porte deux liens "before" et "after"
    Et une liste de fichiers changés contenant un chemin ".css"
    Quand je lance "check-pr-body.sh --changed-files <fichier-liste>"
    Alors la commande sort en code 0

  # ---------------------------------------------------------------------------
  # AC7 — la règle entre dans la LOI déployée
  # ---------------------------------------------------------------------------

  Scénario: La règle development/pr-before-after-media figure dans la LOI compilée
    Soit "pnpm --dir products/mega-city graph:compile" rejoué après l'ajout au bundle décidé en Archi
    Quand j'inspecte le graphe compilé ".ezk/graph.compiled.json"
    Alors une entrée de type "rule" nommée "development/pr-before-after-media" existe
    Et elle est reliée par une arête "bundle→rule" à un bundle lié à au moins un profil déployé
    Et "~/.claude/ENTRY.md" régénéré par "lawgiver bind-global" mentionne cette règle

# Correspondance tests
# AC1 (3 scénarios)      → vitest : products/mega-city/src/backlog/fiche-validator.ts (validateur pur du champ evidence)
# AC2 capture avant/après → bash  : bin/test-pr-evidence.sh (mode capture, via PR_EVIDENCE_SHOT_CMD substitué, hermétique)
# AC2 capture sans --url  → bash  : bin/test-pr-evidence.sh (cas d'erreur, exit non-zéro)
# AC2 render + liens SHA  → bash  : bin/test-pr-evidence.sh (mode render, images fixtures)
# AC2 render sans images   → bash  : bin/test-pr-evidence.sh (cas d'erreur)
# AC3 (before-after ✅)    → bash  : bin/test-pr-evidence.sh (bout en bout, intégration étape 8 simulée)
# AC4 (auto sans/avec diff UI) → bash : bin/test-pr-evidence.sh (détection chemins d'interface par liste de fichiers)
# AC5 (finding reviewer P1/P0) → non couvert par vitest/bash : preuve par essai à blanc documenté (prompt ezk-reviewer.md), pas un test automatisé
# AC6 (check-pr-body ⏳/N.A./liens) → bash : test-check-pr-body.sh (nouvelle option --changed-files)
# AC7 (règle dans la LOI compilée) → vitest : suite existante de graph:compile / fiches:check sur la LOI, complétée d'une assertion sur la règle
