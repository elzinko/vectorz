---
id: "20261008182705749"
title: Garder les sessions dans le cadre de la méthode, avec un débrayage en config
type: feature
priority: P2
product: mega-city
milestone: methode-configurable
version:
status: idea
blocked: design
pr:
evidence: none # garde-fou de session, sans écran
created: 2026-10-08
---

# 20261008182705749 — Rester dans le cadre de la méthode (+ interrupteur de débrayage)

**En clair.** Tu veux que tes sessions sur ce projet restent dans le cadre de la méthode ezk par
défaut, au lieu de partir en roue libre. Avec un interrupteur dans la config pour débrayer quand tu
le décides. Objectif : ne plus sortir du cadre sans l'avoir voulu.

**Si tu arrives frais.** *ezk* = la méthode outillée en skills Claude Code (`/ezk-…`). *Débrayer* =
désactiver volontairement une contrainte via la config du projet (`.vectorz/config.yml`).

## Contexte / Problème

Déclencheur daté : **2026-10-08**, demande PO. Rien ne pousse une session à passer par la méthode.
On peut coder ou décider hors cadre sans s'en rendre compte. Le PO veut un **défaut « dans la
méthode »**, avec une **soupape de débrayage** dans la config. Il ne fixe pas la forme (« je ne
sais pas trop ») : à cadrer.

## Proposition

**POC (premier morceau) : un rappel soft au démarrage de session + un interrupteur config.** Au
démarrage, un hook `SessionStart` (le mécanisme existe déjà — ce projet reçoit déjà des injections au
démarrage) **rappelle le cadre** et **oriente** vers le point d'entrée de la méthode. Un
**interrupteur dans `.vectorz/config.yml`** (même foyer que `github:`, un réglage du cluster
`methode-configurable`) le coupe. C'est un **rappel, pas un gate** : il n'empêche rien, il oriente.

Pourquoi soft d'abord (tranché PO) : un rappel qu'on peut couper coûte peu et ne gêne jamais. Le
**gate dur** — bloquer hors méthode — est plus risqué et vient **après**, s'il se justifie (Suite).

## Critères d'acceptation

- [ ] **Rappel au démarrage** — au démarrage d'une session (hook `SessionStart`), un rappel du cadre
      + l'orientation vers le point d'entrée de la méthode apparaissent.
- [ ] **Interrupteur coupe** — poser l'interrupteur `off` dans `.vectorz/config.yml` → plus de rappel.
- [ ] **Défaut = cadre** — sans réglage, le rappel est **actif** (le défaut est « dans la méthode »,
      demande PO).
- [ ] **Garde — rappel, pas gate** — le rappel **n'empêche jamais** d'agir : une session rappel actif
      peut faire tout ce qu'elle pourrait sans. Sans ce critère, le soft glisse vers le dur en silence.

## Comment vérifier

À rejouer une fois construit :
- Ouvrir une session sans réglage → le rappel du cadre + l'orientation apparaissent (défaut actif).
- Poser l'interrupteur `off` dans `.vectorz/config.yml`, rouvrir une session → plus de rappel.
- Avec le rappel actif, lancer une action quelconque → elle passe (le rappel n'a rien bloqué).

## Suite (plus tard)

- le **gate dur** : bloquer ou alerter fortement quand une session agit hors méthode, au-delà du
  rappel soft — à n'envisager qu'après avoir vécu le rappel, s'il se justifie.

## Notes / décisions

- Mécanisme probable : hook `SessionStart` (même surface technique que la fiche `idea` « Émettre les
  événements de supervision via des hooks Claude Code », 0077).
- Config : `.vectorz/config.yml` (foyer déjà posé par les fiches « GitHub optionnel » et « modules
  optionnels par config », livrées).
- Fiche sœur : [reco de commande suivante à chaque réponse](20261008182705764_reco-commande-suivante-a-chaque-reponse.md).
  Même intention « rester dans le cadre », faces complémentaires ; mécanisme peut-être partagé.
- Capturée en `idea` sur demande PO (2026-10-08), P2 : garde-fou qui change l'usage quotidien.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
- **Mise en attente le 2026-11-03** (run autonome) : la forme reste à choisir. Tu as dit « je ne sais
  pas trop » le 2026-10-08 ; un garde-fou qui pousse chaque session dans la méthode change ton usage
  de Claude Code au quotidien. À cadrer avec toi.
