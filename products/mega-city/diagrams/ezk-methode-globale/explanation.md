## Ce que montre ce diagramme

Trois bandes, rien de plus :

1. **Orchestrateurs** — product-builder → sprint → pr (enchaînement de livraison).
2. **Rôles** — pm → architect → dev → qa → reviewer (une feature).
3. **Capacités** — backlog, sandbox, preview, commits, **archive**… (outils, pas des gens).

Le sprint *orchestre* les rôles ; le pr *consomme* leurs PRs ; rôles **et**
orchestrateurs *utilisent* les capacités. `archive` est une **hygiène de
clôture** (capacité), pas un maillon de la chaîne orchestrateurs.
