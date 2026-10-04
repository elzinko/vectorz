---
id: token-economy/fiche-tient-dans-un-sprint
kind: disposition
level: SHOULD
title: Une fiche prête tient dans un sprint économe — on la découpe au grooming, pas au build
---

- **En clair.** Une fiche trop grosse ne se voit souvent qu'au moment de la construire : le PO doit
  alors trancher en plein run. On mesure la taille au grooming. Une fiche qui dépasse le seuil se
  découpe avant de passer « prête ».
- **Le seuil** : plus de six critères d'acceptation, ou plus de deux surfaces touchées parmi la
  commande (`ezk`, scripts), le serveur, l'écran et un ADR. Au-delà, on découpe
  (`ezk backlog apply split`), ou on écrit dans la fiche pourquoi elle reste entière.
- **Pourquoi six et deux** : la cible d'un sprint économe est d'environ 200k jetons par fiche
  (`token-economy/agent-call-budget`). Les deux fiches qui dépassaient ce gabarit étaient *estimées* à
  500k et plus ; aucune n'a été construite entière. Seule mesure à ce jour : les trois morceaux du
  cockpit (3 à 9 critères chacun) ont coûté environ 190k, 330k et 200k. Seuil provisoire, à recaler
  sur les mesures.
- **Cohérente avec la technique de grooming « couper au plus petit morceau utile »** : la technique
  reste au choix pendant le grooming ; la règle rend la coupe attendue avant la porte « prête ».
- Origine : rétro légère du run cockpit de la V0.6, le 2026-10-04 (capture
  `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`). Deux fiches prêtes, estimées à
  500-800k et 500-700k jetons ; le PO a dû faire découper la première au moment de la construire, et
  arrêter le run devant la seconde.
- Measure (removability) : sur les 5 prochains runs, aucune fiche prête n'est découpée, ni le run
  arrêté, pour cause de taille au moment de la construire.
