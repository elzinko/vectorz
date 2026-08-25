---
id: "20260825202444647"
title: "ezk-codex fix — répondre en fil ET résoudre TOUS les fils traités (pas seulement décliner)"
type: feature
priority: P2
product: mega-city
labels: [ezk-codex, dx]
status: todo
ready:
pr:
created: 2026-08-25
---

# 20260825202444647 — ezk-codex : répondre + résoudre tous les fils traités

**En clair.** Quand `ezk-codex fix` traite les retours du reviewer Codex sur une PR, il devrait, pour
**chaque** retour — **corrigé comme décliné** — **répondre dans le fil** et **le marquer « résolu »**.
Aujourd'hui, le skill ne prévoit la réponse (+ 👎) que pour les **déclines**, et compte sur le
re-`@codex review` pour matérialiser les corrections. Résultat : sur une PR où tout est corrigé, les
fils restent **« non résolus »** — ça se lit comme un oubli.

**Si tu arrives frais.** *ezk-codex* = le skill qui adresse les commentaires du reviewer Codex sur une
PR. *fil* = un thread de commentaire de revue GitHub. *résoudre* = passer le fil à l'état « resolved ».

## Contexte / Problème

Déclencheur daté : **2026-08-25**, le PO sur la **PR #167** (benchmark BMAD vs ezk). J'avais corrigé
les **4 findings P2** mais laissé les **fils ouverts** ; le PO a dû signaler qu'il restait des
« commentaires non résolus » alors que le fond était réglé.

Le trou, dans `products/mega-city/skills/ezk-codex/SKILL.md` :

- **Étape 2 (« CORRIGER ou DÉCLINER »)** ne décrit la **réponse en fil + 👎** que pour le cas
  **décliné**. Pour un finding **corrigé**, aucune consigne de répondre dans le fil.
- **Aucune étape ne marque les fils `resolved`** — ni pour les corrigés, ni pour les déclinés. Le skill
  s'arrête à « commit + push + re-`@codex review` + rapport ».

Conséquence : un `fix` « réussi » laisse la PR avec N fils ouverts. La résolution s'est faite **à la
main** cette fois (réponses `…/comments/<id>/replies` + `resolveReviewThread` GraphQL).

## Proposition

1. **Étendre l'étape 2** : pour **chaque** finding traité — corrigé **ou** décliné — deux gestes de
   clôture du fil :
   - **répondre en fil** en citant le **commit de correction** (corrigé) ou la **raison** (décliné) ;
   - **marquer le fil `resolved`** via GraphQL `resolveReviewThread(threadId)` (threadIds via
     `pullRequest.reviewThreads`).
2. **Étendre l'étape 6 (rapport)** : l'état « prêt à merger » exige **0 fil non résolu** parmi les
   traités (contrôle explicite).
3. **(Suivi déjà noté par le skill)** extraire les parties mécaniques en `scripts/` **testés**
   (`reply-thread.sh`, `resolve-thread.sh`), façon `ezk-archive/scripts/` — la section « Suivi » du
   SKILL.md prévoit déjà cette extraction ; cette fiche la motive.

## Critères d'acceptation

- [ ] après un `fix`, **chaque** fil Codex traité (corrigé/décliné) a **une réponse en fil** + est
      marqué **`resolved`** — contrôle : `reviewThreads` ne renvoie **aucun** `isResolved:false` parmi les traités
- [ ] `SKILL.md` décrit reply **+ resolve** pour **tous** les traités, pas seulement les déclines
- [ ] la résolution passe par GraphQL `resolveReviewThread` (les threadIds récupérés via `reviewThreads`)
- [ ] (option) helper(s) `scripts/` testé(s) pour reply + resolve, appelés par le playbook

## Comment vérifier

<à groomer> Ex. : lancer `ezk-codex fix` sur une PR portant des findings ; à la fin,
`gh api graphql` sur `pullRequest.reviewThreads` montre `isResolved:true` pour tous les fils traités,
et chaque fil porte une réponse citant le commit ou la raison.

## Glossaire

- `resolveReviewThread` — mutation GraphQL GitHub qui passe un fil de revue à l'état « resolved ».
- `fil` (thread) — la conversation attachée à un commentaire de revue inline.

## Notes / décisions

- **Guidance déjà en mémoire** (feedback PO) : `ezk-codex-reply-resolve-tous-les-fils` — à appliquer à
  la main tant que le `SKILL.md` n'est pas patché.
- Réf **ADR-0024** (décision fondatrice d'ezk-codex). Voisin : la section « Suivi (polish noté) » du
  SKILL.md (extraction en `scripts/` testés).
- **P2 = proposition** ; petit patch de playbook, à confirmer/ajuster au grooming.
