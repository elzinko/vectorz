---
id: "20261010100030780"
title: "Le cockpit ouvre le détail d'une fiche du projet choisi (fin des 404 cross-projet)"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [ezk-map, cockpit]
status: shipped
pr: "local (bc8a0316)"
evidence: auto
created: 2026-10-10
---

# 20261010100030780 — Le cockpit ouvre le détail d'une fiche du projet choisi

**En clair.** Dans le tableau de bord, quand tu choisis un autre projet que la méthode (samplerz,
muti…), les vues montrent **ses** fiches. Mais cliquer une de ces fiches donne une **404** : le
serveur ne sait servir le fichier `.md` d'une fiche que depuis vectorz (la méthode), pas depuis le
dépôt du projet choisi. Cette fiche corrige ça.

**Si tu arrives frais.** Le *cockpit*, c'est la barre « Projet » du tableau de bord (`ezk dashboard`)
qui laisse choisir quel projet on regarde. Le *serveur*, c'est `ezk-map` (`bin/ezk-map.ts`), qui
sert les pages et les données au navigateur. Une *fiche* est une feature ou un bug du backlog, un
fichier `features/<id>_<slug>.md`.

## Contexte / Problème

- Le cockpit (ADR-0062) a **deux racines** : les **pages** viennent toujours de la méthode
  (`diagrams/`), les **données** (fiches, pouces) du **projet choisi**.
- Mais le détail d'une fiche est servi comme un **fichier statique**, et `ezk-map` ne sert les
  fichiers que sous la racine de la méthode (`REPO_ROOT`). Une fiche d'un autre projet n'y est pas →
  **404**. Exemple constaté le 2026-10-10 : projet samplerz/muti choisi, clic sur
  `20261001125812000_notarize_embedded_python_runtime.md` → 404.
- Ce n'est **pas** propre à la vue « process » : le **board** lie ses fiches de la même façon
  (`a.href = '../../' + f.file`, `diagrams/avancement/board.html`). La limite est **partagée** par
  toutes les vues à fiches. Elle ne gêne pas tant qu'on regarde vectorz (ses fiches s'ouvrent).
- La route du pouce (`POST /api/verdict`) sait déjà viser le dossier du projet choisi
  (`dataTarget`) : le modèle existe, il n'est juste pas appliqué à la **lecture** d'une fiche.

## Proposition

Servir le détail d'une fiche depuis la racine du **projet choisi**, par une route dédiée et gardée,
sur le patron de `dataTarget` déjà utilisé pour les données et le pouce.

- Une route `GET /fiche?file=<chemin relatif>` (ou équivalent) qui résout le chemin **sous la racine
  du projet choisi** (cookie du cockpit), avec la même garde de traversée que le service statique
  (jamais hors de cette racine), et refuse proprement un projet inconnu/illisible (comme les vues).
- Les coques de vue (board, process, runs…) lient la fiche par cette route plutôt que par
  `../../<file>`. Une seule brique, toutes les vues en profitent.
- Projet par défaut (la méthode) : comportement inchangé.

## Critères d'acceptation

- [x] Projet autre que la méthode choisi dans le cockpit : cliquer une fiche de ce projet **ouvre
      son détail** (plus de 404). *Prouvé : samplerz choisi → fiche `20261001125812000` ouverte (HTTP 200).*
- [x] La résolution du chemin reste **gardée** : aucune lecture hors de la racine du projet choisi
      (test de traversée dans `resolveFichePath`).
- [x] Projet inconnu / illisible / d'une autre méthode : refus lisible (le refus de `dataTarget` est
      repassé tel quel), pas de 404 trompeuse ni de contenu inventé.
- [x] Projet par défaut (la méthode) : le détail s'ouvre comme avant (HTTP 200 sur une fiche vectorz).
- [x] Le board ET la vue process passent par la même brique : le serveur sert tout chemin `features/`
      depuis la racine du projet choisi, donc les liens `../../features/<file>` existants des deux vues
      fonctionnent sans changement de coque.

## Comment vérifier

```bash
# Depuis vectorz, lancer le tableau de bord puis choisir un autre projet au registre.
pnpm --dir products/mega-city ezk:map
# - vue process ou board : choisir samplerz/muti dans la barre « Projet »
# - cliquer une fiche → son détail s'ouvre (HTTP 200), pas de 404
# - vérifier qu'un chemin piégé (../) hors de la racine du projet est refusé
pnpm --dir products/mega-city test   # la garde de traversée et la résolution par projet sous test
```

## Notes

Découverte pendant le sprint de la vue process
([20261002115451315](20261002115451315_fiches-sur-le-process-avec-session.md), 2026-10-10) : la vue
reproduit fidèlement le comportement du board, 404 cross-projet compris. Le PO a tranché : ficher le
chantier cockpit à part plutôt que de le traiter dans la fiche de la vue.
