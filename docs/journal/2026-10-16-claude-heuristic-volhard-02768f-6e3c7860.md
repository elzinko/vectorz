# Journal des difficultés — claude/heuristic-volhard-02768f

## [20261012231419185] Board overview : version en run vs cadrage
- **Coincé** : La revue adverse a vu une contradiction : une version en run mais pas 100% groomée affichait « — pas cadré » et cachait sa progression de dev (cas muti v1.8.0, 14/20).
- **Réglé** : Montrer la barre de dev dès que done>0 OU cadré ; « — pas cadré » réservé aux versions sans dev ni cadrage.
- **Pourquoi** : La donnée amorcée par défaut (vectorz, courante cadrée 9/9) masquait le cas ; le défaut n'a pas suffi à prouver la vue.

## [20261012231419211] Modale fiche orpheline à la navigation
- **Coincé** : La revue a vu : clic sur un item de nav pendant une modale fiche ouverte → on change de vue mais la modale reste à flotter par-dessus (go() oubliait de la fermer).
- **Réglé** : setFicheModalId(null) dans go() ; test de régression (nav ferme la modale).
- **Pourquoi** : La gate navigateur avait suivi le chemin heureux (ouvrir→Échap) et raté ce détour.

## [20261013132218451] 451 à moitié livrée : CLI oui, pointeur au bind non
- **Coincé** : 451 a deux moitiés : voir/régler en terminal (CLI) ET le pointeur mince au bind qui fait physiquement tourner l'agent sur le modèle réglé. La seconde touche le pipeline caps/bind (agentContent recopie le rôle) — grosse intégration, risquée en fin de session longue.
- **Réglé** : Livré + testé le cœur CLI (show/roles/modeles/agents/unset + source + chemin + refus de l'inconnu, résolveur 242). Pointeur au bind reporté en session dédiée, documenté dans la fiche.
- **Pourquoi** : La partie CLI satisfait 3-4 critères sur 6 ; le pointeur en satisfait 2-3 et touche un pipeline couvert par 2105 tests.
