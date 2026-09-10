---
id: "20260910211134143"
title: Afficher la version dans l'UI + menu de bascule licence/Pro (dev)
makes: Un badge de version à droite du titre (« dev » en local, sinon « vX.Y.Z ») et, en dev, un clic qui ouvre un menu pour basculer l'état de licence Pro/gratuit
source: ~/git/bacasable/muti # implémentation prouvée (Electron+Vue)
composes: []
status: draft
home: central
created: 2026-09-10
updated: 2026-09-10
---

## En clair

Deux besoins qui vont ensemble. D'abord afficher le numéro de version de l'app dans
l'interface, à droite du titre — et « dev » quand on tourne en local. Ensuite, en
local seulement, rendre ce badge cliquable pour ouvrir un petit menu qui bascule
l'état de licence (passer Pro ou revenir gratuit) sans manip externe. C'est un outil
de test du gating, pas une vraie activation.

Déclencheur : demande sur samplerz (2026-09-10). muti a déjà le badge version et le
panneau dev déclenché par ce clic.

## Le concept (mécanisme + schéma)

    version lue (build ou paquet) ──► badge à droite du titre
        local ? ──► « dev »   (badge cliquable)
        sinon   ──► « vX.Y.Z » (non cliquable)
             │ clic (dev only)
             ▼
    menu dev ──► bascule l'état de licence en mémoire (Pro / gratuit) pour tester le gating

## Exemples pour goûter (référence — muti, prouvé)

Racine : `~/git/bacasable/muti` (app `apps/desktop`, Electron + Vue)

Badge de version :
- `apps/desktop/web/src/components/ui/VersionBadge.vue:7-41` — « dev » sinon « v{version} »
- `apps/desktop/web/src/App.vue:449-465` — placement à droite du titre
- `apps/desktop/app/main.js:459-461` — version lue du package.json (`app.getVersion()`)

Clic dev → menu / bascule licence :
- `apps/desktop/web/src/App.vue:453-465` — clic sur le badge (dev) ouvre le panneau
- `apps/desktop/web/src/components/ui/DemoDevButtons.vue:92-138` — boutons de simulation (Sim Demo / Clear…)
- `apps/desktop/app/license/license-manager.js` — état de licence DEMO/VALID, simulation

## Attention — variante selon le produit

muti a une notion de « session » (la démo se met en pause périodiquement, durée
limitée). samplerz **N'A PAS** ça : c'est un simple free/Pro. La recette doit donc
séparer clairement le badge + menu (réutilisable) de la mécanique de session (propre
à muti). Pour la partie modèle Pro / clé de licence, composer avec la recette
`plan-distribution-app` (boutique Lemon Squeezy, validation de clé).

## Les étapes (playbook)

À COMPLÉTER au grooming. Squelette :

1. Exposer la version au frontend (variable de build ou endpoint).
2. Badge à droite du titre ; « dev » en local, cliquable seulement en dev.
3. Menu dev : bascule l'état de licence en mémoire.
4. Brancher sur le vrai gating produit (sans dupliquer les règles métier).

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : `~/git/bacasable/muti` — voir « Exemples pour goûter ».
Compose : `recipes/plan-distribution-app.md` (modèle gratuit/Pro + clé de licence).
Cible d'application : **samplerz**. Fiches samplerz liées : `app_version_display`,
`dev_version_license_menu`.

## Statut de cette recette

Capturée le 2026-09-10 (déclenchée par une demande sur samplerz). Statut **draft —
à écrire** : mécanisme muti identifié et pointé ; playbook réutilisable à rédiger, en
tenant compte de la variante « sans session » de samplerz.
