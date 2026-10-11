# I AM THE LAW

Règles compilées de ce projet (cap claude-code-law).

## agent-ops/verify-access-before-asking  `[SHOULD]`

- Avant de demander à l'humain d'exécuter une opération sur un service externe — changer un
  prix ou une variable, déployer, pousser, mettre à jour un code promo —, l'agent vérifie
  D'ABORD s'il peut la faire lui-même : une **CLI authentifiée** (`gh`, `vercel`…), un **MCP
  connecté**, ou un **secret au trousseau** (`ezk-secret list`).
- Il ne sollicite l'humain que pour **créer / déposer un secret**, ou pour une des **4 décisions
  humaines** (action irréversible ou sortante, hausse de budget, idée produit sur backlog vide,
  exigences contradictoires).
- Origine : session 2026-10-10 — l'agent a demandé un changement Vercel alors que la CLI `vercel`
  était authentifiée, et a enchaîné 3 allers-retours sur le dashboard LemonSqueezy pour un prix,
  alors que le jeton API était au trousseau depuis le début (spike 20261010213000378).
- Mesure (removability) : sur les 5 prochaines sessions touchant un service externe, 0 cas où
  l'agent délègue une opération à l'humain sans avoir d'abord vérifié CLI / MCP / trousseau et
  constaté qu'aucun ne permet de la faire.

## clean-code/no-dead-code  `[MUST]`

Pas de code mort, pas de TODO masqué, pas de code simulé. Toute branche est
atteignable et testée. Si un bout n'est plus utilisé, on le supprime — git garde
l'historique. Vérifié à la revue par l'agent `ezk-reviewer` (enforcement niveau 1).

## conventional-commits/format  `[MUST]`

Chaque message de commit suit **Conventional Commits v1.0.0** :
`type(scope)?: sujet` — `type` ∈ feat, fix, docs, style, refactor, perf, test,
build, ci, chore, revert. Description en minuscules, à l'impératif, sans point
final. Breaking change : `!` après type/scope, ou un footer `BREAKING CHANGE:`.
Garanti par un git hook `commit-msg` (enforcement niveau 2, bloquant).

## development/pr-before-after-media  `[MUST]`

- Every PR that delivers a **user-visible** feature or bugfix MUST include a short **before / after** proof **as links in the PR description** (GitHub body)
- Preferred: screenshots (bug or état avant → correction or état après), linked so they render inline in the PR
- Allowed: a short, cheap screen recording (or GIF) when a still image cannot show the issue (animation, timing, navigation flow) — also linked from the PR body
- The media MUST make the problem and the fix understandable **without reading the whole diff**
- Hosting: upload to the PR (GitHub-hosted image URLs), or commit light assets on the branch (e.g. `docs/pr-evidence/<id>-before.png`) and link them in the body — prefer links over burying binaries without a body reference
- Exception: pure chore / docs / infra with **no** user-visible UI change → mark `N.A.` in the PR validation matrix with a one-line reason

Rationale: PO and async reviewers need a visual signal; text-only PRs are insufficient for UX bugs and map/admin flows.

## documentation-guidelines/human-facing-lisibility  `[MUST]`

- Scope: **every artefact a human reads** — PR description, backlog fiche, capture,
  retro write-up, product-builder checkpoint, sprint closure summary,
  **ezk-archive handoff / rapport de clôture** — **and every chat answer addressed to the
  human**: end-of-turn explanation, session summary, sub-agent report relayed to the PO
  (see « Cas sortie de chat » below). Not internal scratch (`SPRINT.md`, draft ADR notes).
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
- **A count shown next to a truncated list LIES unless it flags the truncation.** A number placed
  beside a list (« N branches », « M fiches ») MUST derive from the **same source** as the list, and,
  when a cap truncates the display, say **« X of Y shown »** — never the bare total while only X items
  are printed. Origin: the `ezk-archive` gate announcing `branch_absorbed=26` while enumerating only 16
  (`MAX_FACTS` cap), 2026-09-21 → a count that contradicts its list hides work (here: unmerged branches —
  the opposite of « lose nothing between sessions »). Measure: under the cap, `emitted lines == announced
  count`; above it, the label carries « X/Y ».

### Cas sortie de chat — réponse de fin de tour, résumé de session

Le `Scope:` couvre aussi ce que l'humain lit **dans le fil de conversation** : l'explication de
fin de tour, le résumé de session, le compte rendu d'un sous-agent relayé au PO. Trois clauses.

1. **Canal : Markdown seul.** Le terminal de Claude Code rend le Markdown, pas le HTML.
   `<details>`, `<summary>` et tout HTML brut s'y affichent **en texte, balises comprises** : le
   bloc censé alléger la lecture la dégrade. Interdit dans le chat. Le détail technique va **en
   bas**, sous un titre Markdown (`### Détail technique`) ou en liste, sans repli. `<details>`
   **reste permis** dans les livrables `.md` committés (fiche, PR, doc) : GitHub les rend.
2. **Une fiche se cite par son titre + lien.** En prose comme en chat, une fiche (ou une PR,
   un ADR) s'écrit comme un **titre court en lien cliquable** vers son fichier. L'id peut suivre
   le titre, **jamais le remplacer**. Un id nu (`0080`, `20260826072532537`, `#175`) est un code
   interne : illisible et non navigable. Cette clause ne contredit pas la puce « Lists of
   file-backed items » : dans une liste dont chaque ligne affiche déjà le titre en clair à côté
   du lien (index généré), le lien peut rester sur l'id. Seul l'id **seul** est interdit.
3. **Leviers d'application.** Le chat n'a aucun contrôle automatique : `ezk-reviewer` juge des
   diffs, pas des réponses. La règle tient par des leviers posés ensemble : le `CLAUDE.md` du
   projet ; le style de sortie « Explication claire » du poste (`~/.claude/output-styles/`,
   hors dépôt) ; le texte des agents et des skills de la méthode, qui reprennent la clause de
   canal ; la loi compilée (`.iamthelaw/ENTRY.md`) dans un projet lié par `lawgiver bind`. Sans
   l'un d'eux, la règle reste une intention.

Origin: demande PO 2026-08-24 (« tout ce qui sort de la méthode doit être très clair, y compris
l'explication en retour de chaque LLM »), décision PO 2026-08-26 (clause « titre + lien » dans la
règle et dans `CLAUDE.md`), constat 2026-08-30 (`<details>` affiché en brut dans un projet hôte
sous le style « Explication claire »). Measure (removability): 0 balise `<details>` ou
`<summary>` visible sur les 5 prochaines réponses longues en terminal, et 0 fiche citée par son
seul id.

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

## documentation-guidelines/next-step-affordance  `[SHOULD]`

- **En clair.** Quand une commande ezk se termine, elle dit **quoi lancer ensuite**. Un petit bloc « Et maintenant ? » clôt la réponse : 1 à 3 commandes, chacune avec une raison d'une ligne. Tu n'as plus à te souvenir de la commande d'après.
- **Portée** : la réponse de clôture qu'un humain lit à la fin d'une sous-commande de skill (fin de sprint, `add` / `groom` / `ready` / `ship` du backlog…). Pas le brouillon interne, pas un index généré : `/ezk-help` reste la liste globale « quelles commandes existent ». Ici, c'est « quoi faire **maintenant**, dans cet état ».
- **Place** : le bloc vient **en dernier**, après l'« En clair » et le détail. Court, sans jargon (règle [`documentation-guidelines/human-facing-lisibility`](human-facing-lisibility.md)).
- **Deux étages, jamais mélangés** :
  - **Suite logique** : la suivante est *déterminée* par l'état (ex. après `ready <id>` → `next --ready-only`). Une ligne : la commande + pourquoi.
  - **Pistes** : des idées au choix de l'humain. Jamais formulées comme une obligation.
- **1 à 3 commandes au total.** Chaque commande sur sa ligne, puis « — », puis une raison d'une ligne (« la fiche est tirable maintenant »). Le test compte ces « — ».
- **Pas de bloc creux.** Une sous-commande en lecture seule ou sans suite naturelle (`list`, `help`) ne propose rien. On n'invente jamais une suite pour remplir le bloc.
- **Où vivent les successions.** Chaque skill qui adopte la règle la déclare dans `applies:` et garde dans son `SKILL.md` une courte section « Et maintenant ? » : une table `quand | suite logique | pistes`. Il **ne ré-explique pas** le format : il renvoie ici. Le LLM rédige le bloc d'après la table. Aucun script, aucun menu généré.
- **Les commandes citées existent.** Chaque commande de la table est un vrai skill, une vraie commande, un vrai agent ou un vrai script pnpm (le test `next-step-affordance.test.ts` le vérifie).

Origin: demande PO 2026-08-25 (« à la fin d'un sprint ou d'une commande, proposer les commandes suivantes »), après le benchmark BMAD ([rapport](../../docs/benchmarks/2026-08-25-bmad-vs-ezk.md)). Prior art BMAD : chaque agent affiche un menu numéroté (`*help`), et chaque workflow nomme le suivant (« Create Story → Validate → Dev → Code Review → Retrospective ») ; un workflow « Sprint Status » ne fait que router vers le suivant. On garde l'**idée** (dire ce qui vient après), pas le **moteur** : c'est une convention de restitution, pas un moteur de menu (garde-fou ADR-0013). Measure (removability): sur les 5 prochaines fins de `ready` / `ship` / sprint, 5/5 se terminent par un bloc de 1 à 3 commandes avec une raison chacune, et aucune sous-commande en lecture seule n'en invente un.

## documentation-guidelines/readable-deliverable-trio  `[SHOULD]`

- **En clair.** Chaque fois qu'un skill produit un texte pour l'humain (note de clôture, corps de PR, rapport), on refait le format au jugé, et on constate l'illisibilité après coup. Cette règle nomme le pattern pour ne plus le réinventer : un livrable humain = **trois pièces**.
- **Les trois pièces.**
  1. **Gabarit** : un fichier `*-template.md` qui liste les sections attendues **et**, pour chacune, une consigne courte « mets / bannis ». Source unique, lue par tous les chemins qui produisent le livrable.
  2. **Extracteur** : un script qui sort les **faits** (chiffres, états, listes). Le LLM ne les calcule pas et ne les recopie pas : il les **reçoit** (ADR-0001 : le script range et extrait, le LLM juge et rédige).
  3. **Rendu** : le LLM remplit le gabarit avec ces faits, sous la règle [`human-facing-lisibility`](human-facing-lisibility.md).
- **Format d'un gabarit.** Des sections, chacune avec sa consigne « mets / bannis ». Il **impose l'ouverture « En clair »** : le bloc figure dans le gabarit. Il porte aussi le **périmètre** : ce qu'on montre selon le contexte. Cas fondateur : le handoff d'`ezk-archive` ne restitue que la session courante ; les autres sessions sont nommées, jamais déroulées.
- **Frontière avec la règle de clarté.** Le gabarit fixe le **format**. La règle `human-facing-lisibility` garantit la **lisibilité du texte dedans**. Le gabarit ne la remplace jamais : un gabarit trop rigide produit du remplissage illisible. Le pattern = gabarit **+** extracteur **+** règle de clarté, jamais le gabarit seul.
- **Source unique.** Un gabarit n'existe qu'à un endroit. Le skill le **lie** ; il ne le recopie pas, sinon les copies divergent en silence.
- **Où il vit.** Dans le skill qui produit le livrable (`references/` ou `templates/`). Pas de dossier commun tant qu'aucun partage n'est prouvé.

### Instances connues

Chaque ligne nomme les trois pièces d'un livrable qui existe déjà. Les chemins sont relatifs à `products/mega-city/`. Le test `readable-deliverable-trio.test.ts` vérifie que chaque ligne a quatre cellules, que chaque chemin existe et que chaque gabarit porte le bloc « En clair ».

| Livrable | Gabarit | Extracteur | Rendu |
|---|---|---|---|
| Contexte et bilan d'un run autonome (`ezk-product-build`) | `skills/ezk-product-build/references/run-report-template.md` | `bin/run-report.ts` — avec `bin/run-context.ts` à l'ouverture | `skills/ezk-product-build/SKILL.md` — étape 0 (ouverture) et étape 6 (clôture) de la boucle |
| Note de handoff de clôture (`ezk-archive`) | `skills/ezk-archive/references/handoff-template.md` | `skills/ezk-archive/scripts/check.sh` | `skills/ezk-archive/SKILL.md` — « 3 réponses, zéro jargon » |
| Corps de PR rendu depuis la fiche | `skills/ezk-backlog/templates/feature-template.md` | `bin/pr-emit-local.ts` — mode sans GitHub seulement | `docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md` |
| Capture de rétro (`ezk-retro`) | `skills/ezk-retro/references/capture-template.md` | `bin/retro-captures.ts` | `skills/ezk-retro/SKILL.md` — temps 5, « La capture (obligatoire) » |
| Compte rendu de sprint (`ezk-sprint close`) | `skills/ezk-sprint/references/sprint-report-template.md` | `bin/sprint-report.ts` — avec le lot scellé | `skills/ezk-sprint/SKILL.md` — « La clôture — close » |

Trou connu : avec une PR GitHub, le corps est recopié de la fiche à la main. L'extracteur ne couvre que le mode sans GitHub.

Cas limite : pour le corps de PR, le « rendu » est un recopiage de la fiche (ADR-0029). L'extracteur et le rendu se confondent presque. Le détail est dans « Cas corps de PR » de [`human-facing-lisibility`](human-facing-lisibility.md).

### Ajouter une instance

1. Écris le gabarit : sections, consigne « mets / bannis », ouverture « En clair ».
2. Sors les faits par un script, pas à la main.
3. Ajoute une ligne à la table ci-dessus. Le test dit si un chemin manque.
4. Le skill déclare cette règle dans `applies:` et lie le gabarit.

Origin: retour PO du 2026-08-25 (rapport `ezk-archive` illisible, corrigé au cas par cas) → fiche 20260825182327490 : poser le pattern pour que la lisibilité soit structurelle, pas réparée après coup. Prior art BMAD (templates, validateurs, élicitation) : [étude](../../../../features/done/20260817113353538_etude-prior-art-bmad-templates-elicitation.md) ; on garde le trio, plus simple que leur moteur. Measure (removability): le prochain livrable humain créé par un skill arrive avec ses trois pièces dans la table, et 0 retour « illisible » du PO sur ce livrable.
