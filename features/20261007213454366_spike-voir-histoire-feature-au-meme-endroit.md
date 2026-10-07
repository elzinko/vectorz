---
id: "20261007213454366"
title: "Spike : voir toute l'histoire d'une feature au même endroit (vue par id vs co-localisation)"
type: chore
priority: P3
product: vectorz
milestone:
version:
labels: [backlog-model, spike]
status: idea
pr:
evidence: none # exploration, produit une reco écrite, pas d'UI
created: 2026-10-07
---

# 20261007213454366 — Spike : voir toute l'histoire d'une feature au même endroit

**En clair.** Le PO veut retrouver **toute l'histoire d'une feature au même endroit** : la fiche
(le quoi), l'implémentation (le comment), les preuves d'écran — idéalement visible **dans le code
source**. Ce spike **explore** comment y arriver et **tranche entre deux familles** : une **vue qui
rassemble par id** (sans rien déplacer), ou une **co-localisation physique** (un dossier par story).
Il ne construit rien : il produit une **reco écrite** qui servira de base à un vrai chantier.

**Si tu arrives frais.** Dans la méthode ezk, une user story = **une fiche** `features/<id>_slug.md`.
Son statut vit dans le front-matter, pas dans l'arborescence. Les preuves d'écran vivent dans
`pr-evidence/<id>/`, la branche s'appelle `feat/<id>-slug`, le journal tague l'`<id>`. L'histoire
est donc déjà **unifiée par l'id**, mais **éparpillée** physiquement.

## Contexte / Problème

Besoin exprimé par le PO (2026-10-07, deux fois) : « je voudrais voir une feature et son histoire
d'un coup d'œil, idéalement dans le code ». Deux pistes proposées — un **répertoire par story** qui
encapsule tout, ou **plusieurs stories dans un même document**.

Objections déjà posées (le modèle actuel s'y oppose, en partie) :

- le **statut** vit dans le front-matter, **pas dans l'arborescence** (le cran `todo`/dossier a été
  retiré exprès) ;
- `ship` déplace **un seul fichier** vers `done/`, et ces déplacements **cassent déjà des liens**
  (d'où `test-links-repo`) ;
- l'**implémentation vit déjà dans la fiche** (ADR-0029 : la fiche est le document, la PR en est le
  rendu) ;
- mettre **plusieurs stories dans un doc** casserait le « un seul `status:` par fiche » et la
  mécanique `ship` (voir la règle [[vectorz-split-fiche-pas-de-chapeau]] : une story = une fiche).

Donc le besoin est **légitime**, mais la solution naïve (déménager les fichiers) se bat contre les
invariants du modèle. Le spike doit **comparer** proprement.

## Proposition (ce que le spike explore)

Comparer **trois options** sur le même cas réel (prendre 2-3 features livrées et reconstituer leur
histoire) :

- **A — vue par id (sans déménagement)** : un petit outil/commande qui rassemble, pour un `<id>`,
  sa fiche + `evidence/<id>/` + la branche `feat/<id>-…` + les entrées de journal taguées. Zéro
  changement de modèle. *(Hypothèse de départ privilégiée.)*
- **B — co-localisation physique** : un **dossier par story** qui encapsule fiche + impl + preuves.
  Évaluer le coût : loader, regen, toutes les vues, les liens par id, la mécanique `ship`/`done`.
- **C — statu quo + meilleur lien** : garder l'éparpillement, mais ajouter des liens croisés
  systématiques (fiche ↔ evidence ↔ PR) pour naviguer sans outil.

Pour chaque option : **ce qu'on gagne** (visibilité), **ce qu'on paie** (invariants cassés, coût
outillage), **réversibilité**. Idéalement un avis `ezk-architect`.

## Critères d'acceptation

*(Spike : « fini » = une décision est outillable, pas du code livré.)*

- [ ] Une **note de comparaison** A/B/C existe (gains, coûts, invariants touchés, réversibilité),
      appuyée sur **2-3 features réelles** reconstituées.
- [ ] Une **reco claire** est formulée (quelle option, pourquoi), prête à devenir un ADR + une (ou
      des) fiche(s) de chantier **versionnée(s)**.
- [ ] Les **invariants du modèle** impactés sont listés explicitement (statut hors arbo, `ship`
      un-fichier, liens par id, ADR-0029, règle « une story = une fiche »).

## Comment vérifier

```bash
# Le spike produit un document de décision (pas du code). Vérifier qu'il existe et tranche :
ls docs/ | grep -iE "co-?localisation|histoire-feature"   # la note de comparaison
# et qu'une reco + les options A/B/C y figurent (contrôle humain).
```

## Glossaire

- **spike** : une exploration bornée dont le livrable est une **décision documentée**, pas une
  feature. (La méthode n'a pas de type `spike` dédié — capturé en `chore` + `idea`.)
- **vue par id** : rassembler ce qui partage un `<id>` sans déplacer les fichiers.

## Notes / décisions

- **Origine** : demandes PO des 2026-10-06 et 2026-10-07, pendant le lot V0.9 « Ranger la maison ».
  Volontairement **sorti de la V0.9** (c'est une question de **modèle de backlog**, pas de ménage
  `docs/`). Le PO a dit « ok pour le spike mais **pas tout de suite** ».
- **Sans version ni milestone** : exploration, non planifiée. Le vrai chantier (si décidé) sera
  fiché et versionné après ce spike.
- **Liens** : règle [`split` sans chapeau](20261007154842917_note-migration-bascule-consommateurs-scrum.md)
  n'est pas le sujet, mais la même famille (composition des fiches) ; `milestone` reste l'outil de
  **regroupement logique** retenu en attendant.
