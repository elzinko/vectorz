# ADR 0029 — La fiche est le document, la PR en est le rendu (source unique fiche↔PR), révise ADR-0009

**Statut :** Accepté
**Date :** 2026-08-16
**Deciders :** PO (opérateur) — décision prise en session muti (retours PR #78/#79)

## Contexte

[ADR-0009](0009-ezk-pr-pilot-orchestrateur-validation-prs.md) a fait du corps de PR
un **squelette mince qui LIE la fiche** : `## Summary` (En clair) + `## Lien fiche` +
`## Comment tester`, avec la consigne explicite *« ne pas dupliquer le Gherkin de la fiche :
orienter et renvoyer »*. Intention louable (éviter la copie qui dérive).

**Douleur constatée (session muti, 2026-08-16).** Ce « résumé mince » est en réalité une
**seconde narration rédigée à la main** : la fiche raconte le problème dans son `## Contexte`,
et le `## Summary` de la PR le re-raconte autrement. Deux textes → ils **divergent**. Sur la
PR #79 muti, le `## Summary` a été réécrit à la volée et ne disait plus la même chose que la
fiche ; le PO : *« je ne comprends pas bien la fiche »*. Le principe **une seule source de
vérité** était violé à l'endroit même censé le protéger.

**Reframe.** Il ne faut pas « un résumé qui pointe vers la fiche », il faut que **la fiche SOIT
le document** et que **le corps de PR en soit le RENDU** — le même texte, pas un second. Ce que
la PR réclame en plus (comment vérifier) doit **descendre dans la fiche**, pas naître dans la PR.

## Décision

1. **La fiche `features/<id>_*.md` est la source unique.** Elle **est** le document lisible :
   elle ouvre par **« En clair »** (règle [`human-facing-lisibility`](../../rules/documentation-guidelines/human-facing-lisibility.md))
   puis Contexte / Proposition / Critères.
2. **Le corps de PR est le rendu de la fiche** — sa **prose = le contenu de la fiche**, pas un
   résumé parallèle. À la création (ezk-sprint étape PR / ezk-pr-pilot), on **recopie la fiche**
   dans le corps ; on **ne rédige rien** à côté.
3. **Ce dont la PR a besoin en plus devient une section de la fiche** : `## Comment vérifier`
   (commandes rejouables / signaux observables) entre dans le **template de fiche**. Zéro texte
   écrit deux fois.
4. **Seul le statut vit dans la PR, pas la prose** : la **matrice « Validation »** (CI / tests /
   E2E — état dynamique) reste appendue sous le rendu de la fiche. La convention Validation
   d'ADR-0009 **survit** ; c'est le *seul* bloc propre à la PR.
5. **Sur divergence, la fiche gagne** : si le corps et la fiche diffèrent (fiche éditée après
   ouverture de la PR), on **re-rend** le corps depuis la fiche — jamais l'inverse.

Cette décision **révise ADR-0009** sur la nature de la *prose* du corps (mince-qui-lie → rendu
de la fiche) ; elle **n'annule pas** la convention Validation ni `ezk-pr-pilot` (consommation
du stock).

## Options considérées

- **A. Garder le résumé mince (ADR-0009)** — rejeté : c'est la source du bug (deux narrations
  qui dérivent), constaté en prod.
- **B. Corps de PR = simple lien vers la fiche** — rejeté : le lecteur GitHub ne voit **rien**
  sans ouvrir la fiche ; contredit « le corps doit porter le même contenu ».
- **C. Fragment source partagé, rendu des deux côtés** — rejeté pour l'instant : demande un
  moteur de parsing/rendu custom ; sur-outillage pour le gain.
- **D. La fiche est le document, la PR le rend (retenue)** — une seule prose, une seule source ;
  le seul ajout PR est le statut (matrice), pas du récit.

## Conséquences

- **Template de fiche** gagne `## Comment vérifier` **et** rappelle l'ouverture « En clair » —
  la fiche devient auto-suffisante pour être rendue en PR.
- **Règle `human-facing-lisibility`** : la section « Cas corps de PR » est réécrite (rendu de la
  fiche + matrice, au lieu de trois blocs minces).
- **ezk-sprint étape 8** : « rendre la fiche dans le corps » remplace « rédiger trois blocs ».
- **ezk-pr-pilot** (`init`, squelette, `check-pr-body`) : le contrat validé devient « En clair +
  lien fiche + Comment vérifier + Validation », le garde-fou vérifie le rendu, pas un Summary.
- **Plus facile** : le PO lit **le même texte** dans la fiche et la PR ; plus de dérive.
- **Plus dur** : discipline de **re-rendu** si la fiche bouge après ouverture de la PR (mitigé :
  la fiche gagne, re-render mécanique).
- **Dette** : renommer l'asset `PULL_REQUEST_TEMPLATE.thin.md` (le mot « thin » devient impropre)
  et rafraîchir [`docs/ezk-model-and-lisibility.md`](../ezk-model-and-lisibility.md) — suivi hors
  de cette PR pour la garder revuable. Audit `ezk-steward` recommandé après merge.
