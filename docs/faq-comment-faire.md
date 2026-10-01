# FAQ — comment faire ?

## En clair

Cette page répond aux questions que tu te poses le plus souvent sur la méthode. Chaque réponse tient en quelques phrases. Chaque réponse pointe vers la commande ou le document qui fait autorité.

Si une commande citée ici n'existe plus, un test passe au rouge. Le test vérifie que les commandes existent, pas que chaque phrase reste juste : relis une réponse si elle te surprend. Pour un mot que tu ne connais pas, ouvre le [glossaire](glossaire-jargon-ezk.md).

### Quelle commande pour faire X ? Existe-t-elle déjà ?

**En clair.** Tape `/ezk-help`. Il liste tous les skills, générés depuis leurs fichiers : la liste est toujours à jour. `/ezk-help ezk-backlog` détaille un seul skill. Le [tableau du catalogue](../products/mega-city/skills/README.md) donne la même chose en une ligne par skill, avec son profil de déploiement.

- Commande : `/ezk-help`, ou `pnpm --dir products/mega-city ezk:help` depuis un terminal.
- Fait autorité : [`ezk-help`](../products/mega-city/commands/ezk-help.md).

### Comment noter une idée ou un bug, puis choisir quoi faire ensuite ?

**En clair.** `/ezk-backlog add <idée>` crée une fiche, sans doublon. Elle naît « idée » : elle n'est pas encore tirable. `/ezk-backlog groom <id>` la fait mûrir. `/ezk-backlog ready <id>` ouvre la porte « prête ». `/ezk-backlog next --ready-only` donne la prochaine fiche tirable.

- Commandes : `/ezk-backlog add`, `/ezk-backlog groom <id>`, `/ezk-backlog ready <id>`, `/ezk-backlog next --ready-only`, `/ezk-backlog list` pour l'état d'ensemble.
- Fait autorité : [`ezk-backlog`](../products/mega-city/skills/ezk-backlog/SKILL.md).

### Comment lancer le développement d'une fiche, ou de plusieurs ?

**En clair.** `/ezk-sprint run` déroule un sprint sur une fiche : une branche, une PR, un merge. Il vérifie d'abord que le terrain est prêt (`/ezk-sprint check`, lecture seule). Pour enchaîner plusieurs sprints en autonomie, utilise `/ezk-product-build run`. Ajoute `--once` pour n'en faire qu'un.

- Commandes : `/ezk-sprint run`, `/ezk-sprint check`, `/ezk-product-build run --once`.
- Fait autorité : [`ezk-sprint`](../products/mega-city/skills/ezk-sprint/SKILL.md), [`ezk-product-build`](../products/mega-city/skills/ezk-product-build/SKILL.md).

### Comment capitaliser une feature d'un projet en recette réutilisable ?

**En clair.** Si la feature est déjà une fiche livrée, `/ezk-chef extract <id>` en tire un brouillon de recette. Le script fait la partie mécanique. Le jugement reste à l'agent `ezk-chef` ou à toi. Ensuite `/ezk-chef check` valide le brouillon. Si la feature vit seulement dans le code d'un autre projet, ce n'est pas encore possible : écris d'abord sa fiche.

- Commandes : `/ezk-chef extract <id>`, puis `/ezk-chef check`. Le script se lance aussi à la main : `bash products/mega-city/bin/ezk-chef-extract.sh <id>`.
- Attention : `ezk-chef` n'est dans aucun profil de déploiement pour l'instant. La commande slash n'est donc pas disponible partout, alors que le script marche depuis le dépôt.
- Fait autorité : [`ezk-chef`](../products/mega-city/skills/ezk-chef/SKILL.md), fiche livrée [extraction en recette](../features/done/20260824122629794_ezk-extract-capitaliser-feature-en-recette.md).

### Qui analyse la méthode ? Rétro, steward, KPI : quelle différence ?

**En clair.** Trois rôles, trois métiers. Ils ne font pas doublon, donc pas besoin d'une nouvelle skill d'analyse.

- `/ezk-retro run` part d'un symptôme que tu as vécu et propose une règle mesurable. C'est toi qui valides.
- L'agent `ezk-steward` audite la bibliothèque elle-même : skills, agents, README, scripts. Il rend un verdict GO ou NO-GO.
- La fiche 0057 décrit un futur agent qui lirait des chiffres (KPI) pour nourrir la rétro. Il n'est pas construit.

La rétro nomme son juge de cohérence de deux façons : `chief-judge` et `ezk-steward`. Seul `ezk-steward` existe comme agent.

- Fait autorité : [`ezk-retro`](../products/mega-city/skills/ezk-retro/SKILL.md), [`ezk-steward`](../products/mega-city/agents/ezk-steward.md), [fiche 0057](../features/0057-agent-analyse-methode.md).

### Comment clôturer une session sans rien perdre ?

**En clair.** `/ezk-archive check` fait le tour sans rien modifier et te dit si tu peux archiver. `/ezk-archive run` applique les corrections sûres et écrit la note de passation pour la prochaine session. Il ne fusionne et ne pousse jamais rien tout seul.

- Commandes : `/ezk-archive check`, puis `/ezk-archive run`.
- Fait autorité : [`ezk-archive`](../products/mega-city/skills/ezk-archive/SKILL.md).

### Comment tester puis fusionner plusieurs PRs ouvertes ?

**En clair.** `/ezk-pr plan` analyse le lot : ordre de fusion, conflits, sessions de test à grouper. `/ezk-pr run` déroule une session de test. `/ezk-pr ship` fusionne quand tout est vert.

- Commandes : `/ezk-pr plan`, `/ezk-pr run`, `/ezk-pr ship`.
- Fait autorité : [`ezk-pr`](../products/mega-city/skills/ezk-pr/SKILL.md).

### Où voir comment les mécanismes s'emboîtent ?

**En clair.** `pnpm ezk:map` ouvre la carte interactive de la méthode en 10 minutes. La [carte de la méthode](../products/mega-city/docs/method-map.md) la décrit en texte. Le [glossaire](glossaire-jargon-ezk.md) traduit le jargon (recette, rule, capability, profil…).

- Commande : `pnpm ezk:map`.
- Fait autorité : [carte interactive](../diagrams/methode-mega-city/carte-interactive.html), [glossaire](glossaire-jargon-ezk.md).

---

## Ajouter une entrée

Une entrée = une question, un paragraphe « En clair », et un lien vers la source. Mets chaque commande entre accents graves : le test `faq-freshness` vérifie qu'elle existe.
