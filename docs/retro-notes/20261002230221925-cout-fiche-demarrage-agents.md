---
date: 2026-10-03
session: session « WIP-v0.5 » (run ezk-product-build V0.5, PR #324 et #325)
type: problème
---

# Le coût par fiche dépasse la cible, et le démarrage des agents pèse le plus

**En clair.** Le run V0.5 du 2026-10-02 a livré 2 fiches pour environ 580 000 jetons, soit 240 000 par
fiche. La cible est de 200 000. Le run était pourtant réglé pour économiser. D'après nos mesures, le
poste le plus lourd n'est pas le travail : c'est le démarrage de chaque agent.

**Les faits, datés.**

- **Le run.** `ezk-product-build` le 2026-10-02, fiches `20260930194219046` (PR #324) et
  `20260930194219068` (PR #325). Réglages économes : un seul agent de sprint pour les deux fiches, une
  seule préparation par `ezk-pm`, une seule revue `ezk-reviewer` pour les deux patchs, aucun explorateur.
- **Le bilan.** Environ 580 000 jetons en fin de boucle, soit 240 000 par fiche. Source : le journal du
  run, repris dans l'archive de session du 2026-10-03.
- **La cible.** « ≤ 200k par fiche », écrite dans `products/mega-city/skills/ezk-product-build/SKILL.md`.
- **Le démarrage.** Chaque appel d'agent coûte environ 85 000 jetons avant tout travail. Mesure faite
  pendant le run V0.4 du 2026-10-01. Le run V0.5 a lancé 4 appels : l'agent de sprint, la préparation,
  la revue, puis l'agent de sprint relancé pour pousser et ouvrir les PR. Ordre de grandeur : 340 000
  jetons de démarrage sur 580 000.
- **Le même jour.** La story de la PR #333 a coûté environ 400 000 jetons pour une fiche, pour d'autres
  causes : la gate rejouée à moitié, et le commit de ship reposé après chaque retour de Codex.

**Pourquoi ça coince.** Le rapport de run (`products/mega-city/bin/run-report.ts`) compte les jetons,
pas les appels d'agent. Or c'est le poste qu'on peut réduire sans toucher à la qualité du travail.

**Piste pour la rétro.** Faire compter les appels d'agent par le rapport de run, à côté des jetons.
Puis viser un nombre d'appels par fiche, en plus du plafond de jetons. À mesurer : sur les 3 prochains
runs, jetons par fiche ≤ 200 000.
