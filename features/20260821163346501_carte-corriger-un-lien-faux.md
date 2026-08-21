---
id: "20260821163346501"
title: Corriger un lien faux depuis la carte, et que ça retombe dans les fichiers
type: feature
priority: P2
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---
# Corriger un lien faux sans repasser par une relecture complète

## En clair

Quand on repère un lien faux sur la carte, il faut pouvoir le corriger — et que la
correction **arrive dans les fichiers**, pas seulement dans le dessin. Sinon la prochaine
régénération le fait revenir.

## Contexte / Problème

C'est arrivé pendant la session du 2026-08-20 : la carte affichait un orchestrateur
composant un outil que son propre playbook dit ne **jamais** invoquer. Corriger le dessin
n'aurait servi à rien — le lien venait d'une liste écrite à la main dans la page.

Une fois les liens adossés aux fichiers, le problème se déplace : un lien faux signifie
soit une **déclaration fausse** dans un fichier, soit un **manque** de déclaration.

## Proposition

À groomer. Ce que la fiche doit produire : le **chemin de correction**, du constat au
fichier.

- Depuis la carte, savoir **quel fichier** porte le lien fautif (dépend de la fiche
  « provenance »).
- Distinguer les deux cas : *déclaré à tort* (retirer la déclaration) vs *dessiné sans
  déclaration* (c'est la carte qui invente — le vrai bug).
- Vérifier après coup que le lien a **disparu du graphe généré**, pas seulement du dessin.
- Leçon à graver : ne déclarer que l'**inconditionnel**. Un besoin occasionnel documenté
  comme requis fabrique de fausses alertes — erreur commise trois fois le 2026-08-20.

## Critères d'acceptation

- [ ] Depuis un lien affiché, on atteint le fichier qui le déclare.
- [ ] Retirer la déclaration fait disparaître le lien **de la carte régénérée**.
- [ ] Un lien dessiné sans déclaration est traité comme un **défaut**, pas comme un détail.
- [ ] La correction laisse une trace (quel lien, pourquoi il était faux).

## Comment vérifier

Saboter : déclarer un lien faux, régénérer, le voir apparaître ; le retirer, régénérer,
le voir disparaître. Le cycle complet doit tenir en une minute.
