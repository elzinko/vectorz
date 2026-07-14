---
id: 0032
title: ezk-diagram — prose → diagramme versionné (as-code + image), autorat verbal
type: feature
priority: P2
status: shipped
pr: "#3"
created: 2026-07-12
---

## Contexte / Problème
On veut capturer/comprendre des structures (org-chart des rôles, boucles d'interaction, archi)
**sans écrire de YAML ni de Mermaid à la main** : décrire **avec ses mots**, obtenir un diagramme,
itérer verbalement. Aujourd'hui rien n'outille ce cycle « prose → diagramme → image » de façon
**versionnée et révisable** ; les diagrammes (ex. celui visé par 0028) seraient dessinés à la main
→ ils driftent et coûtent à maintenir.

## Proposition
Un **skill** (catalogue mega-city, donc global → utilisable depuis cop1 et partout) qui tient la
boucle d'autorat verbal et **stocke un artefact versionné** par diagramme :

```
diagrams/<slug>/
  description.md   # LA PROSE = source (ce que l'humain dit)
  diagram.mmd      # diagram-as-code (généré par Claude depuis la prose)
  diagram.svg      # image (rendue depuis le .mmd)
  meta.yaml        # titre, date, liens (géré par l'outil)
```

Boucle : décris → Claude génère le Mermaid → rend l'image → tu valides/corriges **verbalement** →
Claude met à jour la prose + régénère code + image → re-vérif. Git versionne le triplet.
Sous-commandes : `add "<prose>"`, `list`, `edit <slug>`, `rm <slug>`, `dup <slug>`.

**Rester dans l'écosystème** : prose→Mermaid = capacité **native de Claude** (zéro service externe) ;
Mermaid→image = rendu **local** (`mermaid-cli`/`mmdc`, ou un MCP mermaid, ou l'outil visualize).

## Critères d'acceptation
- [ ] `add "<prose>"` produit description.md + diagram.mmd + diagram.svg dans `diagrams/<slug>/`, commités.
- [ ] correction **verbale** → prose + code + image régénérés (le triplet reste cohérent).
- [ ] on peut revenir plus tard : `edit` / `rm` / `dup` par slug.
- [ ] premier usage réel : générer l'org-chart de **0028** depuis la prose (au lieu de le dessiner à la main).

## Notes / décisions (brainstorm 2026-07-12)
- **Descriptif d'abord** : le diagramme EST l'artefact (comprendre/documenter), pas encore un modèle
  exécutable. Choix assumé pour démarrer cheap et utile.
- **Rampe d'accès** : la même commande pourra plus tard émettre un 4e fichier (modèle typé) qui *pilote*
  du comportement — sans jamais faire écrire de YAML à l'humain (Claude le compile). Cf. [[0033]].
- **Skill, pas agent** : la synthèse prose→Mermaid = capacité native ; le skill l'entoure (boucle,
  stockage, versioning, sous-commandes). Un agent « dessinateur » reste optionnel.
- Sert **0028** (produit son diagramme) ; s'inscrit dans le fil méta-outillage 0028-0031.
