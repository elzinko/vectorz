#language: fr
Fonctionnalité: Validateur de journal de supervisabilité v0.1
  En tant que superviseur (humain ou automatisé) d'un run cop1
  Je veux rejouer un journal de run (events.jsonl + commands.jsonl optionnel)
  Afin de savoir si l'invariant de supervisabilité a été respecté,
  avec un rapport lisible et un code retour utilisable en CI

  # Portée DP5 (scope réduit v1) : enveloppe + machine à états + seq + enum fermée
  # de commandes + règle post-run.finished. Hors scope : hash-chain, corrélations
  # version.adopted/upgrade_ok, escalation.resolved→ouverte, report_ref realpath.
  # Chaque scénario correspond à un dossier sous packages/journal-validator/fixtures/.

  Contexte:
    Étant donné un dossier de run contenant un fichier "events.jsonl"
    Et éventuellement un fichier "commands.jsonl"

  # --- Runs nominaux --------------------------------------------------------

  Scénario: Le journal réel du kit émetteur passe vert
    Étant donné la fixture "real-run-toy" contenant un run réel émis par le kit émetteur mega-city
    Et ce run n'a pas de fichier "commands.jsonl" (mode moniteur)
    Quand je valide ce dossier de run
    Alors le rapport ne contient aucune violation
    Et le rapport résume la machine à états du run jusqu'à "finished"
    Et le code retour est 0

  Scénario: Un run nominal synthétique en mode pilote passe vert
    Étant donné la fixture "nominal-synthetic" avec deux gates franchis puis repris
    Et un fichier "commands.jsonl" contenant les "continue" correspondants
    Quand je valide ce dossier de run
    Alors le rapport ne contient aucune violation
    Et le code retour est 0

  Scénario: L'absence de commands.jsonl est un mode moniteur légitime, pas une erreur
    Étant donné un run valide sans fichier "commands.jsonl"
    Et les événements "gate.reached" du run sont chacun suivis d'un "gate.resumed" self-reported
    Quand je valide ce dossier de run
    Alors le rapport ne signale aucun avertissement bloquant sur l'absence de "commands.jsonl"
    Et le code retour est 0

  # --- Invariant : gate ouvert = alarme sur toute activité non reprise -------

  Scénario: Une activité après un gate.reached sans gate.resumed corrélé est une violation
    Étant donné la fixture "violation-post-gate"
    Et un "gate.reached" à la séquence 2 sans "gate.resumed" corrélé
    Et un événement "heartbeat" à la séquence 3 après ce gate
    Quand je valide ce dossier de run
    Alors le rapport contient une violation référençant la séquence 3
    Et le rapport indique le run comme resté "at_gate"
    Et le code retour est différent de 0

  Scénario: Un double gate.reached sans reprise entre les deux est une violation
    Étant donné la fixture "double-gate-open"
    Et un "gate.reached" à la séquence 2 non repris
    Et un second "gate.reached" à la séquence 3 avant toute reprise
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "au plus un gate ouvert" référençant la séquence 3
    Et le code retour est différent de 0

  Scénario: Un gate.resumed orphelin est une violation
    Étant donné la fixture "gate-resumed-orphan"
    Et un "gate.resumed" à la séquence 2 référençant un "gate_event_id" inconnu et sans gate ouvert
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "gate.resumed orphelin" référençant la séquence 2
    Et le code retour est différent de 0

  # --- Enveloppe et intégrité du fichier --------------------------------------

  Scénario: Un trou dans la séquence est détecté comme perte
    Étant donné la fixture "seq-gap"
    Et les événements ont pour "seq" 1, 2 puis 4 (trou en 3)
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "trou de séquence" entre 2 et 4
    Et le code retour est différent de 0

  Scénario: L'absence de run.started est une violation
    Étant donné la fixture "run-started-missing"
    Et le premier événement du journal n'est pas "run.started"
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "run.started manquant"
    Et le code retour est différent de 0

  Scénario: Un run.started qui n'est pas le premier événement est une violation
    Étant donné la fixture "run-started-not-first"
    Et un événement "heartbeat" précède l'événement "run.started"
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "run.started doit être le premier événement"
    Et le code retour est différent de 0

  Scénario: Un événement après run.finished est une violation
    Étant donné la fixture "event-post-finished"
    Et un événement "heartbeat" à la séquence 3 suit un "run.finished" à la séquence 2
    Quand je valide ce dossier de run
    Alors le rapport contient une violation référençant la séquence 3 pour activité post-"run.finished"
    Et le code retour est différent de 0

  Scénario: Une ligne invalide est signalée sans faire planter le validateur
    Étant donné la fixture "invalid-line"
    Et une ligne du fichier "events.jsonl" n'est pas un JSON valide
    Quand je valide ce dossier de run
    Alors le validateur ne lève aucune exception et va au bout de la lecture
    Et le rapport contient une entrée "contract.violation" référençant le numéro de ligne fautive
    Et le rapport traite normalement les lignes valides encadrantes
    Et le code retour est différent de 0

  Scénario: La dernière ligne tronquée sans retour à la ligne est ignorée
    Étant donné la fixture "truncated-last-line"
    Et la dernière ligne du fichier "events.jsonl" n'est pas terminée par un "\n"
    Quand je valide ce dossier de run
    Alors cette dernière ligne tronquée n'apparaît ni comme violation ni comme événement traité
    Et les lignes précédentes valides sont prises en compte normalement

  Scénario: Un champ ou un type inconnu est toléré et simplement signalé
    Étant donné la fixture "unknown-field-type"
    Et une ligne contient un champ additionnel inconnu dans l'enveloppe
    Et une autre ligne a un "type" d'événement inconnu du contrat v0.1
    Quand je valide ce dossier de run
    Alors le rapport signale ces deux lignes comme notices, pas comme violations
    Et ces notices ne changent pas le code retour si le reste du run est conforme
    Et le code retour est 0

  # --- Commandes : enum fermée + corrélation ----------------------------------

  Scénario: Une commande hors de l'enum fermée continue|hold|abort est une violation
    Étant donné la fixture "commands-invalid-enum"
    Et le fichier "commands.jsonl" contient une commande de type "resume"
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "type de commande hors enum" référençant cette commande
    Et le code retour est différent de 0

  Scénario: Un continue référençant un gate_event_id inconnu est une violation
    Étant donné la fixture "commands-continue-unknown-gate"
    Et le fichier "commands.jsonl" contient un "continue" avec un "gate_event_id" qui n'existe dans aucun "gate.reached"
    Quand je valide ce dossier de run
    Alors le rapport contient une violation "gate_event_id inconnu" référençant cette commande
    Et le code retour est différent de 0

  Scénario: Un re-continue d'un gate déjà continué est signalé comme no-op, pas comme violation
    Étant donné la fixture "commands-continue-noop"
    Et le fichier "commands.jsonl" contient deux "continue" successifs pour le même "gate_event_id"
    Quand je valide ce dossier de run
    Alors le rapport signale le second "continue" comme "no-op" (idempotence)
    Et cette entrée n'est pas comptée parmi les violations
    Et le code retour est 0
