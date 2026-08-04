---
id: 0182
title: E4 bis — docs vivants post-BMAD (complément 0039)
type: chore
priority: P3
product: vectorz
epic:
depends: ["0039"]
labels: [hygiene, docs, epoch-2]
status: in-progress
ready: 2026-08-05
pr: "#101"
created: 2026-08-05
---

# 0182 — E4 bis : docs vivants post-BMAD

## Contexte / Problème

La fiche [0039](done/0039-e4-retrait-bmad.md) (E4, shipped #81) a retiré BMAD du graphe
prod cop1, mais plusieurs **docs d'onboarding encore lus en premier** décrivent l'époque 1
(orchestrator BMAD, playbook, sprint-status.yaml, stubs V1-light). Un nouveau contributeur
ou agent suit encore le mauvais chemin. `docs/bmad-version-audit.md` et
`products/cop1/supervisor-playbook.md` restent à la racine sans bannière d'archive.

## Proposition

1. **Réécrire** les docs vivants pour l'époque 2 : `README.md`, `docs/GETTING_STARTED.md`,
   `docs/running-cop1-on-a-project.md` — dogfood = mega-city (`ezk-backlog` / `ezk-sprint` /
   `ezk-start`) + supervision cop1 (`cop1 start`, Moniteur).
2. **Archiver** `docs/bmad-version-audit.md` et le playbook epoch-1 BMAD sous
   `docs/archive/epoch-1-bmad/` ; laisser un stub pointer vers l'archive.
3. **Mettre à jour** `docs/index.md` et une note `PLAN.md` (hygiène).
4. **Ne pas toucher** : `bmad-bridge`, `init-bmad-bridge`, `useBMAD`, ADR-032, allowlist
   `no-bmad-in-prod` pour le bridge intentionnel ; fiche **0162** reste LATER.
5. **CLI epoch-1** (`orchestrator`, `sprint *`, `transcript`) : conserver les stubs
   `exitWithEpoch2MethodHint` (messages actionnables) — déjà conformes E4.

## Critères d'acceptation

- [ ] README + GETTING_STARTED + running-cop1-on-a-project décrivent mega-city + cop1 start,
      pas l'orchestrator BMAD comme chemin principal
- [ ] `bmad-version-audit.md` et playbook epoch-1 archivés ; liens depuis index mis à jour
- [ ] `bmad-bridge` / `init-bmad-bridge` / ADR-032 inchangés ; 0162 non démarrée
- [ ] `tools/boundary/no-bmad-in-prod.test.ts` vert ; build + tests pertinents verts
- [ ] PR feature mergée puis fiche shippée

## Notes

- Complément doc-only de 0039 — pas un second retrait code.
- BMAD externe : renvoyer vers `docs/brancher-une-methode-existante.md` + fiche 0162 (LATER).
