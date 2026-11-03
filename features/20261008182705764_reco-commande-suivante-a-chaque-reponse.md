---
id: "20261008182705764"
title: Une reco de commande suivante à chaque réponse, émise par la méthode
type: feature
priority: P3
product: mega-city
status: idea
blocked: design
pr:
evidence: none # restitution de méthode, sans écran
created: 2026-10-08
---

# 20261008182705764 — Reco « et maintenant ? » à chaque réponse (extension du next-step)

**En clair.** La méthode sait déjà proposer « et maintenant ? », mais seulement en fin de commande
ezk. Tu voudrais cette reco à **chaque** réponse de l'agent, émise par la méthode elle-même, pas
seulement par le prompt de Claude Code. Objectif : toujours savoir quelle commande de la méthode
vient logiquement après.

**Si tu arrives frais.** La règle `next-step-affordance` fixe déjà le format d'un bloc « Et
maintenant ? » (1 à 3 commandes, une raison chacune). Mais les skills ne l'émettent qu'à la **fin de
leurs sous-commandes**.

## Contexte / Problème

Déclencheur daté : **2026-10-08**, demande PO, en citant **BMAD** (une reco de suite à chaque tour).

L'existant couvre déjà le cœur : la règle `next-step-affordance` et sa
[fiche livrée](done/20260825160456259_next-step-affordance-commandes-suivantes.md) (#280). Le trou :
ça ne se déclenche qu'**en fin de commande ezk**. Entre deux commandes, ou après une réponse en
prose, rien ne rappelle la suite. Le PO insiste sur « **émise par la méthode** », à distinguer de
l'élicitation à choix du prompt de Claude Code.

## Proposition

Esquisse, à groomer : **étendre la portée** du next-step à chaque fin de réponse, via un mécanisme
porté par la méthode (hook ou style de sortie), pas seulement par la table curée des skills.

Deux vigilances :
- **Garde-fou ADR-0013** : convention de restitution, pas moteur de menu.
- **Bruit** : une reco à *chaque* tour peut lasser. À calibrer — quand c'est utile vs redondant, et
  silence quand il n'y a pas de suite naturelle (pas de bloc creux, comme la règle l'exige déjà).

## Critères d'acceptation

- [ ] *(à groomer)* Une reco de commande suivante peut apparaître en fin de réponse, hors fin de
      commande ezk, émise par la méthode.
- [ ] *(à groomer)* Elle reste silencieuse quand aucune suite ne s'impose (reprend « pas de bloc
      creux » de la règle).

## Comment vérifier

À définir au grooming. Direction : après une réponse en prose (hors commande ezk), vérifier qu'un
bloc « Et maintenant ? » pertinent peut apparaître, et qu'il se tait quand aucune suite ne s'impose.

## Notes / décisions

- **Extension**, pas reconstruction : la règle `next-step-affordance` et la
  [fiche #280](done/20260825160456259_next-step-affordance-commandes-suivantes.md) existent. On
  élargit leur **portée**, on ne refait pas la règle.
- Garde-fou **ADR-0013** (pas de moteur de menu).
- Fiche sœur : [garder les sessions dans le cadre de la méthode](20261008182705749_forcer-sessions-dans-la-methode-debrayage-config.md).
  Même intention « rester dans le cadre » ; mécanisme peut-être partagé (hook / style de sortie).
- Capturée en `idea` sur demande PO (2026-10-08), P3 : le cœur existe déjà en règle, ce n'est qu'une
  extension.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
- **Mise en attente le 2026-11-03** (run autonome) : le mécanisme passerait par un hook
  ou un style de sortie, comme la fiche sœur
  [garder les sessions dans le cadre de la méthode](20261008182705749_forcer-sessions-dans-la-methode-debrayage-config.md),
  déjà en attente d'un design. Poser un hook ou un style de sortie change la config du poste : le choix
  te revient, pour les deux fiches à la fois.
