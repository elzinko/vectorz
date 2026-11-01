---
id: testing/sortie-machine-verifiee-par-un-tuyau
kind: disposition
level: SHOULD
title: Une sortie lue par un autre programme se vérifie en vrai, par un tuyau, sur le plus gros projet
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** Une commande dont la sortie est lue par un autre programme (`--json`, un contrat) peut
  passer tous ses tests sur une petite fixture et casser en vrai. Avant de la livrer, on la lance par
  un tuyau (`| python3 -c "import json,sys; json.load(sys.stdin)"`), sur le plus gros projet du
  registre de supervision, et on vérifie que la sortie se lit en entier.
- **Le geste de code associé.** Après une grosse sortie, une commande Node rend son code par
  `process.exitCode` et se termine seule. Un `process.exit()` juste après `console.log` coupe la
  sortie à 64 Ko quand elle part dans un tuyau.
- **Symptôme fondateur** (rétro du 2026-11-01) : `ezk backlog show --json` sortait coupé à 65 536
  octets à travers un tuyau, sur muti ; `ezk board show --json` avait le même défaut, encore latent.
  Ni les tests (fixture de huit fiches) ni la revue adverse ne l'avaient vu. Correctif `f13f1491`,
  test de régression `src/__tests__/json-output-large.test.ts`.
- **Frontière.** Ne double pas `development/host-project-proof-before-ship` (preuve sur un projet
  hôte) : ici, le point est la lecture par un tuyau et la taille réelle de la sortie.
- **Mesure (removability).** Sur les 5 prochaines commandes de ce type : 0 bug de sortie trouvé après
  livraison.

Origine : rétro du 2026-11-01, capture `docs/captures/2026-11-01-retro-run-contrats-json-light.md`
(proposition 4, lentilles qualité et produit). Appliquée par `skill:ezk-sprint`.
