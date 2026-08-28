---
id: documentation-guidelines/human-facing-lisibility
kind: disposition
level: MUST
title: Human-Facing Artefact Lisibility
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- Scope: **every artefact a human reads** — PR description, backlog fiche, capture,
  retro write-up, product-builder checkpoint, sprint closure summary,
  **ezk-archive handoff / rapport de clôture**. Not internal scratch (`SPRINT.md`,
  draft ADR notes).
- Open with an **« En clair »** block: the essential in **≤ 3 sentences**, BEFORE detail.
- Trame: lived symptom → proposal in plain words → concrete effect for the reader.
- Internal codes and invented jargon (`R1`, `DoR`, « verrou », « borne anti-veto »…)
  are forbidden as carriers of meaning in the opening — put them in an annex/glossary
  only, and define them once.
- Write **to the human addressed**, not between agents. Prefer a short map over an
  exhaustive dossier.
- **Lists of file-backed items** (backlog fiches, PRs, diagrams, captures): make **every
  entry clickable** — a markdown link on the **id** pointing to the item's source file; the
  title stays in clear next to it. **Resolve the path against where the reader reads it:**
  - a **transient CLI/chat answer** is read from the shell → path **relative to the current
    working directory** (from the repo root: `[0050](features/0050-slug.md)`);
  - a **committed Markdown artefact** (a generated index like `features/BACKLOG.md`, a PR
    body, a fiche) is read as a document → path **relative to that file's own directory**
    (inside `features/BACKLOG.md`: `[0050](0050-slug.md)`, `[0000](done/0000-slug.md)` — never
    `features/…`, which would resolve as `features/features/…`).
  A generator that forbids hand-editing its index (`regen-backlog.sh`) MUST emit these links
  itself. Without the link the reader must guess the path to open the file — exactly what
  breaks piloting (Thomas, 2026-08-28: « je ne m'en sors pas » sur un `list` sans liens).

### Cas corps de PR — la fiche est le document, la PR en est le rendu (ADR-0029)

La **fiche `features/<id>_*.md` est la source unique** ; le **corps de PR en est le RENDU**,
pas un second résumé. Interdit : rédiger un `## Summary` parallèle qui re-raconte la fiche —
c'est la dérive que ça a produite (muti #79 : Summary réécrit ≠ fiche, PO « pas compris »).

Le corps de PR produit par `ezk-sprint` (étape PR) DOIT être lisible **diff fermé** et être le
**rendu de la fiche** :

1. **Le contenu de la fiche, tel quel** — son ouverture **« En clair »** puis ses sections
   (Contexte / Proposition / Critères / **Comment vérifier**). On **recopie la fiche**, on ne
   réécrit pas ; la fiche ouvre par « En clair » (règle ci-dessus) → la PR en hérite.
2. **La provenance** — un lien/chemin vers la fiche (`features/<id>_*.md`, legacy
   `features/<id>-*.md`, `products/<produit>/features/<id>_*.md`). L'id est aussi dans la
   branche `feat/<id>-<slug>`.
3. **La matrice « Validation »** appendue sous le rendu — **seul bloc propre à la PR** (statut
   CI / tests / E2E, dynamique ; convention ADR-0009). Du statut, pas de la prose.

« Comment vérifier » (commandes rejouables / signaux observables) vit **dans la fiche**, pas
inventé dans la PR. **Sur divergence, la fiche gagne** : re-rendre le corps depuis la fiche,
jamais l'inverse. Repère ≤ ~2 000 caractères hors annexes/matrice.

Origin: retro 2026-07-18 (PO restitution unreadable) + samplerz #317 (PR body opaque until
rewrite) + muti #79 2026-08-16 (`## Summary` mince réécrit → diverge de la fiche, PO « pas
compris » → [ADR-0029](../../docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md) : la
fiche est le document, la PR le rend). Measure (removability): 0 « pas compris » claims from the
PO on a human-facing artefact for 5 consecutive sprints; and on the next 3 open PRs, a third
party reading **only** the description reformulates the need in one sentence (3/3).

### Lentille « nouveau venu » — opérationnalise la mesure 3/3 (fiche 0191)

La mesure ci-dessus (un tiers reformule le besoin en une phrase, 3/3) est un **jugement
sémantique** qu'un contrôle déterministe ne peut pas rendre. `ezk-reviewer` l'applique via la
lentille [`newcomer-readability-lens`](../../docs/newcomer-readability-lens.md) : lire le corps
rendu **seul** et reformuler le besoin en une phrase ; **NO-GO** si un terme interne non défini
(hors `## Glossaire`) ou l'absence de vocabulaire pour un lecteur neuf (ouverture « Si tu arrives
frais ») l'en empêche. La part mécanisable — placeholders d'onboarding laissés non remplis dans le
rendu — est gardée par `check-pr-body` ; la lentille couvre l'opacité qu'un script ne voit pas. Le
template de fiche porte les deux blocs (`skills/ezk-backlog/templates/feature-template.md`), la PR
les **rend** quand la fiche les a.
