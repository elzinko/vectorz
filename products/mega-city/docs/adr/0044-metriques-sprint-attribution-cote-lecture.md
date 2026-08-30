# ADR-0044 — Métriques de sprint : attribution durée/tokens côté lecture

- Statut : **Proposé** (2026-08-30)
- Fiche : `20260826082120062_domaine-metriques-de-sprint-rapport.md`
- Contexte amont : `supervision/journal.ts` + `supervision/analyze.ts` (fiche 0104), `tools/outcomes` (done/0044), domaine budget cop1 (`TokenConsumption`, orphelin)

## En clair

On veut savoir, à la fin d'un sprint, combien de temps et de tokens il a coûté. On
n'ajoute **aucun nouvel émetteur**. On **lit** ce qui existe déjà — le journal de
supervision et les transcripts Claude Code — et on **rattache** ces mesures à un
sprint en comparant leurs horodatages à la fenêtre du sprint. La durée est fiable.
Les tokens sont du **best-effort étiqueté** : si le rattachement ne trouve rien
dans la fenêtre, on se replie sur le total de la session et on le dit — jamais un
chiffre faux présenté comme précis.

## Contexte

Deux sources de tokens existaient : la supervision (un run par session, pas par
sprint) et le domaine budget cop1 (`TokenConsumption`, keyé par date, sans id de
sprint). Aucune des deux ne sait, nativement, « à quel sprint appartient ce
token ». Le prérequis de conception posé par Codex sur #176 bloquait la fiche
depuis le 2026-08-26 : il fallait soit persister des frontières de sprint, soit
poser un id de sprint sur les émetteurs de tokens.

## Décision

**Attribution côté lecture, zéro instrumentation neuve.**

- **Frontières de sprint** = les gates `sprint-<slug>-checkpoint` déjà écrits
  dans le journal de supervision (`gate.reached`, horodaté). Le checkpoint DE ce
  sprint marque la fin de sa fenêtre ; le checkpoint précédent (ou `run.started`
  si c'est le premier sprint de la session) marque le début.
- **Tokens** = les lignes `message.usage` des transcripts Claude Code
  (`~/.claude/projects/<slug>/*.jsonl`, déjà horodatées), fenêtrées entre ces deux
  bornes. `supervision/analyze.ts` lisait déjà journal + transcripts en timeline
  fusionnée pour les appels MCP ; l'extraction de `message.usage` est l'extension
  apportée par ce chantier (`sprint-metrics/adapters/transcriptSource.ts`).
- **Repli honnête** : si la fenêtre ne contient aucun `message.usage` (décalage
  d'horloge, session à cheval sur deux sprints…), le rapport somme TOUT le run
  et étiquette `tokens.grain: "session"` avec une note explicite. Le champ
  `grain` rend la granularité RÉELLE toujours visible dans le rapport — jamais
  une valeur sprint silencieusement fausse.
- Le domaine budget cop1 (`TokenConsumption` / `BudgetStorePort`) reste
  **orphelin, écarté** : aucun appelant vivant, keyage par date insuffisant pour
  distinguer deux sprints le même jour.

## Alternatives écartées

- **Poser un id de sprint sur les émetteurs de tokens** (transcripts ou budget
  cop1) — rejeté : demande d'instrumenter un format de fichier qu'on ne
  contrôle pas (transcripts Claude Code) ou de réanimer un domaine mort sans
  appelant, pour un gain que la jointure en lecture obtient déjà sans écrire une
  seule ligne de plus.
- **Descope la métrique tokens** — rejeté comme solution par défaut, gardé
  seulement comme repli (grain session) quand le fenêtrage échoue vraiment.
- **Ventiler durée/tokens par étape du sprint** (BDD/archi/TDD/gate/revue/PR) —
  différé : le journal ne pose qu'UN gate par sprint, pas un par étape. Le
  rapport le signale (`steps.ventilated: false` + note) plutôt que d'inventer
  une granularité qu'aucune donnée ne soutient.

## Conséquences

- La durée de sprint est **solide** dès ce MVP (horodatages journal, aucune
  ambiguïté).
- Les tokens sont **best-effort** : exacts quand la fenêtre sprint contient des
  événements, dégradés (mais honnêtes) sinon. Un futur id de sprint posé sur les
  émetteurs améliorerait la précision sans changer le contrat du rapport (le
  champ `grain` absorbe l'évolution).
- Le domaine `sprint-metrics` (`products/mega-city/src/sprint-metrics/`) reste
  hexagonal : le cœur pur (`domain/`) ignore tout des ports (`JournalSource`,
  `TranscriptSource`, `RepoSource`) et de leurs adaptateurs réels — un futur
  changement de source (id de sprint natif, autre historique) ne touche qu'un
  adaptateur.
