#language: fr
# Référence normative : ADR-035-abandon-siege-run-orphelin.md
# Fiche : features/0168-run-orphelin-verrou-sans-cle.md
#
# Périmètre : route POST /api/supervision/runs/abandon + politique D4 +
# adaptateur EmitterCliAbandonAdapter (spawn) + bouton Moniteur.
# Tags : @unit = comportement domaine/application/infra, testable sans navigateur.
#        @e2e  = rendu et interactions dans la mission-control (Playwright).

Fonctionnalité: Abandon d'un run orphelin depuis le Moniteur (fiche 0168)
  En tant que superviseur (humain) utilisant la mission-control
  Je veux pouvoir abandonner un run en « Silence prolongé » d'un clic
  Afin de débloquer l'émetteur sans toucher au disque à la main,
  tout en garantissant que cop1 ne décide jamais seul et n'écrit jamais le journal.

  Contexte:
    Étant donné le daemon cop1 tourne avec le JournalWatcherAdapter actif
    Et un projet surveillé est présent sous un watch-root configuré

  # ---------------------------------------------------------------------------
  # Rubrique A — Politique d'abandon (D4) : gardes côté serveur
  # ---------------------------------------------------------------------------

  @unit
  Scénario: AC1 — 404 si le runDir soumis n'est pas une clé connue du serveur
    # ADR-035 D4 §1 : le client ne peut nommer qu'un run que le serveur a lui-même
    # découvert — aucun chemin client n'est jamais résolu (traversée de chemin impossible).
    Étant donné aucun run n'a encore été découvert sous les watch-roots configurés
    Quand un POST /api/supervision/runs/abandon est émis avec un runDir arbitraire non connu
    Alors la réponse a le statut HTTP 404
    Et aucun événement n'est écrit dans aucun journal

  @unit
  Scénario: AC1 — 409 si le run est dans l'état "running" avec liveness "alive" (pas presumed_dead)
    # ADR-035 D4 §2 : on n'abandonne pas un run vivant.
    Étant donné un run découvert par le serveur dont l'état est "running" et la liveness est "alive"
    Quand un POST /api/supervision/runs/abandon est émis avec le runDir de ce run
    Alors la réponse a le statut HTTP 409
    Et aucun événement n'est écrit dans le journal de ce run

  @unit
  Scénario: AC1 — 409 si le run est dans l'état "at_gate" (silence voulu, jamais presumed_dead)
    # ADR-035 D4 §2 + ADR-028 D8 : presumed_dead ne se déclenche pas sur at_gate.
    # L'abandon d'un run au jalon est interdit.
    Étant donné un run découvert par le serveur dont l'état est "at_gate"
    Quand un POST /api/supervision/runs/abandon est émis avec le runDir de ce run
    Alors la réponse a le statut HTTP 409
    Et aucun événement n'est écrit dans le journal de ce run

  @unit
  Scénario: AC1 — 409 si le run est déjà dans l'état "finished"
    # On n'abandonne pas un run déjà terminé.
    Étant donné un run découvert par le serveur dont l'état est "finished"
    Quand un POST /api/supervision/runs/abandon est émis avec le runDir de ce run
    Alors la réponse a le statut HTTP 409
    Et aucun événement n'est écrit dans le journal de ce run

  @unit
  Scénario: AC6 — 409 avec marche à suivre si abandon_command n'est pas configurée
    # ADR-035 D3 + D4 §3 : capacité dormante par défaut (abandon_command: []).
    # Le message d'erreur doit expliquer comment activer la capacité.
    Étant donné la config de cop1 ne contient pas de "abandon_command" configurée (défaut vide)
    Et un run découvert dont l'état est "running" et la liveness est "presumed_dead"
    Quand un POST /api/supervision/runs/abandon est émis avec le runDir de ce run
    Alors la réponse a le statut HTTP 409
    Et le corps de la réponse contient une marche à suivre expliquant comment configurer abandon_command
    Et aucun événement n'est écrit dans le journal de ce run

  @unit
  Scénario: AC1 — chemin nominal : abandon accepté sur run running + presumed_dead + capacité configurée
    # ADR-035 D4 : les trois gardes sont passées → la commande est déléguée au port.
    Étant donné la config de cop1 contient une abandon_command configurée
    Et un run découvert dont l'état est "running" et la liveness est "presumed_dead"
    Quand un POST /api/supervision/runs/abandon est émis avec le runDir de ce run
    Alors la réponse a le statut HTTP 200 (ou 202)
    Et l'adaptateur a été invoqué avec le projectRoot et le run_id attendu
    Et aucune écriture directe dans events.jsonl n'a été effectuée par cop1

  # ---------------------------------------------------------------------------
  # Rubrique B — Provenance de la commande (D3)
  # ---------------------------------------------------------------------------

  @unit
  Scénario: D3 — la commande d'abandon est lue depuis la config de cop1, jamais depuis le .mcp.json du projet
    # ADR-035 D3 : frontière de confiance — le daemon n'exécute pas la config de sa cible.
    Étant donné la config de cop1 définit abandon_command: ["pnpm", "--dir", "products/mega-city", "supervision:abandon"]
    Et le projet surveillé possède un ".mcp.json" contenant une commande différente
    Quand l'adaptateur résout la commande à spawn pour un abandon
    Alors la commande spawnée est celle de la config de cop1
    Et la commande du ".mcp.json" du projet n'est jamais lue ni exécutée

  # ---------------------------------------------------------------------------
  # Rubrique C — Pas de mise à jour optimiste du snapshot (D6)
  # ---------------------------------------------------------------------------

  @unit
  Scénario: D6 — le POST abandon ne modifie pas le snapshot en mémoire avant confirmation du disque
    # ADR-035 D6 : la source unique de vérité est le disque.
    # La carte ne passe en "finished" que quand le watcher a absorbé events.jsonl.
    Étant donné un run running + presumed_dead et la capacité configurée
    Quand un POST /api/supervision/runs/abandon réussit (HTTP 200)
    Alors le snapshot en mémoire de ce run n'est pas immédiatement modifié en "finished"
    Et le snapshot est mis à jour uniquement après que le JournalWatcherAdapter
      a détecté le changement de events.jsonl et absorbé le nouvel événement
    Et un événement SSE "supervision.run.updated" est émis après cette absorption

  # ---------------------------------------------------------------------------
  # Rubrique D — Fin de la boucle : run_start réussit après abandon (AC2)
  # ---------------------------------------------------------------------------

  @unit
  Scénario: AC2 — run_start réussit sur le même projet après l'abandon d'un run orphelin
    # ADR-035 / fiche 0168 AC2 : l'abandon par le siège libère le verrou émetteur.
    Étant donné un run orphelin ouvert dans un projet (bloquant tout nouveau run_start)
    Quand l'abandon siège est exécuté et que events.jsonl contient "run.finished {status:abandoned}"
    Alors un appel "run_start" sur ce même projet réussit
    Et un nouveau run_id différent de l'orphelin est attribué
    Et le journal de l'orphelin reste intact et contient exactement son événement "run.finished"

  # ---------------------------------------------------------------------------
  # Rubrique E — Interface Moniteur (E2E Playwright)
  # ---------------------------------------------------------------------------

  @e2e
  Scénario: AC1 E2E — le bouton "Abandonner ce run" est visible uniquement sur une carte presumed_dead
    # ADR-035 D4 : le bouton est conditionnel à l'overlay liveness presumed_dead.
    Étant donné la mission-control ouverte dans le navigateur
    Et un run affiché dans l'état "running" avec la liveness "presumed_dead" (carte "Silence prolongé")
    Quand j'observe le panneau de ce run
    Alors un bouton "Abandonner ce run" (ou libellé équivalent) est visible
    Et ce bouton est absent sur les cartes dont la liveness est "alive"
    Et ce bouton est absent sur les cartes dont l'état est "at_gate" ou "finished"

  @e2e
  Scénario: AC6 E2E — le bouton est absent (ou désactivé avec raison) si abandon_command n'est pas configurée
    # ADR-035 D3 : capacité dormante → pas de bouton actif sans config.
    Étant donné la config de cop1 ne contient pas de abandon_command configurée
    Et un run affiché avec la liveness "presumed_dead"
    Quand j'observe le panneau de ce run dans la mission-control
    Alors aucun bouton d'abandon actif n'est présent
    Et une indication explique pourquoi l'abandon n'est pas disponible (ex. "abandon_command non configurée")

  @e2e
  Scénario: AC1 E2E — clic sur "Abandonner ce run" déclenche l'abandon et affiche un état intermédiaire
    # ADR-035 D6 : latence assumée (spawn + debounce 80 ms).
    # L'UI montre un état "abandon demandé" avant que le disque confirme.
    Étant donné un run affiché avec la liveness "presumed_dead" et la capacité configurée
    Quand je clique sur le bouton "Abandonner ce run"
    Alors la carte affiche un état intermédiaire "abandon demandé" (ou libellé équivalent)
    Et la carte n'affiche pas encore l'état "finished" (le disque n'a pas encore confirmé)

  @e2e
  Scénario: AC1 E2E — la carte passe en "finished" quand le disque confirme, sans rechargement
    # ADR-035 D6 : c'est le retour par le disque (watcher → SSE) qui met à jour la carte.
    Étant donné un clic sur "Abandonner ce run" vient d'être effectué
    Quand le kit émetteur a écrit "run.finished {status:abandoned, abandoned_by:seat}" dans events.jsonl
    Et le JournalWatcherAdapter a absorbé cet événement et émis le SSE "supervision.run.updated"
    Alors la carte du run passe en état "finished" sans rechargement de page
    Et la carte indique que l'abandon a été effectué par le siège ("abandoned_by: seat")

  @e2e
  Scénario: AC5 E2E — sans clic, le run reste en "Silence prolongé" indéfiniment
    # ADR-035 D7 / AC5 : aucun auto-abandon — le signal reste visible tant que l'humain n'agit pas.
    Étant donné un run affiché avec la liveness "presumed_dead"
    Et aucun clic sur le bouton d'abandon n'a été effectué
    Quand on observe la mission-control après un délai supplémentaire significatif
    Alors la carte reste dans l'état "running" avec la liveness "presumed_dead"
    Et aucun événement "run.finished" n'apparaît dans le journal
