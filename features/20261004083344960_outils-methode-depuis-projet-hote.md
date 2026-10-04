---
id: "20261004083344960"
title: "Les outils de la méthode marchent depuis un projet hôte"
type: feature
priority: P1
product: mega-city
version:
labels: [installation]
epic:
status: idea
pr:
evidence: none # commandes et messages de terminal, pas d'écran
created: 2026-10-04
---

# 20261004083344960 — Les outils de la méthode marchent depuis un projet hôte

**En clair.** Depuis un projet hôte comme samplerz, plusieurs commandes `ezk` refusent de travailler : elles ne visent que le dépôt de la méthode. Les skills de sprint et de rétro les prescrivent pourtant, et l'agent compense par des scripts jetables, sans jamais compter les jetons de chaque fiche. On veut que ces commandes acceptent la racine d'un projet hôte, et qu'un refus montre la bonne cible.

**Si tu arrives frais.** Un projet hôte utilise la méthode sans la contenir : samplerz en est un, la méthode vit dans vectorz. La supervision est le journal des runs qui permet de compter durée et jetons par fiche.

## Contexte / Problème

Vécu au sprint 1 de samplerz, le 2026-10-03, puis à sa rétro :

- Ces commandes refusent un projet hôte : `ezk evidence`, `ezk pr emit-local`, `ezk sprint report`, `ezk backlog apply`, `ezk backlog plan-head`, `ezk backlog plan-lot`, `ezk docs check-links`. Le script sous-jacent accepte parfois `--root` (`backlog:apply`, `sprint:report`), la commande `ezk` non.
- Le message de refus conseille « ajoute --root » suivi du chemin de vectorz. Pour un projet hôte, c'est la mauvaise cible.
- Appelé en direct sans `--root`, le script `plan:lot` a lu le backlog de vectorz depuis samplerz, sans prévenir.
- `sprint:report` exige la supervision, absente de samplerz. Aucun chiffre de durée ni de jetons par fiche ; `ezk-chef suggest` n'a pas pu tourner à la rétro.
- Le skill `ezk-sprint` prescrit `bash products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh`, un chemin qui n'existe que dans vectorz.
- Effets : 2 scripts Playwright jetables pour les preuves avant/après, un worktree temporaire pour l'état « avant », un script jetable pour rendre le corps de PR depuis la fiche, relancé à chaque PR.
- Pendant la conversion du backlog de samplerz, l'agent architecte a proposé de garder le slug comme id. Le contrat « id numérique en tête du nom de fichier » n'était pas écrit là où il le lit.

## Notes / décisions

- Priorité P1. Fiche captée le 2026-10-04 par la rétro samplerz du 2026-10-03, piste 1, retenue par le PO. Capture : `docs/captures/2026-10-03-retro-premier-sprint-format-methode.md` dans le dépôt samplerz. À groomer avant d'être tirée.
- Mesure retenue : au prochain sprint de samplerz, 0 script jetable et 100 % des fiches chiffrées en jetons ; 5 refus sur 5 nomment le projet hôte.
