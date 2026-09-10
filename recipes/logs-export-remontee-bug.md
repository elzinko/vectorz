---
id: "20260910211134049"
title: Logs applicatifs exportables + remontée de bug avec logs joints
makes: Un fichier de logs applicatif (avec rotation) et un bouton « remonter un bug » qui joint automatiquement les derniers logs, la version et l'info système
source: ~/git/bacasable/muti # implémentation prouvée (Electron+Vue)
composes: []
status: draft
home: central
created: 2026-09-10
updated: 2026-09-10
---

## En clair

Une app sans logs est difficile à débugger : quand un utilisateur signale un bug,
on n'a pas le contexte technique. Cette recette ajoute deux choses. D'abord un
fichier de logs sur disque, horodaté, avec rotation (taille max, quelques fichiers
gardés). Ensuite un bouton « remonter un bug » qui joint tout seul les dernières
lignes de logs, la version de l'app et l'info système, et crée un rapport prêt à
traiter.

Déclencheur : la passe de test de samplerz (2026-09-10). Débugger les échecs de
téléchargement à l'aveugle a montré le manque. muti a déjà le mécanisme complet.

## Le concept (mécanisme + schéma)

    l'app écrit ───► fichier de logs {userData}/logs/app.log  (append + rotation)
                          │
    clic « remonter un bug »
                          │  lit les N dernières lignes
                          ▼
    collecte { logs, version, info système, capture ? }
                          │  POST
                          ▼
    serveur ──► crée une issue GitHub (au nom du dev)
             └► logs en gist secret, liés dans l'issue

## Exemples pour goûter (référence — muti, prouvé)

Racine : `~/git/bacasable/muti` (app `apps/desktop`, Electron + Vue)

Fichier de logs (écriture + rotation + IPC) :
- `apps/desktop/app/main.js:577-643` — `getLogPath` `{userData}/logs/muti.log`, rotation 2 Mo / 2 fichiers, IPC append/read

Remontée de bug (collecte + envoi) :
- `apps/desktop/web/src/components/tracking/ReportBugButton.vue:40-77` — collecte logs (500 dernières) + version + système
- `apps/desktop/web/src/components/ui/ReportBugModal.vue:218-265` — POST `{ title, body, labels, logs, screenshot }`
- `apps/website/api/report-bug.js:157-176` — crée une issue GitHub + logs en gist secret

## Les étapes (playbook)

À COMPLÉTER au grooming. Squelette :

1. Écrire un logger fichier (rotation) dans le backend / process principal.
2. Exposer une lecture des N dernières lignes.
3. Bouton UI « remonter un bug » : collecte logs + version + système.
4. Endpoint serveur : issue GitHub + logs en pièce jointe (gist / blob).

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : `~/git/bacasable/muti` — voir « Exemples pour goûter » ci-dessus.
Cible d'application : **samplerz** (backend Python FastAPI + UI web statique).
Adapter le logger au backend Python ; l'endpoint de rapport peut viser une issue GitHub.

## Statut de cette recette

Capturée le 2026-09-10 (déclenchée par la passe de test samplerz : besoin d'un
fichier de logs pour débugger les échecs yt-dlp, puis d'une remontée de bug façon
muti). Statut **draft — à écrire** : le mécanisme muti est identifié et pointé, le
playbook réutilisable reste à rédiger et à prouver sur un 2e projet (samplerz).
Fiches samplerz liées : `app_debug_log_file`, `log_export_bug_report`.
