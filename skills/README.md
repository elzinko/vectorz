# skills/ — catalogue des compétences (host-agnostique)

Le **corps markdown** des skills (le playbook), indépendant de l'hôte. Source de vérité unique.
Les `caps/<host>/` les matérialisent dans la forme native de chaque LLM.

Un skill = un dossier :

```
ezk-commits/
├── SKILL.md      ← frontmatter (name, description = le déclencheur) + playbook markdown
└── scripts/      ← scripts optionnels
```

**Migration** : tes skills `ezk-*` actuels (repo `claude-skills`) viendront ici à ton rythme.
En attendant, ils restent utilisables **tels quels** via `install.sh` — voir `caps/claude-desktop/`.

## Catalogue

| skill | état | rôle |
|---|---|---|
| `ezk-ezk` | 📝 proposé (ADR-0007) | méta-skill : transforme une session en skill réutilisable (compose brainstorming + architecture + skill-creator ; range via `scripts/deploy.sh`) |
| `ezk-archive` | 📥 importé (strangler-fig) | rituel de clôture de session : clôt proprement un repo pour ne rien perdre entre deux sessions (check/run via `scripts/check.sh`) |
| `ezk-product-builder` | 📝 proposé (ADR-0008) | couche product-owner : construit un produit en enchaînant des sprints (compose ezk-backlog + /product-brainstorming + ezk-sprint ; pure orchestration, aucun script) |
| `ezk-commits` | 📥 importé (strangler-fig, pilote 0004) | messages Conventional Commits + hook `commit-msg` (`scripts/commit-msg`) — 1er skill rendu **bindable** (loader sous-dossiers) |
