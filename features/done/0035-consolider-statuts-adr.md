---
id: 0035
title: Consolider les statuts ADR (re-tampons sans gate démo — L4a de 0034)
type: chore
priority: P0
product: vectorz
epic: 0034
status: shipped
pr: "#12"
created: 2026-07-15
---

# 0035 — Consolider les statuts ADR

## Contexte / Problème

Amont validé par panel adverse (2026-07-15). Le seul vrai préalable de « la suite » :
tant que les statuts ADR mentent, chaque passe de nettoyage ou de suppression peut
rouvrir des décisions déjà prises. Ce lot ne touche **que les re-tampons sans dépendance
à la démo** (extraits du lot L4a de la fiche [0034](../0034-mise-a-plat-post-pivot.md)). Il
**ne statue PAS** ADR-022/026/027 : ceux-là relèvent de la fenêtre DP8 post-démo et/ou
d'un arbitrage humain (voir Notes).

## Proposition

1. **ADR-021 → Accepté.** Justifier par le **contrat de couture** référencé « inchangé »
   par ADR-023/025/027 (en-têtes), **pas** par « code mergé » : le commit 3cb9db2/#48 a
   mergé le *document* au statut Proposed, pas une implémentation. Lève le bloqueur (b)
   de la fiche mega-city 0016.
2. **ADR-024 → Accepté**, **après** confirmation en historique de l'exécution E6-S2
   (suppression `ContainerRuntimePort`/`DockerDesktopAdapter` au commit `d200f0e`, alias
   « #55 » renuméroté post-subtree). La dépendance d'ADR-024 à ADR-022 survit à la
   révision (la brique 1 révisée reste métier-aveugle).
3. **ADR-025 → ajouter le bandeau back-ref** « Révisé par ADR-027 (remplace Décision §1) ».
   Confirmé manquant (grep `027` sur ADR-025 = vide) alors qu'ADR-027 §5 le déclare.
   Statut reste Proposé.
4. **ADR-026 → ajouter le bandeau** « Révisé par ADR-029 — `bmad-orchestration/` gardé
   *jusqu'à E4* » (exécute l'AI-6 d'ADR-029). Statut reste Proposé (différé post-démo).

## Critères d'acceptation

- [ ] `grep Statut docs/adr/ADR-021*` = Accepté ; `ADR-024*` = Accepté
- [ ] ADR-022 reste **WIP/Brouillon** ; ADR-025 / 026 / 027 restent **Proposé** (aucune promotion au-delà de ce que la capture 2026-07-14 autorise)
- [ ] `grep 027 docs/adr/ADR-025*` non vide (back-ref présent)
- [ ] `grep ADR-029 docs/adr/ADR-026*` non vide (bannière posée, statut inchangé)
- [ ] Exécution E6-S2 confirmée en historique avant le re-tampon d'ADR-024

## Notes / décisions

**Ce que ce lot NE fait PAS** (différé / arbitrage humain, cf. 0034 D5/D9) :
- **ADR-022** reste WIP : la réécriture de la brique 1 (« tire & dispatche » → « octroie
  des clairances », loop `pull task → dispatch` rendu **caduc** par la capture 14/07) est
  une révision d'archi de fond, différée post-démo (DP8) — pas un re-tampon. Prérequis
  avant toute promotion : hisser l'invariant « Method port générique, BMAD = 1 impl à
  généraliser » du rang de question ouverte au corps de l'ADR.
- **ADR-026 & ADR-027** restent Proposé (différables ensemble post-démo, capture §5). Ne
  pas re-tamponner 027 tant que `package.json name != vectorz` (neutralisation inachevée)
  et sans relecture humaine — le renommage cop1→vectorz est un arbitrage humain.
