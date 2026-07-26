---
id: 0061
title: La projection jette la méthode et le siège — impossible de savoir QUI a produit un run, ni avec quelle version
type: bug
priority: P1
epic:
status: shipped
ready:
pr: "#50"
created: 2026-07-25
---

## Contexte / Problème

Le journal **porte** l'information. Première ligne d'un `events.jsonl` réel (banc rejoué
le 2026-07-25) :

```json
{"seq":1,"type":"run.started","payload":{"method":{"name":"supervision-demo","version":"0.1.0"},"seat":"human"}}
```

La **projection la jette**. `RunProjection`
([`journal-validator/src/types.ts:75`](../../products/cop1/packages/journal-validator/src/types.ts#L75))
expose `runId`, `state`, `lastEventTs`, `lastEventSeq`, `gates`, `violations`, `notices`,
`tokens` — **ni `method`, ni `seat`**. `RunSnapshot` côté app n'ajoute que
`projectRoot`/`runDir`/`liveness`/`emissionClass`/`lastAbsorbedAt`, et `RunCard` côté web
n'affiche donc rien de tel.

Conséquence : **ni l'API `GET /api/supervision/runs`, ni le Moniteur, ne peuvent répondre
à « quelle méthode a produit ce run, et dans quelle version ? »** — alors que la réponse
est écrite en clair, ligne 1, dans le fichier qu'ils viennent de lire.

Ce que ça casse concrètement :

1. **La promesse d'agnosticisme n'est pas démontrable.** Le discours du produit est
   « cop1 regarde n'importe quelle méthode ». Le jour où BMAD émet (fiche mega-city 0058),
   deux runs côte à côte dans le Moniteur seront **indiscernables** : rien ne dira lequel
   vient de quelle méthode. L'argument de vente est invisible dans le produit.
2. **La question « quelle version tourne ici ? » reste sans réponse.** Question posée
   telle quelle par le PO le 2026-07-25. Le déploiement actuel est en mode `--link`
   (`~/.claude/{skills,agents}` = symlinks vers le clone) : tous les projets partagent le
   HEAD du clone, en continu. `method_version` **par run** est précisément le bon niveau
   de réponse — il est émis, puis perdu.
3. **Le `seat` disparaît alors qu'il est contractuel.** Le verdict Q1 de la revue de
   groupe (fiche 0030) est « un seul siège contractuel, **deux autorités** ». Distinguer
   un run lancé par l'humain d'un run lancé par un autre siège est un attendu du
   contrat v0.1 ; l'information est émise et non projetée.
4. **La détection d'écart de méthode (fiche mega-city 0082) n'a pas de support.** 0082
   prévoit un « marquage d'écart de méthode au démarrage d'un travail » (méthode déclarée
   ↦ méthode attendue). Sans `method` dans la projection, le moniteur n'a rien à comparer.

## Proposition

Faire remonter jusqu'à l'écran ce qui est **déjà lu** — aucune nouvelle collecte, aucun
nouvel outil, contrat v0.1 non rouvert :

1. `RunProjection` porte `method?: { name: string; version?: string }` et `seat?: string`,
   renseignés depuis le `payload` de `run.started`.
2. **Champs optionnels et tolérants.** Le journal est semi-hostile : un `run.started`
   sans `method`, avec un `method` non conforme, ou absent (journal tronqué), ne doit
   ni faire échouer la projection ni inventer une valeur. Absent ⇒ absent, et **dit
   absent** — même doctrine que `tokens: { provenance: 'absent' }` (D9), qui est le
   précédent à suivre plutôt qu'à contourner.
3. La carte du Moniteur affiche « méthode · version » et le siège.
4. Le validateur décide s'il **signale** un `run.started` sans `method` (notice, jamais
   violation : `method_version` est requis par le schéma de l'émetteur mega-city, mais
   un émetteur tiers n'est pas tenu par ce schéma — c'est tout l'intérêt du contrat).

## Critères d'acceptation

- [ ] `GET /api/supervision/runs` renvoie la méthode et sa version pour un run qui les a
      émises.
- [ ] Le `seat` déclaré est visible dans la projection.
- [ ] Un journal sans `method` (ou avec un `method` malformé) projette **sans erreur**,
      et l'absence est affichée comme absence — jamais comme une valeur par défaut.
- [ ] La carte du Moniteur montre méthode · version · siège.
- [ ] Deux runs de **méthodes différentes** sont distinguables d'un coup d'œil dans le
      Moniteur (test avec deux `method_name` distincts — le banc `supervision-demo-run.ts`
      suffit à en fabriquer un second).

## Notes

- Découvert en répondant à la question PO « chaque projet a-t-il sa propre version de
  méthode ? » (2026-07-25) : la réponse *devrait* être lisible dans l'UI, elle ne l'est
  nulle part.
- Se tire naturellement **avec** la fiche [0059](0059-moniteur-carte-de-run-lisible.md)
  (carte de run lisible) : c'est la même carte, et « méthode · version » est justement
  l'information qui manque le plus en tête de carte.
- Prérequis technique du « marquage d'écart de méthode » de la fiche mega-city **0082**.
- Ne rouvre **pas** le contrat v0.1 : les champs existent déjà dans l'enveloppe émise,
  seule la projection est aveugle.
