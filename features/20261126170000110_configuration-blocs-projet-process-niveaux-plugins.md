---
id: "20261126170000110"
title: "La page Configuration est rangée en Projet, Process, Niveaux et Plugins, sans commande ni jargon"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-26
---

# 20261126170000110 — La page Configuration est rangée en Projet, Process, Niveaux et Plugins, sans commande ni jargon

**En clair.** La page Configuration montre un « bundle « dod » », des commandes et un chemin de lecture ambigu. On la range en quatre blocs : Projet, Process, Niveaux, Plugins. Les niveaux se disent performant, standard, économe.

**Si tu arrives frais.** La configuration règle le process d'un projet : préparer les fiches, construire un sprint, livrer une version. Un niveau choisit le modèle et l'effort d'un agent. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/11-configuration-app.png` / `11-configuration-maquette.png`.

- `ConfigView.tsx` écrit « bundle « dod » » et affiche des commandes brutes.
- Le « chemin lu » n'est pas clairement le dossier du projet.
- Donnée : `ezk config show --json` (contrat `config-show`).

## Proposition

1. **Projet** : réglages (`.vectorz/config.yml`), dossier lu = dossier du projet, bouton « Enregistrer ».
2. **Process** : Préparer les fiches (grooming, DoR) ; Construire un sprint (DoD = « 5 règles », Revue adverse) ; Livrer une version (gate de release : cohérence du lot, chasse aux bugs, tests, autres contrôles). Un « i » par ligne de réglage, à droite.
3. **Niveaux** : performant, standard, économe avec modèle et effort en français (élevé, moyen, faible).
4. **Plugins** : GitHub activé, plugins disponibles, « Installer » seulement si le geste existe.
5. **Retirés** : le mot « bundle », toute commande affichée comme texte (infobulle seulement).

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] Quatre blocs Projet, Process, Niveaux, Plugins apparaissent dans cet ordre.
- [x] Le mot « bundle « dod » » n'apparaît plus ; le DoD se lit « oui » avec son nombre de règles quand la méthode le publie, « non publié » sinon. (Amendé le 2026-11-26 en revue, voir Hors périmètre.)
- [x] Aucune commande ezk n'est affichée comme texte ; elle est en infobulle.
- [x] Le chemin lu est le dossier du projet.
- [x] Les niveaux s'écrivent performant, standard, économe, et l'effort élevé, moyen, faible.
- [x] Un seul « i » par ligne de réglage, à droite.
- [x] Une valeur non publiée s'écrit « non publié ».

## Comment vérifier

- Preuve avant / après (configuration) : [avant](../docs/pr-evidence/20261126170000110/configuration-before.jpg) → [après](../docs/pr-evidence/20261126170000110/configuration-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (champs morts retirés ; compte du DoD hors périmètre, entériné)

```bash
pnpm --dir products/cop1/packages/web test -- ConfigView.test.tsx
```

- vue Configuration : http://localhost:5273 → menu Configuration : relire les quatre blocs.

## Hors périmètre

- Le compte « 5 règles » du DoD. `ezk config show --json` ne publie pas le nombre de règles du paquet dod. L'écran ne l'invente pas (ADR-086). Il s'affichera quand le contrat le publiera. Décision de revue du 2026-11-26.
- Ajouter de nouveaux réglages dans la méthode.
- Créer des plugins.
- Éditer les règles d'un paquet (voir Loi).
