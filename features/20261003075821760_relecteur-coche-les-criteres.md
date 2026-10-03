---
id: "20261003075821760"
title: Le relecteur coche les critères d'acceptation, pas le constructeur
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [revue]
status: idea
pr:
evidence: none # changement de méthode de revue, pas d'écran
created: 2026-10-03
---

# 20261003075821760 — Le relecteur coche les critères d'acceptation, pas le constructeur

**En clair.** Le gabarit de fiche le dit : une case cochée veut dire « prouvé, jamais
auto-déclaré ». Mais aucun agent n'est chargé de cette preuve. En pratique, celui qui construit la
story coche lui-même ses critères, avant même la revue. On veut que le **relecteur** rejoue
« Comment vérifier », puis coche chaque case avec sa preuve, et qu'il ne dise GO que si toutes les
cases sont prouvées.

**Si tu arrives frais.** Les *critères d'acceptation* sont les cases à cocher d'une fiche : ce qui
doit être vrai pour accepter la story. Le *relecteur* est l'agent `ezk-reviewer`, la revue adverse
de l'étape 7 d'`ezk-sprint`.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-02, PR #333 : le constructeur a coché 7 critères sur 8 dans un commit
à lui (`2fb3500e`, « cocher les critères tenus »), **avant** la revue adverse. Le relecteur a jugé le
diff, mais il n'a confirmé aucune case une par une. Le 2026-10-03, le PO demande : « qui fait cette
validation des critères avec ezk ? ».

**Pourquoi personne ne le fait.** Constat du 2026-10-03 :

- la consigne d'`ezk-reviewer` (`agents/ezk-reviewer.md`) ne parle jamais des critères de la fiche :
  il juge le diff ;
- `ezk-qa` écrit des scénarios de test, mais ne coche pas la fiche ;
- `ezk-sprint` n'a aucune étape « vérifier chaque critère ».

Le gabarit pose la règle ; rien ne la fait tenir.

**La cause retenue : deux gestes confondus** (grooming du 2026-10-03, prémisse retournée). *Prouver*
un critère et *accepter* la story sont deux gestes distincts. La méthode n'en nomme aucun, et aucun
rôle indépendant n'a la preuve à sa charge. Les autres causes possibles, et ce qui les écarte :

| Hypothèse | Ce qui la soutient | Ce qui l'écarte |
|---|---|---|
| L'agent qualité doit prouver : ses scénarios forment la DoD | `agents/ezk-qa.md` : « ces scénarios SONT la DoD » | `ezk-sprint` le saute pour toute fiche de prose (« Autorat de prose : pas de BDD / TDD / E2E d'agent ») ; absent de #333, comme de la plupart des stories de vectorz |
| L'agent produit doit accepter, comme un PO en Scrum | `agents/ezk-pm.md` lit « la fiche backlog visée + ses critères d'acceptation » | il n'agit qu'absorbé par `ezk-product-build` en mode autonome ; en usage direct, c'est le PO humain qui accepte, sans rejouer chaque preuve |
| Les critères sont trop vagues pour être prouvés | sur #333, un critère ne se prouvait qu'au merge | la règle `development/acceptance-criteria-before-merge` règle déjà ce cas |

Le relecteur est le seul regard indépendant présent à **chaque** story : aucun merge sans son GO
(ADR-0059). Lui confier la preuve ne coûte aucun appel d'agent de plus (ADR-0060).

## Proposition

Trois rôles, un geste chacun :

- **Prouver : le relecteur.** Il juge chaque critère, prouvé ou non prouvé.
- **Fournir des preuves : l'agent qualité**, quand il est appelé. Ses scénarios et ses captures
  servent de preuve aux critères qu'ils couvrent.
- **Accepter : le PO**, au point d'arrêt, en lisant la liste prouvée.

Concrètement :

- À l'étape 7 d'`ezk-sprint`, `ezk-reviewer` reçoit la fiche avec son patch. Il rejoue
  « Comment vérifier » et juge chaque critère d'acceptation : **prouvé** (avec sa preuve : commande
  et sortie, ou `fichier:ligne`) ou **non prouvé** (avec ce qui manque).
- Son verdict liste chaque critère. **Pas de GO** tant qu'un critère reste non prouvé. Le bloc
  « Mesure de suivi » n'est pas concerné : il se relève après la livraison.
- Le constructeur ne coche plus rien lui-même. L'orchestrateur reporte dans la fiche les cases du
  verdict, telles quelles, et le verdict reste attaché à la PR.

**Où la preuve tombe dans le flux** (avis d'architecte du 2026-10-03, gardé par le PO) :

```
7  revue         → verdict : chaque critère « prouvé (preuve) » ou « non prouvé (manque) »
7b cases         → l'orchestrateur reporte les cases du verdict, telles quelles (commit dédié)
8  PR + ship     → verdict posté sur la PR ; le ship range la fiche, cases comprises
9  point d'arrêt → le PO lit la liste prouvée et accepte
10 merge
```

- **Avant le ship, toujours** : le ship range la fiche dans `done/`, les cases doivent y être déjà.
  Compatible avec la fiche
  [« Poser le commit ship une seule fois »](20261002230039650_ship-pose-une-fois-apres-codex.md),
  quel que soit le moment du ship.
- **Un verdict au format fixe**, une ligne par critère : `critère N : prouvé — <preuve>` ou
  `critère N : non prouvé — <manque>`. On peut ainsi vérifier mécaniquement que les cases de la fiche
  correspondent au verdict ; un script de report pourra venir plus tard, sans changer le format.
- **Un correctif après le verdict** (par exemple un retour Codex retenu) : seuls les critères qu'il
  touche repassent devant le relecteur, pas toute la revue.
- **En mode autonome**, `ezk-pm` accepte à la place du PO, sur la même liste.
- **Sans PR** (`pr: false`), le verdict va dans le fichier de revue local (`review:emit`).

## Critères d'acceptation

- [ ] La consigne d'`ezk-reviewer` décrit le jugement critère par critère, avec la preuve exigée, et
      interdit un GO tant qu'un critère n'est pas prouvé.
- [ ] L'étape 7 et la DoD d'`ezk-sprint` disent que les cases sont cochées d'après le verdict du
      relecteur, jamais par le constructeur.
- [ ] Le verdict suit le format « une ligne par critère », et les cases de la fiche correspondent
      au verdict, avant le commit ship.
- [ ] Le point d'arrêt d'`ezk-sprint` (étape 9) présente au PO la liste des critères prouvés, avant
      de lui demander d'accepter.
- [ ] Un test de contrat sur le texte vérifie ces consignes.

**Mesure de suivi** — sur les 5 prochaines PR de story, chaque case cochée a sa preuve dans le
verdict du relecteur.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

- Relire `agents/ezk-reviewer.md` : la section « critères d'acceptation » y figure.
- Relire l'étape 7 d'`ezk-sprint` : les cases viennent du verdict.

## Notes / décisions

- **P1 demandée par le PO** le 2026-10-03.
- **Grooming du 2026-10-03**, deux techniques gardées par le PO : « retourner la prémisse » (prouver
  et accepter sont deux gestes ; le relecteur prouve, le PO accepte, l'agent qualité fournit ses
  preuves quand il est appelé) et « avis de l'architecte » (la preuve tombe entre la revue et le
  ship, verdict au format fixe, cases recopiées).
- Voisine distincte : [« La revue locale rejoue les scripts bash modifiés »](20261002230039755_revue-rejoue-scripts-bash.md)
  (même agent, autre geste : exécuter les scripts, pas valider les critères).
- Lien avec la règle `development/acceptance-criteria-before-merge` : elle garantit que chaque
  critère **peut** se cocher avant le merge ; cette fiche dit **qui** le coche.
