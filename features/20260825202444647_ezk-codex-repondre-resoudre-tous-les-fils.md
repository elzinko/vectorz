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

1. **Clore chaque fil traité** — corrigé **ou** décliné — par deux gestes : **répondre en fil**
   (citer le commit de correction, ou la raison du déclin) et **marquer le fil `resolved`** via
   GraphQL `resolveReviewThread(threadId)`.
   **Séquencement (retour Codex #168)** : pour un finding **corrigé**, ces deux gestes viennent
   **après que la correction est commitée ET poussée** (près des étapes 4-5 du playbook), **pas** à
   l'étape 2 — sinon la réponse citerait un commit inexistant, et un fil résolu trop tôt resterait
   « resolved » même si le push échoue. Pour un **décliné** (aucun commit), reply + resolve se font au
   moment de la décision.
2. **Ne traiter que les fils NON résolus** (retour Codex #168) : à l'intake (étape 1), sélectionner les
   fils `isResolved:false` via `pullRequest.reviewThreads` — pas « tous les commentaires filtrés par
   auteur ». Sinon un `fix` **relancé** re-traite des fils déjà résolus (réponses en double, fixes
   re-considérés).
3. **Étendre l'étape 6 (rapport)** : l'état « prêt à merger » exige **0 fil non résolu** parmi les
   traités (contrôle explicite).
4. **(Suivi déjà noté par le skill)** extraire les parties mécaniques en `scripts/` **testés**
   (`reply-thread.sh`, `resolve-thread.sh`), façon `ezk-archive/scripts/` — la section « Suivi » du
   SKILL.md prévoit déjà cette extraction ; cette fiche la motive.

## Critères d'acceptation

- [ ] après un `fix`, **chaque** fil Codex traité (corrigé/décliné) a **une réponse en fil** + est
      marqué **`resolved`** — contrôle : `reviewThreads` ne renvoie **aucun** `isResolved:false` parmi les traités
- [ ] `SKILL.md` décrit reply **+ resolve** pour **tous** les traités, pas seulement les déclines
- [ ] la résolution passe par GraphQL `resolveReviewThread` (les threadIds récupérés via `reviewThreads`)
- [ ] pour un finding **corrigé**, reply + resolve n'ont lieu **qu'après** commit **et** push réussis (pas de citation d'un commit inexistant, pas de fil résolu avant un push qui échoue)
- [ ] un `fix` **relancé** après une passe réussie **ne re-traite pas** les fils déjà résolus (intake filtré `isResolved:false`) — aucune réponse en double
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
