# ADR 0009 — `ezk-pr-pilot` : orchestrateur de validation d'un stock de PRs + convention « Validation » découplée

- Statut : **accepté** (amendé par [ADR-0022](0022-ezk-methode-trois-bandes-naming.md) :
  nom préféré `ezk-pr` ; `init` Validation → à terme `ezk-backlog init`)
- Date : 2026-07-06

## Contexte

Sur livestreamz, 8 PRs ouvertes hétérogènes (docs mergeables, web mergeable-si-vert,
mobile device-test-obligatoire) : 7/8 avaient une section « Validation », **aucune**
n'était rejouable sans contexte (pas de commandes littérales, pas de flag « rebuild
dev-client », pas de signal observable pass/fail, pas de remise à zéro). L'utilisateur
a dû être guidé PR par PR : ordre de merge, bancs à démarrer, sessions groupées
(3 sessions au lieu de 8, dont UNE session device pour 3 PRs mobiles via branche
d'intégration vérifiée par `git merge-tree`). Le besoin est double : **écrire** des
PRs testables, **consommer** un stock de PRs efficacement.

## Décision

1. **Une convention, pas un skill, pour l'écriture** : `docs/PR_VALIDATION.md` (le
   fond) + `.github/PULL_REQUEST_TEMPLATE.md` (squelette **mince** qui **lie** la
   doc). Découplage explicite : la convention évolue sans toucher le template.
   Elle s'applique là où la PR naît (ezk-sprint, étape PR).
2. **Un seul nouveau skill pour la consommation : `ezk-pr-pilot`** — sous-commandes
   `init` (installe la convention : template absent → créer le squelette ; template
   **existant → ne jamais écraser, agréger une section-lien**), `plan` (ordre de
   merge par merge-tree, sessions groupées), `run` (bancs + checklists), `report`
   (résultats dans les PRs), `ship` (squash-merge au vert + ezk-backlog ship).
   Il **compose** ezk-preview, ezk-device/ezk-apk, verify/run, ezk-backlog,
   ezk-commits.

## Options considérées

- **A. Tout dans ezk-sprint** — rejeté : ezk-sprint produit UNE PR ; le job
  « consommer le stock » n'a pas de sprint, le skill deviendrait obèse.
- **B. Deux nouveaux skills (écriture + consommation)** — rejeté : la convention
  d'écriture n'a pas de comportement propre ; template + garde-fou suffisent.
- **C. Convention + un skill orchestrateur (retenue)** — la convention rend
  l'orchestrateur quasi déterministe (il *lit* les blocs Validation au lieu de
  re-déduire par analyse de diff — mesuré ~10× moins cher).

## Conséquences

- Plus facile : tester un stock (sessions groupées), merger dans le bon ordre,
  tracer ce qui a été validé et comment, onboarder un testeur sans contexte.
- Plus dur : discipline d'écriture des PRs (matrice à remplir) ; `init` doit
  s'adapter aux repos (modalités existantes, template préexistant).
- Frontières tenues : ezk-sprint (produire) / ezk-pr-pilot (consommer) /
  ezk-archive (clôturer) ; une seule instance par repo (leçon des boucles
  parallèles du 2026-07-05).
