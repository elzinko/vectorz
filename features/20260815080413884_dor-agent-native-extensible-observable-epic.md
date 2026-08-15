---
id: "20260815080413884"
title: DoR agent-native — extensible par projet + readiness observable (épic)
type: epic
priority: P2
product: mega-city
status: todo
created: 2026-08-15
---

# DoR agent-native — extensible par projet + readiness observable

## Contexte / Problème

Session 2026-08-15 (audit méthode, PO) : « peut-on optimiser la DoR par les agents avant
de démarrer un sprint ? » — grooming / refinement / INVEST / DoR extensible par projet /
métriques de readiness.

**Constat de l'audit.** La machinerie scrum existe déjà et tourne : `groom`/`ready` (gate
DoR bloquant, [ADR-0016](../products/mega-city/docs/adr/0016-rituels-scrum-cycle-de-vie-backlog.md)),
auto-groom + `--check-ready` ([ADR-0028](../products/mega-city/docs/adr/0028-product-builder-auto-groom-ready.md)).
Mais deux trous :

1. **La DoR est figée** — 3 slots en dur (problème / valeur / critères) + 1 conditionnel
   (dépendances). Rien ne permet à un repo d'ajouter ses propres critères de « ready ».
2. **La readiness n'est pas observable** — `regen` compte `ready` dans le prompt, mais rien
   n'est émis au journal de supervision et aucune garde n'empêche un intake à sec. Preuve
   chiffrée le 2026-08-15 : **1 seule fiche `ready` sur 39 `todo`** — le débit de grooming
   est le goulot, et il est invisible.

**Thèse directrice (à graver dans ADR-0016).** Le gate DoR est le **contrat de
build-readiness falsifiable** dont un agent a besoin (on le garde), débarrassé de la
**cérémonie d'équipe humaine** (on la jette). En vocabulaire INVEST : la méthode garde
**V**aluable (slot valeur) + **T**estable (slot critères + plancher outcome-testable
d'ADR-0028) et largue **I / N / E / S** comme coordination humaine — SAUF deux propriétés
qui **re-gagnent** de la valeur en monde agent, mais reformulées :

- **Indépendance → sûreté de concurrence** : constructible dans un worktree isolé sans
  collisionner avec ce qui est en vol (le repo a un historique de collisions d'ids entre
  sessions parallèles).
- **Estimation → prédictibilité** : baseline de coût-token par classe de fiche, pour une
  équipe mûre sur sujets récurrents (opt-in ; si la variance est trop forte, on ne force
  pas — l'absence de prédictibilité est elle-même une information).

Ces deux propriétés ne rouvrent pas INVEST : elles deviennent des **slots optionnels** du
mécanisme d'extension (allumés par projet), pas des exigences universelles.

## Proposition — chantiers (enfants)

| Fiche | Rôle dans l'épic | État |
|---|---|---|
| [[20260815080414006]] (neuve) | **Épine** — DoR extensible par projet : base 3+1 + manifeste de slots par repo, lu par `groom`/`ready` | idea |
| [[0100]] | Métriques `backlog.health` + garde d'intake « pas assez de ready » — **le quick win** | idea |
| [[20260812104022231]] | 1er slot d'extension concret : « surfaces produit impactées » (doc/site/release notes) | idea |
| [[20260812104022243]] | `groom` appelle aussi `engineering:architecture` — extension du moteur de grooming | idea |

**Action non-fiche (à faire) :** amender [ADR-0016] avec la thèse « DoR = INVEST − cérémonie
+ 2 slots agent-era » (révision de doc, pas un ADR neuf ; le gate DoR est déjà son objet).

## Critères d'acceptation (épic)

- [ ] ADR-0016 amendé : la thèse est gravée (ce qu'on garde d'INVEST, ce qu'on jette, pourquoi).
- [ ] Un projet peut déclarer ≥1 slot DoR supplémentaire, exigé par le gate `ready`.
- [ ] `backlog.health {total, ready, not_ready}` émis au journal de supervision + garde d'intake.
- [ ] Chaque enfant passe son propre gate `ready` (panel adverse au gate) avant d'être tiré.

## Notes / décisions

- **Frère**, pas enfant, de l'épic rationalisation [[20260813131737959]] : c'est de la
  capacité neuve, pas du nettoyage de cohérence.
- **Anti-Goodhart** : les métriques de readiness restent un **signal de flux, jamais une
  cible**. Maximiser « ready » = tamponnage à vide — exactement ce que le plancher +
  concurrence `ezk-pm` d'ADR-0028 empêchent.
- **Anti-sur-outillage ([ADR-0013])** : les slots optionnels (indépendance, prédictibilité)
  restent `idea` tant qu'aucun projet ne les réclame ; la prédictibilité dépend d'une capture
  de coût-token par fiche qu'on n'a pas encore — **parquée, pas construite**.
- Voisins non absorbés (à surveiller au `review`) : [[20260812104022246]] (composition
  comportementale = mécanisme général derrière 243), [[0177]] (pratiques projet portables),
  [[0065]] (composition de lot), [[0053]] (gate DoD adossé métrique, épic 0051).
- **Panel adverse** prévu au gate `ready` : les 2 agents lancés le 2026-08-15
  (ezk-pm / ezk-architect) sont morts sur erreur API ; la passe adverse a été faite **inline**
  → à rejouer en indépendant avant tout tirage.
- Origine : session 2026-08-15 (audit méthode).
