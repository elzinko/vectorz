#language: fr
Fonctionnalité: Lecteur de journal .supervision/runs/ dans la mission-control (mode moniteur)
  En tant que superviseur (humain) utilisant la mission-control
  Je veux voir en direct l'état d'un run que cop1 n'a pas lancé lui-même
  Afin de le suivre en mode moniteur sans redémarrer quoi que ce soit et sans que
  cop1 ne décide quoi que ce soit à sa place (panneau strictement read-only)

  # Fiche 0031 (DP4, étape 4 du MVP démo). Compose avec le validateur 0027 : mêmes
  # fixtures de run sous packages/journal-validator/fixtures/.
  # Tags : @unit = comportement du JournalWatcherAdapter / de la projection d'état,
  #        testable sans navigateur (fichiers → événements → état projeté).
  #        @e2e = rendu observable dans la mission-control (badge, libellés, DOM),
  #        testable uniquement via un navigateur piloté (Playwright).

  Contexte:
    Étant donné un projet avec un dossier ".supervision/runs/" sur un watch-root configuré
    Et le daemon cop1 tourne avec le JournalWatcherAdapter actif

  # --- Découverte et lecture live -----------------------------------------

  @unit
  Scénario: Un run déjà présent au démarrage du daemon est découvert
    Étant donné un dossier ".supervision/runs/<id>/" contenant déjà un "events.jsonl" valide
      avant le démarrage du daemon
    Quand le daemon démarre et que le JournalWatcherAdapter parcourt les watch-roots
    Alors un snapshot du run est projeté et émis via "supervision.run.updated" sur l'EventBus
    Et l'état projeté du run reflète la machine à états jusqu'au dernier événement du fichier

  @unit
  Scénario: Un run créé pendant que le daemon tourne est découvert sans redémarrage
    Étant donné le daemon en cours d'exécution sans aucun run connu
    Quand un nouveau dossier ".supervision/runs/<id>/" apparaît avec un "events.jsonl"
    Alors le JournalWatcherAdapter détecte le nouveau fichier sans redémarrage du daemon
    Et un nouveau snapshot de ce run est émis via "supervision.run.updated" au fil de son écriture

  @e2e
  Scénario: Un dossier de run alimenté à la main s'affiche live dans la mission-control
    Étant donné la mission-control ouverte dans le navigateur sans run affiché
    Quand j'ajoute à la main des lignes à ".supervision/runs/<id>/events.jsonl" simulant
      "run.started" puis "gate.reached"
    Alors le run apparaît dans la mission-control sans rechargement de page
    Et l'état affiché passe de "running" à "at_gate"
    Et l'âge du dernier événement affiché ("il y a Xs") augmente au fil du temps
    Et aucun redémarrage du daemon n'a été nécessaire

  # --- Badge classe B et provenance des tokens -----------------------------

  @e2e
  Scénario: Le badge « classe B — best-effort » et la provenance des tokens sont visibles
    Étant donné un run affiché dans la mission-control, alimenté depuis un journal valide
    Quand j'ouvre la vue de ce run
    Alors un badge « classe B — best-effort » est visible sur le panneau
    Et la provenance de chaque token affiché est marquée soit « mesuré », soit
      « absent-et-dit-absent »
    Et aucun token n'est affiché comme mesuré s'il n'a pas été effectivement lu dans le journal

  # --- Origine des reprises -------------------------------------------------

  @unit
  Scénario: Un gate.resumed avec command_ref est projeté comme clairance par commande
    Étant donné un "gate.reached" suivi d'un "gate.resumed" dont le payload contient
      un champ "command_ref"
    Quand le JournalWatcherAdapter projette cet événement
    Alors la reprise est projetée avec l'origine "clairance par commande"

  @unit
  Scénario: Un gate.resumed sans command_ref est projeté comme self-reported
    Étant donné un "gate.reached" suivi d'un "gate.resumed" dont le payload ne contient
      pas de champ "command_ref"
    Quand le JournalWatcherAdapter projette cet événement
    Alors la reprise est projetée avec l'origine "self-reported en session"

  @e2e
  Scénario: L'origine de la reprise est affichée distinctement dans la mission-control
    Étant donné un run affiché contenant une reprise par commande et une reprise self-reported
    Quand j'ouvre la vue de ce run
    Alors la reprise par commande est libellée distinctement de la reprise self-reported
    Et aucune des deux formulations ne laisse penser que cop1 a lui-même déclenché la reprise

  # --- presumed_dead : uniquement en running, jamais en at_gate (D8) -------
  # `presumed_dead` est un overlay serveur (`liveness`), distinct du `state`
  # de contrat calculé par journal-validator : le `state` reste "running", et
  # ancré sur l'heure LOCALE de dernière absorption réussie du run
  # (`lastAbsorbedAt`), jamais sur le `ts` auto-déclaré du journal (semi-hostile).

  @unit
  Scénario: Un silence prolongé en état "running" fait basculer l'overlay liveness sur presumed_dead
    Étant donné un run dans l'état "running" dont la dernière absorption réussie date de plus
      que le seuil de silence configuré (indépendamment du "ts" auto-déclaré dans le journal)
    Quand le seuil de silence est dépassé depuis la dernière absorption
    Alors le "state" du run reste "running"
    Et l'overlay "liveness" du run passe à "presumed_dead"

  @unit
  Scénario: Un silence prolongé en état "at_gate" ne déclenche jamais presumed_dead
    Étant donné un run dans l'état "at_gate" (gate.reached sans gate.resumed) dont la
      dernière absorption réussie date de plus que le seuil de silence configuré
    Quand le seuil de silence est dépassé depuis la dernière absorption
    Alors l'état affiché reste "at_gate"
    Et l'overlay "liveness" reste "alive" : "presumed_dead" n'est jamais déclenché tant que
      le run reste "at_gate"

  # --- Ligne invalide : violation affichée, run lisible ---------------------

  @unit
  Scénario: Une ligne JSONL invalide produit une violation "contract.violation" sans casser la lecture du run
    Étant donné la fixture "invalid-line" du validateur 0027, rejouée par le
      JournalWatcherAdapter
    Quand le JournalWatcherAdapter lit le fichier "events.jsonl"
    Alors le snapshot projeté porte, dans son champ "violations", une entrée de code
      "contract.violation" référençant la ligne fautive
    Et les événements valides encadrants sont projetés normalement
    Et le run reste consultable dans son ensemble

  @e2e
  Scénario: La violation est affichée dans la mission-control sans rendre le run illisible
    Étant donné un run dont le journal contient une ligne invalide au milieu d'événements valides
    Quand j'ouvre la vue de ce run dans la mission-control
    Alors une indication de violation est visible sur le run
    Et l'historique des événements valides du run reste affiché et navigable

  @unit
  Scénario: Un trou de séquence (seq_gap) est affiché comme violation sans casser la lecture du run
    Étant donné la fixture "seq-gap" du validateur 0027 (seq 1, 2 puis 4), rejouée par le
      JournalWatcherAdapter
    Quand le JournalWatcherAdapter lit le fichier "events.jsonl"
    Alors le snapshot projeté porte, dans son champ "violations", une entrée de code
      "envelope.seq_gap" référençant le trou de séquence
    Et le run reste consultable jusqu'au dernier événement valide reçu

  # --- gate.resumed orphelin (cas limite de projection) --------------------

  @unit
  Scénario: Un gate.resumed orphelin est projeté comme anomalie sans faire planter la projection
    Étant donné la fixture "gate-resumed-orphan" du validateur 0027 (gate.resumed
      référençant un gate_event_id inconnu, sans gate ouvert), rejouée par le
      JournalWatcherAdapter
    Quand le JournalWatcherAdapter projette les événements de ce run
    Alors le snapshot projeté porte, dans son champ "violations", une entrée de code
      "state.gate_resumed_orphan" référençant ce gate.resumed orphelin
    Et l'état du run n'est pas faussement projeté comme "at_gate" repris
    Et le run reste consultable

  # --- Robustesse à un journal semi-hostile (lecture) -----------------------

  @unit
  Scénario: Un events.jsonl illisible (ex. dossier au lieu d'un fichier) ne fait jamais planter le daemon
    Étant donné un dossier ".supervision/runs/<id>/events.jsonl" qui est en réalité un
      dossier et non un fichier (journal mal initialisé côté émetteur tiers)
    Quand le JournalWatcherAdapter tente d'absorber ce run
    Alors aucune exception n'est levée jusqu'à l'appelant
    Et un snapshot est tout de même émis pour ce run, portant une violation de code
      "watcher.read_error"

  # --- Verrou DP2 : zéro mapping gate→phase, panneau read-only -------------

  @e2e
  Scénario: Le panneau ne propose aucune action de pilotage sur le run
    Étant donné un run affiché dans la mission-control, y compris un run "at_gate"
    Quand j'ouvre la vue de ce run
    Alors aucun bouton ni contrôle de décision (continuer, suspendre, abandonner) n'est
      présent sur le panneau

  @e2e
  Scénario: Les report_ref sont rendus de façon inerte
    Étant donné un run dont un événement "gate.reached" porte un "report_ref"
    Quand j'ouvre la vue de ce run
    Alors le report_ref est affiché de façon échappée et inerte (non exécutable, non
      cliquable vers une ressource hors de la racine projet)

  @unit
  Scénario: Aucune correspondance gate_id → nom de phase métier n'existe côté cop1
    Étant donné le code source de la fonctionnalité de lecture de journal
    Quand j'inspecte la projection d'état et le rendu du run
    Alors aucune table ni fonction ne fait correspondre un "gate_id" à un nom de phase
      de méthode
    Et le nom de la phase courante, si affiché, provient tel quel du contenu du
      "report_ref" produit par la méthode, jamais d'un mapping interne à cop1
