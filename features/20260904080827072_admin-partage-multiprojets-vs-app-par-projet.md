---
id: "20260904080827072"
title: "Un seul tableau de bord pour tous tes projets — choisir le projet, voir sa config"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, supervision]
status: idea
pr:
evidence:
created: 2026-09-04
---

# 20260904080827072 — Un seul tableau de bord pour tous tes projets

**En clair.** Aujourd'hui, le tableau de bord ne lit qu'un projet à la fois : pour en changer, il
faut le relancer. Cette fiche en fait une seule page web pour tous tes projets. Tu choisis le
projet dans un menu, puis tu vois ses fiches et sa config. Un serveur, un port, un registre de
projets.

**Si tu arrives frais.** Le *tableau de bord* est la page web locale de la méthode
(`ezk dashboard`) : board des fiches, pilotage, runs, carte. Le *Moniteur* est une autre page web
locale : celle de la supervision des runs.

## Contexte / Problème

Le PO pilote plusieurs projets avec la méthode : vectorz, samplerz, muti… Le 2026-10-02, il
demande « une vision claire d'où en est chaque projet » : choisir un projet, voir sa config, voir
ses fiches.

Les morceaux existent, mais en deux moitiés qui ne se parlent pas.

- **Le tableau de bord sait lire un autre projet, mais un seul par lancement.**
  `ezk --root <projet> dashboard` fixe le projet au démarrage
  ([pouvoir pointer les vues sur un autre projet](done/20260826173221323_racine-parametrable-des-vues.md)).
  Il n'a pas de menu de projets.
- **Le Moniteur liste déjà les projets**, une ligne chacun. Il lit le registre
  `supervision.registry.yaml`
  ([onglet « Projets » dans le Moniteur](done/0062-onglet-projets-moniteur.md),
  [registre de supervision](done/0082-registre-supervision-cote-vectorz.md)).
  Mais il ne montre ni les fiches ni la config. Seul vectorz y est inscrit.
- **La config d'un projet ne se lit que dans le terminal** : `ezk config` (PR, CI, revue Codex),
  `ezk rules show`, `ezk dor show`. Et `ezk config` ne sait pas viser un autre projet. Elle n'est
  pas déclarée « commande projet » dans le manifeste, contrairement aux deux autres (constaté le
  2026-10-02).

## Proposition

**Déjà tranché par le PO le 2026-10-02 : global, pas une app par projet.** Une app par projet
multiplierait les ports et n'offrirait aucune vue d'ensemble. C'était la question d'origine de
cette fiche.

**Reste à trancher au grooming, avec l'architecte : quelle page devient le cockpit ?**

- **A — le tableau de bord.** Il a déjà le board, le pilotage, les runs, la carte et les sessions.
  Il lui manque le menu de projets.
- **B — le Moniteur.** Il a déjà la liste des projets et leur activité. Il lui manque tout le reste.
- **C — fusionner les deux.**

Dans tous les cas, on garde **un seul registre de projets** : celui de la supervision.

Ensuite, dans la page retenue :

1. **Un menu de projets**, lu dans le registre. Choisir un projet recharge les pages sur ses
   données, sans relancer le serveur. Le registre accepte d'autres méthodes que mega-city
   (`method: bmad`, par exemple). Le cockpit ne sait pas lire leurs fichiers : un tel projet reste
   dans la liste, avec l'état « méthode non prise en charge », sans fiches ni config inventées.
2. **Une page « config »** du projet choisi, en lecture seule : les interrupteurs GitHub (PR, CI,
   revue Codex), ses règles propres, ses critères de « prête ».
3. **`ezk config` devient une commande projet** : `ezk --root <projet> config` lit la config de
   n'importe quel projet, comme `ezk rules show` le fait déjà.

## Critères d'acceptation

- [ ] Un ADR consigne la décision : global retenu, la page retenue (A, B ou C) et pourquoi, le
      registre unique.
- [ ] La page liste les projets du registre. Choisir un projet affiche **ses** fiches, sans
      relancer le serveur.
- [ ] Un projet du registre introuvable sur le disque s'affiche comme tel. La page ne tombe pas.
- [ ] Un projet du registre dont la méthode n'est pas mega-city apparaît avec l'état « méthode non
      prise en charge ». Le cockpit n'affiche pour lui ni fiches ni config.
- [ ] La page « config » montre, pour le projet choisi, les mêmes valeurs que `ezk config`,
      `ezk rules show` et `ezk dor show`. Elle n'écrit rien.
- [ ] `ezk --root <projet> config` affiche la config d'un autre projet.
- [ ] Inscrire un projet avec `ezk supervision registry-add` suffit pour qu'il apparaisse.
- [ ] Le serveur n'écoute que sur la boucle locale (127.0.0.1).

## Comment vérifier

```bash
# inscrire un deuxième projet dans le registre (depuis le dépôt vectorz)
ezk supervision registry-add samplerz <chemin-de-samplerz>
# ouvrir la page retenue par l'ADR (ici, le tableau de bord)
ezk dashboard
# → choisir samplerz dans le menu : ses fiches s'affichent ; ouvrir « config »
# → comparer avec le terminal :
ezk --root <chemin-de-samplerz> config
ezk --root <chemin-de-samplerz> rules show
ezk --root <chemin-de-samplerz> dor show
```

## Glossaire

- `registre` — le fichier `supervision.registry.yaml` : la liste des projets suivis (id, chemin,
  méthode).
- `commande projet` — une commande `ezk` marquée `project: true` dans
  `products/mega-city/ezk-manifest.yml`. Elle sait viser un autre projet avec `--root`.

## Notes / décisions

- **Jalon `cockpit`, version V0.6** (décision PO du 2026-10-02 ; la V0.5 est « le sprint au lot »). Les fiches du cockpit se lient par
  ce jalon, pas par une fiche chapeau. Fiche sœur :
  [voir les fiches posées sur le schéma du process, avec leur session](20261002115451315_fiches-sur-le-process-avec-session.md).
  Idée liée, sans version :
  [une page d'accueil, une ligne par projet](20261002115451451_page-une-ligne-par-projet.md).
- **Historique.** Créée le 2026-09-04 comme question d'archi ouverte, « admin ezk : partagé
  multi-projets vs une app par projet — ports, isolation » (type chore, P3). Née du chantier
  [ezk multi-client](20260901173549334_ezk-multi-client-cursor-modeles-par-hote.md). Parkée par le
  PO le 2026-09-04. Réveillée le 2026-10-02 : la question est tranchée (global), la fiche devient
  une feature en P1.
- **Prior art** : la chaîne de supervision (daemon + web + registre) gère déjà du multi-projet.
  Voir le [contrat de supervisabilité](0029-contrat-supervisabilite-v02-differes.md).
