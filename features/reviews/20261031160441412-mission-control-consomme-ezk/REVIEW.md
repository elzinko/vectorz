---
schema: method-review@0.1
fiche: "20261031160441412"
branch: "feat/20261031160441412-mission-control-consomme-ezk"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "0de3c2ae"
status: approved
created: "2026-11-01"
---

# Review — 20261031160441412

## Résumé

Revue adverse ezk-reviewer en deux passes. Première passe NO-GO : la fenêtre d'une fiche plantait, car le contrat envoie chaque critère en objet {texte, coche} et la page l'affichait tel quel ; le test qui aurait dû le voir comparait la sortie à l'entrée. Aussi : versions passées à l'envers, compteurs à zéro dans le choix du projet, un clamp qui masquait une incohérence. Tout corrigé, avec des tests prouvés rouges sans le correctif. L'essai réel dans la page a trouvé un défaut de plus, corrigé : la page n'interrogeait le serveur qu'une fois et restait figée en chargement. Seconde passe : GO, six critères prouvés, dont deux rejoués sur les vraies données d'ezk. Le cast as unknown as reste une frontière de confiance assumée sur un contrat versionné.

## Rendus

N.A.

## Matrice de validation

Build cop1=vert ; Tests cop1 (689)=vert ; Tests web (103) + typecheck=vert ; Gate de la méthode (2336)=vert ; Lint=11 erreurs antérieures hors des fichiers de la story ; Essai réel=326 livrées, fenêtre de fiche, mention bloquée ; Revue adverse=GO ; Before/after=vue d'ensemble de vectorz

## À tester

pnpm cop1:dev puis http://localhost:5273 : 326 fiches livrées sur vectorz ; ouvrir une fiche : critères en texte ; fiche bloquée : mention bloquée ; supervision.ezk_command: ["false"] dans la config : plan indisponible

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
