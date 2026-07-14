# ADR 0004 — `capture` : plan pur + ports LLM aux bords + journal append-only

- Statut : **proposé** (sprint 2, fiche 0002)
- Date : 2026-06-26

## Contexte

`capture <target> <kind>` (kind = rule | skill | agent | interaction) doit
**capitaliser en cours de projet** : ajouter une règle / skill / agent /
interaction, l'**historiser** dans `journal/learnings.md`, et **commiter** — pour
qu'une session future en bénéficie via `bind` (le « flywheel »).

Contrainte non négociable (leçon `lifefindsaway`, ADR-0001) : **le LLM ne range
jamais**. Il **rédige** (le contenu) et **juge** (un avis), mais l'écriture dans
le catalogue, l'append au journal et le commit git sont faits par le **script**,
toujours pareil, testables. C'est précisément l'étape où `lifefindsaway` a mis le
LLM dans le cœur (transitions d'état) et a perdu sa fiabilité.

## Décision

1. **Réutiliser le pattern d'ADR-0003 : calcul pur → I/O en frontière.**
   - `planCapture(target, kind, authored, date)` est **pur** : il calcule un
     `CapturePlan = { artifact: FileWrite, journalLine: string, commitMessage: string }`.
     Aucun disque, aucun git, aucun LLM. 100 % testable, déterministe.
   - `applyCapture(plan, rootDir)` est la **coquille I/O** (la seule à toucher le
     disque et git) : écrit l'artefact, **append** la ligne au journal
     (append-only, jamais de réécriture), `git add` + `git commit`.

2. **Le LLM uniquement aux bords, injecté via `CapturePorts`** (domain.ts) :
   - `author(brief): Promise<string>` → rédige le markdown de l'artefact.
   - `judge(candidate, corpus): Promise<{ ok, notes }>` → **avis non bloquant** ;
     ses `notes` alimentent le résumé de la ligne de journal. Un `ok: false` ne
     bloque pas (consultatif) — il est tracé, pas exécutoire.
   - En test, les ports sont **mockés** : zéro appel LLM réel dans la CI.

3. **4 kinds = 4 destinations dans le catalogue** (discrimination `kind`
   centralisée en UN point, invariant ADR-0002) :
   - `rule`        → `rules/<id>.md`, frontmatter `kind: disposition`
   - `interaction` → `rules/<id>.md`, frontmatter `kind: interaction` (ADR-0002)
   - `skill`       → `skills/<id>.md`
   - `agent`       → `agents/<id>.md`
   L'`id` est validé par `assertSafeId` (anti-traversal, ADR-0003/F1).

4. **`journal/learnings.md` = append-only.** Une ligne par capture
   (`| date | cible | type | résumé | commit |`), ajoutée **en bas**, jamais
   réécrite. La date est **passée en paramètre** (pas de `Date.now()` dans le
   chemin reproductible). Le `git log` EST le lien fort ; la colonne `commit`
   reste vide au POC (on ne peut pas inclure son propre sha dans le commit qu'on
   crée — back-write/amend = complexité reportée).

5. **Commit déterministe** : message conventional `chore(capture): <kind> <id>`
   (passe le hook `commit-msg` que `bind` pose — dogfooding).

## Conséquences

- **Plus facile** : tester le cœur sans LLM ni disque (plan pur + ports mockés) ;
  garantir « le LLM ne range jamais » par construction (toute écriture est dans
  `applyCapture`) ; rejouer/auditer via le journal + `git log`.
- **À surveiller** : `applyCapture` doit rester la SEULE frontière I/O de capture.
- **Hors POC (fiches de suivi)** : (a) **câbler** une interaction capturée dans
  les `interactions[]` d'un agent existant (append à une liste de frontmatter —
  le vrai flywheel `/capture ezk-reviewer --interaction "…"`) ; (b) back-write du
  sha dans la colonne `commit` ; (c) résolution d'un `level` par défaut pour les
  rules capturées ; (d) **charger un vrai corpus pour `judge`** : au POC le juge
  reçoit `[]` (consultatif mais aveugle au catalogue, pas de détection de doublon).

## Alternatives écartées

- **author/judge font l'écriture** — c'est remettre le LLM dans le cœur : l'échec
  `lifefindsaway`. Rejeté (ADR-0001).
- **Pas de plan, écrire directement** — perd la testabilité sans disque/LLM et
  rompt la symétrie avec `bind` (ADR-0003). Rejeté.
- **Réécrire le journal pour y mettre le sha** — casse l'append-only. Rejeté.
