# Rapport de chasse aux bugs — ‹cible› — ‹AAAA-MM-JJ›

<!--
  Gabarit du rapport ezk-scout. Remplace CHAQUE ‹…› (un ‹…› resté en place fait refuser le rapport).
  Les commentaires HTML comme celui-ci sont ignorés par le contrôle.
  Contrôle de forme : bash scripts/check-report.sh <ce rapport rempli>
  Règle human-facing-lisibility : « En clair » d'abord, phrases courtes, une idée par phrase.
  Le rapport s'écrit HORS du dépôt cible (dossier tmp) : la passe ne modifie jamais la cible.
-->

## En clair

‹1 à 3 phrases simples : ce que la passe a sondé, le défaut le plus grave trouvé, ce que tu dois décider.›

**‹N› trouvées · ‹M› fichées · ‹K› écartées**

« fichées » = retenues comme **brouillon de fiche** dans ce rapport. **Aucune carte n'est créée**
tant que tu n'as pas dit lesquelles entrent au backlog. Invariant : N = M + K.

## Cadre de la passe

- **Cible** : ‹app, version ou SHA testé, comment elle a été lancée›
- **Lentille** : bugs
- **Bornes** : sondes ‹utilisées›/‹max› · durée ‹utilisée›/‹max› min
- **Garde find-only** : ‹coller la ligne « find-only : OK — … » de find-only-guard.sh verify›

## Isolation de l'état

<!-- Une ligne par état mutable que l'app touche : fichiers/prefs/session/cache, base, volumes,
     services externes. Un état qu'on ne sait PAS isoler n'est pas sondé : dis-le ci-dessous. -->

- ‹état mutable› : ‹comment il a été isolé (dossier tmp, base jetable, stack préfixée…)›
- ‹état NON isolable› : NON ISOLÉ — chemin non sondé (‹raison›)

## Brouillons de fiche

### B1 — ‹titre court du bug›

- **Type / priorité suggérés** : bug · P‹0-3›
- **Gravité** : ‹critique | majeure | mineure›
- **En clair** : ‹ce qui casse, pour qui, en 1 ou 2 phrases simples›
- **Reproduction** (rejouable) :
  1. ‹commande ou geste exact, copiable tel quel›
  2. ‹…›
- **Attendu / obtenu** : ‹ce qui devait arriver› / ‹ce qui arrive›
- **Capture** *(optionnelle — bug de rendu)* : ‹chemin de l'image›
- **Localisation probable** *(optionnelle — indice non garanti)* : `‹fichier›:‹ligne›`
- **Anti-doublon** : ‹aucune fiche équivalente dans le backlog | voisine : id — à enrichir plutôt qu'à créer›

<!-- Retire les lignes Capture / Localisation si tu n'en as pas. Un bloc ### B2, B3… par brouillon. -->

## Écartées

- ‹titre› — raison : ‹doublon de id | non reproduit en 3 essais | hors périmètre | chemin non isolable›

## Pour valider (toi)

Dis quels brouillons entrent au backlog (ex. « B1 et B3 »). Alors seulement, `ezk-scout file`
appelle `ezk-backlog add` pour ceux-là : chaque fiche naît `idea`, étiquetée `scout`.
Les autres restent dans ce rapport, rien n'est créé.
