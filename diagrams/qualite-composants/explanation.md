## Ce que montre ce diagramme

La structure statique de l'observabilité qualité — **qui dépend de quoi** — rangée selon la
trichotomie **règle / capacité / config** :

- **bleu = la méthode** (la règle-loi + les hooks qui lancent l'outil) ;
- **ambre = la capacité** (les outils, sous forme d'adaptateurs, + la config) ;
- **vert = le moniteur** (KPI, courbes, agent d'analyse).

En gris, trois pièces neutres : le **MetricPort** (le contrat abstrait — c'est lui qui rend
l'ensemble *language-agnostic*), le **Mesureur tiers** et le **Silo** (le magasin des mesures).

Le pivot **corrigé par le panel** : le **mesureur tiers** est le **seul** à *écrire* la mesure ;
la règle DoD, elle, **lit** une valeur déjà mesurée. On ajoute un outil = un adaptateur derrière
le port, sans toucher ni la règle ni le silo ; **installer un outil = provisionner un adaptateur**
(un préalable, pas une règle).
