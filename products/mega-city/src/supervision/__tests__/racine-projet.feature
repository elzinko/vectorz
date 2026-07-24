# language: fr
# Fiche : features/0086-feat-normalisation-arbre-principal.md
# Mesure fondatrice : features/done/0083-spike-mesure-racine-projet-worktree.md
# (CLAUDE_PROJECT_DIR == cwd == dossier de lancement — la normalisation ne viendra
# jamais de l'environnement, elle est à la charge du kit.)

Fonctionnalité: Résolution de la racine de projet — normalisation vers l'arbre principal
  En tant qu'opérateur qui travaille en worktrees git
  Je veux que le journal de supervision atterrisse dans l'arbre principal du dépôt
  Et que le serveur m'annonce au démarrage où il écrit et pourquoi
  Afin qu'aucun journal ne disparaisse silencieusement avec un worktree

  # ---------------------------------------------------------------------------
  # Rubrique N — Normalisation (AC1, AC5)
  # ---------------------------------------------------------------------------

  Scénario: La racine fournie est un worktree lié — le journal remonte à l'arbre principal
    Soit un dépôt git avec un arbre principal et un worktree lié
    Quand la racine de projet résolue pointe le worktree
    Alors la racine effective est l'arbre principal du dépôt
    Et un run démarré écrit son journal sous "<arbre principal>/.supervision/runs/"
    Et la provenance annonce une normalisation depuis le worktree

  Scénario: La normalisation s'applique quelle que soit la provenance de la racine
    Soit un dépôt git avec un arbre principal et un worktree lié
    Quand "SUPERVISION_PROJECT_ROOT" désigne explicitement le worktree
    Alors la racine effective est l'arbre principal du dépôt

  Scénario: Le chemin de rapport reste relatif à la racine effective du projet
    Soit un run démarré depuis un worktree (racine normalisée vers l'arbre principal)
    Quand un "gate_reached" écrit un rapport markdown
    Alors "report_ref" est un chemin relatif à l'arbre principal
    Et la résolution de "report_ref" depuis l'arbre principal atteint le fichier écrit

  Scénario: La racine fournie est un sous-dossier d'un worktree — le sous-chemin est préservé
    Soit un dépôt git avec un worktree lié contenant un sous-dossier "app"
    Quand la racine de projet résolue pointe "<worktree>/app"
    Alors la racine effective est "<arbre principal>/app"

  # ---------------------------------------------------------------------------
  # Rubrique R — Replis propres (AC2) : le kit reste utilisable hors git
  # ---------------------------------------------------------------------------

  Scénario: La racine n'est pas dans un dépôt git — comportement inchangé, aucune erreur
    Soit un dossier hors de tout dépôt git
    Quand la racine de projet résolue pointe ce dossier
    Alors la racine effective est ce dossier, telle quelle
    Et aucune erreur n'est levée

  Scénario: La racine est dans un sous-module git — pas une normalisation de worktree
    Soit un dépôt git contenant un sous-module (".git" fichier sans "commondir")
    Quand la racine de projet résolue pointe le sous-module
    Alors la racine effective est le sous-module, telle quelle

  # ---------------------------------------------------------------------------
  # Rubrique E — Échappatoire explicite (AC3)
  # ---------------------------------------------------------------------------

  Scénario: L'échappatoire rétablit délibérément le journal par worktree
    Soit un dépôt git avec un arbre principal et un worktree lié
    Et l'échappatoire explicite de normalisation est activée
    Quand la racine de projet résolue pointe le worktree
    Alors la racine effective est le worktree
    Et la provenance annonce le choix délibéré d'un journal par worktree

  # ---------------------------------------------------------------------------
  # Rubrique A — Annonce au démarrage (AC4) : la condition, pas le bonus
  # ---------------------------------------------------------------------------

  Scénario: Le serveur annonce la racine effective et sa provenance au démarrage
    Soit une racine résolue, normalisée ou non
    Quand le serveur démarre
    Alors une ligne lisible par un humain part sur stderr — jamais sur stdout (protocole MCP)
    Et cette ligne donne le chemin effectif du journal ET la provenance de la racine
    Et un humain qui la lit sait immédiatement où le journal va s'écrire et pourquoi

  Scénario: L'annonce distingue les quatre provenances
    Soit les cas : variable explicite, dossier courant, normalisée depuis un worktree, échappatoire par-worktree
    Quand la ligne d'annonce est produite pour chacun
    Alors chaque cas est identifiable sans ambiguïté dans le texte de la ligne
