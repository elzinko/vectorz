Le **board d'avancement** : où en sont les fiches actives du backlog, d'un coup d'œil.

En clair : chaque fiche non livrée (hors `features/done/`) devient une carte — id,
titre, statut, priorité, épic. Triées priorité d'abord, statut ensuite. Des filtres
(statut, type, épic, produit) réduisent la vue. Cliquer une carte ouvre directement
sa fiche source, servie par `ezk-map`.

**Même principe que la carte du domaine** (`diagrams/methode-mega-city/`, épic
« carte fidèle ») : rien n'est dessiné à la main. `avancement-data.ts` compile les
données depuis les fiches (même patron que `map-data.ts` depuis le catalogue). Elles ne sont
plus dans `board.html` : elles vivent dans `board.data.js`, non committé (ADR-0055), calculé à
chaque requête par `pnpm ezk:map` ou écrit par `pnpm --dir products/mega-city views:regen`. Le
board ne peut donc pas être périmé ; un test (`untracked-views.test.ts`) prouve que les données
construites disent vrai sur le backlog réel.

**Ce que ce lot NE fait PAS** (gelé, voir la section dédiée dans le board lui-même) :
la frise des sprints, le diagramme du process scrum avec les fiches positionnées
dessus, et tout objet « sprint-as-data ». Le verdict du panel adverse du 2026-08-23
est explicite : ces briques ne se décident qu'après usage du board lot 0, pas avant
— risque de « 4ᵉ système scrum » (ADR-0013).
