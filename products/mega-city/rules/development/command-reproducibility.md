---
id: development/command-reproducibility
kind: disposition
level: MUST
title: Une instruction inline oriente le QUOI, jamais le COMMENT d'une commande
enforcements:
  - type: agent-check
    agent: ezk-steward
---

- **Le comportement d'une commande = le skill + ses flags.** C'est la seule source du COMMENT :
  quand merger, quand se bloquer, quelles gates passer, comment déléguer.
- **Une instruction inline oriente le QUOI, pas le COMMENT.** « Traite ces fiches », « priorise
  celle-ci », « ajoute ce bug » = du QUOI, légitime. « Si tu es bloqué, ouvre une PR » ne doit PAS
  s'étendre en « n'ouvre que des PR pour tout le run » : une consigne ponctuelle ne redéfinit pas
  en silence le comportement documenté du skill.
- **Changer le COMMENT passe par une fiche feature**, développée et testée, avant d'entrer dans la
  méthode. Pas de mutation de comportement par prompt.
- **Mesurable :** 0 cas où une instruction inline change en silence le comportement documenté d'une
  commande. Un tel écart = checkpoint (on s'arrête, on nomme la divergence, on tranche).
- Origine : rétrospective du 2026-09-05 (symptôme racine). Une consigne inline « si bloqué → PR »
  avait été étendue à tout le run, redéfinissant sans le dire le comportement de merge. Enforcement
  niveau 1 : l'agent `ezk-steward` (gardien de la cohérence de la méthode) lit cette règle.
