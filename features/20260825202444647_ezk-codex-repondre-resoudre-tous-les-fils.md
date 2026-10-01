---
id: "20260825202444647"
title: "ezk-codex répond et ferme tous les fils de revue traités"
type: feature
priority: P2
product: mega-city
version: V0.3
labels: [revue]
status: idea
pr:
created: 2026-08-25
---

# 20260825202444647 — ezk-codex : répondre + résoudre tous les fils traités

**En clair.** Quand `ezk-codex fix` traite les retours du reviewer Codex sur une PR, il doit, pour
**chaque** retour, répondre dans le fil **et** le marquer « résolu ». Cela vaut pour un retour
corrigé comme pour un retour décliné. Aujourd'hui, le skill ne répond qu'aux déclins. Une PR dont
tout est corrigé garde donc des fils « non résolus », et cela se lit comme un oubli.

**Si tu arrives frais.** *ezk-codex* est le skill qui traite les commentaires du reviewer Codex sur
une PR. Un *fil* est une conversation de commentaire de revue GitHub. *Résoudre* un fil le passe à
l'état « resolved ».

## Contexte / Problème

Déclencheur daté : **2026-08-25**, le PO sur la **PR #167** (benchmark BMAD vs ezk). Les **4 findings
P2** étaient corrigés, mais les fils restaient ouverts. Le PO a dû signaler des « commentaires non
résolus » alors que le fond était réglé.

Le trou se trouve dans `products/mega-city/skills/ezk-codex/SKILL.md` :

- **Étape 2 (« CORRIGER ou DÉCLINER »)** ne décrit la réponse en fil + 👎 que pour le cas **décliné**.
  Pour un finding corrigé, rien n'invite à répondre dans le fil.
- **Aucune étape ne marque un fil `resolved`**, ni pour les corrigés, ni pour les déclinés. Le skill
  s'arrête à « commit + push + re-`@codex review` + rapport ».

Un `fix` « réussi » laisse donc la PR avec N fils ouverts. La résolution s'est faite **à la main**
cette fois-là (réponses `…/comments/<id>/replies`, puis GraphQL `resolveReviewThread`).

**Mesure du 2026-10-01.** Sur les 60 dernières PR de vectorz, 40 portent des fils Codex. Parmi elles,
35 en gardent au moins un **non résolu**, soit 61 fils sur 69. Le cas de la #167 n'est pas isolé :
c'est la norme.

## Périmètre de cette PR (POC)

Un patch de **playbook** dans `products/mega-city/skills/ezk-codex/SKILL.md`. Aucun script : le POC
prouve la valeur avec le texte du skill, les requêtes rejouées pour de vrai.

1. **Intake par fils non résolus** (retour Codex #168). L'étape 1 lit `pullRequest.reviewThreads` et
   ne garde que les fils `isResolved:false` dont le premier commentaire vient de Codex. Un `fix`
   relancé ne re-traite donc jamais un fil déjà résolu, et ne poste aucune réponse en double.
2. **Un seul bloc « Clore un fil »** : réponse via `…/comments/<id>/replies`, puis mutation GraphQL
   `resolveReviewThread`. Il sert pour **tous** les fils traités.
3. **Fil décliné** : clos tout de suite (étape 2). Il n'y a aucun commit à attendre.
4. **Fil corrigé** : clos **après** commit **et** push réussis (étape 4), jamais à l'étape 2
   (retour Codex #168). Sinon la réponse citerait un commit inexistant, et un fil résolu trop tôt le
   resterait même si le push échoue.
5. **Rapport (étape 6)** : « prêt à merger » exige **0 fil traité encore non résolu**, avec une
   requête de contrôle explicite.

## Critères d'acceptation

- [x] `SKILL.md` étape 1 : l'intake lit `reviewThreads` et ne garde que les fils `isResolved:false` ouverts par Codex
- [x] `SKILL.md` contient un bloc « Clore un fil » : réponse en fil, puis GraphQL `resolveReviewThread` (threadId issu de `reviewThreads`)
- [x] un fil **décliné** est clos à la décision (réponse + 👎 + résolu)
- [x] un fil **corrigé** n'est clos qu'après commit **et** push réussis, la réponse cite le commit ; push en échec ⇒ aucun fil résolu
- [x] étape 6 : « prêt à merger » exige 0 fil traité non résolu, avec la requête de contrôle
- [x] `check`, la description du skill et les garde-fous disent la même chose que la boucle
- [x] les requêtes du playbook sont **rejouées pour de vrai** (preuves ci-dessous)

**Preuves (2026-10-01).**

- **Intake** : le bloc de l'étape 1, extrait tel quel du `SKILL.md`, est rejoué sur la PR #70. Il rend
  les 2 fils Codex non résolus avec `threadId`, `commentId`, `path`, `line`, `body`. Sur la PR #211
  (4 fils, tous résolus), la même requête ne rend rien.
- **Mutation** : l'introspection du schéma GitHub donne `ResolveReviewThreadInput.threadId` (ID).
  Le bloc de résolution, extrait tel quel, est rejoué avec un identifiant factice. GitHub l'analyse,
  lie la variable et répond « introuvable » : la syntaxe est bonne.
- **Limite assumée** : la résolution d'un fil **vivant** n'est pas exercée. Aucun fil Codex ouvert
  n'existe sur la PR du POC, et résoudre les fils d'une PR ancienne serait une écriture non demandée.

## Comment vérifier

1. **Intake** : jouer la requête de l'étape 1 sur une PR qui porte des fils Codex (ex. la #167).
   Elle rend `threadId`, `commentId`, `path`, `line`, `body` pour chaque fil retenu, et rien pour un
   fil résolu.
2. **Mutation** : `gh api graphql` sur `__type(name:"ResolveReviewThreadInput")` rend le champ
   `threadId`, du type attendu par le bloc « Clore un fil ».
3. **Relecture du playbook** : trois gestes visibles. Décliné ⇒ clos à l'étape 2. Corrigé ⇒ clos à
   l'étape 4 après le push. Rapport ⇒ contrôle « 0 fil traité non résolu ».
4. **En vrai** (au premier `fix` sur une PR avec fils Codex ouverts) : la requête de contrôle rend
   0 fil non résolu parmi les traités, et chaque fil porte une réponse citant le commit ou la raison.

## Suite (hors POC)

- Extraire les gestes mécaniques en `scripts/` **testés** (`close-thread.sh` : réponse + résolution),
  façon `ezk-archive/scripts/`. La section « Suivi » du `SKILL.md` prévoit déjà cette extraction.
- Rejouer la boucle complète de bout en bout sur une PR vivante dès qu'un fil Codex ouvert existe
  (le quota Codex est épuisé au moment du POC).
- Paginer `reviewThreads` au-delà de 100 fils (cas rare).
- Utiliser le `resolutionReason` facultatif de `resolveReviewThread` (`ADDRESSED`, `WONT_FIX`,
  `INVALID`, vérifié dans le schéma). Corrigé et décliné se liraient alors d'un coup d'œil dans la PR.
- Les 61 fils déjà ouverts sur les PR mergées ne sont pas touchés par ce patch. Les clore serait un
  nettoyage à part, à décider par le PO.

## Glossaire

- `resolveReviewThread` — mutation GraphQL GitHub qui passe un fil de revue à l'état « resolved ».
- `fil` (thread) — la conversation attachée à un commentaire de revue inline.

## Notes / décisions

- **Guidance déjà en mémoire** (feedback PO) : `ezk-codex-reply-resolve-tous-les-fils`. Elle reste
  valable à la main tant que le `SKILL.md` n'est pas patché.
- Réf **ADR-0024** (décision fondatrice d'ezk-codex). Voisin : la section « Suivi (polish noté) » du
  `SKILL.md`.
- Effets de bord du patch : l'ADR-0024 reçoit l'invariant 6 (clore chaque fil traité), et la carte
  interactive est régénérée (`pnpm map:data`) parce que la description du skill change.
- Arbitrage de grooming : **pas de script dans le POC**. Le texte du skill suffit à prouver la
  valeur, et les scripts attendent que le besoin de les tester se confirme.
