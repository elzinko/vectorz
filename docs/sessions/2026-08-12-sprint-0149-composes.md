# SPRINT — 0149 `composes:`

> Run supervision : `2026-08-09T14-19-35-747Z-b9c51278` · mode `--checkpoints auto --tokens cap`
> Méthode : ezk-product-builder (build). Scratch éphémère par-branche.

## Fiche en cours
- **0149** — formaliser la composition inter-skills (`composes:`) · P1 · mega-city · ready `2026-08-09`

## Definition of Done (fiche 0149 — 3 critères)
- [x] binder un profil sans un composant requis (manquant DIRECT ou TRANSITIF) émet un warning listant les manquants — `checkComposition` + `lawgiver bind-global` (stderr) · tests composition.test.ts (dont cas transitif)
- [x] les refs externes (skill-creator, product-brainstorming) ne déclenchent AUCUN warning — `composesExternal` exempté · test dédié
- [x] le diagramme Mermaid est régénéré par script et à jour dans skills/README.md — `composes:graph` idempotent · test composes-graph.test.ts
- [x] gate locale verte (typecheck 0 · 358 tests) · revue GO (self-review : pur, assertSafeId, déterministe)

## Livraison
- Commit `8507305` sur `feat/0149-composes-inter-skills` (14 fichiers).
- **PR #121 ouverte** (base `main`) : https://github.com/elzinko/vectorz/pull/121 · `@codex review` déclenché · CI en cours.
- **Décision PO (2026-08-09) : option A** — push + PR faits, **merge laissé à l'humain**. Le builder est en PAUSE avant merge (pas de `ship`, run supervision laissé ouvert).

## Codex (PR #121) — historique
- **R1 (P1)** bind par-projet non couvert → `reportComposition` aussi dans `runBind` — corrigé `21febc2`, fil Resolved.
- **R2 (P2)** octet NUL littéral dans `composition.ts` (fichier binaire pour git) → échappement `\0` — corrigé `932c1ee`.
- **R3 (P2)** `ezk-preview` annoté requis → faux warning sur `daily` (preview y est exclu exprès) — retiré `eec1956`, fil Resolved.
- **R4 (P2)** demande d'**ajouter `ezk-codex`** → **oscillation** : même cas qu'ezk-preview (délégué-si-présent, `daily` l'omet, ezk-sprint dégrade l.191). L'ajouter recréerait le faux positif de R3.
- **Racine = trou #7** : `composes:` n'a pas de tier « optionnel/candidat ». **STOP anti-boucle** (4e round). Décision design remontée à l'humain (décliner R4 / accepter / créer tier optionnel).

## Notes / décisions
- **2026-08-09 — Archi (ADR-0025, casquette architecte tenue en propre, mode cap).**
  Décision : `Skill.composes?` + `Skill.composesExternal?` (docs/domain.ts) · loader parse
  `composes:`/`composes-external:` · **checker pur** `src/core/composition.ts`
  (`checkComposition(resolved, catalog)`, fermeture transitive, exempte les externes) ·
  **bord** `bin/lawgiver.ts` imprime les warnings sur stderr (bind() reste PUR) ·
  **script** `bin/regen-composes-graph.ts` → bloc managé Mermaid dans skills/README.md.
  **Scope OUT journalisé** : remodel « Skill = dossier + scripts/ » (proposition §2) —
  non requis par les 3 critères, impacte les caps (gate fiche 0121), déféré. POC = rendre
  la composition mécanique (détection + graphe), pas le remodel.
- **Délégation** : implémentation → ezk-tdd (contexte jetable, éco tokens cap) ; revue → ezk-reviewer.
  Pas d'E2E Playwright (feature domaine/CLI, aucune UI).
- **2026-08-09 — Checkpoint « aucune fiche ready » (intake).** Aucune fiche tirable dans le PLAN :
  tête de séquence = 0149 (todo, DoR complète mais sans tampon `ready:`) ; seule fiche ready = 0044,
  hors-plan (parquée depuis la maj roadmap 2026-07-30). Gate `ready` jamais auto-tamponné (ADR-0016 A5)
  → STOP humain. **Décision PO : option A** — valider la DoR de 0149 (jugée complète : problème ADR-0012 +
  4 intégrations fantômes · valeur enabler bloquant 0102 · 3 critères observables · aucune dépendance externe)
  puis construire. Gate posé (`ready: 2026-08-09`). Build délégué à `ezk-sprint`.
- **[ezk-pm] 2026-08-10 — Checkpoint Codex R4 (oscillation `composes:` ezk-sprint) → option A.**
  Décliner R4 : `composes:` reste « requis seulement » pour la PR #121. Motif : ajouter `ezk-codex`
  requis (B) recrée le faux warning `daily` que R3 venait d'éteindre → sabote la valeur cœur du POC
  (signal propre) ; créer le tier optionnel maintenant (C) = scope creep sur PR prête (CI verte,
  DoD 3/3) en mode cap. Le trou #7 (tier optionnel/candidat) part en **follow-up P2 par ENRICHISSEMENT
  de la fiche 0149** (limite connue + critère `composes-optional:` qui ne warne jamais sur absence),
  pas de nouvelle fiche. Réversibilité : le tier optionnel réintègrera ezk-preview + ezk-codex sans
  toucher au checker requis. Réponse Codex R4 = décliner + 👎, motif « même cas que R3, tracé follow-up P2 ».
  Merge #121 laissé à l'humain (inchangé).
