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
| `ezk-backlog` | 📥 importé (0024, version #31) | backlog markdown versionné (add dédoublonnant + version + brainstorm) — satisfait la fiche 0022 |
| `ezk-sprint` | 📥 importé (0024) | orchestrateur de sprints autonomes (BDD→TDD→gate→revue→PR→squash) |
| `ezk-ci` | 📥 importé (0024) | valide les pipelines GitHub Actions en local (act + Docker) |
| `ezk-preview` | 📥 importé (0024) | URL de démo pour une feature (Vercel / cloudflared / tailscale) |
| `ezk-device` | 📥 importé (0024) | build + test Android sur un tél physique distant (Tailscale/adb) |
| `ezk-apk` | 📥 importé (0024) | build d'un APK/IPA de preview sur EAS + lien d'install |
| `ezk-npm-scripts` | 📥 importé (0024) | hygiène des scripts npm/pnpm/turbo d'un monorepo |
| `ezk-design-system` | 📥 importé (0024) | design system minimal (tokens + atomes + styleguide vivant) — l'« étendre » reste la fiche 0019 |

> **Agents** (`../agents/`) migrés aussi (0024) : `ezk-architect`, `ezk-qa`, `ezk-reviewer`, `ezk-steward`, `ezk-tdd`.
> Migration du contenu **terminée** : les 12 skills + 5 agents `ezk-*` vivent désormais dans mega-city.
> Follow-up hors migration : **étendre** `ezk-design-system` (UI/UX requêtable, fiche 0019).
