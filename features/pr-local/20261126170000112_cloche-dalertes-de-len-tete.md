> 🗎 Rendu de la fiche [features/20261126170000112_cloche-dalertes-de-len-tete.md](../20261126170000112_cloche-dalertes-de-len-tete.md)

# 20261126170000112 — La cloche d'alertes de l'en-tête montre une alerte par élément

**En clair.** L'en-tête n'a pas de cloche. On l'ajoute avec une alerte par élément et un panneau déroulant. Tant que la méthode ne publie pas les alertes, la cloche affiche « non publié ».

**Si tu arrives frais.** Une alerte est un élément qui demande ta décision : fiche bloquée, idée à groomer, rétro due, version à versionner. La méthode doit publier cette liste ; l'écran ne la calcule pas. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/01-projets-maquette.png` (la cloche est en haut à droite de la maquette).

- Aujourd'hui l'en-tête n'a aucune alerte.
- La maquette montre un compteur, un panneau, et pour chaque alerte un type, un projet, un titre, un texte et une croix.
- La donnée vient de [`ezk now --json` publie les alertes de la cloche](../done/20261114131612944_ezk-now-json-alertes-de-la-cloche.md), pas encore livrée.

## Proposition

1. **Cloche** à droite de l'en-tête avec compteur.
2. **Panneau déroulant** : titre « Alertes », « une par élément », « i ».
3. **Une alerte par élément** : type (fiche bloquée, idée à groomer, rétro due, version à poser, question de session, sprint sans rétro), projet, titre, texte.
4. **Fermeture** : pas de croix dans ce POC. Fermer une alerte et s'en souvenir demande un geste d'écriture : fiche « La cloche se souvient des alertes fermées ».
5. **Tant que le contrat manque** : la cloche affiche « non publié » et aucun compteur.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] La cloche affiche un compteur égal au nombre d'alertes publiées.
- [x] Chaque alerte est une ligne avec son type, son titre et son texte.
- [x] Aucune croix de fermeture n'est dessinée tant que la méthode n'a pas de geste pour fermer une alerte. (Amendé le 2026-11-26 en revue : « une alerte fermée disparaît et ne revient pas » part dans la fiche « La cloche se souvient des alertes fermées », voir Hors périmètre.)
- [x] Sans contrat publié, la cloche affiche « non publié » et aucun chiffre.
- [x] Aucune alerte n'est calculée côté écran.

## Comment vérifier

- Preuve avant / après (cloche) : [avant](../../docs/pr-evidence/20261126170000112/cloche-before.jpg) → [après](../../docs/pr-evidence/20261126170000112/cloche-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (fermeture renvoyée à la fiche 113 ; capture après jointe, 49 alertes réelles)

```bash
pnpm --dir products/cop1/packages/web test -- Alerts.test.tsx
```

- vue Projets : http://localhost:5273 → menu Projets : cliquer la cloche, fermer une alerte.

## Hors périmètre

- Fermer une alerte et s'en souvenir : fiche « La cloche se souvient des alertes fermées » ([20261126170000113](../20261126170000113_la-cloche-se-souvient-des-alertes-fermees.md)). Le contrat `now-show/v1` est en lecture seule ; le daemon n'a pas de geste d'écriture. Décision de revue du 2026-11-26, alignée sur le périmètre POC entériné par ezk-pm pour la fiche des alertes.
- Écrire le contrat `ezk now --json` : c'est la fiche dont celle-ci dépend.
- Notifications hors de l'écran.
- Alertes par e-mail.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ web 412, daemon 444, build OK |
| Revue adverse | ✅ ezk-reviewer GO après correctif (fermeture renvoyée à la fiche 113 ; capture après jointe) |
| Before / after (UI) | docs/pr-evidence/20261126170000112/cloche-before.jpg → docs/pr-evidence/20261126170000112/cloche-after.jpg |
