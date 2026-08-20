## Ce que montre ce diagramme

La méthode mega-city en une seule carte : **comment les pièces tiennent ensemble**, du référentiel
jusqu'au travail livré.

- **Le PO** (toi) est le point d'entrée : il décide et garde la main.
- **Deux catalogues** se composent : **LA LOI** (bleu — les règles + leurs regroupements) et
  **L'ÉQUIPE** (ambre — 7 rôles/agents + 23 commandes `ezk-*`).
- **L'assemblage** (gris) : un **profil** (keystone) compose loi + équipe, puis le **bind
  déterministe** matérialise le tout dans la forme native de chaque hôte (Claude Code, Desktop,
  Cursor, cop1).
- **Le flux** (vert) met la méthode en oeuvre : le **backlog** alimente le **product-builder**, qui
  enchaîne des **sprints** (1 fiche → 1 PR), jusqu'au **ship** qui réalimente le backlog.

Les liens porteurs : le sprint **convoque les agents**, la loi **guide** le sprint, et la
**rétro** propose de nouvelles règles qui **retournent dans la loi** — la boucle se referme.
`ezk-start` ouvre la session, `ezk-archive` la clôt sans rien perdre.

> Cette carte est la **colonne vertébrale** (simple). Le détail exhaustif — les 23 commandes avec
> leurs sous-commandes, les 7 capabilities, tous les liens de composition — vit dans la **carte
> dynamique interactive** (l'artefact HTML compagnon).

> ⚠️ **v1 — trois défauts connus** (audit du 2026-08-20, détail dans `description.md`) :
> les liens sont surtout **inférés de la prose** (7 arêtes réellement déclarées via
> `composes:`, une quarantaine dessinées) ; **`bind → caps/host` est faux** comme séquence
> (le bind *utilise* un cap, ADR-0003) ; **les rôles ne sont pas dans le graphe**
> (`composes:` ne relie que skill→skill). À corriger avant d'en faire la carte de référence.
