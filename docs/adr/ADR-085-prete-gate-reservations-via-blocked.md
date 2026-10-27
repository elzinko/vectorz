# ADR-085 — « Prête » gate les réservations via blocked:, pas un champ needs-design:

- Statut : accepté
- Date : 2026-10-27
- Décideurs : PO (Thomas) + panel adverse (3 voix)

## En clair

Une fiche peut cacher une réservation (« réservé au panel, pas d'autonomie ») dans sa prose. L'intake
ne lit que le champ `blocked:`, donc le caveat surgit en plein build. On ne crée **pas** de champ neuf
`needs-design:` pour ça : le champ existe déjà, c'est `blocked:` (raisons typées). « Prête » **signale**
désormais une réservation laissée en prose quand aucun `blocked:` typé ne la porte. Pas de blocage : un
signal, le groomeur juge.

## Contexte

« Prête » (DoR) certifie une fiche **bien écrite**, pas une fiche dont la prémisse tient. Deux pannes :

1. une surface de code citée n'existe pas (ex. un « README `.rules/` ») — cas v0.16 ;
2. un caveat « réservé panel/maquette, pas d'autonomie » écrit en **note libre** échappe à l'intake,
   qui n'écarte que sur `blocked:` — cas 2026-10-24 et 2026-10-26.

Un **panel adverse** (2026-10-27) a éprouvé la reco initiale de la fiche (ajouter un champ
`needs-design:`) et l'a **renversée** : `blocked:` est **déjà** un champ à raisons typées (`panel`,
`design`, `review`…), lu par `plan:head`, `plan:lot` et `run-eligibility`. Un second champ
doublonnerait, et une faute de frappe y passerait en silence (le validateur ne refuse pas les champs
inconnus).

## Décision

- **Panne 2** : « prête » (`ezk dor check`) **signale** une réservation laissée en prose libre
  (« hands-off », « pas d'autonomie », « réservé panel/maquette ») quand **aucun `blocked:` typé** ne
  la porte. **Pas de champ neuf.** **Pas de blocage** : un signal (ADR-0001 — le script range, le
  groomeur juge), car une fiche qui ne fait que **parler** de réservations peut déclencher à tort.
- **Panne 1** (confronter la prémisse au code) : **différée en spike séparé**, hors gate — sa fiabilité
  n'est pas prouvée (« règle en observation » n'est pas greppable).

## Conséquences

- **Gagné** : un caveat ne surgit plus en plein build ; il est poussé vers `blocked:`, que l'intake lit
  déjà. Le mécanisme existant (liste fermée typée) est réutilisé, pas dupliqué.
- **Coût assumé** : le signal a des **faux positifs** — une fiche qui *parle* de réservations (celle qui
  porte cette décision, par exemple) le déclenche. Acceptable car c'est un signal, jamais un refus.
- **On s'interdit** : un champ `needs-design:` parallèle à `blocked:`.
- **Lié** : vocabulaire `blocked:` ramené à un seul mot anglais (fiche `20261027180541168`,
  commit `e00cff22`).
- **Fiche** : `features/20261015213921103_dor-verifie-premisse-dans-le-code.md`.
