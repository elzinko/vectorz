Le diagramme de composants de l'observabilité qualité : la structure statique (qui dépend de
quoi), organisée autour de la trichotomie **règle / capacité / config** — modèle **corrigé après
le panel adverse du 2026-07-22** (ADR-033).

Trois zones de couleur :

- **Méthode (mega-city)** : la **Règle DoD** (« couverture ≥ seuil », la loi, dans
  `products/mega-city/rules/`) et les **Hooks CI** (qui *lancent* l'outil).
- **Capacité (côté produit)** : les **Adaptateurs** d'outils (Codecov, Sonar, CodeQL) et la
  **Config** (le seuil ; les « chemins exclus » sont un arbitrage ouvert, peut-être surface gelée).
- **Moniteur (mission-control)** : la **Projection KPI** (vues colonne), l'**Onglet qualité**
  (courbes) et l'**Agent d'analyse** (propose, sous gate PO).

Au centre, trois pièces neutres : le **MetricPort** (le contrat abstrait, language-agnostic), le
**Mesureur tiers** (neutre) et le **Silo** (le journal des mesures). Dépendances : les hooks
**lancent** les adaptateurs ; les adaptateurs **implémentent** le port (inversion de dépendance) ;
le **mesureur tiers lit la valeur** via le port et **écrit la mesure** dans le silo — **lui seul
écrit** ; la règle DoD **lit la valeur déjà mesurée** (elle ne pilote pas l'adaptateur en direct) ;
la config **paramètre** la règle et **provisionne** les adaptateurs ; côté moniteur, la projection
**lit** le silo, l'onglet **affiche** la projection, l'agent la **lit**. Le port et le silo sont la
seule chose que la règle et le moniteur connaissent — jamais un outil précis.
