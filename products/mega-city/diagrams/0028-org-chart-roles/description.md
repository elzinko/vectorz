# Org-chart des rôles ezk-* (fiche 0028)

> Source de vérité de ce diagramme (prose). Le `.mmd` et le `.svg` en sont générés — ne pas les éditer à la main.

Organigramme de l'équipe de dev `ezk-*`, en **deux strates**, plus la distinction **rôle vs capacité**.

## Chaîne de valeur (les rôles, dans l'ordre)

Un **PO / BA** cadre le besoin et tient le backlog (`ezk-backlog` + `product-brainstorming`). Il passe la
main à l'**Architecte** (`ezk-architect`) qui tranche la structure. Le **Dev** (`ezk-dev`) implémente — le
TDD est une **capacité** qu'il mobilise, pas un rôle. La **QA** (`ezk-qa`) écrit les scénarios et valide. Le
**Reviewer** (`ezk-reviewer` / `code-review`) passe le diff au crible. Le **Scrum master** (`ezk-sprint`)
orchestre le sprint d'une feature. Au-dessus, un **Product Owner multi-sprints** (`ezk-product-builder`)
enchaîne les features.

## Couches de management (orthogonales à la chaîne de valeur)

Un **integration / release manager** (`ezk-pr`) teste-puis-merge un stock de PRs. La **clôture de
session** (`ezk-archive`) range proprement entre deux sessions.

## Rôle vs capacité

Les **rôles** sont nommés ci-dessus. Les **capacités** — TDD, rules / iamthelaw, diagram-as-code
(`ezk-diagram`) — sont mobilisées **par** un rôle ; ce ne sont pas des rôles.
