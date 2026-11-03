---
id: "20260821210633457"
title: "Un siège automatique qui joue une vraie session Claude Code, pour tester la méthode sans humain"
type: feature
priority: P2
product: mega-city
milestone:
depends: ["0169"]
labels: [test-local, supervision, dogfood]
status: idea
blocked: deferred
pr:
evidence: none # script et journal, sans écran ; la preuve, c'est le journal
created: 2026-08-21
---

# 20260821210633457 — Un siège automatique qui joue une vraie session Claude Code

> **Recentrée le 2026-11-02**, sur décision du PO. Jusque-là, la fiche portait aussi un explorateur
> par PR qui proposait des fiches. Cette part vit désormais ailleurs : voir § Notes / décisions.

**En clair.** Pour tester la méthode de bout en bout, il faut aujourd'hui qu'un humain ouvre Claude
Code, tape une commande et réponde aux validations. On veut un siège automatique qui joue cette
session à sa place. Chaque run qu'il joue est étiqueté, pour que personne ne le prenne pour une
validation humaine. Le journal de la session se vérifie ensuite contre un attendu, sans humain.

**Si tu arrives frais.** Une *session* est une conversation Claude Code qui exécute la méthode. Le MCP
`supervision` y émet un journal d'événements : début de run, validations, fin. Mission control
affiche ce journal. Le *siège* est celui qui répond aux validations : d'habitude, c'est toi.

## Contexte / Problème

Le dogfooding manuel trouve des défauts que rien d'autre ne trouve : des trous entre les pièces, pas
des bugs de fonction. Les fiches [0105](done/0105-bug-moniteur-silence-dogfood.md) et
[0168](done/0168-run-orphelin-verrou-sans-cle.md) en sont nées. Mais chaque passe coûte une session
humaine.

`scripts/dogfood-guided.sh` enchaîne déjà le build, le daemon, l'interface et `analyze`. Il s'arrête
trois fois pour attendre un humain :

- démarrer l'interface web (`scripts/dogfood-guided.sh:263`) ;
- ouvrir Claude Code avec le MCP `supervision` (`scripts/dogfood-guided.sh:282`) ;
- taper `/supervision-demo` (`scripts/dogfood-guided.sh:291`).

La première pause se scripte sans difficulté. Les deux autres demandent un siège.

Deux pièces sont déjà là. L'oracle `analyze --expect` compare un journal à un attendu
(`products/mega-city/bin/supervision-analyze.ts`, livré par la fiche
[0169](done/0169-explorateur-llm-par-pr.md)). Le journal sait porter un siège : le champ `seat` est lu
par la projection des runs (`products/cop1/packages/journal-validator/src/projectRun.ts:15`).

## Proposition

```
dogfood-guided.sh, mode autonome
  ├── lance le daemon et l'interface        (plus de pause)
  ├── siège automatique (Agent SDK)   ──▶   vraie session Claude Code, MCP supervision branché
  │      répond seul aux validations        chaque run porte seat: agent (ou seat: ci)
  └── analyze --expect <attendu>      ──▶   vert, ou rouge avec l'événement manquant
```

- **Le siège pilote une vraie session Claude Code**, par le Claude Agent SDK : Claude Code empaqueté
  en bibliothèque, avec ses outils, ses MCP et ses sous-agents. Pas l'API Messages. Doc :
  `code.claude.com/docs/en/agent-sdk`, à lire avant toute signature.
- **On ne simule jamais le LLM.** Ce qui se scripte, c'est le siège, l'horloge et l'environnement.
  Les décisions du modèle restent réelles : elles sont la source d'imprévu, et l'imprévu est ce qu'on
  teste.
- **Le siège automatique est toujours étiqueté** `seat: agent` ou `seat: ci`. Sans étiquette, le
  journal dirait « le siège humain a validé » alors que personne n'a validé : le harnais fabriquerait
  une fausse preuve.
- **Ces runs sont exclus des mesures** qui lisent le journal, sinon ils les faussent.
- **Le mode guidé reste disponible**, pour explorer à la main.
- **L'outil ne bloque rien.** Il ne garde aucun merge : un test instable qui bloque finit éteint.

## Critères d'acceptation

- [ ] `scripts/dogfood-guided.sh` tourne de bout en bout sans pause humaine, en mode autonome. Le mode
      guidé reste disponible.
- [ ] Le siège joue une vraie session Claude Code, avec le MCP `supervision` branché, et répond seul
      aux validations.
- [ ] Chaque run joué par le siège porte `seat: agent` ou `seat: ci` dans le journal.
- [ ] Ces runs sont exclus des mesures qui lisent le journal : une mesure donne le même résultat avec
      ou sans eux.
- [ ] Le journal de la session passe `analyze --expect` contre un attendu écrit d'avance. Un écart
      échoue, et le message nomme l'événement manquant.
- [ ] Gate locale verte : typecheck, lint et tests.

## Comment vérifier

1. Lancer `scripts/dogfood-guided.sh` en mode autonome, option à nommer au `ready` : la chaîne va
   jusqu'au bout sans intervention.
2. Le journal montre les runs de la session avec `seat: agent`.
3. Calculer une mesure avec et sans ces runs : le chiffre est le même.
4. Exiger dans l'attendu un événement que la session n'émet pas : `analyze --expect` échoue et le
   nomme.

## Glossaire

- `siège` — celui qui répond aux validations d'une session : d'habitude l'humain, ici un programme.
- `validation` (*gate*) — un point où la session s'arrête et attend la réponse du siège.
- `Agent SDK` — Claude Code empaqueté en bibliothèque, pilotable par un programme.
- `dogfooding` — utiliser la méthode sur elle-même pour en trouver les défauts.

## Notes / décisions

- **Recentrée le 2026-11-02 (décision PO).** L'ancienne brique 3, utiliser l'app d'une PR et proposer
  des fiches, est couverte ailleurs :
  - les bugs, par `ezk-scout`, livré :
    [20260910165637000](done/20260910165637000_ezk-scout-chasse-bugs-tache-de-fond.md) ;
  - les améliorations :
    [20261102183114656](20261102183114656_scout-lentille-ameliorations-fiches-feature.md) ;
  - le suivi de ce qui est testé, par le carnet :
    [20261102182259416](done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md).

  Le déclenchement « par PR » ne colle plus à vectorz, qui intègre sans PR. La fiche sort de la
  version v0.23.0 et de la milestone `exploration-app`, qui portent « l'app se cartographie ». Sa
  priorité ne change pas.
- **Conditions du panel du 2026-10-14, toujours valables pour le siège** : un spike borné dans le
  temps sur l'Agent SDK avant de s'engager ; un siège livré seul, sans dépendre d'aucune autre pièce
  d'exploration.
- **Décisions du 2026-10-14 reportées dans la fiche améliorations** : la parade « juge et partie »
  (journaliser tout refus rencontré), l'absence d'agent qualifieur, et la question d'un dossier séparé
  pour les propositions.
- **Deux défauts d'`analyze` relevés le 2026-07-30**, à traiter ici au grooming : aucun verdict n'est
  rendu sur un run abandonné ; le tableau des appels MCP ne distingue pas un appel réussi d'un appel
  refusé.
- **Dépend de** [0169](done/0169-explorateur-llm-par-pr.md), l'oracle, livré. **Scindée** de 0169 le
  2026-08-21 ; le volet article vit dans [[20260821210633522]].
- **Voisines** : [[0099]] (vérifier les directives d'émission), [[0104]] (kit d'analyse de session),
  [20260825024356665](20260825024356665_expect-sous-sequence-sessions-live.md) (attendus en
  sous-séquence).
- **À trancher au grooming** : le spike sur l'Agent SDK, et la vérification de la session dans mission
  control, seul écran depuis l'amendement de l'ADR-086.
- **Mise en attente le 2026-11-03** (run autonome) : le panel du 2026-10-14 exige d'abord un spike
  sur l'Agent SDK. Ce spike lance de vraies sessions Claude Code depuis un script, sans humain. Elles
  consomment ton quota, ou demandent une clé d'API. Ouvrir cette dépense te revient, comme le dépôt
  d'une clé si le SDK en exige une.
