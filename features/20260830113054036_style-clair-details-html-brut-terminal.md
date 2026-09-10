---
id: "20260830113054036"
title: La règle de clarté pousse vers `<details>` HTML qui fuit en texte brut dans le terminal Claude Code
type: bug
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-30
---

## En clair

La règle « mets le détail technique en bas / sur demande » pousse l'agent à emballer ce
détail dans un bloc repliable HTML `<details><summary>…</summary>`. Dans le **terminal de
Claude Code**, ce HTML n'est **pas** rendu : les balises `<details>` et `<summary>`
s'affichent **en texte brut** au milieu de la réponse. Résultat : une sortie censée être
« plus claire » devient **moins** lisible que sans le bloc.

Constaté le 2026-08-30 dans un projet hôte (google-mcp-multi-account, style de sortie
« Explication claire » actif). L'agent a produit :

```
<details>
<summary>Détail technique (fichiers clés)</summary>
...
</details>
```

…affiché tel quel, balises comprises (capture fournie par le PO).

> Anti-doublon : ce n'est pas le même sujet que
> [[20260824111001836_regle-clarte-atteint-tout-output-ezk]] (qui traite du **câblage**
> de la règle dans `base` et de l'**élargissement au chat**). Ici la règle atteint bien
> le chat ; le défaut est le **format** qu'elle suggère : du HTML repliable inadapté au
> canal terminal.

## Contexte / problème

Le canal de sortie « chat » de Claude Code rend du **Markdown GitHub-flavored**, mais ne
rend **pas** le HTML repliable `<details>`/`<summary>`. La consigne de clarté (mettre le
détail « en bas ou sur demande ») n'interdit pas explicitement le HTML, donc l'agent
choisit naturellement un `<details>` pour « replier sur demande ». Le canal ne sait pas
replier → les balises fuient.

Le piège est **latent** : la consigne encourage un geste (« replier le détail ») que le
médium ne supporte pas. Il ne se voit qu'à l'exécution, dans le terminal.

## Portée

- Touche **toute** sortie de chat produite sous la règle de clarté dans le terminal
  Claude Code (explication de fin de tour, résumé de session, réponses longues).
- Ne touche **pas** les artefacts écrits en `.md` (fiches, PR, docs) : là, `<details>`
  est rendu correctement par GitHub. La correction doit donc être **ciblée sur le canal
  chat/terminal**, sans casser l'usage légitime de `<details>` dans les livrables
  Markdown.

## Piste de correction (à groomer)

Dans la règle de lisibilité `documentation-guidelines/human-facing-lisibility` (ou là où
la clarté est câblée pour le chat) : ajouter une contrainte **canal-terminal** explicite.

- Interdire le HTML repliable (`<details>`, `<summary>`) et tout HTML brut dans les
  sorties **chat/terminal**.
- Pour « détail en bas / sur demande » en terminal : utiliser un simple **titre
  Markdown** (`### Détail technique`) suivi du contenu, ou une **liste**. Pas de repli.
- Garder `<details>` **autorisé dans les livrables `.md`** (fiches, PR, docs) où le rendu
  GitHub le supporte.

## Definition of Done (proposée)

- Une réponse longue en terminal ne contient **aucune** balise `<details>`/`<summary>`
  ni HTML brut.
- Le détail technique reste présent, en bas, sous un titre Markdown.
- L'usage de `<details>` dans un livrable `.md` n'est pas impacté.
- Priorité P2 proposée (cosmétique mais visible à chaque réponse longue) — à confirmer
  côté PO.
