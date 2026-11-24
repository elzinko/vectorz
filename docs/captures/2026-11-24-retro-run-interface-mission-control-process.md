---
type: retro
date: 2026-11-24
theme: "Run autonome du 19 novembre « nouvelle interface de mission control et écran Process » : trois sprints livrés, quatre frictions d'outillage"
scope: "sprints 16, 17 et 18 du 19 novembre (écran Process, règles par étape, menu par portée), mode auto ; rétro légère choisie par le PO : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Le compte rendu de sprint écrit « total 0 jeton » quand le journal ne contient aucune mesure de jetons. C'est un faux zéro : 39 comptes rendus sur 84 le portent. Il doit écrire « jetons non mesurés » et dire pourquoi. Suite d'une fiche livrée le 4 novembre, qui couvre le sprint non daté mais pas ce repli vide."
    kind: feature
    by: [qualite, produit]
    status: ⏳
  - proposition: "Le relais du daemon jette en silence tout champ du contrat qu'il ne connaît pas. Un test par relais doit faire passer l'exemple rangé du contrat et vérifier que chaque champ en ressort."
    kind: feature
    by: [architecture, qualite]
    status: ⏳
  - proposition: "Les vues de mission control n'ont pas d'adresse. La commande de capture avant/après ne peut donc pas viser l'écran Process. Chaque vue reçoit une adresse, pour que la capture marche sans script maison."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "Pour tester le board sur un dossier de travail, régler la commande ezk du daemon dans la config de mission control, au lieu d'un faux ezk glissé en tête du PATH."
    kind: action
    by: [dev]
    status: ⏳
  - proposition: "Avant la revue adverse, rejouer telles quelles, depuis la racine, les commandes de la section « Comment vérifier » de la fiche."
    kind: action
    by: [qualite]
    status: ⏳
---

**En clair :** le run du 19 novembre a livré trois écrans sans gate rouge ni refus de revue. Les
frictions viennent de l'outillage autour : un compte rendu qui affiche zéro jeton au lieu de « non
mesuré », un relais qui jette les champs neufs du contrat, et des écrans qu'on ne peut pas capturer
par la commande prévue. Le PO tranche trois fiches et deux gestes.

## 1 · Les faits de départ

Trois fiches livrées, une par sprint :

- [L'écran Process se lit de gauche à droite, avec ses boucles](../../features/done/20261117223348250_ecran-process-en-ligne-avec-ses-boucles.md) : 33 minutes.
- [Rattacher les règles du projet aux étapes du process](../../features/done/20261117223348335_regles-du-projet-rattachees-aux-etapes.md) : 17 minutes.
- [Mission control range son menu par portée](../../features/done/20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md) : 10 minutes.

La gate est restée verte. La revue adverse a dit oui trois fois.

Les frictions observées :

1. **L'écran affichait « contrat du process incomplet ».** Le contrat publiait bien les boucles et
   la boîte à outils. Le relais du daemon, entre la méthode et l'écran, filtrait les champs qu'il
   ne connaissait pas. Il a fallu les ajouter à la main dans le relais. Aucun test ne l'a vu : le
   test du relais lit l'exemple du contrat, mais ne vérifie que certains champs.
2. **Tester le board sur le dossier de travail a demandé un détour.** Le daemon appelle l'ezk
   installé sur le poste, donc le code du dossier principal. Le run a glissé un faux ezk en tête du
   PATH. Or la config de mission control prévoit déjà ce réglage : la commande ezk du daemon y est
   configurable. Le détour était inutile.
3. **La capture avant/après n'a pas pu servir.** La commande de capture prend une adresse web.
   L'écran Process n'en a pas : on y arrive par un clic dans le menu. Le run a écrit des scripts de
   capture à la main, quinze images en tout. Il a aussi dû viser le Chrome du poste, faute du
   navigateur fourni avec l'outil de test.
4. **Les trois comptes rendus de sprint disent « total 0 jeton ».** Le texte annonce un repli sur
   le total du run, puis affiche zéro. En fait, le journal ne contient aucune mesure de jetons. Le
   même zéro figure dans 39 comptes rendus sur 84.
5. **Une commande de fiche ne trouvait aucun test.** La section « Comment vérifier » donnait une
   commande lancée depuis la racine. Elle ne trouvait pas les fichiers de test. Le relecteur l'a vu ;
   la commande a été corrigée pour partir du paquet web.
6. **Petite friction :** le bilan de run refuse un champ « raison » vide. Il faut écrire un tiret.

Signaux lus en plus :

- Les trois comptes rendus de sprint du 19 novembre.
- Le journal de sprint de la branche : sa section des galères est vide pour ces trois sprints.
- Le carnet hors git contient dix notes, la plus récente du 15 novembre. Aucune ne porte sur ces
  sprints. Elles restent au carnet pour une rétro de méthode, sans être versées.

## 2 · Tour 1 — chaque lentille propose

Rétro légère : les lentilles sont portées par l'orchestrateur, pas par des agents indépendants.

- **Architecture.** Le relais est un second gardien du contrat. Chaque champ neuf demande deux
  modifications, et l'oubli de la seconde ne casse aucun test. Proposition : un test de passage
  intégral par relais.
- **Qualité.** Le zéro des comptes rendus ment : il ressemble à une mesure. Proposition : écrire
  « non mesuré ». Elle propose aussi le test du relais, une adresse par vue, et de rejouer les
  commandes de la fiche avant la revue.
- **Dev.** Le faux ezk du PATH était un détour : la config le prévoit. Proposition : passer par
  la config. Il appuie l'adresse par vue, qui supprimerait les scripts de capture.
- **Produit.** Le PO lit ces comptes rendus pour piloter son budget. Un zéro le trompe sur le coût
  réel. Il appuie la fiche du faux zéro.

## 3 · Tour 2 — confrontation et convergence

- Le faux zéro et le test du relais rallient tout le monde. Ce sont deux symptômes structurels : ils
  reviendront à chaque compte rendu et à chaque champ neuf. Ils partent en fiches.
- L'adresse par vue rallie qualité et dev. Produit note qu'elle sert aussi le PO : il pourrait
  ouvrir un écran précis depuis un lien.
- Le réglage de la commande ezk reste un geste : la config existe déjà, rien à construire.
- Rejouer les commandes de la fiche reste un geste. Un seul cas l'appuie ; une règle viendra s'il
  revient.
- **Écarté :** une règle « tout champ de contrat est relayé ». Le test du relais la rend inutile,
  et une règle de discipline n'aurait pas évité l'oubli.
- **Écarté :** le tiret du bilan de run. Le message d'erreur dit déjà quoi faire.

## 4 · Le juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Ce qui est proposé au PO

1. **Fiche : le compte rendu dit « non mesuré » au lieu de zéro.** Fait vécu : trois comptes rendus
   sur trois affichent zéro jeton, et 39 sur 84 dans le dossier. La fiche
   [Le compte rendu de sprint écrit « 0 tokens »](../../features/done/20261104095401066_compte-rendu-sprint-faux-zero-tokens.md)
   a réglé le sprint non daté le 4 novembre. Le repli sur le total du run, quand ce total est vide,
   lui a échappé : c'est sa suite, pas un sujet neuf. Mesure : sur les trois prochains
   sprints sans mesure de jetons, aucun compte rendu n'affiche « total 0 ».
2. **Fiche : un test par relais fait passer tout le contrat.** Fait vécu : l'écran Process a affiché
   « contrat incomplet » alors que le contrat était juste. Mesure : retirer un champ du relais fait
   échouer un test.
3. **Fiche : chaque vue de mission control a une adresse.** Fait vécu : quinze captures faites par
   script maison. Mesure : la commande de capture prend une capture de l'écran Process par son
   adresse.
4. **Geste : régler la commande ezk du daemon par la config.** Mesure : le prochain test d'écran
   sur un dossier de travail se passe de faux ezk.
5. **Geste : rejouer « Comment vérifier » avant la revue.** Mesure : sur les cinq prochaines
   fiches, le relecteur ne trouve aucune commande de fiche cassée.

## 6 · Suivi des décisions de la rétro précédente

- **« Contrôler une fiche écrite à la main avant de la committer »** : tenue. Les deux fiches
  écrites à la main au début du run passent le contrôle des fiches, qui ne relève aucune anomalie.
- **La règle « la rétro due est un choix chiffré »** : tenue, un cas sur trois. Le run a proposé
  la rétro avec son coût, et le PO a choisi la version légère. Trop tôt pour conclure.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| Fiche : « non mesuré » au lieu de zéro | ⏳ | |
| Fiche : test de passage intégral par relais | ⏳ | |
| Fiche : une adresse par vue | ⏳ | |
| Geste : commande ezk du daemon par la config | ⏳ | |
| Geste : rejouer « Comment vérifier » avant la revue | ⏳ | |

## 8 · Glossaire

- **Relais du daemon** : le petit programme de mission control qui appelle ezk, lit sa réponse et
  la transmet à l'écran. Il trie les champs au passage.
- **Contrat** : le format fixe de la réponse d'ezk, avec un exemple rangé à côté.
- **Rétro légère** : les points de vue sont tenus par un seul agent, l'orchestrateur, au lieu
  d'un agent par point de vue. Moins chère, moins indépendante.
- **Round-robin dégradé** : le nom de ce mode dans la méthode.
