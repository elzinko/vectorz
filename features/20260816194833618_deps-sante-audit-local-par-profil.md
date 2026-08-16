---
id: "20260816194833618"
title: "Santé des dépendances côté ezk — audit local activable par profil (alternative frugale à Dependabot)"
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-16
---

# 20260816194833618 — Santé des dépendances en local, activable par profil

## Contexte / Problème

**Déclencheur (2026-08-16).** Une PR Dependabot périmée (#139) a soulevé la question :
« est-ce que Dependabot consomme des ressources ? ». Réponse : Dependabot lui-même est
**gratuit**, mais **chacune de ses PR déclenche un run CI** (lint/build/test) qui pioche
dans le quota GitHub Actions limité (repo privé, ~2000 min/mois). Ses PR groupées
vieillissent aussi et deviennent bruyantes (#139 mélangeait 2 correctifs sécurité utiles
à des sauts de version majeurs risqués, et **redescendait** même une version déjà montée
sur `main`).

Besoin exprimé : garder la **veille dépendances** mais **sans dépendre du cloud en
continu** — l'intégrer aux « choses à faire côté ezk », **à la demande** et **en local**.

## Proposition

Une **capacité « santé des dépendances »** ajoutée au catalogue mega-city :

- **Check en local** (`pnpm audit` / `pnpm outdated`, ou `osv-scanner`) — **zéro minute
  cloud** — qui liste failles + montées disponibles.
- **Sortie = fiches backlog** : chaque montée utile devient une fiche (ou une ligne), donc
  les dépendances entrent dans le flux ezk normal, comme tout le reste.
- **Activable par projet** via le système qui **existe déjà** : les **profils** (`base`,
  `daily`, `desktop`, `mobile`, `cop1-target`…) + `lawgiver bind`. Ce n'est PAS un nouveau
  système de plugins à activer/désactiver — c'est **une entrée de plus** dans ce catalogue.
  (C'est le cœur de l'idée : « on a plein de tâches/capacités, on choisit celles qu'on
  active par projet » = les profils.)
- **Driver-agnostique** : la capacité décrit le *quoi* (auditer les deps) ; le *comment*
  côté cloud (GitHub + Dependabot, GitLab…) n'est qu'un **adaptateur optionnel**. On peut
  garder Dependabot comme filet de sécurité cloud, ou le couper et tout faire en local.

**Maison probable = `ezk-ci`** (qui fait déjà « valide en local d'abord + surveille/plafonne
la conso GitHub Actions ») plutôt qu'un skill neuf — anti-surproduction (ADR-0013). À
challenger : si le périmètre grossit (multi-plateforme, planification), un `ezk-deps` dédié
se défend.

## Critères d'acceptation (à groomer)

- [ ] Un check deps **en local** produit un rapport (failles + `outdated`) sans run cloud.
- [ ] Les montées utiles atterrissent en **fiches backlog** (intégration `ezk-backlog`).
- [ ] La capacité est **activable/désactivable par projet** via un profil (pas de système
      parallèle).
- [ ] Décision tranchée : **sous-commande d'`ezk-ci`** vs **skill `ezk-deps`** dédié.
- [ ] Décision : garder Dependabot (filet cloud) ou le désactiver (`dependabot.yml` /
      réglages sécurité du repo).

## Notes / cohérence

- **Piège** : « lancer régulièrement » **via GitHub Actions** = reconsommer des minutes.
  Version zéro-coût = **à la demande**, ou un **rappel** dans le rituel d'ouverture
  (`ezk-start`). Un cron local ne tourne que si la machine est allumée.
- **Voisines** : [[20260812134515706]] (étendre `ezk-ci` d'un `harden`/`apply` — mêmes
  « recettes appliquées par repo ») · [[0177]] (capacités portables par projet) ·
  [[0170]] / [[0087]] (modèle d'extension + distribution plugin — le catalogue des
  « capacités activables ») · [[0174]] (`ezk-issues`, intégration GitHub) · les profils
  `products/mega-city/profiles/`.
- **Priorité P2 provisoire** (posée à la capture, PO à confirmer) : confort/frugalité ; la
  sécurité de base est déjà couverte gratuitement par les alertes Dependabot.
