---
id: "20260930194219068"
title: "ezk-product-build : orchestrateur de session, contrat de sprint redéfini (Option A)"
type: refactor
priority: P1
product: mega-city
milestone:
labels: [sprint]
depends: ["20260930194219046", "20260930123438875"]
status: idea
pr:
evidence: none # méthode / skills, pas d'écran
created: 2026-09-30
---

# 20260930194219068 — ezk-product-build : orchestrateur de session, contrat de sprint redéfini (Option A)

## En clair

Dernière brique du cycle. Une fois le lot (fiche 1) et les verbes `start`/`close` (fiche 2) en
place, il faut **reposer** `ezk-product-build` : il n'enchaîne plus des *features*, il enchaîne des
**sprints** (des lots), et son checkpoint passe **entre incréments**, plus entre features. C'est
l'**Option A** tranchée par le PO le 2026-09-30.

## Contexte / Problème

Le panel adverse a trouvé une **contradiction** : l'ADR-0054 fait de `run` le cycle complet
(construit N stories), alors qu'aujourd'hui `ezk-product-build` **appelle `ezk-sprint` fiche par
fiche** et tient lui-même le checkpoint inter-sprint. Les deux ne peuvent pas être vrais.

**Arbitrage PO — Option A** : c'est **`ezk-sprint`** qui possède la boucle du lot
(`run` = `start → N stories → close` = 1 incrément). Donc `ezk-product-build` doit être **reposé**
au-dessus : il enchaîne des **sprints** (lots), pas des features. Sans cette fiche, le contrat
`ezk-product-build ↔ ezk-sprint` reste contradictoire.

## Proposition

- **Redéfinir le contrat** : `ezk-product-build` confie à `ezk-sprint` **un lot** (pas une fiche),
  et `ezk-sprint` boucle les stories du lot jusqu'à l'incrément.
- **Checkpoint entre incréments** : le checkpoint inter-sprint de `ezk-product-build` se déplace
  **entre lots livrés**, plus entre features. Un seul checkpoint par sprint (lot), pas par story.
- Aligner `SKILL.md` d'`ezk-product-build` : « la boucle », « frontière & délégation »,
  l'absorption/checkpoint, et les exemples.
- Vérifier la cohérence avec la rétro-compat par verbe (fiche 2) : un `run` hérité au niveau
  feature doit continuer de s'arrêter là où avant (golden-path).

## Critères d'acceptation

- [ ] `ezk-product-build` confie un **lot** à `ezk-sprint` (plus une fiche isolée) ; le contrat est explicite dans son `SKILL.md`.
- [ ] Le **checkpoint inter-sprint** se joue **entre incréments** (lots), un par sprint.
- [ ] La **contradiction `run` ↔ product-build** est levée et documentée (Option A) ; plus aucune formulation contradictoire dans les 3 `SKILL.md`.
- [ ] Rétro-compat : un `run`/`--checkpoints ask`/`once` hérité s'arrête **où avant** (test narratif golden-path).
- [ ] Tests verts (`test` + `test:scripts`).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
grep -nE "lot|incrément|sprint" products/mega-city/skills/ezk-product-build/SKILL.md
```

## Notes / décisions

- Dépend de la fiche 1 ([lot](20260930194219046_ezk-backlog-lot.md)) et de la fiche 2 ([start/close](done/20260930123438875_cycle-vie-sprint-session-ceremonies.md)) — construite **en dernier**.
- Lève la contradiction pointée par le panel (architecte) le 2026-09-30 ; Option A actée par le PO. Voir [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md).
