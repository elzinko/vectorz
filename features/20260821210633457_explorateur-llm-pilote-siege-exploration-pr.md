---
id: "20260821210633457"
title: "Explorateur LLM par PR — pilote de siège auto + exploration (suite de l'oracle 0169)"
type: feature
priority: P2
product: mega-city
epic:
depends: ["0169"]
labels: [supervision, test, llm, dogfood]
status: todo
ready:
pr:
created: 2026-08-21
---

# Explorateur LLM par PR — piloter le siège, puis user l'app pour de vrai

## En clair

**Suite de [[0169]]** (l'oracle `analyze --expect`, scindé le 2026-08-21). Une fois qu'on sait
**comparer un journal de session à un attendu**, on veut deux briques de plus : un **siège
automatique** qui joue une session Claude Code réelle en répondant aux gates, puis un **explorateur**
qui *use l'application pour de vrai* sur une PR et rapporte non pas un vert/rouge, mais des
**propositions de fiches** (bug / trou / feature à adapter). C'est le vrai sujet ; l'oracle n'en était
que le socle testable.

## Contexte / Problème

Le dogfooding manuel trouve des défauts que rien d'autre ne trouve (cf. 0105, 0168 : des **trous entre
les pièces**, pas des bugs de fonction), mais il coûte une session humaine à chaque fois. `0169` a
livré l'**oracle** (le moteur d'assertion sur le journal). Restent les deux briques qui automatisent
le *geste* : jouer la session, et explorer.

`scripts/dogfood-guided.sh` fait déjà build + smoke + daemon/web + screenshots Playwright + `analyze`.
Ses **deux seuls trous** sont des `pause_human` : « ouvre Claude Code » et « tape /supervision-demo ».

## Proposition

### Brique 2 — Pilote de siège (remplacer les deux `pause_human`)

Une session Claude Code réelle, pilotée, MCP `supervision` branché, avec un **siège scripté** qui
répond aux gates. Brique = **Claude Agent SDK** (Claude Code empaqueté en bibliothèque : outils
intégrés, MCP, sous-agents) — **pas** l'API Messages, **pas** son tool runner. Doc :
`code.claude.com/docs/en/agent-sdk` (à lire avant toute signature).

**Contrainte non négociable : le siège automatique est étiqueté** (`seat: agent` / `ci`). Un
`gate.resumed` non marqué ferait dire au journal « le siège humain a validé » alors que personne n'a
validé — le harnais fabriquerait des preuves fausses sur la propriété même que le contrat garantit.
Ces runs alimentent aussi le corpus du mesureur d'outcomes : à **filtrer**, sinon les mesures faussent.

### Brique 3 — Explorateur par PR (le vrai sujet)

Sur une PR : monter le banc, **user l'application** (parcours navigateur + émission MCP), et rendre
**des propositions de fiches** qualifiées :

| Classe | Ce que c'est | Exemple vécu |
|---|---|---|
| **bug** | un comportement contredit le contrat | — |
| **trou** | rien n'est faux, il manque une pièce | 0168 : un verrou sans clé |
| **feature à adapter** | ça marche, mais c'est illisible / inutilisable | 0105 : le Moniteur paraît cassé |

Sortie = commentaire de PR + `ezk-backlog add` **proposé** (jamais appliqué seul — invariant
`review`/`reconcile` : détecter propose, l'humain arbitre).

### Garde-fous (ce qui décide si l'outil vaut quelque chose)

- **Ne jamais mocker le LLM.** Un mock est une fixture payée au prix d'un LLM. Ce qui se script, c'est
  le **siège**, l'horloge, l'environnement — pas les décisions du modèle : c'est le générateur
  d'imprévu, et l'imprévu est le produit.
- **Un screenshot est une pièce à conviction, pas un oracle.** Assertions dures sur le DOM.
- **L'explorateur est juge et partie.** Rien ne garantit qu'un agent rapporte ce qui le gêne (le
  2026-07-30 il aurait pu voir `run_start refusé`, hausser les épaules, et rendre un rapport vert).
  **Point de conception à trancher au grooming de cette fiche** : journalisation forcée de tout refus
  rencontré, vérification croisée journal ↔ transcript, ou second agent adverse.
- **Non bloquant.** L'outil ne garde pas un merge (un test instable qui bloque est éteint en deux
  semaines). La pyramide protège, l'explorateur trouve.
- **Tout défaut trouvé se convertit en test déterministe** (via l'oracle 0169). Sinon on repaye un run
  LLM chaque nuit pour re-découvrir le même bug — et on finira par l'éteindre.

## Critères d'acceptation

- [ ] `dogfood-guided.sh` tourne de bout en bout **sans `pause_human`** (mode autonome), et garde le
      mode guidé pour l'exploratoire.
- [ ] Les runs émis par un siège automatique sont **distinguables** dans le journal (`seat: agent`/`ci`)
      et **exclus** des mesures d'outcomes.
- [ ] Sur une PR de test contenant un défaut connu, l'explorateur produit une **proposition de fiche
      correctement classée** (bug / trou / feature à adapter).
- [ ] **Aucune fiche créée sans arbitrage humain.**
- [ ] Le garde-fou « juge et partie » est **implémenté** (au moins une des trois parades) et testé.
- [ ] Tout défaut trouvé est **convertible en test déterministe** via l'oracle 0169 (démontré sur 1 cas).
- [ ] Ce que le harnais ne couvre pas est **journalisé** (pas de troncature silencieuse).
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

1. Lancer `dogfood-guided.sh` en mode autonome : la chaîne va jusqu'au bout sans intervention humaine,
   et le journal montre un siège `agent`/`ci`.
2. Vérifier que les runs `agent`/`ci` sont exclus du corpus d'outcomes (mesure inchangée avec/sans).
3. Sur une PR-cobaye avec défaut connu : l'explorateur rend une proposition de fiche de la bonne classe,
   **sans** créer la fiche seul.
4. Prendre un défaut rapporté et écrire son **test déterministe** via `analyze --expect` (0169).

## Notes / décisions

- **Dépend de [[0169]]** (l'oracle) — le socle d'assertion. **Brique 2 avant brique 3** (l'explorateur
  a besoin d'un siège pilotable).
- **Scindée de 0169 le 2026-08-21** (décision PO : garder l'oracle tirable seul, sortir le reste en suites).
- Deux défauts d'`analyze` relevés le 2026-07-30, à rattacher ici ou à 0105 au grooming : aucun verdict
  rendu sur un run abandonné ; le tableau des appels MCP ne distingue pas un appel réussi d'un refusé.
- **À groomer avant de tirer** : le point « juge et partie » et le choix Agent SDK ne sont pas tranchés.
  Fiche **non ready** (todo) — grooming au moment du tirage.
- Voisines : [[0099]] (vérifier les directives d'émission), [[0104]] (kit d'analyse de session).
