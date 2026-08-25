---
id: "20260825024356665"
title: Comparateur `analyze --expect` en sous-séquence — tolérer les events non déclarés (sessions live, briques 2/3)
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [supervision, test, llm]
status: idea
ready:
pr:
created: 2026-08-25
---

# Comparateur `--expect` : passer du strict à la sous-séquence

## En clair

L'oracle `supervision:analyze --expect` (fiche [0169](done/0169-explorateur-llm-par-pr.md), shippé) compare
aujourd'hui un journal à un scénario en mode **strict** : le scénario doit énumérer **chaque** event,
dans l'ordre exact. C'est parfait pour des journaux **contrôlés** (fixtures, tests déterministes) — le
socle. Mais dès qu'on veut asserter sur une **session live** (le rôle des briques 2/3 : pilote de siège,
explorateur par PR), le strict échoue à tort : une vraie session émet des `heartbeat` périodiques et
parfois une `escalation`, à des positions imprévisibles. Un event non déclaré entre deux jalons → **faux
divergent**.

Cette fiche fait évoluer le comparateur vers une **sous-séquence ordonnée** : les steps du scénario sont
des **jalons** qui doivent apparaître **dans l'ordre**, mais les events non déclarés entre eux sont
**tolérés**. C'est fidèle au `…` de la fiche 0169 (« au moins ça, dans cet ordre »).

## Contexte / Problème

Relevé par la revue adverse de 0169 (P1 #3, non bloquant pour le socle). Le comparateur
`matchRunToScenario` (`src/supervision/expect.ts`) avance par **adjacence stricte** : chaque step consomme
les occurrences consécutives de son `type` à la position courante, et tout event d'un autre type à cette
position casse le match. Atténuants qui rendaient le strict acceptable pour le socle : le runtime refuse
un `heartbeat` pendant un gate ouvert, et `min:0` permet une étape optionnelle. Ces atténuants ne
couvrent pas les sessions live (heartbeats hors gate, escalations).

## Proposition (à groomer)

- **Mode sous-séquence** : pour chaque step, avancer le curseur en **sautant** les events non déclarés
  jusqu'au(x) event(s) du type attendu ; conserver l'ordre et les contraintes de champ
  (`gate_id`/`status`/`outcome`) ; redéfinir la sémantique de `min` dans ce mode (au moins N occurrences,
  pas forcément adjacentes).
- **Choix à trancher au grooming** : sous-séquence par défaut, ou opt-in via un champ scénario
  (`match: "strict" | "subsequence"`) pour garder le strict là où il a du sens (assertions exhaustives) ?
- Réutiliser l'infra 0169 (types `Scenario`/`ScenarioStep`, CLI `--expect`, code retour 0/1/2) — pas de
  nouveau concept.

## Critères d'acceptation (brouillon)

- [ ] Un scénario de **jalons** (`run.started → gate.reached → run.finished`) matche un run réel
      contenant des `heartbeat`/`escalation` intercalés (plus de faux divergent).
- [ ] L'ordre reste imposé : un jalon hors ordre diverge toujours.
- [ ] Les contraintes de champ et `min` gardent un sens documenté dans le nouveau mode.
- [ ] Le strict reste accessible si le grooming retient un mode opt-in.
- [ ] Gate locale verte (typecheck / tests), avec fixtures de sessions live.

## Comment vérifier

Écrire un scénario de jalons, l'exécuter contre un journal réaliste (avec heartbeats/escalations
intercalés) → code retour 0 ; réordonner un jalon → code retour non-nul.

## Notes / décisions

- Lignée : suite directe de [0169](done/0169-explorateur-llm-par-pr.md) (comparateur strict, socle).
  À tirer quand les **briques 2/3** ([[20260821210633457]]) créent le besoin de tester des sessions live.
- Origine : P1 #3 de la revue adverse ezk-reviewer du 2026-08-25.
