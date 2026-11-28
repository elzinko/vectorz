---
date: 2026-10-15
session: "main / vectorz"
type: friction
---

# Mode auto en 2 phases : groomer+vérifier la DoR d'abord, puis dev ; reporter après grooming avec raison

PO 2026-10-15. Le mode auto d'ezk-product-build ENTRELACE aujourd'hui grooming et dev (boucle : intake → si tête bloquée, groom → build → suivant). Proposition : séparer en 2 PHASES. Phase 1 = regarder toutes les fiches de la version, vérifier la DoR, groomer ce qui manque, décider si le/les sprints sont lançables (en série, ou en PARALLÈLE si envisageable). Phase 2 = lancer les dev, SEULEMENT si la phase 1 est OK. Cette séparation de phase n'existe pas. En plus : en mode auto, pouvoir REPORTER une fiche après grooming, avec la RAISON dans le rapport final (partiellement là — skip+journal+surface, utilisé ce run pour la fiche trier-rétro — à rendre SYSTÉMATIQUE). Lié au gate « version prête à lancer » (note précédente) : ce gate est la SORTIE de la phase 1. Dimension neuve à groomer : parallélisation des sprints (aujourd'hui séquentiel).
