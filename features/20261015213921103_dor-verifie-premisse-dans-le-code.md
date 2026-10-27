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

**Décision de modèle, réservée au PO / au panel** (d'où `blocked: attend-panel`). L'avis d'architecte
ci-dessous éclaire le choix ; il ne le tranche pas.

### Le constat de l'architecte : deux pannes distinctes, pas une

Le titre parle d'« une » prémisse, mais les cas vécus montrent **deux pannes différentes**.

1. **La surface citée n'existe pas.** La fiche suppose un `README .rules/`, une « règle en
   observation » qui ne sont nulle part. Le pilote la croit tirable ; elle ne l'est pas.
   *(cas v0.16 : [trier les sorties de rétro](20261002155911271_trier-sorties-retro-par-nature.md).)*
2. **Le caveat est invisible à l'intake.** La fiche porte « réservé panel/maquette » en **note
   libre**. L'intake ne la lit pas — il n'écarte que sur le champ `blocked:`. Le caveat surgit en
   plein build. *(cas 2026-10-24 et 2026-10-26 : board runs réels, voir Notes.)*

Les trois voies ne répondent donc pas à la même question. (a) attaque la panne 1. (c) attaque la
panne 2. (b) ne touche à rien. **(a) et (c) ne s'excluent pas** : elles réparent deux choses.

### Les options

| Voie | Ce qu'elle fait | Complexité | Fiabilité | Panne visée |
|---|---|---|---|---|
| **(a)** confronter au code | le LLM liste les surfaces citées, un script vérifie leur présence dans le dépôt | haute | **incertaine** — « règle en observation » n'est pas un chemin greppable ; faux positifs/négatifs | panne 1 |
| **(b)** statu quo | « prête » = promesse de rédaction | nulle | — | aucune |
| **(c)** champ `needs-design:` | un champ structuré, lu par l'intake avant le build, comme `blocked:` | basse | **sûre** — c'est de la donnée, le script la lit (ADR-0001) | panne 2 |

### Choix recommandé — (c) maintenant, (a) en spike, (b) écartée

- **(c) d'abord.** C'est le plus petit morceau utile. Il reprend le patron **éprouvé** de `blocked:` :
  un champ, l'intake le lit, aucune intelligence à écrire. Il règle la panne la plus récente et la
  plus concrète (2026-10-26). Réversible, doctrine-propre (le script range, personne ne juge).
- **(a) en spike, pas en gate dès la v1.** Confronter la prémisse au code a de la valeur, mais sa
  fiabilité n'est **pas prouvée** : comment grepper un concept comme « règle en observation » ? Gater
  « prête » sur un contrôle qui se trompe serait pire que le mal. À éprouver d'abord sur quelques
  fiches, hors gate, avant d'en faire un cran bloquant.
- **(b) écartée comme réponse permanente.** Trois cas datés chiffrent le coût du statu quo : des
  sprints sautés, des caveats découverts en plein build.

**ADR à ouvrir quand le panel valide.** La décision change le modèle de la DoR : elle est durable,
donc elle mérite un ADR court. Mais pas avant l'arbitrage — la fiche reste `blocked: attend-panel`,
et il n'y a **pas de construction** tant que le panel n'a pas tranché.

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

- **Nouveau cas daté (2026-10-26, rétro ADR-084) — le caveat en note libre, invisible à l'intake.** La
  même fiche [runs réels](done/20261024130842250_board-web-runs-reels-adaptateur-projectchantiers.md)
  portait aussi « réservé panel/maquette, pas d'autonomie hands-off » en **note libre** : l'intake, qui
  n'écarte que sur le champ `blocked:`, ne l'a pas vu — le caveat n'a surfacé qu'en pleine construction.
  **Facette à trancher au panel** : un **champ structuré** « réservé / needs-design » (comme `blocked:`),
  lu par l'intake AVANT le build, plutôt qu'une phrase que personne ne lit. (Capture :
  `docs/captures/2026-10-26-retro-session-adr084-board.md`.)
