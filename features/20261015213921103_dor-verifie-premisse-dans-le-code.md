---
id: "20261015213921103"
title: "« Prête » (DoR) vérifie que la prémisse interne de la fiche tient dans le code"
type: feature
priority: P2
product: mega-city
labels: [methode, dor]
milestone: preparation
version:
status: idea
pr:
evidence: none # cran de process, pas d'écran
created: 2026-10-15
blocked: attend-panel — change le modèle de la DoR, arbitrage PO requis
---

# 20261015213921103 — « Prête » vérifie que la prémisse tient dans le code

**En clair.** Aujourd'hui « prête » certifie une fiche **bien écrite** (ses sections sont remplies),
pas une fiche dont la **prémisse tient**. Une fiche prête a dû être sautée parce qu'elle supposait des
surfaces — un « README `.rules/` », une « règle en observation » — qui n'existent **nulle part** dans
le code. On veut décider si le grooming / la DoR doit confronter au code les surfaces internes citées,
ou si « prête » reste une promesse de rédaction.

**Si tu arrives frais.** La *DoR* (« definition of ready ») = les cases à cocher pour qu'une fiche soit
tirable. `ezk dor check` vérifie aujourd'hui que les sections **existent** et mentionnent chaque item ;
il ne vérifie pas que ce qu'elles **citent** existe dans le code.

## Contexte / Problème

Relevé par l'audit adverse du découpage (2026-10-15, lentille PO), sur un cas vécu : au run v0.16, la
fiche [trier les sorties de rétro](20261002155911271_trier-sorties-retro-par-nature.md) était prête
mais a dû être sautée — elle demandait d'aligner une 3ᵉ surface (« README `.rules/` ») et un concept
(« règle en observation ») qui n'existent dans aucun fichier.

- `ezk dor check` est un contrôle **textuel** de complétude (`skills/ezk-backlog/SKILL.md:377`).
- Le seul ancrage réel au monde est les dépendances **externes** (repo, service, secret — « accès
  constaté le … », `ezk-backlog:321`).
- Une prémisse **interne** (« la fiche suppose que la fonction / la surface X existe ») n'est jamais
  confrontée au code. Le pilote croit la fiche tirable ; elle ne l'est pas.

## Proposition

**Décision de modèle, réservée au PO / au panel** (d'où `blocked: attend-panel`). Deux voies :

- **(a)** Ajouter un cran de DoR « les surfaces / concepts internes cités existent » — vérification
  semi-mécanique au grooming : le LLM liste les surfaces citées, un contrôle vérifie leur présence
  dans le dépôt (doctrine ADR-0001 : le script range, le LLM juge).
- **(b)** Acter que « prête » = promesse de rédaction, et compter sur le groom ou le dev pour buter
  sur la prémisse absente (statu quo, assumé).

Pas de construction tant que le panel n'a pas tranché.

## Critères d'acceptation

> Provisoires — à finaliser au panel selon la voie retenue.

- [ ] Une fiche d'alignement de doc qui cite une surface interne inexistante ne passe pas « prête »
      en silence : soit un signal au grooming, soit une décision explicite journalisée.

## Comment vérifier

```bash
# Rejouer le cas fondateur : la fiche trier-sorties-retro cite « .rules/ » et « règle en observation »
# qui n'existent pas — la DoR doit le signaler (voie a), ou la fiche assume le risque (voie b).
cd products/mega-city && pnpm ezk dor check 20261002155911271
```

## Notes / décisions

- Provenance : rapport d'audit du découpage, 2026-10-15 (famille « vrai manque de modèle »). Cas daté :
  note de rétro « une fiche ready peut porter une prémisse absente du code » (2026-10-14).
- Cas fondateur : [trier les sorties de rétro](20261002155911271_trier-sorties-retro-par-nature.md).
- `blocked: attend-panel` : change le modèle de la DoR — à tenir avec le PO, pas en run autonome.

- **Nouveau cas daté (2026-10-24, run board) — la donnée, pas seulement le code.** La sœur 3
  [runs réels](done/20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md) était `ready`,
  mais sa prémisse — des journaux portant la clé `chantier` + les moments — **n'existe pas dans la
  donnée vécue** (0 clé chantier sur 132 journaux réels, même en contrat v0.2). C'est le symptôme exact
  de cette fiche, côté **donnée émise** plutôt que surface de code. Renforce la voie (a) : la DoR d'un
  **read-model** devrait confronter au réel la donnée qu'il prétend afficher, pas seulement les surfaces
  de code citées. (Capture : `docs/captures/2026-10-24-retro-board-build-light.md`.)
