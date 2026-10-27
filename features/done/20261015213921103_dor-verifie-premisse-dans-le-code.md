---
id: "20261015213921103"
title: "« Prête » force un caveat (réservé panel/maquette) dans un blocked: typé, pas en note libre"
type: feature
priority: P2
product: mega-city
labels: [methode, dor]
milestone: preparation
version:
status: shipped
pr: "local (9e95dad8)"
evidence: none # cran de process, pas d'écran
created: 2026-10-15
blocked:
---

# 20261015213921103 — « Prête » vérifie que la prémisse tient dans le code

**En clair.** Aujourd'hui « prête » certifie une fiche **bien écrite**, pas une fiche dont le caveat est
**visible**. Une fiche a dû être sautée en plein build parce qu'elle portait « réservé panel/maquette »
en **note libre** — l'intake ne lit que le champ `blocked:`. On ferme ce trou : « prête » **refuse de
laisser une réservation en prose** ; elle doit passer par un `blocked:` **typé**, que l'intake lit déjà.
Le champ n'est pas à créer — il existe. (La panne voisine, « la fiche cite une surface de code
absente », part en spike séparé.)

**Si tu arrives frais.** La *DoR* (« definition of ready ») = les cases à cocher pour qu'une fiche soit
tirable. `ezk dor check` vérifie aujourd'hui que les sections **existent** et mentionnent chaque item ;
il ne vérifie pas que ce qu'elles **citent** existe dans le code.

## Contexte / Problème

Relevé par l'audit adverse du découpage (2026-10-15, lentille PO), sur un cas vécu : au run v0.16, la
fiche [trier les sorties de rétro](../20261002155911271_trier-sorties-retro-par-nature.md) était prête
mais a dû être sautée — elle demandait d'aligner une 3ᵉ surface (« README `.rules/` ») et un concept
(« règle en observation ») qui n'existent dans aucun fichier.

- `ezk dor check` est un contrôle **textuel** de complétude (`skills/ezk-backlog/SKILL.md:377`).
- Le seul ancrage réel au monde est les dépendances **externes** (repo, service, secret — « accès
  constaté le … », `ezk-backlog:321`).
- Une prémisse **interne** (« la fiche suppose que la fonction / la surface X existe ») n'est jamais
  confrontée au code. Le pilote croit la fiche tirable ; elle ne l'est pas.

## Proposition

**Décidé par panel adverse le 2026-10-27, trois voix unanimes.** Le panel a éprouvé la reco précédente
(« ajouter un champ `needs-design:` ») et l'a **renversée** : le champ existe déjà, il s'appelle
`blocked:`.

### Deux pannes distinctes (constat conservé)

1. **La surface citée n'existe pas.** La fiche suppose un `README .rules/`, une « règle en observation »
   absents du code. Le pilote la croit tirable ; elle ne l'est pas.
   *(cas v0.16 : [trier les sorties de rétro](../20261002155911271_trier-sorties-retro-par-nature.md).)*
2. **Le caveat est invisible à l'intake.** La fiche porte « réservé panel/maquette » en **note libre**.
   L'intake n'écarte que sur `blocked:` ; le caveat surgit en plein build.
   *(cas 2026-10-24 et 2026-10-26, voir Notes.)*

### Ce que le panel a trouvé dans le code

`blocked:` est **déjà** un champ à **raisons typées** (liste fermée : `attend-panel`, `attend-maquette`,
`sous-revue`, `auto-édition-risquée`… — `src/backlog/blocked-reasons.ts`). Les **trois** chemins
d'intake l'écartent déjà avant le build : `plan:head`, `plan:lot`, et le run autonome
(`run-eligibility`, qui escalade sans délibérer). La fiche elle-même portait `blocked: attend-panel`.

Donc la panne 2 n'est **pas** « un champ manque ». C'est « l'auteur a écrit le caveat en prose au lieu
de poser le `blocked:` typé qui existait sous sa main ». Un second champ (`needs-design:`) serait un
**doublon** : un endroit de plus à oublier, une 2ᵉ plomberie à câbler, et — le validateur ne refusant
aucun champ inconnu — une faute de frappe (`need-design:`) passerait en silence, rebâtissant la panne.

### La décision (voie retenue)

**Pas de champ neuf. On gate `blocked:`.** La porte « prête » (`ezk dor check` / `ready`) **refuse, ou
signale**, une fiche qui porte une **réservation en prose libre** (mots « réservé », « maquette »,
« panel », « pas d'autonomie », « hands-off »…) **sans `blocked:` typé correspondant**. Le caveat est
ainsi forcé dans le champ que l'intake lit déjà. On réutilise les raisons typées existantes ; on n'en
ajoute une (p.ex. `réservé-design`) que si une sémantique vraiment distincte le justifie.

**Panne 1 → spike séparé (voie a), hors gate.** Confronter au code les surfaces citées a de la valeur,
mais sa fiabilité n'est pas prouvée (« règle en observation » n'est pas greppable). À éprouver hors
gate, dans une fiche spike dédiée — pas ici.

**ADR court** à écrire au build : panne 2 = règle de gate sur `blocked:` (zéro champ neuf) ; panne 1 =
spike. Statu quo écarté — trois cas datés en chiffrent le coût (sprints sautés, caveats découverts en
plein build).

## Critères d'acceptation

- [ ] Une fiche qui porte une **réservation en prose libre** (« réservé », « maquette », « panel »,
      « pas d'autonomie ») **sans `blocked:` typé** ne passe pas « prête » en silence : `ready` /
      `ezk dor check` la refuse ou la signale, avec la raison. **Preuve** : le rejeu du cas 2026-10-26
      est vert — la réservation est attrapée avant le build, plus découverte en pleine construction.
- [ ] Une fois le caveat porté par un `blocked:` typé (p.ex. `attend-maquette`), les **trois** chemins
      d'intake l'écartent avant le build : `plan:head` la met en différées, `plan:lot` en écartées avec
      la raison, le run autonome l'escalade sans délibérer.
- [ ] **Aucun champ neuf** : `rg "needs-design" products/mega-city/src` rend 0 ; le validateur de fiche
      ne gagne aucun champ. La réservation passe par `blocked:` + la détection de prose.
- [ ] **Précédence** figée par un test : une fiche portant `blocked:` ET une réservation en prose →
      la raison `blocked:` prime et s'affiche.
- [ ] Un ADR court acte la décision (panne 2 = gate sur `blocked:` ; panne 1 = spike).
- [ ] Gate locale verte (`pnpm test` + `pnpm test:scripts`).

## Comment vérifier

```bash
cd products/mega-city
# 1. Une réservation en prose libre sans blocked: typé ne passe pas « prête » en silence
pnpm ezk backlog ready <fiche-test-avec-note-libre>   # → refus ou signal, avec la raison
# 2. Portée par un blocked: typé, elle est écartée par les trois chemins d'intake
pnpm plan:head          # la fiche est en « différées », pas en tête
pnpm plan:lot           # elle est en « écartées » avec sa raison
pnpm run:eligibility <id>   # disposition escalate/defer + message
# 3. Aucun champ neuf n'a été introduit
rg "needs-design" src   # → 0
```

## Notes / décisions

- Provenance : rapport d'audit du découpage, 2026-10-15 (famille « vrai manque de modèle »). Cas daté :
  note de rétro « une fiche ready peut porter une prémisse absente du code » (2026-10-14).
- Cas fondateur : [trier les sorties de rétro](../20261002155911271_trier-sorties-retro-par-nature.md).
- `blocked: attend-panel` : change le modèle de la DoR — à tenir avec le PO, pas en run autonome.

- **Nouveau cas daté (2026-10-24, run board) — la donnée, pas seulement le code.** La sœur 3
  [runs réels](20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md) était `ready`,
  mais sa prémisse — des journaux portant la clé `chantier` + les moments — **n'existe pas dans la
  donnée vécue** (0 clé chantier sur 132 journaux réels, même en contrat v0.2). C'est le symptôme exact
  de cette fiche, côté **donnée émise** plutôt que surface de code. Renforce la voie (a) : la DoR d'un
  **read-model** devrait confronter au réel la donnée qu'il prétend afficher, pas seulement les surfaces
  de code citées. (Capture : `docs/captures/2026-10-24-retro-board-build-light.md`.)

- **Nouveau cas daté (2026-10-26, rétro ADR-084) — le caveat en note libre, invisible à l'intake.** La
  même fiche [runs réels](20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md)
  portait aussi « réservé panel/maquette, pas d'autonomie hands-off » en **note libre** : l'intake, qui
  n'écarte que sur le champ `blocked:`, ne l'a pas vu — le caveat n'a surfacé qu'en pleine construction.
  **Facette à trancher au panel** : un **champ structuré** « réservé / needs-design » (comme `blocked:`),
  lu par l'intake AVANT le build, plutôt qu'une phrase que personne ne lit. (Capture :
  `docs/captures/2026-10-26-retro-session-adr084-board.md`.)

- **2026-10-27 : panel adverse tenu (3 voix) → `blocked: attend-panel` levé, fiche rendue tirable.**
  Verdict unanime GO-sous-conditions, qui **renverse** la reco « champ `needs-design:` » : ce champ
  doublonne `blocked:`, dont les raisons typées sont déjà lues par `plan:head`, `plan:lot` et
  `run-eligibility` (`src/backlog/blocked-reasons.ts` ; patron posé par
  [raisons typées pour blocked](20261013131632484_raisons-typees-pour-blocked.md)). Risque relevé
  par le dev : le validateur ne refuse aucun champ inconnu, donc un `needs-design:` mal orthographié
  passerait en silence. Voie retenue : **gate sur `blocked:`** — « prête » refuse une réservation laissée
  en prose libre sans `blocked:` typé. Panne 1 (confronter au code) → spike séparé, hors gate.
