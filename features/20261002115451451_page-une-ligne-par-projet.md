---
id: "20261002115451451"
title: "Une page d'accueil : une ligne par projet (config, fiches prêtes, session active, dernier run)"
type: feature
priority: P3
product: mega-city
milestone: cockpit
version:
labels: [ezk-map, supervision]
status: idea
pr:
evidence:
created: 2026-10-02
---

# 20261002115451451 — Une page d'accueil : une ligne par projet

**En clair.** Idée à mûrir : une page d'accueil qui montre tous tes projets d'un coup, une ligne
chacun. Pour chaque projet : sa config, ses fiches prêtes, sa session active, son dernier run.
C'est le coup d'œil du matin, avant d'entrer dans le détail d'un projet. Le PO ne sait pas encore
si c'est son usage : on la garde pour ne pas la perdre.

## Contexte / Problème

- Le 2026-10-02, le PO demande « une vision claire d'où en est chaque projet ».
- Une liste de projets existe déjà dans le Moniteur de supervision
  ([onglet « Projets » dans le Moniteur](done/0062-onglet-projets-moniteur.md)) : méthode et
  version, chemin, activité. Elle ne montre ni la config ni le backlog.
- Le menu de projets du cockpit
  ([un seul tableau de bord pour tous tes projets](done/20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md))
  pose la liste. Cette idée l'enrichit d'un résumé par projet.

## Proposition

Direction, à cadrer au grooming. Sur la liste des projets du cockpit, une ligne par projet :

- la config : PR, CI et revue Codex allumées ou non ;
- le nombre de fiches prêtes, et la prochaine à tirer ;
- la session active, s'il y en a une ;
- le dernier run : sa date, les fiches livrées.

## Critères d'acceptation

- [ ] À définir au grooming, quand le PO connaîtra son usage.

## Comment vérifier

À définir avec les critères.

## Notes / décisions

- **Jalon `cockpit`, sans version** : liée au cockpit, pas planifiée. Elle vient après le menu de
  projets, dont elle réutilise la liste.
- **Suite de** [onglet « Projets » dans le Moniteur](done/0062-onglet-projets-moniteur.md).
- Créée le 2026-10-02, P3 (PO).
