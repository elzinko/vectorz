# language: fr
# Fiche : features/20260821172716537_carte-ne-montre-pas-la-loi.md — ADR-0040.
# Definition of Done exécutable des 6 critères d'acceptation. La carte ezk:map
# doit LIRE le graphe compilé (.ezk/graph.compiled.json, produit par
# `pnpm --dir products/mega-city graph:compile`), jamais ré-interpréter les
# .yml source. Doctrine D5 : pas de recompilation au bord.

Fonctionnalité: La carte ouvre le bloc LA LOI (règles, bundles, profils)
  En tant que lecteur de la carte ezk:map
  Je veux voir les règles, bundles et profils comme des nœuds, avec leurs liens
  Afin de répondre "qui active quoi ?" pour un profil sans ouvrir un fichier .yml

  # ---------------------------------------------------------------------------
  # AC1 — la recherche aboutit
  # ---------------------------------------------------------------------------

  Scénario: Chercher "composition" ou "règles" sur la carte aboutit
    Soit la carte "ezk:map" servie localement avec un graphe compilé à jour
    Quand je cherche "composition" dans la carte
    Alors au moins un nœud du bloc "LA LOI" apparaît dans les résultats
    Quand je cherche "règles" dans la carte
    Alors au moins un nœud de type "rule" apparaît dans les résultats

  # ---------------------------------------------------------------------------
  # AC2 — nœuds lus du graphe compilé, pas des .yml à la main
  # ---------------------------------------------------------------------------

  Scénario: Les règles, bundles et profils sont affichés comme nœuds du graphe compilé
    Soit le fichier ".ezk/graph.compiled.json" généré par "graph:compile"
    Quand j'ouvre le bloc "LA LOI" de la carte
    Alors je vois un nœud par entrée de type "rule" du graphe compilé
    Et je vois un nœud par entrée de type "bundle" du graphe compilé
    Et je vois un nœud par entrée de type "profile" du graphe compilé
    Et le nombre de nœuds affichés correspond exactement au nombre d'entrées du graphe compilé
    Et aucun fichier ".yml" sous "rules/", "bundles/" ou "profiles/" n'est lu directement par la carte

  # ---------------------------------------------------------------------------
  # AC3 — liens visibles et sourcés (provenance fichier)
  # ---------------------------------------------------------------------------

  Scénario: Les liens bundle→règle, profil→bundle, profil→agent/skill et règle→agent sont visibles et sourcés
    Soit le bloc "LA LOI" ouvert sur la carte
    Alors chaque arête "bundle→rule" du graphe compilé est représentée sur la carte
    Et chaque arête "profile→bundle" du graphe compilé est représentée sur la carte
    Et chaque arête "profile→agent" ou "profile→skill" du graphe compilé est représentée sur la carte
    Et chaque arête "rule→agent" du graphe compilé est représentée sur la carte
    Quand je sélectionne n'importe quel nœud "rule", "bundle" ou "profile"
    Alors sa fiche affiche un chemin de fichier de provenance non vide
    Et ce chemin pointe vers le ".yml" ou le frontmatter d'origine du nœud

  # ---------------------------------------------------------------------------
  # AC4 — "qui active quoi ?" sans ouvrir un .yml
  # ---------------------------------------------------------------------------

  Scénario: Un lecteur répond "qui active quoi ?" pour un profil donné, HÉRITAGE compris, sans ouvrir de .yml
    Soit le profil "mobile" affiché sur la carte (il hérite du profil "base" via profile-extends)
    Quand je sélectionne ce profil
    Alors je vois la liste de ses bundles activés, héritage compris
    Et le bundle "base" (hérité) figure dans la liste, pas seulement le bundle "mobile"
    Et je vois les règles activées via ces bundles, y compris celles héritées du bundle "base"
    Et je vois les agents et skills activés, y compris le skill "ezk-archive" hérité de "base"
    Et je n'ai eu besoin d'ouvrir aucun fichier ".yml" pour obtenir cette réponse

  # ---------------------------------------------------------------------------
  # AC5 — sabotage : nouveau bundle détecté sans édition de la carte
  # ---------------------------------------------------------------------------

  Scénario: Un bundle ajouté et recompilé apparaît sur la carte sans toucher au code de la carte
    Soit la carte affichant N bundles avant modification
    Quand j'ajoute un nouveau fichier ".yml" dans "bundles/"
    Et que je relance "pnpm --dir products/mega-city graph:compile"
    Et que je recharge la carte "ezk:map"
    Alors la carte affiche N+1 bundles
    Et le nouveau bundle apparaît avec sa provenance
    Et aucun fichier du code de la carte n'a été modifié pour obtenir ce résultat

  # ---------------------------------------------------------------------------
  # AC6 — doctrine D5 : lecture seule, pas de recompilation au bord
  # ---------------------------------------------------------------------------

  Scénario: La carte lit l'objet compilé et ne recompile jamais au bord
    Soit le serveur de la carte "ezk:map" démarré
    Quand une page du bloc "LA LOI" est chargée
    Alors le module de la carte lit exclusivement ".ezk/graph.compiled.json"
    Et aucune invocation de "graph:compile" n'est déclenchée par le serveur ou le client de la carte
    Soit le fichier ".ezk/graph.compiled.json" absent (404) ou le serveur indisponible
    Alors la carte affiche un état "graphe non à jour / introuvable" au lieu de recompiler silencieusement
    # Limite connue (ADR-0041) : un graphe PRÉSENT mais périmé n'est pas détectable côté
    # navigateur (pas d'accès aux mtimes source) ; la fraîcheur est garantie par le check CI/ship de graph:compile.
