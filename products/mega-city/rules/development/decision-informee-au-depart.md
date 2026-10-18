---
id: development/decision-informee-au-depart
kind: disposition
level: SHOULD
title: Un run autonome pose une décision informée au départ, rend un incrément revertible à la fin, et ne dérange pas le PO en cours de route
---

- **En clair.** Le run a été vécu comme « yolo » : du temps passé à lotir, puis 16 fiches découvertes
  « sur le carreau » à la clôture. Le PO veut l'inverse : **savoir au départ** ce qui sera tenté et ce
  qui est déjà bloqué, puis **juger à la fin** sur un travail annulable — sans surprises au milieu.
- **La règle.** Un run autonome tient **deux temps nets** :
  1. **Au départ** — après lecture du stock tirable, il émet **une seule** carte : « voici ce que je
     tente, voici ce que je sais déjà bloqué et pourquoi ». Un point d'information unique, avant de
     lancer. Plus aucun blocage « surprise » révélé en milieu de run.
  2. **À la fin** — « fini » veut dire **un incrément que le PO peut revoir, corriger ou annuler** :
     le rapport de run liste les tentatives et leur issue (livrée / échouée avec raison) et donne, par
     fiche livrée, le **geste d'annulation en un coup** (la livraison par fiche reste atomique).
  Entre les deux, la boucle **n'ouvre aucune décision PO** (les 4 STOP humains et le stop & ask d'un
  blocage réel jouent toujours — ce ne sont pas des arbitrages de confort).
- **Mesure (retirabilité).** Sur les 5 prochains runs : **1 annonce de faisabilité au départ** (le
  périmètre bloqué y est nommé, rien de nouveau ne surgit en cours), et le bilan final offre **un
  revert nommé par fiche livrée**, sans aucun arbitrage PO soulevé en milieu de run.
- **Origine.** Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`).
  Reprend la demande du PO : « lancer le dev, revoir quand c'est fait, corriger voire annuler ».
