---
id: 0024
title: "Supprimer le vieux code d'avant le pivot"
type: refactor
priority: P3
product: vectorz
version:
labels: [dette]
epic:
status: idea
pr:
created: 2026-07-06
---

# 0024 — résorber la périphérie pré-pivot

> **↗️ Détachée de l'épic 0034 le 2026-09-11.** 0034 (mise à plat post-pivot) est clôturé ;
> 0024 devient un **chore autonome bas** — purger le code mort pré-pivot (`ceremony-engine`,
> `quality-intelligence`). Pas urgent, pas obsolète. La moisson des capteurs (0045) peut
> précéder cette purge ou se faire depuis l'historique git.

## En clair
Deux paquets datent d'avant le pivot. `ceremony-engine` ne sert plus à personne : il est
**supprimé** par cette fiche. `quality-intelligence`, lui, **tourne encore** (la commande `init` et
le moteur de workflow s'en servent) : on ne le touche pas ici, la suite est décrite en bas.

## Contexte / Problème
ADR-022 définit le cœur comme control plane aveugle au métier (« jamais de code
méthode-spécifique dans le cœur »). Or deux packages datent des sprints 0-5 pré-pivot
(audit 2026-07-06) : `ceremony-engine` (9 features de cérémonies scrum, zéro import depuis
app/web) et `quality-intelligence` (importé par app — SprintRunner, chemin vivant de
`sprint-run`, et InitService/templates — et par sprint-core, WorkflowEngine en type-only ;
constat 2026-07-15, fiche 0034 écart 2).
C'est de la méthode et de la qualité — territoire des ports (3) Method/Task et (4) Rules.
Par ailleurs ADR-022 est un brouillon WIP : les fondations de l'intégration mega-city
(fiche mega-city 0016, double-gated) attendent sa consolidation. (Constat 2026-07-15,
fiche 0034 : ADR-021 est mergé depuis le commit 3cb9db2/PR #48 — il reste à le **statuer**
Proposé → Accepté, plus à le merger.)

## Proposition
1. ~~Statuer ADR-021 Proposé → Accepté~~ **FAIT** (ADR-021 Accepté le 2026-07-15, fiche
   0035 / PR #12). Reste : statuer ADR-022 (WIP → Proposé, avec la décision EscalationPort
   « différé » — cf. mega-city ADR-0011 §4).
2. ceremony-engine : sortir du cœur — supprimer, ou geler derrière le Method port si une
   méthode future en a besoin ; décision à l'ADR.
3. quality-intelligence : idem derrière le Rules port/DoDCheck (le seam ADR-020 couvre déjà
   le besoin vivant).

## Critères d'acceptation
- [x] ADR-021 statué (Proposé → Accepté) — **fait, fiche 0035 / PR #12 (2026-07-15)**
- [ ] ADR-022 statué (WIP → Proposé)
- [x] `ceremony-engine` supprimé — 0 importeur (preuve : `grep -rn "@cop1/ceremony-engine"` ne rend
      que le paquet lui-même ; aucun `package.json`, `tsconfig` ni `import` des autres paquets).
- [ ] `quality-intelligence` supprimé — **non fait, vivant** (voir « Suite »)
- [x] build/tests verts après résorption — `pnpm build` (tsc -b) vert ; `pnpm test` racine :
      661 tests / 123 fichiers avant, 624 / 113 après (les 37 tests / 10 fichiers retirés sont ceux
      du paquet supprimé) ; `pnpm lint` et `check-links.sh` verts ; `pnpm install --frozen-lockfile` vert.
- [ ] la fiche mega-city 0016 (cap cop1) n'est plus bloquée côté cop1

## Comment vérifier
```bash
git ls-files products/cop1/packages/ceremony-engine | wc -l   # 0
pnpm install --frozen-lockfile && pnpm build && pnpm test     # verts
```

## Livré (2026-10-01) — la moitié sûre
- Supprimé : `products/cop1/packages/ceremony-engine/` (30 fichiers), son entrée dans le script
  `build` racine, son bloc dans `pnpm-lock.yaml` (12 lignes), sa ligne dans `docs/GETTING_STARTED.md`.
- Corrigé au passage : la phrase « 8 packages » du prompt de l'agent dev
  (`sprint-core/.../DevPromptTemplate.ts`) nommait `ceremony-engine` ; elle nomme maintenant
  `journal-validator`. Texte seul, aucun test ne l'épinglait.
- Laissé tel quel, par choix : les ADR (022, 027, 030, mega-city 0011) et `docs/brownfield-snapshot.md`
  (instantané du 2026-04-15) citent encore `ceremony-engine` — ce sont des documents datés, pas des
  descriptions du présent.

## Suite — `quality-intelligence` (à décider par le PO)
Le paquet est **vivant**. Deux usages réels (constat du 2026-10-01) :
1. `app/src/features/init/application/InitService.ts` importe `TEMPLATES` depuis
   `@cop1/quality-intelligence/templates/index.js` — dépendance d'**exécution** de `init`.
2. `sprint-core/src/features/workflow/application/WorkflowEngine.ts` (et son test) importe le **type**
   `QualityGatePort` — dépendance de typage seule.

Marche à suivre quand le PO tranche : (a) déplacer `QualityGatePort` dans `sprint-core` (là où il
est consommé) ; (b) déplacer `TEMPLATES` dans `app` (ou dans le catalogue mega-city) ; (c) supprimer
le paquet, son entrée du script `build` racine, ses références dans les `package.json` et `tsconfig`
d'`app` et de `sprint-core`, et son bloc de `pnpm-lock.yaml`. Cela touche **deux paquets vivants** :
une PR à part, avec sa propre revue.
Aussi restant : statuer ADR-022 (WIP → Proposé).

## Notes / décisions
Le README et le brownfield-snapshot (avril) sont en retard sur le code (« 2 stubs
restants » périmé) — les rafraîchir dans la même passe.
