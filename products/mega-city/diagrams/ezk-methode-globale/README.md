# Méthode ezk — vue globale (simple)

> Source : [`description.md`](description.md). Généré — ne pas éditer à la main.

## Ce que montre ce diagramme

Trois bandes, rien de plus :

1. **Orchestrateurs** — product-builder → sprint → pr.
2. **Rôles** — pm → architect → dev → qa → reviewer (une feature).
3. **Capacités** — backlog, sandbox, preview, commits, **archive**… (outils, pas des gens).

```mermaid
flowchart TB
  subgraph O["1. Orchestrateurs"]
    direction LR
    PB["product-builder"] --> SP["sprint"] --> PR["pr"]
  end

  subgraph R["2. Roles — une feature"]
    direction LR
    PM["pm"] --> ARCH["architect"] --> DEV["dev"] --> QA["qa"] --> REV["reviewer"]
  end

  subgraph C["3. Capacites ezk-caps-*"]
    direction LR
    BL["backlog"]
    SB["sandbox"]
    PV["preview"]
    CM["commits"]
    AR["archive"]
  end

  SP -->|"orchestre"| R
  PR -->|"consomme les PRs"| R
  R -.->|"utilisent"| C
  O -.->|"utilisent"| C
```

**Vues** · éditer sur [mermaid.live](https://mermaid.live) en collant `diagram.mmd`.
