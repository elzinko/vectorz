---
id: 0169
title: "Oracle de journal `analyze --expect` — rendre une session testable (brique 1, ex-explorateur LLM)"
type: feature
priority: P1
epic:
depends: ["0168"]
labels: [supervision, test, llm, dogfood]
status: todo
ready: 2026-08-21
pr:
created: 2026-07-30
product: mega-city
---

# 0169 — Un oracle qui compare le journal d'une session à un scénario attendu

## En clair

**Recentrée le 2026-08-21** (décision PO). L'ancienne fiche empilait 3 outils + un article ; elle est
scindée. Ici = **le 1er bout, le socle** : donner à `supervision:analyze` un **attendu** pour qu'il
devienne un vrai `assert` sur le journal d'une session. Les suites (pilote de siège auto, explorateur
par PR) sont dans [[20260821210633457]] ; l'article dans [[20260821210633522]].

## Contexte / Problème

**Les tests écrits vérifient des réponses à des questions déjà posées.** C'est pour ça que
[0105](done/0105-bug-moniteur-silence-dogfood.md) et
[0168](done/0168-run-orphelin-verrou-sans-cle.md) ont échappé à toute la suite : le runtime était
testé, le serveur MCP était testé, et le produit était pourtant inutilisable. Ces défauts sont des
**trous entre les pièces** — un trou ne se teste pas, il se rencontre.

Pour outiller la détection, il faut d'abord un **oracle** : quelque chose qui sait dire « ce journal
de session ne correspond pas à ce qu'on attendait ». `supervision:analyze`
([0104](done/0104-kit-analyse-session-supervision.md)) parse déjà le journal, croise les transcripts
et rend un verdict — mais un verdict de cohérence *intrinsèque* (« start + activité + fin »), pas une
comparaison à un attendu.

## Valeur

Le journal est la **surface d'assertion idéale** : ordonné, typé, contractuel. Un acteur non
déterministe (le LLM) devient testable parce qu'on n'assert pas sur ce qu'il *dit*, mais sur ce qu'il
*écrit*. Cet oracle est le **socle réutilisable** de tout le reste (pilote, explorateur) — et il a de
la valeur seul : un `assert` de journal rejouable en CI. La fiche d'origine le disait : la brique 1
« a de la valeur même si les deux autres ne se font jamais ».

## Proposition — `supervision:analyze --expect`

`analyze` est **déjà** le moteur d'assertion. Ce qui lui manque n'est pas du code, c'est un
**attendu**. Un scénario déclaratif (JSON/YAML) + un code retour, et on a un `assert` — sans nouvelle
brique :

```
attendu : run.started → heartbeat+ → gate.reached(demo-gate-1)
        → gate.resumed → … → run.finished(success)
```

Le scénario décrit **la séquence attendue** *et* **les réponses du siège**.

**Conversion en test déterministe (la règle qui rend l'ensemble viable).** Tout défaut trouvé une fois
(par un usage réel) se fige en fixture : E2E Moniteur sur fixture « journal à un seul `run.started` »,
et test unitaire sur le message de `run_start` refusé. Le LLM trouve une fois, la fixture garde pour
toujours.

## Critères d'acceptation

- [ ] `supervision:analyze --expect <scenario>` compare un journal à une séquence attendue et sort un
      **code retour exploitable en CI**.
- [ ] Un scénario déclaratif décrit la séquence attendue **et** les réponses du siège.
- [ ] Deux tests déterministes dérivés existent : E2E Moniteur sur fixture « un seul `run.started` », et
      test unitaire sur le message de `run_start` refusé.
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

1. Écrire un scénario déclaratif (JSON/YAML) : `run.started → heartbeat+ → gate.reached(...) →
   gate.resumed → run.finished(success)`, avec les réponses attendues du siège.
2. `analyze --expect <scenario>` sur un journal **conforme** → code retour 0.
3. Même commande sur un journal **divergent** (gate manquant, fin absente) → code retour non-nul.
4. Vérifier les deux tests déterministes (fixture Moniteur + message `run_start` refusé).
5. Gate locale verte.

## Notes / décisions

- **Prérequis dur : [0168](done/0168-run-orphelin-verrou-sans-cle.md)** — **shippé** (verrou run-unique
  débloquable). Prérequis satisfait.
- **Scindée le 2026-08-21** (décision PO « garder le 1er bout ») : briques 2 (pilote de siège) et 3
  (explorateur par PR) → [[20260821210633457]] ; volet article → [[20260821210633522]]. Le nom de
  fichier reste `0169-explorateur-llm-par-pr.md` (les fiches historiques 4-chiffres ne se renomment pas).
- **Groom 2026-08-21** : DoR complète sur la brique 1 (problème, valeur, 4 critères observables, comment
  vérifier). Tamponnée `ready: 2026-08-21`.
- Voisines : [[0099]] (vérifier les directives d'émission), [0105], [0104].
