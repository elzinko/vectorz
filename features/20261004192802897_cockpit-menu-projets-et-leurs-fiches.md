---
id: "20261004192802897"
title: "Cockpit : le tableau de bord liste tes projets et montre les fiches du projet choisi"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, supervision]
status: ready
pr:
evidence: before-after
created: 2026-10-04
split_from: "20260904080827072"
---

# 20261004192802897 — Cockpit : le tableau de bord liste tes projets et montre les fiches du projet choisi

**En clair.** Aujourd'hui, le tableau de bord ne lit qu'un projet à la fois : pour en changer, il
faut le relancer. Avec cette fiche, un menu liste les projets du registre. Tu en choisis un, et les
pages montrent ses fiches, sans relancer le serveur. Un projet que le cockpit ne sait pas lire
apparaît quand même, avec la raison.

**Si tu arrives frais.** Le *tableau de bord* est la page web locale de la méthode
(`ezk dashboard`, servie par `products/mega-city/bin/ezk-map.ts`) : board des fiches, pilotage,
runs, carte. Le *registre* est `supervision.registry.yaml` : la liste des projets suivis (id,
chemin, méthode). Un *pouce* 👍/👎 est le verdict qu'on pose sur une fiche depuis le board.

## Contexte / Problème

Deuxième des trois fiches nées du découpage de « Un seul tableau de bord pour tous tes projets »
(20260904080827072), décidé par le PO le 2026-10-04. Le PO pilote plusieurs projets avec la
méthode : vectorz, samplerz, muti. Le 2026-10-02, il demande « une vision claire d'où en est
chaque projet ».

- **Le tableau de bord sait lire un autre projet, mais un seul par lancement.**
  `ezk --root <projet> dashboard` fixe le projet au démarrage (`projectRootOrExit`). Les données,
  elles, sont déjà calculées à chaque requête pour une racine passée en argument
  (`dataViewForPath`). Le seul verrou : la racine est choisie une fois.
- **Le Moniteur liste déjà les projets**, mais il ne montre ni fiches ni config, et il vit dans un
  plugin hors de la méthode (ADR-0039).
- **Tous les projets ne rangent pas leurs fiches au même format** (constaté le 2026-10-03). vectorz
  et muti sont au format 5. whatsapp-mcp est au format 4 ; city-guided, claude-proxy,
  google-mcp-multi-account et whatsapp-group-mcp au format 2. samplerz range ses fiches en fichiers
  Gherkin `.feature`, que le tableau de bord ne sait pas lire.
- **Les pouces s'écrivent dans le projet de lancement.** L'ADR-0057 limite le tableau de bord à
  cette seule écriture, par identifiant validé.

## Valeur — ce que coûte de ne rien faire

- Savoir où en est un projet oblige à relancer le tableau de bord sur lui, ou à lire le terminal.
- Avec le menu, un coup d'œil suffit, tous projets confondus. C'est aussi le socle de la page
  « config » (fiche sœur 20261004192802964) et des réglages d'agents par projet.

## Proposition

```
registre (lu à chaque requête, jamais écrit)
        │  vectorz · muti · samplerz…
        ▼
tableau de bord ── menu : choisir un projet par son identifiant (jamais par un chemin)
        ├─ pages : les mêmes pour tous (elles viennent de la méthode)
        └─ données et pouces : ceux du projet choisi
```

1. **Un menu de projets**, lu dans le registre à chaque requête : un projet inscrit apparaît sans
   relancer le serveur. Le choix voyage avec la requête (lien ou cookie, tranché au build) ; le
   serveur le résout en chemin par le registre, et seulement par lui.
2. **Des états, au lieu de pages fausses** :
   - « introuvable » : le chemin du registre n'existe pas sur le disque ;
   - « méthode non prise en charge » : le registre dit une autre méthode que mega-city ;
   - « format de fiches non pris en charge » : pas de fiches au format de la méthode (samplerz) ;
   - « format en retard » : les fiches sont à une version ancienne du format, affichée.
3. **Les pouces s'écrivent dans le projet choisi**, et seulement là.
4. **Sans choix de projet**, le tableau de bord se comporte comme aujourd'hui.

## Critères d'acceptation

- [ ] La page liste les projets du registre. Choisir un projet affiche **ses** fiches, sans
      relancer le serveur.
- [ ] Sans choix de projet, le tableau de bord se comporte comme aujourd'hui : `--root`, puis
      `EZK_ROOT`, puis la méthode elle-même.
- [ ] Un identifiant de projet inconnu est refusé. Le serveur ne lit rien en dehors des projets du
      registre.
- [ ] Un projet du registre introuvable sur le disque s'affiche comme tel. La page ne tombe pas.
- [ ] Un projet du registre dont la méthode n'est pas mega-city apparaît avec l'état « méthode non
      prise en charge ». Le cockpit n'affiche pour lui ni fiches ni config.
- [ ] Un projet sans fiches au format de la méthode apparaît avec l'état « format de fiches non pris
      en charge ». Aucune fiche n'est inventée.
- [ ] Un projet dont les fiches sont dans une version ancienne du format affiche « format en
      retard » et cette version, au lieu de statuts faux.
- [ ] Un pouce posé sur une fiche du projet choisi s'écrit dans ce projet, et seulement là.
- [ ] Le serveur n'écoute que sur la boucle locale (127.0.0.1).

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts
# depuis le dossier principal de vectorz :
ezk supervision registry-add muti ~/git/bacasable/muti          # fiches au format 5
ezk supervision registry-add samplerz ~/git/samplerz            # fiches en Gherkin
ezk dashboard
# → le menu liste vectorz, muti et samplerz
# → choisir muti : ses fiches s'affichent
# → choisir samplerz : état « format de fiches non pris en charge »
# poser un pouce sur une fiche de muti :
ls ~/git/bacasable/muti/features/reviews/verdicts/   # le verdict est là
git status --porcelain features/reviews/verdicts/    # depuis vectorz → rien
```

- vue board : `http://127.0.0.1:<port>/` (avant : sans menu ; après : menu de projets, muti choisi)

Demander un projet inconnu au serveur : il refuse, sans rien lire. La forme exacte de la requête
dépend du mécanisme retenu au build.

## Dépendances externes

- **dépendance muti — accès constaté le 2026-10-04.** `~/git/bacasable/muti`, sur `main`, format 5.
- **dépendance samplerz — accès constaté le 2026-10-04.** `~/git/samplerz`, sur `main`, 141
  fichiers Gherkin `.feature`, sans `features/README.md` de format.

## Glossaire

- `registre` — `supervision.registry.yaml` : la liste des projets suivis (id, chemin, méthode).
- `format` — la version de rangement des fiches, `layout_version` dans `features/README.md`.
- `pouce` — le verdict 👍/👎 posé sur une fiche depuis le board, écrit sous
  `features/reviews/verdicts/`.

## Notes / décisions

- 2026-10-04 : née du découpage de 20260904080827072 (décision PO, run `ezk-product-build`), avec
  ses critères 2 à 8, 11 et 15. Dépend du socle (20261004192802828 : ADR et registre unique).
- Décisions héritées du grooming du 2026-10-03 : global, pas une app par projet ; le tableau de
  bord devient le cockpit (option A) ; samplerz est signalé « non pris en charge », sans plus.
- Vise les projets hôtes : règle `development/host-project-proof-before-ship`, la preuve se fait
  sur muti, samplerz ou le banc cop1-cobaye avant le ship.
- **Prête le 2026-10-04** (run `ezk-product-build` en mode auto, sans `--review`) : critères hérités
  du parent prêt, concurrence `ezk-pm` GO sur la porte « prête ».
