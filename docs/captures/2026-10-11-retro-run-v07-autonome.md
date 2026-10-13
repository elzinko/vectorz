---
type: retro
date: 2026-10-11
theme: "Run autonome ezk-product-build v0.7 — ce qui a frotté en flux local et en autonomie"
scope: "le run du 2026-10-11 (flux local github:false, worktree) : v0.7 livrée + 1 fiche v0.9, puis arrêt PO"
participants: [architecture, qualite, produit, juge, po]
actions:
  - proposition: "Parité du flux local : run report accepte un sha local (pas que #PR), close daté par l'id du run du journal (pas une égalité de slugs), regen --root propre — DIP : dépendre d'une abstraction d'identité/merge, pas d'un détail d'infra"
    kind: feature
    by: [architecture, qualite, produit]
    status: ✅
    decision: "Découpée sans doublon : run report local → lien vers la fiche existante 20261010235330118 ; close daté → enrichissement de la fiche existante 20261002230039863 (symptôme slug ≠) ; regen --root → nouvelle fiche 20261011091552583"
    date: 2026-10-11
  - proposition: "Marqueur de blocage typé : étendre le champ blocked: existant (fiche 652) avec des raisons lisibles (po-defer / needs-mockup / needs-github / risky-selfedit) que next et le run sautent sans délibérer"
    kind: feature
    by: [produit]
    status: ✅
    decision: "Pas de doublon : enrichit la fiche existante 20261002133125418 (extension « raisons typées » ajoutée à son champ blocked:)"
    date: 2026-10-11
  - proposition: "Le run autonome filtre l'éligibilité AVANT de délibérer (taille / risque structurel / blocked / PO-différé → escalade immédiate) et s'arrête par défaut à la borne de version (la suivante n'est tirable qu'au tag)"
    kind: regle
    target: skill:ezk-product-build
    by: [architecture, produit]
    status: ✅
    decision: "Nouvelle fiche backlog 20261011091553794 (le PO a demandé de corriger l'outil par une fiche) ; dépend du marqueur typé 20261002133125418 ; complète le garde-fou version-scope (ADR-0070)"
    date: 2026-10-11
  - proposition: "Contrôle de forme des vues générées (le H1 dérive du vrai titre, jamais d'un flag CLI) + test de contrat CLI : aucun flag ne fuit dans la sortie, un flag inconnu échoue"
    kind: regle
    target: skill:ezk-sprint
    by: [qualite, architecture]
    status: ✅
    decision: "Nouvelle fiche 20261011091555006 (fusionnée avec la détection de confinement en gate ci-dessous)"
    date: 2026-10-11
  - proposition: "La gate détecte « garde de confinement ajoutée sans test au point d'entrée » (script check-boundary-tests câblé dans test:scripts) — la règle testing/confinement-contract-at-boundary existe, mais seule la revue adverse l'a appliquée"
    kind: regle
    target: agent:ezk-reviewer
    by: [qualite, architecture]
    status: ✅
    decision: "Fusionnée dans la nouvelle fiche 20261011091555006 (deux invariants de gate dans une seule fiche)"
    date: 2026-10-11
  - proposition: "Banc jetable E2E « flux local » (github:false, worktree) rejouant run report / sprint close / backlog regen et relisant les artefacts (sha accepté, date et durée non nulles, bon dépôt visé)"
    kind: spike
    by: [qualite]
    status: ✅
    decision: "Nouvelle fiche spike 20261011091556212"
    date: 2026-10-11
  - proposition: "Capitaliser l'invariant « un ship/commit vise le checkout principal, pas le worktree courant » dans ezk-pr / ezk-sprint (déjà corrigé ce run) — pas une fiche, une ligne d'invariant"
    kind: action
    by: [architecture]
    status: ✅
    decision: "Note d'invariant, pas de fiche : déjà corrigé ce run (sprint.sh vise le checkout principal via git-common-dir). À consigner dans ezk-pr / ezk-sprint comme invariant"
    date: 2026-10-11
---

**En clair :** le run a bien livré la v0.7, mais il a frotté sur deux choses. D'abord, les outils du flux **local** (sans GitHub) sont en retard sur le flux PR : le bilan de run exige un numéro de PR, le compte rendu de sprint reste « non daté », et une régénération a corrompu un titre en silence. Ensuite, en **autonomie**, le run a longuement hésité « je continue ou j'arrête ? » sur des fiches qu'il n'aurait pas dû toucher. Les trois lentilles proposent 7 améliorations ; **à toi de cocher** celles qu'on range.

## 1 · Les faits de départ

- **S1** — `ezk run report` exige un `#<numéro>` de PR → inutilisable en flux local (merges par sha). Le bilan a été écrit à la main.
- **S2** — `ezk backlog regen --root <x>` a fait fuiter `--root` comme **titre** du H1 de `BACKLOG.md` (« # --root »), sans erreur.
- **S3** — le compte rendu de `ezk-sprint close` est **non daté** tant que le slug du checkpoint de supervision ne coïncide pas avec le slug dérivé de l'objectif.
- **S4** — la gate automatisée (vitest / typecheck / test:scripts) **n'a pas attrapé** deux vrais défauts que la revue adverse a bloqués : le titre corrompu (a) et une garde de confinement de chemin sans test (b).
- **S5** — le run « va jusqu'au bout sur les prochaines versions » n'a **pas de borne d'arrêt claire** : au-delà de v0.7, fiches risquées-structurelles, grosses, ambiguës, PO-différées ou bloquées → délibération coûteuse puis arrêt-escalade.
- **S6** — en worktree, le compte rendu de `close` visait le **worktree** au lieu du **checkout principal** pour `ship-merge --local` (corrigé ce run).
- **S7** — une fiche que le PO avait **différée** (« réveiller quand F1/F2 ») n'a pas de marqueur que le tirage respecte → risque de la construire à tort, ou de longuement hésiter.

## 2 · Tour 1 — chaque lentille propose

- **Architecture** : racine commune = violation d'inversion de dépendance (DIP). `run report` et `close` dépendent d'un détail d'infra (num PR, égalité de slugs) au lieu d'une abstraction stable (sha / id de run). + porte d'éligibilité avant délibération (S5). + la gate doit vérifier la **forme des artefacts générés** et exiger un test sur toute garde de confinement (S4).
- **Qualité** : la gate verte donne une fausse assurance. Test de contrat CLI (aucun flag ne fuit, S2), snapshot « golden » des vues générées (S4a), test de confinement au point d'entrée + script de détection en gate (S4b), banc jetable flux local (S1/S3/S6).
- **Produit** : borne d'arrêt = la version en cours (S5), marqueur de blocage typé lu par le tirage (S7), table « classe de blocage → escalade en 1 tour », parité du flux local (S1/S2/S3).

## 3 · Tour 2 — confrontation et convergence

Fortes convergences, fusionnées :
- **S1 + S2 + S3** fusionnent en **une feature « parité du flux local »** (racine DIP commune, confirmée par architecture) — découpable en 3 fiches liées par un `milestone:` commun, sans fiche-chapeau.
- **S5** : la *porte d'éligibilité avant délibération* (architecture) et l'*arrêt à la borne de version* (produit) fusionnent en **une règle** sur `skill:ezk-product-build` ; la *table d'escalade* (produit) en est le mode d'emploi, pas une pièce séparée.
- **S4** : le *contrôle de forme des vues* (architecture + qualité) et le *test de confinement en gate* (qualité + architecture) restent deux pièces (deux invariants de gate distincts).
- Écarté : rien de divisif. Le marqueur de blocage (S7) est retenu comme **socle machine** qui rend la règle d'éligibilité déterministe.

## 4 · Le juge de cohérence

Vérifié par le pilote (`ezk-steward` indisponible cette session). **Aucune contradiction, aucun doublon strict** ; trois propositions **étendent de l'existant** :
- Le marqueur de blocage **étend** le champ `blocked:` déjà là (fiche 652) — pas un nouveau champ.
- Le test de confinement en gate **durcit** la règle `testing/confinement-contract-at-boundary` qui existe déjà (il manquait la détection côté gate) — pas une nouvelle règle de fond.
- La règle d'arrêt du run **complète** le garde-fou de tirage `version-scope` (ADR-0070, livré ce run) : l'un cadre le *tirage*, l'autre le *stop du run*. Cohérent.

## 5 · Ce qui est proposé au PO

Les 7 propositions ci-dessus. **Décision PO du 2026-10-11 : « ok pour tout, mais vérifie d'abord que les
fiches n'existent pas déjà ».** La vérification anti-doublon a montré que 3 propositions avaient déjà une
fiche. Le rangement en a tenu compte : on lie ou on enrichit l'existant, on ne crée du neuf que là où rien
n'existait.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| S1 — parité du flux local (run report / close daté / regen) | Lien [20261010235330118](../../features/done/20261010235330118_run-report-accepte-livraison-locale.md) + enrichissement [20261002230039863](../../features/done/20261002230039863_sprint-report-trace-supervision.md) + nouvelle fiche [20261011091552583](../../features/done/20261011091552583_regen-root-ecrit-titre-casse.md) | 2026-10-11 |
| S7 — marqueur de blocage typé | Enrichit [20261002133125418](../../features/20261002133125418_tete-plan-ignore-drapeau-bloquee.md), pas de doublon | 2026-10-11 |
| S5 — run : éligibilité avant délibération + arrêt à la borne | Nouvelle fiche [20261011091553794](../../features/20261011091553794_run-autonome-filtre-eligibilite-avant-deliberer.md) | 2026-10-11 |
| S4a+S4b — gate : forme des vues + confinement testé | Nouvelle fiche [20261011091555006](../../features/20261011091555006_gate-attrape-forme-vues-et-confinement.md) | 2026-10-11 |
| S6 — banc jetable E2E flux local | Nouvelle fiche spike [20261011091556212](../../features/done/20261011091556212_banc-jetable-e2e-flux-local.md) | 2026-10-11 |
| S7-invariant — ship vise le checkout principal | Note d'invariant, pas de fiche (déjà corrigé ce run) | 2026-10-11 |

**Doublon repéré à signaler.** Deux fiches couvrent déjà « le bilan de run en local » :
[20261010235330118](../../features/done/20261010235330118_run-report-accepte-livraison-locale.md) et
[20261004211038053](../../features/done/20261004211038053_run-report-livraison-locale.md). Elles font double
emploi. À fusionner à un prochain grooming — je ne les touche pas ici.
