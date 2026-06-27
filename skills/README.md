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
