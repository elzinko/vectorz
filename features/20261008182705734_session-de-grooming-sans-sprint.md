---
id: "20261008182705734"
title: Une session de grooming qui ne lance jamais de sprint ni de code
type: feature
priority: P3
product: mega-city
status: idea
pr:
evidence: none # capability de méthode, sans écran
created: 2026-10-08
---

# 20261008182705734 — Session de grooming dédiée (ni sprint, ni code)

**En clair.** Aujourd'hui, pour faire mûrir des fiches, tu ouvres une session qui sait tout
faire : sprint, code, archivage. Tu voudrais un mode plus simple. Une session dédiée au
grooming, qui ne construit rien et ne réclame pas de clôture lourde. Tu entres, tu mûris des
fiches, tu sors.

**Si tu arrives frais.** *Grooming* = faire mûrir une fiche jusqu'à « prête » (problème, valeur,
critères). *Session* = le cadre d'un échange de travail ; aujourd'hui une session se referme par
`ezk-archive`, pensé pour une session qui a livré.

## Contexte / Problème

Déclencheur daté : **2026-10-08**, demande PO. Le grooming est une **sous-commande**
(`ezk-backlog groom <id>`), pas un **mode**. Rien ne pose « on est en session de grooming, on ne
fera ni sprint ni code ». Et la clôture de session (`ezk-archive`) est taillée pour une session qui
a produit un incrément : pour une session qui n'a fait que groomer, elle paraît de trop.

Nuance à ne pas perdre : groomer **committe** des fiches (`docs(features): groom …`). Ces commits
doivent quand même atterrir sur `main`. Donc « sans archiver » ne veut pas dire « sans rien ranger ».
Ça veut dire « sans la cérémonie de clôture d'un incrément livré ».

## Proposition

Esquisse, à groomer : un **mode de session « grooming »**. Une commande d'entrée cadre l'intention,
propose en boucle les fiches à groomer (tête du plan, fiches `idea`), et à la sortie garantit
seulement que les commits de grooming sont sur `main` — sans dérouler `ezk-archive`. À rattacher au
cycle de vie de session (ADR-0054 : story ⊂ sprint ⊂ session).

Question ouverte : est-ce un vrai mode outillé, ou juste une **convention** plus un `next-step` qui
ne propose que du grooming ? À trancher au grooming.

## Critères d'acceptation

- [ ] *(à groomer)* Un mode « session de grooming » existe : on y groome des fiches sans jamais
      ouvrir de sprint ni écrire de code.
- [ ] *(à groomer)* La sortie d'une session de grooming ne réclame pas la clôture complète
      d'`ezk-archive`, mais garantit que les commits de grooming sont sur `main`.

## Comment vérifier

À définir au grooming. Direction : dérouler une session de grooming de bout en bout sur une ou deux
fiches `idea`, vérifier qu'aucune étape sprint/code n'est proposée, et qu'à la sortie les fiches
groomées sont committées sur `main` sans passage par `ezk-archive`.

## Notes / décisions

- Cycle de vie de session : **ADR-0054** (story ⊂ sprint ⊂ session).
- Clôture : `ezk-archive` — que devient « rien à archiver » pour une session qui a **groomé** (donc
  committé des fiches) ? C'est le cœur à trancher.
- Capturée en `idea` sur demande PO (2026-10-08), P3 : direction à garder, pas pressante.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
