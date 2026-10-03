---
id: token-economy/retro-due-choix-chiffre
kind: disposition
level: SHOULD
title: La rétro due en fin de run est un choix chiffré, pas un lancement automatique
---

- **En clair.** Une rétro coûte cher : plusieurs agents, sur deux tours. En fin de run, on la propose
  au PO avec son coût, en version complète ou légère, et c'est lui qui choisit. En mode économe, elle
  ne se lance jamais seule.
- **La proposition** suit le bilan de fin de run : version complète (chaque lentille sur deux tours)
  ou légère (le tour 2 en un seul appel, qui rend le consensus), chacune avec le coût mesuré à la
  dernière rétro de cette forme.
- **Cohérente avec `token-economy/checkpoint-before-cost`** (confirmer avant une phase coûteuse) :
  « prévenir » veut dire « demander », pas « annoncer puis lancer ».
- **Une rétro due non lancée laisse une trace** : une ligne dans le bilan ou dans `SPRINT.md` dit
  qu'elle a été proposée, et ce que le PO a choisi.
- Origine : rétro de l'itération V0.5 du 2026-10-03 (capture
  `docs/captures/2026-10-03-retro-iteration-v0-5.md`). Le run a fini sans lancer la rétro due ; le PO
  l'a lancée à la main. Son tour 1 a coûté environ 400k jetons, le double de l'annonce, et le PO a
  choisi un tour 2 léger (105k).
- Measure (removability) : sur les 3 prochains runs de 2 sprints ou plus, la rétro due est proposée
  avec son coût (3/3), et aucune n'est oubliée sans trace.
