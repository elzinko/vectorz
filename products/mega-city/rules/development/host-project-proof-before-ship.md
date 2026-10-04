---
id: development/host-project-proof-before-ship
kind: disposition
level: SHOULD
title: Une fiche qui vise les projets hôtes s'éprouve sur le banc avant d'être livrée
---

- **En clair.** Des tests verts dans vectorz ne prouvent pas qu'une capacité marche chez un projet
  hôte. Avant de livrer une fiche qui vise les hôtes, on la fait tourner sur le banc cop1-cobaye, et
  la fiche le dit en une ligne datée.
- **Portée** : une fiche dont la valeur se joue dans un autre dépôt que vectorz. Exemples : la
  commande `ezk` lancée depuis un hôte, le mode local, la clôture d'`ezk-archive` dans muti.
- **La ligne**, dans « Notes / décisions » de la fiche, avant son ship :
  « éprouvée sur cop1-cobaye le AAAA-MM-JJ : <ce qui a tourné, et le résultat> ». Une gêne trouvée
  là se corrige dans la même story, ou devient une fiche nommée dans cette ligne.
- **Sans banc disponible**, la ligne dit pourquoi, et la fiche garde une « Mesure de suivi » chez
  l'hôte. On ne livre pas en silence.
- Origine : rétro légère de fin de V0.5 du 2026-10-04 (capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`). Le mode local, livré par quatre PR aux
  tests verts, a montré 16 gênes, dont 4 bloquantes, à son premier usage sur cop1-cobaye
  (note `docs/retro-notes/traitees/20261003202803825-livre-jamais-eprouve-projet-hote.md`).
- Measure (removability) : les 3 prochaines fiches livrées qui visent un hôte portent la ligne (3/3),
  et aucune gêne bloquante n'est trouvée chez l'hôte après leur ship.
