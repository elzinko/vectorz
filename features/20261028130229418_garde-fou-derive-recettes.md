---
id: "20261028130229418"
title: "Garde-fou : une recette déclarée dont l'implémentation a disparu (extension ezk-chef check)"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, derive]
depends: ["20261023120000001"]
status: ready
pr:
evidence: none # garde-fou de méthode sans écran ; preuve = un cas « source: absente » sur une fixture, testé
created: 2026-10-28
---

# 20261028130229418 — Garde-fou de dérive des recettes déclarées

## En clair

La commande `ezk recipes` (livrée hier) montre les recettes utilisables depuis un projet. Problème :
une recette déclarée peut **mentir** avec le temps. Elle dit « mon implémentation est là », et le
dossier a disparu. On veut que le gardien des recettes, `ezk-chef check`, **attrape ce mensonge** :
une recette dont le champ `source:` pointe un chemin qui n'existe plus est signalée, nommée, testée.

## Contexte / Problème

- La fiche sœur [Découvrir les recettes (`ezk recipes`)](done/20261023120000001_declarer-outils-recettes-methodes-projet.md)
  a livré la **découverte** en lecture seule. Elle a laissé de côté le **contrôle de cohérence** :
  rien ne vérifie qu'une déclaration correspond encore au réel.
- Une recette porte un champ `source:` — le chemin de son implémentation. Rien n'empêche ce chemin
  de pointer dans le vide : le dossier déplacé, le fichier supprimé, la recette jamais mise à jour.
- **La valeur.** Une recette qui ment casse la découverte en silence. Un lecteur suit le `source:`,
  tombe sur rien, et perd confiance dans tout le livre. Le garde-fou rend ce mensonge **visible au
  moment où on valide une recette**, pas six mois plus tard chez quelqu'un d'autre.

## Proposition

**La maison : `ezk-chef check`** — le gardien des recettes. Il possède déjà le contrôle
« un pointeur vers une implémentation réelle » (`ezk-chef.md`, règle `recipe/*`). Vérifier que le
`source:` résout encore, c'est le **même métier** : on étend ce qu'il fait, on n'ajoute pas un
vérificateur neuf.

**`ezk law doctor` est écarté.** Son objet, c'est la **loi déployée** — il compare ce que
`bind-global` déposerait dans `~/.claude` à ce qui y est vraiment installé (règle manquante, lien
mort, loi périmée). Les recettes n'y sont pas. Mettre la dérive des recettes dans `law doctor`
mélangerait deux objets sans rapport. Décision tranchée au grooming, journalisée plus bas.

Le contrôle réutilise les primitives déjà livrées, sans rien réimplémenter :

- `scanDeclaredRecipes` / `indexedRecipe` (fiche 002) pour lire une recette déclarée ;
- le marcheur de dossiers de la fiche 001 pour trouver les `RECIPE.md` d'un projet ;
- **« existe »** se mesure par **présence de fichier sous une racine injectée**, jamais via le
  `PATH` (sinon le test devient non reproductible).
- Une source **absolue ou « maison »** (`~/git/autre-dépôt`, comme le fait le livre par conception —
  ADR-0013) pointe un autre dépôt : machine-dépendante, elle est **comptée mais jamais jugée**. Le
  rapport dit « sur N vérifiées » pour que « 0 dérive » ne se lise pas « tout vérifié ».

## Critères d'acceptation

- [ ] Une recette du **livre** (`recipes/*.md`) dont le `source:` pointe un chemin absent du dépôt
      est **signalée et nommée** (`recette → source: <chemin>`), testée.
- [ ] Une recette **déclarée dans un projet** (`RECIPE.md`) dont le `source:` pointe un chemin absent
      **sous la racine du projet** est signalée et nommée, testée.
- [ ] « Existe » = présence de fichier sous une racine **injectée** (aucune lecture du `PATH`).
- [ ] Le contrôle est une **extension de `ezk-chef check`**, pas un vérificateur neuf.
- [ ] Lecture seule : le contrôle ne modifie aucun fichier.
- [ ] Gate locale verte.

## Comment vérifier

- Sur une fixture : une recette dont le `source:` pointe un dossier supprimé → `ezk-chef check` la
  signale, nomme la recette et le chemin fautif.
- Une recette dont le `source:` résout bien → aucun signal, rien d'autre n'est touché.
- `git status` propre après le contrôle (lecture seule).

## Suite

- **Le cas inverse « installé mais non déclaré »** (un outil présent sous le projet que personne n'a
  déclaré en recette) **n'entre pas dans cette fiche.** Raison : « un outil non déclaré » n'a pas de
  frontière testable tant qu'on n'a pas défini ce qui compte comme outil. Le poser ici rendrait un
  critère d'acceptation invérifiable et bloquerait la DoR pour rien. C'est un cadrage à part (sans
  doute un spike), à ouvrir si le besoin se présente — pas un oubli.

## Notes / décisions

- **Origine** : critère de dérive de la fiche
  [Découvrir les recettes (`ezk recipes`)](done/20261023120000001_declarer-outils-recettes-methodes-projet.md),
  différé à la livraison du POC `ezk recipes` (2026-10-28, revue `ezk-reviewer` GO). Séparé pour que
  la découverte ship proprement.
- **Décision de structure (grooming 2026-10-28)** : maison = `ezk-chef check`, pas `ezk law doctor`.
  Motif : la dérive d'une recette est une question de recette (le pointeur vers une implémentation
  réelle), domaine propre de `ezk-chef` ; `law doctor` ne connaît que la loi déployée.
- **Périmètre resserré** : la fiche ne garde que la dérive **déterministe** — « déclaré, absent ».
  Le cas « installé, non déclaré » part en `## Suite` (ci-dessus), faute de frontière testable.
- La minceur de preuve (un seul cas moteur) ne bloque pas : déclarer et contrôler une recette est
  bon marché, c'est ce qui rend la découverte fiable (règle `agent-ops/preuve-mince-question-pas-veto`,
  amendement [ADR-0013](../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md)).
