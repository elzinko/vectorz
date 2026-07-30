---
id: 0145
title: ezk-product-builder — mode --checkpoints ask|auto (décisions recommandées par défaut)
type: feature
priority: P1
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
En session Claude Desktop, l'opérateur répond « oui, continue » ~2 fois par feature (double
checkpoint builder + sprint) et à ~12 types d'arrêts par cycle, alors que 5 sont
auto-recommandables (le défaut est déjà la 1re option des tables de checkpoints) et 3
délégables. La fonctionnalité doit vivre dans la SKILL (indépendante de cop1, ADR-0011 §1
et §3) — cop1 ne fera que l'activer.

## Proposition
1. Flag `--checkpoints ask|auto`, calqué sur l'idiome `--tokens lean|cap|full` :
   `argument-hint` + section dédiée + défaut `ask` + mutable à chaud via une option des
   tables de checkpoint.
2. En `auto` : les arrêts (a) prennent la 1re option de la table ; les arrêts (b) sont
   délégués (blocage technique → ezk-architect/ezk-reviewer ; cadrage → product-brainstorming ;
   arbitrage → ezk-pm, fiche 0036) ; chaque décision est journalisée dans SPRINT.md
   (« Notes / décisions ») ; les 4 arrêts humains (ADR-0011 §3) restent des STOP durs.
   Repli de sûreté : si le délégataire (ezk-pm ou autre) est ABSENT du contexte bindé,
   l'arrêt concerné retombe en `ask` — jamais d'improvisation.
3. Condition de sûreté : l'inter-sprint automatique exige un plafond tokens actif
   (`--tokens cap`) — sinon il reste `ask`.
4. Absorber le double checkpoint : quand le builder est l'appelant, il répond au
   checkpoint fin-de-sprint d'ezk-sprint (étape 9) ; l'humain ne garde que l'inter-sprint
   (écrire la règle DANS les deux playbooks).
5. Corriger la l.68 du builder (« uniquement à ces 4 moments ») pour inclure le garde-fou
   irréversible/sortant comme 5e arrêt assumé.

## Critères d'acceptation
- [ ] `--checkpoints auto` + `--tokens cap` : un sprint complet sans question humaine hors cas (c), décisions journalisées dans SPRINT.md
- [ ] en `auto`, un push --force simulé ou un secret manquant STOPPE toujours
- [ ] un seul « on continue ? » par feature en mode composé (checkpoint sprint absorbé)
- [ ] `--checkpoints ask` (défaut) : comportement actuel inchangé
- [ ] sur un profil SANS ezk-pm, `auto` retombe en `ask` pour les arrêts délégables (testé)

## Notes
ADR-0011. Analyse des 12 arrêts (5a/3b/4c) : mémoire projet du 2026-07-06. cop1 activera ce
mode comme un prompt le ferait (aucun code fonctionnel côté cop1). L'alignement du nommage
des modes tokens (lean|cap|full vs « plafond-dur/pleine-puissance ») est extrait en
fiche 0038 (micro-chore indépendante).
