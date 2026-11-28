---
id: "20261128093846629"
title: "La page Annuaire de la méthode : compétences, agents, règles, profils, commandes, glossaire"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control, annuaire]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846629 — La page Annuaire de la méthode : compétences, agents, règles, profils, commandes, glossaire

**En clair.** Dans le menu, « Annuaire de la méthode » est grisé : la page n'existe pas. La maquette la
dessine avec six onglets. On la construit avec ce que la méthode publie déjà. Ce qu'elle ne publie pas
encore s'affiche « non publié ».

**Si tu arrives frais.** Mission control est l'écran de cop1. Il lit ce que la méthode publie en JSON et
n'invente aucune donnée (ADR-086). L'Annuaire est le rayon de bibliothèque de la méthode : tout ce qui
existe. La page Loi, elle, ne montre que ce qui s'applique au projet. La maquette est la référence d'écran
du PO : page « Annuaire de la méthode ».

## Contexte / Problème

Le PO a relu la maquette en novembre. Son groupe « Global » contient deux entrées : Projets et Annuaire de
la méthode. Dans l'app, l'entrée Annuaire est grisée avec la mention « À venir ». Or la méthode publie déjà
de quoi remplir la page :

- `ezk help --json` : 74 commandes, 26 compétences et 8 agents, avec leur description ;
- `ezk law show --json` : 96 règles, et pour chaque objet les règles qu'il applique.

Demande du PO du 2026-11-28 : « tendre vers ce qui a été défini dans la maquette ».

## Proposition

1. **Une route de lecture au daemon** relaie `ezk help --json`, sur le modèle des relais existants
   (`/api/law/<projet>`). Un test fait passer l'exemple rangé du contrat et vérifie que chaque champ en
   ressort.
2. **La page Annuaire**, titre « Annuaire de la méthode mega-city », avec six onglets et leur compte :
   Compétences, Agents, Règles, Profils, Commandes, Glossaire.
   - **Compétences** : recherche ; colonnes « Compétence (dans Claude Code : /commande) », « Ce qu'il fait »,
     « Lit ses règles au démarrage », « Règles appliquées ».
   - **Agents** : colonnes « Agent », « Rôle », « Lit ses règles », « Convoqué par ».
   - **Règles** : titre « Toutes les règles de la méthode », ligne de comptes « N au catalogue · N
     s'appliquent à ‹projet› → sa page Loi · N ne s'appliquent nulle part » ; filtres par effet (lues
     partout, au démarrage, sans effet, orphelines), par paquet et par catégorie ; colonnes « Règle »,
     « Niveau », « Catégorie », « Effet aujourd'hui », « Paquets », « Appliquée par », « Vérifiée par ».
   - **Profils** : colonnes « Profil », « Hôte cible », « Règles », « Paquets · agents · skills », « Lié à ».
   - **Commandes** : filtre par domaine, recherche, colonnes « Commande », « Ce qu'elle fait », « Écrit le
     projet », « Script » ; un clic sur une commande ouvre son détail dans une fenêtre.
   - **Glossaire** : les termes publiés par la méthode.
3. **La santé de la méthode** : une pastille « N avertissements » dans l'en-tête ouvre une fenêtre qui les
   liste. Les avertissements viennent des comptes publiés (règles sans effet, règles orphelines) et du
   contrôle du graphe quand il est publié.
4. **L'entrée du menu devient active.** La page porte aussi un lien « Carte de la méthode » vers la carte
   zoomable existante.
5. **Jamais de valeur inventée** : une colonne ou un onglet que la méthode ne publie pas dit « non publié ».

Hors périmètre : les pages d'une compétence, d'un agent et d'une règle (fiche sœur) ; la publication du
glossaire et des profils par la méthode.

## Critères d'acceptation

- [x] L'entrée « Annuaire de la méthode » du menu ouvre la page ; elle n'est plus grisée.
- [x] Les six onglets existent, chacun avec son compte quand la méthode le publie ; l'onglet Compétences
  s'ouvre par défaut.
- [x] Les onglets Compétences, Agents, Règles et Commandes listent les objets publiés, avec les colonnes
  de la maquette ; la recherche et les filtres réduisent la liste.
- [x] Un clic sur une commande ouvre son détail : domaine et verbe, ce qu'elle fait, script lancé, écrit
  le projet ou non.
- [x] La pastille d'avertissements ouvre la liste des avertissements ; sans avertissement, pas de pastille.
- [x] Le lien « Carte de la méthode » ouvre la carte zoomable.
- [x] Une donnée non publiée s'affiche « non publié », jamais un zéro ni un texte inventé.
- [x] Le relais du daemon est couvert par un test qui fait passer l'exemple du contrat.
- [x] Capture avant / après jointe.

## Comment vérifier

- vue Annuaire : http://localhost:5274 → menu Annuaire de la méthode
- `pnpm --dir products/cop1/packages/web exec vitest run`
- `pnpm --dir products/cop1/packages/app exec vitest run`
- Preuve avant / après (annuaire) : [avant](../docs/pr-evidence/20261128093846629/annuaire-before.jpg) → [après](../docs/pr-evidence/20261128093846629/annuaire-after.jpg)

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Revue adverse (ezk-reviewer) : GO après une correction (port de test en double). Écarts à la maquette, faute de publication : un seul avertissement de santé au lieu de cinq, glossaire « non publié », profils réduits au nom et au compte de règles, pas de « scripts internes ».
