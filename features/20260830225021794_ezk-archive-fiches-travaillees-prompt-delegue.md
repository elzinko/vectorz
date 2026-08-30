---
id: "20260830225021794"
title: ezk-archive — passer les fiches TRAVAILLÉES (pas seulement livrées) au prompt délégué
type: refactor
priority: P2
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-08-30
---

## En clair

Quand on clôt une session qui a **travaillé** une fiche sans rien **livrer**, l'archivage
peut perdre le lien vers cette fiche. Le récit rangé dans `docs/sessions/` n'aura pas son
entête `fiches: <id>`, et on ne le retrouvera plus par son id. Cette fiche demande de
transmettre à l'agent d'archivage la liste des fiches **travaillées**, pas seulement
livrées.

## Contexte / Problème

`ezk-archive` archive un récit de session. Deux chemins : **inline** quand tout est propre,
**délégué à un sous-agent** quand il reste des choses en suspens (verdict DIRTY).

Le portier de clôture se lance avec `--shipped <ids>` ou `--shipped none`. Ici `none`
veut dire **« rien livré »**, pas **« aucune fiche travaillée »** (voir
`products/mega-city/skills/ezk-archive/scripts/check.sh` et le SKILL, section `--shipped`).

Le trou : sur le chemin délégué, le résumé de session passé à l'agent ne porte que les ids
**livrés**. Une session qui a travaillé la fiche X sans la livrer se clôt en `--shipped
none`. L'agent ne reçoit alors **aucun id**, alors qu'il devrait poser `fiches: X`. Il se
retrouve à choisir entre deux mauvaises options : inventer un id (interdit — il ne fabrique
jamais un fait de session) ou omettre l'entête (on perd le lien fiche ↔ récit).

Depuis la PR #199, l'entête est **conditionnel** : présent si la session a travaillé des
fiches, absent sinon. Mais « la session a travaillé des fiches » n'est vrai pour l'agent
que s'il **reçoit** ces ids. D'où cette fiche.

- Symptôme daté : finding Codex **P2 (round 4)** sur la PR #199, le 2026-08-30.
- Réf : PR #199 (parité agent↔SKILL), ADR-0018 (lien fiche↔récit).

## Proposition

Transmettre au prompt délégué la liste des fiches **travaillées** dans la session,
séparément de `--shipped` (qui reste la déclaration de ce qui a été **livré**) :

- côté SKILL `ezk-archive` : construire le prompt délégué avec une liste explicite
  « fiches travaillées » (livrées + travaillées-non-livrées) ;
- n'omettre l'entête `fiches:` que si cette liste est **réellement vide** (session
  vraiment non-feature) ;
- si besoin, ajuster `scripts/check.sh` pour distinguer clairement « travaillé » de
  « livré » sans casser la sémantique actuelle de `--shipped`.

## Critères d'acceptation

- [ ] Une session DIRTY qui a travaillé la fiche X **sans la livrer** (`--shipped none`)
      produit un récit `docs/sessions/…` portant `fiches: X`.
- [ ] Le récit reste retrouvable par `grep -rl X docs/sessions/`.
- [ ] Une session vraiment sans fiche (aucune travaillée) n'a **pas** d'entête — aucun id
      inventé.
- [ ] La sémantique de `--shipped` (ce qui est **livré**) est inchangée pour le reste du
      portier.

## Comment vérifier

- Un test de bout en bout (façon `bin/test-labo-cuisine.sh`) qui simule une session DIRTY
  « fiche travaillée, rien livré » et vérifie que l'entête `fiches:` est bien posé.
- Relire le prompt délégué construit par le SKILL : il doit citer les fiches travaillées,
  pas seulement `--shipped`.

## Notes

- Cas limite, pas bloquant : aucune session réelle n'a encore déclenché la perte. La PR
  #199 a fermé la porte à l'invention d'id ; cette fiche ferme la porte à la perte de lien.
- Panel/ADR non requis a priori — c'est un ajustement de contrat interne à `ezk-archive`.
