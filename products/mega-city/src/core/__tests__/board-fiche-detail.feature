# language: fr
# Fiche : features/20260826225817193_board-clic-fiche-detail.md
# DoD E2E : sur le board d'avancement, cliquer une fiche ouvre un panneau de détail LISIBLE
# (métadonnées + corps rendu), au lieu de naviguer vers le .md brut. Rendu en textContent/DOM.

Fonctionnalité: Détail d'une fiche au clic, dans le board d'avancement
  En tant que lecteur du board
  Je veux cliquer une fiche et voir son détail mis en forme sans quitter le board
  Afin de comprendre une fiche sans ouvrir son fichier markdown brut

  Scénario: Cliquer une carte ouvre le panneau de détail (pas le .md brut)
    Soit le board d'avancement servi par ezk:map
    Quand je clique sur une carte de fiche
    Alors un panneau de détail s'ouvre dans la page
    Et la navigation ne quitte pas le board vers le fichier .md brut

  Scénario: Le panneau montre métadonnées et corps lisible
    Soit une carte de fiche cliquée
    Alors je vois ses métadonnées (id, titre, statut, priorité, type)
    Et je vois le corps de la fiche rendu lisible (titres, paragraphes, listes)
    Et un lien « ouvrir le fichier » pointe vers la source .md

  Scénario: Fermeture du panneau
    Soit le panneau de détail ouvert
    Quand j'appuie sur Échap, ou je clique hors du panneau, ou sur le bouton fermer
    Alors le panneau se ferme et je reviens au board

  Scénario: Sécurité du rendu (anti-XSS)
    Soit une fiche dont le corps contient des caractères de balisage
    Quand le panneau la rend
    Alors le texte est posé via textContent (aucun innerHTML sur du texte de fiche)

  Scénario: La donnée reste générée
    Soit le bloc "ezk-avancement-data" du board
    Quand j'ajoute l'interactivité du détail
    Alors ce bloc de données reste inchangé (le test de fidélité du board reste vert)
