# Rapport de chasse aux bugs — mission control — 2026-11-03

## En clair

La passe a ouvert les 12 vues de mission control et joué 10 actions sans écriture : toutes marchent, sans erreur console.
Un seul défaut retenu, mineur : l'en-tête de l'écran s'appelle encore « board v0.17.0 », pas « mission control ».
Tu décides s'il enrichit la fiche voisine sur les anciens mots de l'écran.

**2 trouvées · 1 fichées · 1 écartées**

« fichées » = retenues comme **brouillon de fiche** dans ce rapport. **Aucune carte n'est créée**
tant que tu n'as pas dit lesquelles entrent au backlog. Invariant : N = M + K.

## Cadre de la passe

- **Cible** : mission control (cop1), branche feat/20261102182259592-carnet-mc, SHA 50b97e05, lancé en aperçu Vite sur localhost:5276 depuis le worktree carnet-mc
- **Lentille** : bugs
- **Bornes** : sondes 25/30 · durée 10/15 min
- **Carnet** : actif — mission-control (zone : tout)
- **Garde find-only** : find-only : OK — 1 dépôt · carnet-mc HEAD 50b97e0 · arbre, refs et worktree inchangés

## Isolation de l'état

- Navigateur : Chrome sans tête, profil jetable dans un dossier tmp, détruit en fin de passe
- Daemon de mission control : instance d'aperçu sur le port 5276, distincte de celle du PO (port 4242, éteinte pendant la passe)
- Registre des projets : copie ignorée par git de `cop1.config.yaml` dans le worktree, jamais celle du checkout principal
- Fiches et dossiers du projet : lus seulement, par `ezk … --json`
- Poser un pouce sur une fiche : NON ISOLÉ — chemin non sondé (écrit un verdict dans le dépôt)
- Lancer une session depuis l'écran : NON ISOLÉ — chemin non sondé (démarre un vrai travail)
- Changer un réglage dans Configuration : NON ISOLÉ — chemin non sondé (écrit `.vectorz/config.yml`)

## Couverture

- **Avant** : 0 sur 70 testés
- **Après** : 19 sur 70 testés
- **Notés au carnet** : 19 nœuds, SHA 50b97e05417f7eb1fd1504b26c9d3dadf2c8e9c3

## Brouillons de fiche

### B1 — L'en-tête de mission control dit encore « board v0.17.0 »

- **Type / priorité suggérés** : bug · P3
- **Gravité** : mineure
- **En clair** : en haut à gauche, l'écran s'appelle « board » avec la version figée v0.17.0. Le glossaire nomme cet écran « mission control », et la méthode en est à la v0.23.
- **Reproduction** (rejouable) :
  1. Lance mission control et ouvre-le dans un navigateur.
  2. Lis le libellé en haut à gauche, à côté du point de couleur.
- **Attendu / obtenu** : « mission control », sans version, ou avec la vraie version / « board v0.17.0 »
- **Capture** : captures/overview.png
- **Localisation probable** : `products/cop1/packages/web/src/board/Board.tsx:29`
- **Anti-doublon** : voisine : 20261102234112839 « Réécrire les guides de l'ancien écran de supervision » — elle liste déjà les anciens mots affichés par `Board.tsx` ; à enrichir plutôt qu'à créer

## Écartées

- La Chronologie de vectorz affiche « aucun évènement » — raison : non reproduit sur les vraies données. Le banc lisait le worktree, sans dossier de runs ; sur le checkout principal, le même code trouve 3 runs et 3 chantiers. La note d'échec posée au carnet a été retirée.

## Pour valider (toi)

Dis quels brouillons entrent au backlog (ex. « B1 et B3 »). Alors seulement, `ezk-scout file`
appelle `ezk-backlog add` pour ceux-là : chaque fiche naît `idea`, étiquetée `scout`.
Les autres restent dans ce rapport, rien n'est créé.
