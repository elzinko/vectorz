> 🗎 Rendu de la fiche [features/20261126170000109_loi-regles-en-vigueur-et-paquets.md](../done/20261126170000109_loi-regles-en-vigueur-et-paquets.md)

# 20261126170000109 — La page Loi montre les règles en vigueur et l'état des paquets, plus le catalogue brut

**En clair.** La page Loi liste 96 règles du catalogue, sans dire lesquelles s'appliquent au projet. On montre « Ce qui s'applique ici », les règles en vigueur avec leurs filtres, et les 11 paquets avec leur état. Un lien mène à l'Annuaire.

**Si tu arrives frais.** La loi est l'ensemble des règles que les skills et agents lisent. Un paquet est un groupe de règles. « En vigueur » veut dire installée ou lue au démarrage. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/10-loi-app.png` / `10-loi-maquette.png`.

- `LawView.tsx` affiche les 96 règles du catalogue et 34 compétences, avec des pastilles « 0 citées sans être installées ».
- La maquette ne montre que les règles en vigueur sur le projet (27) et renvoie au catalogue par un lien.
- Donnée : `ezk law show --json` (contrat `law-show`).

## Proposition

1. **« Ce qui s'applique ici »** : règles en vigueur, installées, propres au projet, paquets en vigueur ; contrat du projet (« aucun » si `.vectorz/rules.yml` absent) ; déployée par (« profil non publié »).
2. **Règles en vigueur** : « 27 ici · 96 au catalogue → ». Colonnes : titre en clair, niveau (MUST, SHOULD), réglé par, d'où (installée, lue au démarrage, propre au projet), paquet, garantie, vérifiée par.
3. **Filtres** : d'où, paquet, niveau, recherche.
4. **Paquets** : 11 lignes avec règles, réglé par, état ici (installé, lu, N règles sur M en vigueur, disponible). Un paquet ouvre son détail.
5. **Lien « Annuaire de la méthode → »** en tête de page.
6. **Retiré** : la liste brute du catalogue et la colonne des 34 compétences.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] Seules les règles en vigueur sont listées ; le compteur dit « N ici · M au catalogue ».
- [x] Le titre d'une règle est en clair, pas son identifiant technique.
- [x] Les filtres d'où, de paquet et de niveau réduisent la liste.
- [x] Le tableau des 11 paquets donne l'état de chacun sur ce projet.
- [x] Aucun lien mort vers l'Annuaire : la page n'existe pas encore, le lien attend sa page. (Amendé le 2026-11-26 en revue, voir Hors périmètre.)
- [x] Une donnée non publiée s'écrit « non publié » ; aucun « 0 » inventé.

## Comment vérifier

- Preuve avant / après (loi) : [avant](../../docs/pr-evidence/20261126170000109/loi-before.jpg) → [après](../../docs/pr-evidence/20261126170000109/loi-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (infobulle des règles installées ; lien Annuaire hors périmètre, entériné)

```bash
pnpm --dir products/cop1/packages/web test -- LawView.test.tsx
```

- vue Loi : http://localhost:5273 → menu Loi : filtrer sur « MUST », ouvrir le paquet dod.

## Hors périmètre

- Le lien « Annuaire de la méthode → » en tête de page. L'Annuaire est grisé dans le menu et aucune page ne l'accueille. Un lien vers rien serait un bouton sans cible. Il viendra avec la page de l'Annuaire. Décision de revue du 2026-11-26.
- Modifier une règle depuis l'écran : elle change par une rétro.
- La page de l'Annuaire.
- Choisir les paquets d'un projet depuis l'écran.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ tsc propre, 386 tests web verts, daemon vert |
| Revue adverse | ✅ ezk-reviewer GO après correctif (infobulle des règles installées ; lien Annuaire hors périmètre, entériné) |
| Before / after (UI) | docs/pr-evidence/20261126170000109/loi-before.jpg → docs/pr-evidence/20261126170000109/loi-after.jpg |
