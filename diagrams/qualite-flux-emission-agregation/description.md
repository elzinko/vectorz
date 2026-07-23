Le flux d'observabilité qualité, du build d'une PR jusqu'à la décision du PO — modèle
**corrigé après le panel adverse du 2026-07-22** (ADR-033).

Acteurs : la **Méthode** (skills + hooks, mega-city) qui fabrique le code et **exécute** les
outils ; l'**Outil d'analyse** (Codecov, Sonar) qui produit un chiffre objectif ; le **Mesureur
tiers** (neutre) qui lit le résultat et **écrit** la mesure ; le **Silo** (le journal des
mesures — le magasin) ; le **Moniteur** (mission-control — l'écran) ; le **PO**.

Au build de chaque PR : la méthode **lance l'analyse** (elle garantit que l'outil est installé et
lancé) ; l'outil renvoie un **artefact déterministe** (ex. couverture 78 %). Point de loi
corrigé : **lancer l'outil ≠ écrire le chiffre** — c'est un **mesureur tiers neutre** qui lit
l'artefact et **écrit** la mesure `quality.measured` collée au commit/PR dans le silo. La méthode
auditée n'écrit jamais son propre chiffre (ADR-031/0044), et le moniteur n'écrit jamais non plus
(ADR-032). Ensuite le moniteur **lit** le silo en lecture seule, **agrège** en KPI (commit → PR →
sprint → version), affiche les courbes, et le PO **décide** (seuil DoD, amélioration).
