---
id: 0063
title: Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes)
type: feature
priority: P2
product: vectorz
epic:
status: in-progress
ready: 2026-08-03
pr:
created: 2026-07-26
---

## Contexte / Problème

Brancher un projet est aujourd'hui une **commande CLI** (`supervision:link`, fiche 0094).
Demande PO (2026-07-26) : le faire **depuis le Moniteur** — « on clique *ajouter projet*, on
sélectionne un répertoire via une modale (OSX), puis tout est installé via le Moniteur ».

C'est cohérent avec l'invariant **anti-falsification** (fiche 0050/0082) : c'est **l'humain**
qui ancre un projet, jamais le modèle. Le geste d'ancrage a juste besoin d'une **UI**.

## Valeur

- Ancrer un projet **sans terminal** — le geste devient un clic, pas une commande à connaître.
- Le superviseur (déjà un logiciel qui tourne) **pilote l'install**, au lieu que l'utilisateur
  assemble `.mcp.json` + `watch_roots` à la main.

## Proposition (POC 2026-08-03)

Bouton **« Ajouter un projet »** dans l'onglet Projets (0062).

1. **Chemin** — collage d'un chemin absolu (pas de dialog OSX natif en web : tranché
   pour le POC ; dialog natif = suite).
2. **Mode** :
   - **Méthode seule** → spawn `bind_command` (lawgiver bind) — pas de MCP, pas de registre.
   - **Supervisé** → spawn `link_command` (`supervision:link`) + `registry_add_command`
     (`supervision:registry-add`) — redémarrage daemon requis pour les watchers.
3. Le daemon **ne réimplémente pas** link : il spawn les CLIs siège (même pattern qu'ADR-035).

## Critères d'acceptation

- [x] Formulaire « Ajouter un projet » (chemin absolu + mode + id/méthode) déclenche
      `POST /api/supervision/projects/anchor` (geste humain UI).
- [x] Mode **méthode seule** : spawn `bind_command` ; pas d'entrée registre / pas de link.
- [x] Mode **supervisé** : spawn link + registry-add ; projet visible dans Projets ;
      message de redémarrage daemon pour activer le watch.
- [x] `supervision:link` / `supervision:registry-add` restent le socle — le daemon spawn,
      ne duplique pas la logique.
- [x] Capacité dormante si commandes absentes de `cop1.config.yaml` (409 + marche à suivre).

## Notes

- Pendant *écriture* de **0062** (lister) ; shippables séparément.
- Dialog dossier OSX natif reporté (suite) — POC = collage chemin.
- Groomé 2026-08-03 — DoR problème / valeur / AC OK.
