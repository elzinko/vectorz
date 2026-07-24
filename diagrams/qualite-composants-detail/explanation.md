## Ce que montre ce diagramme

La vue **détaillée** de l'observabilité qualité : comment les cinq zones s'emboîtent, du push
d'une PR jusqu'aux courbes — et par où passe chaque décision.

Comment le lire :

- **bleu = toi et tes écrans** (la PR, mission-control) ; **violet = la méthode** (hooks CI,
  règles, gate, rétro) ; **ambre = les outils et leur config de collecte** ; **gris = les pièces
  neutres** (mesureur tiers et les deux portes d'écriture) ; **vert = les données** (journaux +
  vues de calcul).
- **Pointillé rose = pas encore fiché ou optionnel** : le commentaire de PR (0058), la
  visualisation de la méthode (0060), et les outils SaaS (chaque installation = proposition que
  TU approuves, c'est toi qui crées le compte).

Les quatre verrous à retenir :

1. **Lancer ≠ écrire** : la méthode exécute l'outil, mais seul le **mesureur tiers** écrit le
   chiffre (via MetricSink). De même, seule la porte « script d'append » écrit le journal des
   décisions — ni la rétro ni toi n'écrivez le fichier à la main.
2. **Le gate ne voit que le journal** : il lit une valeur déjà mesurée, jamais l'outil en
   direct ; pas de mesure valide ⇒ refus (fail-closed).
3. **Deux configs, pas une** : la *collecte* (quel outil, quel artefact) vit côté produit ; le
   *seuil* (la loi) vit côté méthode. Un seul fichier aurait recouplé les deux domaines.
4. **Les frontières se franchissent par fichiers** (journaux, config, artefacts), jamais par
   imports de code — c'est la parade structurelle au couplage.
