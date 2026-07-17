---
id: 0064
title: Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible »)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0064 — Sprint intake : DoR & santé du backlog

## Contexte / Problème

Friction née du **premier self-host** (session 2026-07-16) : en voulant piloter par sprint
**en journée** (mode moniteur, pas la nuit), le PO constate que l'intake d'`ezk-sprint`
(étape 0, `products/mega-city/skills/ezk-sprint/SKILL.md:71`) se réduit à *« prends LA
prochaine fiche prioritaire »*. Manque toute la couche **amont d'un vrai début de sprint** :

1. **Grooming / readiness** : quelles fiches respectent une **DoR** (Definition of Ready)
   **fixée par des règles d'équipe** (pas au doigt mouillé) ?
2. **Priorisation** puis **sprint planning** (constituer un lot de stories).
3. **Indicateur de santé du backlog** — *anticiper* : combien de features au total,
   **combien prêtes, combien pas prêtes**.
4. Ces métriques doivent apparaître **dans le résultat du prompt** ET être **émises comme
   messages de monitoring** (= le contrat de supervisabilité — l'app moniteur les affiche).
5. Un **garde** : pouvoir dire *« on ne peut pas faire de sprint : pas (assez) de features
   prêtes »* au lieu de démarrer à vide.
6. *Un jour* : des **seuils** qui signalent *« il faut penser à groomer »*.

> C'est un **gros sujet** (dixit PO) — et c'est aussi la **démonstration live de la boucle
> Sujet A** : la 1ʳᵉ friction du self-hosting devient un item d'amélioration de la méthode
> (cf. [0063 ezk-retro](0063-ezk-retro-ceremonie-auto-amelioration.md)).

## Proposition

À groomer. Pistes (composent l'existant, ne réinventent rien) :

- **DoR = une règle d'équipe** dans `rules/` — critères observables de « fiche prête »
  (problème/valeur clairs, critères d'acceptation testables, dépendances connues…). Évolutive
  via `ezk-retro` (0063).
- **Intake enrichi** d'`ezk-sprint` (ou skill `ezk-planning` dédié — à trancher) : classe les
  fiches du backlog par la DoR, compte **total / prêtes / pas-prêtes**, priorise, planifie un lot.
- **Émission** d'un événement `backlog.health {total, ready, not_ready, by_priority…}` dans le
  **journal de supervisabilité** → l'app moniteur (aveugle à la méthode) l'affiche ; et la même
  synthèse **dans le résultat du prompt**.
- **Garde d'intake** : `ready < seuil` ⇒ **refuse le sprint** avec un message clair
  (« groomez d'abord »). En termes de supervisabilité : un état/escalade « pas de travail prêt ».
- **Futur** : seuils → signal *« temps de groomer »* (relie l'auto-amélioration / Sujet B, ou
  simple alerte de flux).

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Métriques de FLUX / santé du backlog** — distinctes des 2 axes d'[ADR-031](../../../docs/adr/ADR-031-deux-axes-de-validation.md)
  (Axe 1 « le produit tourne ? », Axe 2 « la méthode est bonne ? ») : ici c'est la santé du
  **backlog**, en amont du sprint.
- **Non bloquant** pour construire une fiche **déjà prête** (ex. 0063) : ce sujet compte quand
  il y a un **stock** à trier/anticiper.
- Compose : `ezk-sprint` (intake `SKILL.md:71`), `ezk-backlog` (statuts, `list`), `rules/` (la
  DoR), le contrat de supervisabilité (event `backlog.health` → app moniteur), `ezk-retro`
  (0063, fait évoluer la DoR/les règles).
- Origine : session 2026-07-16 (premier self-host — 1ʳᵉ friction). Priorité P2 à confirmer au grooming.
