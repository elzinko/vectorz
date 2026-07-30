---
id: 0169
title: "Explorateur LLM par PR — parcourir l'app pour trouver les trous, et proposer la fiche"
type: feature
priority: P1
epic:
depends: ["0168"]
labels: [supervision, test, llm, dogfood, article]
status: todo
ready:
pr:
created: 2026-07-30
product: mega-city
---

# 0169 — Un explorateur qui use l'app pour de vrai, et rapporte ce qu'il casse

## Contexte / Problème

**Les tests écrits vérifient des réponses à des questions déjà posées.** Une fixture
contient ce que son auteur a imaginé — et personne n'écrit une fixture « run laissé
ouvert parce que la session est morte », parce qu'on écrit des fixtures de runs bien
formés. C'est exactement pour ça que [0105](0105-bug-moniteur-silence-dogfood.md) et
[0168](0168-run-orphelin-verrou-sans-cle.md) ont échappé à toute la suite existante :
le runtime était testé (verrou, `seq`, confinement), le serveur MCP était testé
(`src/supervision/__tests__/mcp-server.e2e.test.ts`), et le produit était pourtant
inutilisable. Ces deux défauts ne sont pas des bugs de fonction, ce sont des **trous
entre les pièces** — et un trou ne se teste pas, il se rencontre.

### Le cas fondateur, daté (2026-07-30)

Une session `/supervision-demo` lancée à la main :

1. `run_start` **refusé** — un run `ezk-sprint` de la veille était resté ouvert.
2. Aucun outil de reprise dans le kit ⇒ projet muet définitivement.
3. Déblocage par décision humaine, puis fiche **0168** rédigée dans la foulée.
4. Puis `supervision:analyze` a révélé deux défauts de plus, du même geste : le run
   abandonné ne reçoit **aucun verdict** (« Runs : 2 », un seul verdict rendu), et le
   tableau des appels MCP **ne distingue pas succès et refus** (un `run_start` rejeté y
   figure comme les autres, donnant à lire deux runs pour un seul créé).

Aucun test écrit d'avance n'aurait produit ces trois findings. Un usage réel, oui — en
une session. **C'est ce geste-là qu'on veut outiller.**

### Ce qui existe déjà (ne pas reconstruire)

- `scripts/dogfood-guided.sh` (368 l.) fait **déjà** : build, smoke, daemon + web,
  screenshots Playwright (`scripts/dogfood-screenshot.mjs`), comptage des journaux,
  `analyze`, rapports. Ses deux seuls trous sont des `pause_human` : « ouvre Claude
  Code » (étape 4) et « tape /supervision-demo » (étape 5).
- `supervision:analyze` ([0104](done/0104-kit-analyse-session-supervision.md)) parse le
  journal, croise les transcripts Claude Code et rend des verdicts.

## Valeur

Le dogfooding manuel trouve des défauts que rien d'autre ne trouve — mais il coûte une
session humaine à chaque fois, et ne tourne donc qu'exceptionnellement. L'automatiser,
c'est transformer un geste rare et cher en un passage régulier : chaque PR est *usée*
avant d'être mergée, et ce qu'elle casse arrive en fiche plutôt qu'en surprise chez
l'utilisateur suivant.

## Proposition

Trois briques ordonnées, chacune livrable seule. La n°1 a de la valeur même si les deux
autres ne se font jamais.

### 1. `supervision:analyze --expect` — donner un oracle (le moins cher, à faire d'abord)

`analyze` est **déjà** le moteur d'assertion : il lit le journal, croise les transcripts
et rend un verdict. Ce qui lui manque n'est pas du code, c'est un **attendu**. Aujourd'hui
il juge la cohérence *intrinsèque* (« start + activité + fin ») ; un test veut comparer à
un scénario attendu :

```
attendu : run.started → heartbeat+ → gate.reached(demo-gate-1)
        → gate.resumed → … → run.finished(success)
```

Un scénario déclaratif (JSON/YAML) + un code retour, et on a un `assert` — sans nouvelle
brique. **Le journal est la surface d'assertion idéale** : ordonné, typé, contractuel. Un
acteur non déterministe devient testable parce qu'on n'assert pas sur ce qu'il *dit*,
mais sur ce qu'il *écrit*.

### 2. Pilote de siège — remplacer les deux `pause_human`

Une session Claude Code réelle, pilotée, avec le MCP `supervision` branché, et un siège
**scripté** qui répond aux gates. La brique correspondante est le **Claude Agent SDK**
(Claude Code empaqueté en bibliothèque : outils intégrés, MCP, sous-agents) — pas l'API
Messages, pas son tool runner. Doc : `code.claude.com/docs/en/agent-sdk` ; à lire avant
d'écrire la moindre signature.

**Contrainte non négociable : le siège automatique doit être étiqueté** (`seat: agent` /
`ci`). Un `gate.resumed` non marqué fait dire au journal « le siège humain a validé »
alors que personne n'a validé — le harnais fabriquerait des preuves fausses sur la
propriété même que le contrat existe pour garantir. Ces runs alimentent aussi le corpus
du mesureur d'outcomes et du contrat d'améliorabilité (mc-0061) : à filtrer, sinon les
mesures sont faussées.

### 3. Explorateur par PR — le vrai sujet

Sur une PR : monter le banc, **user l'application pour de vrai** (parcours navigateur +
émission MCP), et rendre non pas un vert/rouge mais **des propositions de fiches**
qualifiées :

| Classe | Ce que c'est | Exemple vécu |
|---|---|---|
| **bug** | un comportement contredit le contrat | — |
| **trou** | rien n'est faux, il manque une pièce | 0168 : un verrou sans clé |
| **feature à adapter** | ça marche, mais c'est illisible / inutilisable | 0105 : le Moniteur paraît cassé |

Sortie = commentaire de PR + `ezk-backlog add` **proposé** (jamais appliqué seul —
invariant `review`/`reconcile` : détecter propose, l'humain arbitre).

### Garde-fous (ce qui décide si l'outil vaut quelque chose)

- **Ne jamais mocker le LLM.** Un mock est une réponse qu'on a écrite soi-même, donc une
  fixture — payée au prix d'un LLM, en plus lente et moins reproductible. Ce qui se
  script, c'est le **siège**, l'horloge, l'environnement. Pas les décisions du modèle :
  c'est le générateur d'imprévu, et l'imprévu est le produit.
- **Un screenshot est une pièce à conviction, pas un oracle.** Assertions dures sur le
  DOM ; la capture sert à l'humain qui relit.
- **L'explorateur est juge et partie.** Rien ne garantit qu'un agent rapporte ce qui le
  gêne : le 2026-07-30, il aurait pu voir `run_start refusé`, hausser les épaules et
  faire la démo sur `vectorz-jouet` — rapport vert, 0168 inexistante. À traiter
  explicitement (contrainte de journalisation de tout refus rencontré, vérification
  croisée journal ↔ transcript, ou second agent adverse). **Point de conception à
  trancher au grooming.**
- **Non bloquant.** Cet outil ne garde pas un merge : un test instable qui bloque les PR
  est désactivé en deux semaines. La pyramide protège, l'explorateur trouve.
- **Règle qui rend l'ensemble viable : tout défaut trouvé se convertit en test
  déterministe.** Le LLM trouve une fois, la fixture garde pour toujours. Sans cette
  conversion, on repaye un run LLM chaque nuit pour re-découvrir le même bug — et on
  finira par l'éteindre. Appliqué à aujourd'hui : un E2E Moniteur sur fixture « journal à
  un seul `run.started` », et un test unitaire sur le message de `run_start` refusé.

## Critères d'acceptation

- [ ] `supervision:analyze --expect <scenario>` compare un journal à une séquence
      attendue et sort un code retour exploitable en CI.
- [ ] Un scénario déclaratif décrit la séquence attendue **et** les réponses du siège.
- [ ] `dogfood-guided.sh` tourne de bout en bout sans `pause_human` (mode autonome), et
      garde le mode guidé pour l'exploratoire.
- [ ] Les runs émis par un siège automatique sont **distinguables** dans le journal, et
      exclus des mesures d'outcomes.
- [ ] Sur une PR de test contenant un défaut connu, l'explorateur produit une proposition
      de fiche correctement classée (bug / trou / feature à adapter).
- [ ] Aucune fiche n'est créée sans arbitrage humain.
- [ ] Ce que le harnais ne couvre pas est **journalisé** (pas de troncature silencieuse).
- [ ] Gate locale verte (typecheck/lint/tests).

## Volet article

Le sujet est publiable, et l'histoire est déjà écrite par les faits : *une suite de tests
verte, un produit inutilisable, et trois défauts trouvés en une session par un agent qui
se contentait d'utiliser l'application*.

Angle : **les tests vérifient des réponses à des questions déjà posées ; le LLM pose les
questions que personne n'avait écrites.** Avec la nuance honnête qui évite l'article de
hype — non-déterminisme, absence de localisation, juge et partie, et la règle de
conversion en test déterministe sans laquelle rien ne tient économiquement.

Matériau disponible : `0105`, `0168`, le journal
`2026-07-30T13-20-55-013Z-615bcd81` et son rapport `analyze`.

> **À trancher au grooming** : la convention du repo met les articles dans des fiches
> séparées ([0069](0069-article-emission-events-claude-desktop-code.md), 0062, 0043,
> 0049). L'article est gardé ici à la demande du PO ; le scinder reste possible si le
> volet outil part en sprint sans lui.

## Notes / décisions

- **Prérequis dur : [0168](0168-run-orphelin-verrou-sans-cle.md).** Sans clé pour le
  verrou run-unique, un harnais autonome qui plante laisse un orphelin et bloque toutes
  les exécutions suivantes. `dogfood-guided.sh` **contourne déjà** le problème à l'étape
  5b (« évite KO à cause d'orphans anciens hors démo ») — le contournement est là, le
  défaut non.
- Deux défauts d'`analyze` relevés le 2026-07-30, à rattacher ici ou à 0105 au grooming :
  aucun verdict rendu sur un run abandonné (« Runs : 2 », 1 verdict) ; le tableau des
  appels MCP ne distingue pas un appel réussi d'un appel refusé.
- Voisines : [0099](0099-contrat-emission-verifier-directives.md) (vérifier les
  directives d'émission), [0105](0105-bug-moniteur-silence-dogfood.md),
  [0104](done/0104-kit-analyse-session-supervision.md).
- Répartition des étages assumée : unit (runtime) et intégration (serveur MCP) existent ;
  le trou déterministe le plus rentable est un **E2E Moniteur sur fixture** — il permet
  de tester « Silence prolongé », escalade, gate ouvert, abandon en quelques secondes,
  là où le screenshot actuel exige un vrai silence. À décider au grooming : fiche à part
  ou premier lot d'ici.
