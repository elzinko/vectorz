<!-- Corps de PR = RENDU de la fiche (source unique `features/<id>_*.md`), PAS un résumé
     parallèle. Règle human-facing-lisibility / ADR-0029. Ne rien rédiger ici : recopier la
     fiche ; sur divergence, la fiche gagne → re-rendre. (Nom de fichier « thin » = legacy.) -->

<!-- ▼▼▼ RENDU DE LA FICHE — coller son contenu tel quel (En clair + sections) ▼▼▼ -->

# <id> — <titre>

**En clair.** <l'ouverture de la fiche, recopiée telle quelle>

## Contexte / Problème

<recopié de la fiche>

## Proposition

<recopié de la fiche>

## Critères d'acceptation

- [ ] <recopié de la fiche>

## Comment vérifier

<recopié de la fiche : commandes rejouables / preuves agent pointant des scripts existants.
Les liens before/after d'UI vivent ICI (donc dans la fiche), pas inventés côté PR.>

<!-- ▲▲▲ FIN DU RENDU DE LA FICHE ▲▲▲ -->

## Validation

<!-- SEUL bloc propre à la PR : statut dynamique (CI/tests/E2E), pas de la prose. Conv. ADR-0009. -->

| Modalité | Statut |
|---|---|
| CI | ⏳ |
| Tests unitaires | ⏳ |
| E2E navigateur | N.A. / ⏳ |
| Before / after (UI) | N.A. / ⏳ |
| Preview de déploiement | N.A. |

Voir [docs/PR_VALIDATION.md](../docs/PR_VALIDATION.md).
