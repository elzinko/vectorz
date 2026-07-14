# language: fr
# Référence normative : cop1 docs/captures/2026-07-13-contrat-methode-et-versions.md §7
# (squelette v0.1 du contrat de supervisabilité). Fiche : features/0050-kit-emetteur-supervisabilite.md
#
# Périmètre de cette PR : lib d'append (src/supervision/) + serveur MCP émetteur (stdio, 5 outils).
# Les consignes de skill (~15 lignes) sont hors Gherkin (revue documentaire).

Fonctionnalité: Kit émetteur de supervisabilité v0.1
  En tant que méthode instrumentée (ezk-product-builder / ezk-sprint via mega-city)
  Je veux émettre un journal d'événements append-only conforme au contrat
  Afin qu'un superviseur externe (cop1 ou tout autre) puisse suivre et piloter mes runs
  sans connaître mon métier.

  Contexte:
    Soit un dossier projet vide sur disque avec un dépôt git initialisé et un premier commit
    Et le serveur MCP émetteur est démarré avec "project_root" fixé sur ce dossier projet

  # ---------------------------------------------------------------------------
  # Rubrique A — Run nominal complet
  # ---------------------------------------------------------------------------

  Scénario: Run nominal complet du premier événement à la clôture
    Quand j'appelle l'outil "run_start" avec la méthode "ezk-product-builder" version "0.1.0" et le siège "pilot"
    Alors un dossier ".supervision/runs/<run_id>/" est créé sous la racine du projet
    Et le fichier "events.jsonl" de ce dossier contient exactement une ligne
    Et cette ligne est un événement de type "run.started" avec pour payload
      | champ            | valeur                                    |
      | method.name      | ezk-product-builder                       |
      | method.version   | 0.1.0                                     |
      | seat             | pilot                                      |
    Et cet événement "run.started" est le premier du journal

    Quand j'appelle l'outil "gate_reached" avec gate_id "gate-1", outcome "ok" et un rapport markdown "## Étape 1 OK"
    Alors un fichier de rapport est créé sous le dossier du run
    Et l'événement "gate.reached" écrit en journal référence ce rapport via "report_ref"
    Et "report_ref" est un chemin relatif à la racine du projet, sans jamais sortir du dossier du run
    Et l'événement "gate.reached" porte un champ "upgrade_ok" de type booléen
    Et le résultat retourné par l'outil "gate_reached" contient le mot "STOP"
    Et le résultat retourné par l'outil "gate_reached" contient un identifiant "gate_event_id"

    Quand j'appelle l'outil "gate_resumed" avec le "gate_event_id" reçu à l'étape précédente
    Alors un événement "gate.resumed" est écrit en journal
    Et son champ "gate_event_id" correspond exactement à l'événement "gate.reached" qu'il referme

    Quand j'appelle l'outil "run_finished" avec le statut "success"
    Alors un événement "run.finished" est écrit en journal avec le statut "success"
    Et le journal contient, dans l'ordre du fichier, exactement les types suivants
      | ordre | type          |
      | 1     | run.started   |
      | 2     | gate.reached  |
      | 3     | gate.resumed  |
      | 4     | run.finished  |
    Et les "seq" de ces quatre lignes sont 1, 2, 3, 4 sans trou
    Et l'ordre du fichier fait foi, indépendamment du champ "ts"

  # ---------------------------------------------------------------------------
  # Rubrique B — Enveloppe et intégrité du journal
  # ---------------------------------------------------------------------------

  Scénario: Chaque ligne du journal respecte l'enveloppe imposée
    Soit un run démarré via "run_start"
    Quand j'appelle successivement "gate_reached", "gate_resumed" puis "run_finished"
    Alors chaque ligne de "events.jsonl" est un JSON valide contenant au moins
      les champs "event_id", "run_id", "seq", "ts", "contract", "type", "payload"
    Et tous les "event_id" du journal sont uniques
    Et tous les "run_id" du journal sont identiques et égaux à l'identifiant du run démarré
    Et les "seq" du journal forment une suite strictement croissante sans trou, en base 1
    Et le champ "contract" est une URI versionnée stable sur tout le run

  Scénario: Le payload fourni par l'appelant ne peut jamais écraser les champs d'enveloppe
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec un payload contenant volontairement les clés
      "seq", "event_id", "run_id" et "contract" avec des valeurs falsifiées
      (ex. seq: 9999, run_id: "autre-run", contract: "contract://falsifie")
    Alors l'événement réellement écrit en journal ignore ces valeurs falsifiées
    Et ses champs d'enveloppe ("seq", "event_id", "run_id", "contract") sont ceux calculés
      par le serveur, jamais ceux fournis par l'appelant

  # ---------------------------------------------------------------------------
  # Rubrique C — Cycle de vie du run (run_start / run_finished)
  # ---------------------------------------------------------------------------

  Scénario: Refus d'un second run_start alors qu'un run est déjà ouvert
    Soit un run déjà démarré via "run_start" et non terminé
    Quand j'appelle à nouveau l'outil "run_start"
    Alors l'appel est refusé avec une erreur explicite
    Et aucun nouveau dossier de run n'est créé
    Et le journal du run déjà ouvert n'est pas modifié

  Scénario: Toute émission hors run ouvert est une erreur, sauf run_start
    Soit le serveur MCP démarré mais aucun "run_start" n'a encore été appelé
    Quand j'appelle l'un des outils "gate_reached", "gate_resumed", "escalate" ou "run_finished"
    Alors chacun de ces appels est refusé avec une erreur explicite
    Et aucun fichier "events.jsonl" n'est créé

  Scénario: Toute émission après run_finished est une erreur
    Soit un run démarré puis terminé via "run_finished" avec le statut "success"
    Quand j'appelle l'un des outils "gate_reached", "gate_resumed" ou "escalate"
    Alors chacun de ces appels est refusé avec une erreur explicite
    Et le fichier "events.jsonl" du run terminé n'est pas modifié

  Scénario: Un nouveau run_start après run_finished ouvre un nouveau run distinct
    Soit un run A démarré puis terminé via "run_finished"
    Quand j'appelle "run_start" à nouveau
    Alors un nouveau "run_id", différent de celui du run A, est attribué
    Et un nouveau dossier ".supervision/runs/<nouveau_run_id>/" est créé
    Et le nouveau "events.jsonl" démarre à "seq" 1 avec un événement "run.started"
    Et le dossier et le journal du run A restent inchangés

  # ---------------------------------------------------------------------------
  # Rubrique D — Un seul gate ouvert à la fois
  # ---------------------------------------------------------------------------

  Scénario: gate_resumed sans gate ouvert est une erreur
    Soit un run démarré via "run_start", sans aucun "gate_reached" appelé depuis
    Quand j'appelle l'outil "gate_resumed" avec un "gate_event_id" quelconque
    Alors l'appel est refusé avec une erreur explicite
    Et aucun événement "gate.resumed" n'est écrit en journal

  Scénario: Double gate_reached sans gate_resumed intermédiaire est une erreur
    Soit un run démarré via "run_start"
    Et un premier "gate_reached" déjà appelé et non encore repris par "gate_resumed"
    Quand j'appelle à nouveau l'outil "gate_reached"
    Alors l'appel est refusé avec une erreur explicite
    Et aucun second événement "gate.reached" n'est écrit en journal
    Et le journal ne contient jamais plus d'un "gate.reached" ouvert simultanément

  # ---------------------------------------------------------------------------
  # Rubrique E — upgrade_ok : calcul mécanique, veto possible, jamais forçable à true
  # ---------------------------------------------------------------------------

  Scénario: upgrade_ok est vrai quand l'arbre git est propre et sans worktree en vol
    Soit un run démarré via "run_start" dans un projet dont l'arbre git est propre
    Et aucun worktree ni sous-run n'est en cours sur ce projet
    Quand j'appelle "gate_reached" sans fournir de veto
    Alors l'événement "gate.reached" porte "upgrade_ok" à "true"

  Scénario: upgrade_ok est faux quand l'arbre git est sale
    Soit un run démarré via "run_start" dans un projet dont l'arbre git contient
      des modifications non commitées
    Quand j'appelle "gate_reached" sans fournir de veto
    Alors l'événement "gate.reached" porte "upgrade_ok" à "false"

  Scénario: upgrade_ok est faux quand un worktree est en vol
    Soit un run démarré via "run_start" dans un projet dont l'arbre git est propre
    Mais un worktree additionnel est actuellement ouvert sur ce projet
    Quand j'appelle "gate_reached" sans fournir de veto
    Alors l'événement "gate.reached" porte "upgrade_ok" à "false"

  Scénario: Le veto de l'appelant force upgrade_ok à faux même sur arbre propre
    Soit un run démarré via "run_start" dans un projet dont l'arbre git est propre
    Et aucun worktree ni sous-run n'est en cours sur ce projet
    Quand j'appelle "gate_reached" avec "upgrade_ok_veto: true"
    Alors l'événement "gate.reached" porte "upgrade_ok" à "false"

  Scénario: L'appelant ne peut jamais forcer upgrade_ok à true
    Soit un run démarré via "run_start" dans un projet dont l'arbre git contient
      des modifications non commitées
    Quand j'appelle "gate_reached" en tentant de fournir "upgrade_ok: true" dans le payload
    Alors cette valeur fournie par l'appelant est ignorée
    Et l'événement "gate.reached" porte "upgrade_ok" à "false"
      (calculé mécaniquement par le serveur, jamais accepté depuis l'appelant)

  # ---------------------------------------------------------------------------
  # Rubrique F — Rapport et confinement de report_ref
  # ---------------------------------------------------------------------------

  Scénario: Le rapport markdown fourni est écrit sous le dossier du run
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec "report_markdown" contenant du texte markdown
    Alors un fichier est créé sous ".supervision/runs/<run_id>/"
    Et le contenu de ce fichier est exactement le markdown fourni
    Et l'événement "gate.reached" référence ce fichier via "report_ref"
    Et "report_ref" est un chemin relatif à la racine du projet (pas au worktree)

  Scénario: report_ref reste confiné sous la racine du projet même en cas de tentative d'échappement
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec un "report_markdown" fourni
    Alors le chemin de fichier réellement utilisé par le serveur est calculé par le serveur,
      jamais dérivé d'une valeur transmise par l'appelant
    Et il n'existe aucun moyen, pour l'appelant, de faire écrire le rapport hors de
      ".supervision/runs/<run_id>/" (pas de paramètre de chemin exposé par l'outil)
    Et si un contrôle de confinement realpath échoue malgré tout, le serveur refuse
      l'opération avec une erreur explicite plutôt que d'écrire hors du projet

  Scénario: gate_reached sans rapport ne référence aucun report_ref
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec outcome "attention" sans fournir de "report_markdown"
    Alors l'événement "gate.reached" est écrit sans "report_ref" (ou avec une valeur absente)
    Et aucun fichier de rapport n'est créé sous le dossier du run

  # ---------------------------------------------------------------------------
  # Rubrique G — Persistance et redémarrage du serveur
  # ---------------------------------------------------------------------------

  Scénario: Le seq reprend strictement croissant après redémarrage du serveur sur un run ouvert
    Soit un run démarré via "run_start" puis un "gate_reached" suivi d'un "gate_resumed"
      (journal contenant les seq 1, 2, 3)
    Et le serveur MCP est arrêté puis relancé avec le même "project_root"
    Quand j'appelle "gate_reached" à nouveau sur ce même run après redémarrage
    Alors le nouvel événement porte "seq" 4, ni un doublon de seq existant, ni un retour en arrière
    Et le contenu des lignes 1 à 3 du journal reste strictement inchangé après redémarrage

  Scénario: Le redémarrage relit le run_id et le gate ouvert depuis le journal existant
    Soit un run démarré via "run_start" puis un "gate_reached" appelé, sans "gate_resumed"
    Et le serveur MCP est arrêté puis relancé avec le même "project_root"
    Quand j'appelle l'outil "gate_resumed" avec le "gate_event_id" du gate resté ouvert
    Alors l'appel est accepté et un événement "gate.resumed" cohérent est écrit
    Et le serveur redémarré n'a pas dupliqué l'événement "run.started" ni le "gate.reached" déjà présents

  # ---------------------------------------------------------------------------
  # Rubrique H — Escalade (signal, jamais un frein)
  # ---------------------------------------------------------------------------

  Scénario: Une escalade blocked est journalisée sans interrompre le run
    Soit un run démarré via "run_start" et actuellement en cours (pas de gate ouvert)
    Quand j'appelle l'outil "escalate" avec type "blocked" et un détail "attente d'une dépendance externe"
    Alors un événement "escalation" est écrit en journal avec un "escalation_id" et type "blocked"
    Et cet appel n'arrête pas le run et n'empêche pas un "gate_reached" ultérieur

  # ---------------------------------------------------------------------------
  # Rubrique I — Robustesse / hostilité (revue NO-GO, corrections B1/M1/M2)
  # ---------------------------------------------------------------------------

  Scénario: gate_id hostile est rejeté avant toute écriture sur disque
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec un "gate_id" contenant une tentative
      d'échappement de chemin (ex. "../../../../victim/link") combinée à un
      symlink préexistant hors du dossier du run
    Alors l'appel est refusé avec une erreur de validation explicite
    Et aucune écriture n'a lieu sur le fichier ciblé par le symlink hors projet
    Et aucun événement "gate.reached" n'est écrit en journal

  Scénario: gate_id contenant un séparateur de chemin est une erreur de validation claire
    Soit un run démarré via "run_start"
    Quand j'appelle "gate_reached" avec un "gate_id" contenant un "/"
    Alors l'appel est refusé avec une erreur de validation explicite (pas une erreur système type ENOENT)

  Scénario: Une dernière ligne de journal tronquée n'est jamais fatale
    Soit un run démarré via "run_start" puis un "gate_reached" déjà écrit
    Et la dernière ligne du fichier "events.jsonl" a été tronquée (écriture interrompue,
      pas de retour à la ligne final, JSON invalide)
    Quand j'appelle à nouveau un outil qui lit l'état du journal (ex. "gate_resumed")
    Alors l'appel n'échoue pas à cause de la ligne tronquée
    Et la ligne tronquée est ignorée ; le "seq" repart de la dernière ligne valide
    Et le run reste utilisable normalement

  Scénario: Une dernière ligne complète mais sans retour à la ligne final n'est jamais ressuscitée
    Soit un run démarré via "run_start"
    Et un événement "gate.reached" complet et JSON-valide a été écrit en toute fin de
      fichier, mais SANS retour à la ligne final (crash exactement après l'écriture
      du JSON, avant le "\n")
    Quand j'appelle à nouveau l'outil "gate_reached"
    Alors l'appel est accepté (aucun gate fantôme détecté à partir de la ligne sans "\n")
    Et le "seq" du nouvel événement ne duplique jamais celui de la ligne sans "\n"
    Et la ligne sans "\n" a disparu du fichier après ce nouvel append (jamais refermée
      ni ressuscitée)

  Scénario: upgrade_ok se dégrade silencieusement hors dépôt git
    Soit un dossier projet qui n'est PAS un dépôt git (pas de ".git")
    Et un run démarré via "run_start" dans ce dossier
    Quand j'appelle "gate_reached" sans fournir de veto
    Alors l'appel n'échoue pas et ne lève aucune exception
    Et l'événement "gate.reached" porte "upgrade_ok" à "false"
