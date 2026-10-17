---
id: "20261017110956989"
title: Attribuer les jetons réels par mode de revue (local vs PR+Codex) pour comparer le coût d'une fiche
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [supervision, observabilite]
status: idea
pr:
evidence: none # commande / rapport, pas d'écran
created: 2026-10-17
---

# 20261017110956989 — Jetons réels par mode de revue (local vs PR+Codex)

**En clair.** On sait déjà mesurer les jetons réels d'un sprint : un module lit les
transcripts Claude Code et les additionne. Mais il ne sait pas les **séparer par mode** :
une fiche faite en tout-local, sans PR, ne se distingue pas d'une fiche passée par PR +
Codex. Du coup, la question « est-ce moins cher en local ? » se répond au **modèle**, pas à
la **mesure**. Cette fiche ajoute un marqueur de mode à l'attribution des jetons, plus une
petite sortie comparative, en s'appuyant sur le module existant — sans le réécrire.

**Si tu arrives frais.** `sprint-metrics` est le module de mega-city qui reconstruit la
consommation de jetons d'un run. Il lit les champs `message.usage` des transcripts Claude
Code (entrée/sortie), les fenêtre par sprint, et sert `sprint:report` / `run:report`. « Mode
de revue » = la façon dont une fiche est relue avant d'être fusionnée : **tout-local** (revue
par l'agent `ezk-reviewer`, squash local, pas de PR) ou **PR + Codex** (ouverture d'une PR,
revue Codex en plus). Les deux sont pilotés par les drapeaux `pr` et `codex-review` de
`.vectorz/config.yml`.

## Contexte / Problème

Séance du 2026-10-17. Le PO demande si faire tourner la méthode en tout-local coûte moins
cher en jetons que le mode PR + Codex. Réponse donnée au **modèle** : le coût d'une fiche est
fixé par l'unique appel `ezk-reviewer` (~85k de contexte fixe par appel, 107-162k pour la
revue), identique dans les deux modes ; Codex est un bot externe à **zéro jeton** côté
vectorz. Sources : [Coût de sprint compté en appels d'agent](../products/mega-city/docs/adr/0060-cout-sprint-compte-en-appels-agent.md)
et [Revue locale plancher, Codex filet, PR optionnelle](../products/mega-city/docs/adr/0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md).

Ce qui empêche de **mesurer** cette réponse au lieu de l'estimer, vérifié dans le code :

1. **Aucun marqueur de mode.** `UsageEvent` (`products/mega-city/src/sprint-metrics/domain/tokens.ts`)
   ne porte que `ts`, `sessionId`, `inputTokens`, `outputTokens`. Les jetons sont sommés, jamais
   répartis « local » vs « PR+Codex ». La comparaison demandée est donc impossible à sortir.
2. **Pas de split cache.** Seuls entrée et sortie sont captés. Les jetons de **cache**
   (`cache_read`, `cache_creation`) sont ignorés. Or une lecture de cache coûte bien moins
   qu'un jeton d'entrée neuf : les additionner à parité, ou les oublier, fausse le **coût**
   réel. Un vrai comparatif de coût doit trancher ce point.
3. **Le journal de supervision ne porte aucun jeton.** Les événements de
   `.supervision/runs/<run>/events.jsonl` sont des battements de cœur et des gates — jamais un
   `usage`. Tout est reconstruit **après coup** depuis les transcripts ; `run:report` prend
   même les jetons en saisie manuelle (`--tokens-used`, sinon « non mesurés »).

Fiches voisines écartées, pour mémoire : [Socle vertical — port de métrique](0052-socle-metrique-port-adaptateur-silo.md)
et [KPI agrégés commit→PR→sprint→version](0055-kpi-agreges-commit-pr-sprint-version.md) sont
parkées et portent l'**observabilité qualité** (couverture, DoD) ; 0052 exclut explicitement
le coût jetons. [Borner le coût du chemin daté de sprint:report](20261013143324505_sprint-report-cout-chemin-date.md)
traite la **vitesse** de la mesure, pas son contenu. Aucune ne couvre l'attribution par mode.

## Valeur

**Si on ne la fait jamais ?** Pour « local vs PR+Codex », rien de grave : le modèle répond
déjà (même coût d'appel, Codex gratuit). La valeur est ailleurs, et elle est réelle :

- **Piloter la doctrine lean.** « Batcher, moins d'appels » est affirmé, pas mesuré. Un coût
  réel par fiche dit si ces gestes baissent vraiment la facture.
- **Attraper la dérive de coût.** Une évolution de méthode qui gonfle les jetons par fiche se
  verrait ici, au lieu de ne se sentir que dans le quota Max.

Le cœur, c'est **voir le coût réel par fiche** ; la comparaison local vs PR+Codex en est le
**premier consommateur**, pas le but.

## Proposition

Tranche mince, adossée à `sprint-metrics` (on étend, on ne réécrit pas). Trois décisions de
structure, tranchées par l'avis architecte (2026-10-17) :

1. **Mode dérivé du run, au rapport.** `local` | `pr-codex` déduit de la config (`pr`,
   `codex-review`) ou du `run.started`, au moment de l'attribution. `UsageEvent` reste pur
   (ts, session, entrée, sortie, cache). Pas de changement au chemin d'émission.
2. **Grain = run, un mode par run.** Un run mixte (des fiches locales, d'autres en PR) est
   marqué « mode mixte — non ventilé » et différé, comme le repli grain-session existant.
3. **Jetons de cache captés, pas pondérés.** `UsageEvent` gagne `cacheRead` + `cacheCreation`
   (les `message.usage` des transcripts les portent) ; on rapporte les quatre nombres côte à
   côte, sans prix figé. Le coût en euros (pondération cache) est une étape ultérieure.

POC d'abord : un run rejoué, deux modes, quatre nombres par mode. Polish ensuite.

**ADR :** pas à la capture ; un ADR court n'ouvre qu'au build si la pondération prix (cache →
coût) devient une policy.

## Critères d'acceptation

- [ ] **Mode dérivé, pas saisi.** L'attribution porte `local` | `pr-codex`, calculé depuis la
      config (`pr`, `codex-review`) ou le `run.started` — jamais à la main. *Preuve : un test
      qui change la config et voit le mode changer, sans toucher aux transcripts.*
- [ ] **Comparaison affichée.** `sprint:report` (ou `run:report`) imprime les jetons par mode,
      local et PR+Codex côte à côte. *Preuve : la sortie de la commande sur un run rejoué.*
- [ ] **Somme conservée.** La somme des deux modes égale le total du run : rien perdu, rien
      compté deux fois. *Preuve : un test d'égalité « somme-par-mode == total ».*
- [ ] **Cache réel.** `cacheRead` et `cacheCreation` sont captés et rapportés à part, non nuls
      sur un run réellement caché, sans prix figé. *Preuve : la sortie sur un run avec cache.*
- [ ] **Repli honnête préservé.** Fenêtre vide → grain session, avec sa note ; jamais un total
      faux. *Preuve : le test existant de `attributeTokens` reste vert.*

## Comment vérifier

```bash
# Le module de mesure et ses tests
pnpm --dir products/mega-city test -- src/sprint-metrics

# La sortie comparative sur un run réel (à câbler par la fiche)
pnpm --dir products/mega-city ezk sprint report --help
```

## Glossaire

- `sprint-metrics` — module de mega-city qui reconstruit la consommation de jetons d'un run
  depuis les transcripts Claude Code (`products/mega-city/src/sprint-metrics`).
- `UsageEvent` — l'enregistrement d'un relevé de jetons : horodatage, session, entrée, sortie.
- mode de revue — `local` (revue `ezk-reviewer` + squash local, pas de PR) ou `pr-codex` (PR
  ouverte + revue Codex en plus).

## Notes / décisions

- Moteur : rendre **mesurable** la comparaison local vs PR+Codex, aujourd'hui seulement
  estimée au modèle (ADR-0060). Portée volontairement mince ; le gros œuvre de mesure existe.
- Risque : le grain « par mode » suppose qu'un run tient un seul mode. Un run mixte (certaines
  fiches en PR, d'autres en local) demande un tag plus fin — à cadrer au grooming.
- Dépend de `sprint-metrics` et de la lecture de config `pr` / `codex-review`
  (`ezk-sprint`). Pas de dépendance externe nouvelle.
