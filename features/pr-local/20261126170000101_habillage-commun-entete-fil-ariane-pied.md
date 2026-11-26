> 🗎 Rendu de la fiche [features/20261126170000101_habillage-commun-entete-fil-ariane-pied.md](../done/20261126170000101_habillage-commun-entete-fil-ariane-pied.md)

# 20261126170000101 — Mission control a l'habillage de la maquette : en-tête, fil d'Ariane, boutons « i » et pied de page

**En clair.** L'en-tête de mission control affiche « board v0.17.0 », la version du paquet, et non celle du projet. On pose l'en-tête, le fil d'Ariane, les boutons « i » et le pied de page de la maquette. La pastille montre la dernière version étiquetée du projet choisi.

**Si tu arrives frais.** Cette fiche touche le cadre commun à toutes les pages, pas leur contenu. La cloche d'alertes a sa propre fiche. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Écart constaté sur les captures `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/01-projets-app.png` et `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/01-projets-maquette.png`, reprises sur toutes les pages (voir aussi `05-fiches-*`).

- L'app affiche « board » et une pastille « v0.17.0 » : c'est la version du paquet web, pas celle du projet.
- Aucun fil d'Ariane. La maquette en pose un sur chaque page : « Projets › vectorz › Fiches ».
- Les titres de page portent un sous-titre long (« les règles de la méthode, et celles que personne ne lit »). La maquette met un bouton « i » à la place.
- Pas de pied de page. La maquette ferme chaque page sur « mega-city · Documentation ».
- Le sélecteur de projet existe (`Board.tsx`) ; la maquette le place après « Mission control », avec la pastille de version à côté.

## Proposition

1. **En-tête** : « Mission control », puis le sélecteur de projet, puis la pastille de la dernière version étiquetée du projet choisi. Source : `ezk board show --json`, liste des versions étiquetées. Sans version étiquetée, la pastille dit « aucune version » ; si le contrat ne la publie pas, « non publié ». Elle ne reprend jamais la version du paquet.
2. **Fil d'Ariane** « Projets › projet › page », sur chaque page du groupe Projet. « Projets » mène à l'accueil, « projet » à la vue d'ensemble. Une page de détail ajoute son niveau : « Sprints › Sprint 32 ».
3. **Bouton « i »** à droite du titre de page et de chaque carte. Il montre au survol une phrase d'aide. Le texte long et les sous-titres actuels disparaissent. Un seul « i » par ligne de réglage, à droite.
4. **Pied de page** « mega-city · Documentation » sur toutes les pages. « Documentation » mène à la page de documentation de la méthode si elle existe ; sinon le mot reste sans lien, sans lien inventé.
5. **Sans la cloche** : la place est laissée, la cloche est portée par la fiche « La cloche d'alertes de l'en-tête ».
6. Un composant partagé porte le titre, le « i », le fil et le pied. Les pages cessent de les dessiner chacune.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] La pastille de l'en-tête affiche la dernière version étiquetée du projet choisi, et « board v0.17.0 » n'apparaît plus.
- [x] Sans version étiquetée publiée, la pastille dit « aucune version » ou « non publié », jamais le numéro du paquet.
- [x] Chaque page du groupe Projet affiche son fil d'Ariane ; chaque maillon, sauf le dernier, est un lien qui ouvre la bonne page.
- [x] Chaque titre de page et chaque carte portent un bouton « i » à droite ; aucun sous-titre long ne reste sous les titres.
- [x] Le pied de page « mega-city · Documentation » figure sur toutes les pages.
- [x] Un test rend l'habillage pour deux projets et vérifie que la pastille change avec le projet.
- [x] Capture avant / après de l'en-tête jointe à la fiche.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web test -- Board.test.tsx
```

- vue Vue d'ensemble : http://localhost:5273 → menu Vue d'ensemble : en-tête, fil, pied de page ; changer de projet change la pastille.
- Preuve avant / après : [avant](../../docs/pr-evidence/20261126170000101/habillage-before.jpg) → [après](../../docs/pr-evidence/20261126170000101/habillage-after.jpg)
- Contrôle « prête » : ezk-pm GO le 2026-11-26 (lot de 13). Revue adverse : ezk-reviewer GO, 7 critères prouvés ; deux sous-titres de carte et la source de la pastille corrigés après revue.

## Hors périmètre

- La cloche d'alertes (fiche dédiée).
- Le contenu des pages : chacune a sa fiche.
- Une page de documentation nouvelle.
- Le groupe Global du menu, qui ne change pas.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ tsc propre, 33 fichiers / 280 tests web verts (biome exclut ce paquet) |
| Revue adverse | ✅ GO (ezk-reviewer, 0 bloquant ; sous-titres de ProcessMap et GraphMap, source de la pastille corrigés) |
| Before / after (UI) | docs/pr-evidence/20261126170000101/habillage-before.jpg → docs/pr-evidence/20261126170000101/habillage-after.jpg |
