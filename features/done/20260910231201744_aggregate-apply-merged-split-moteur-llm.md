---
id: "20260910231201744"
title: "Appliquer pour de vrai les fusions et découpages de fiches proposés"
type: feature
priority: P2
product: mega-city
labels: [backlog]
epic:
version: V0.3
status: shipped
pr: "#292"
created: 2026-09-10
---

# 20260910231201744 — aggregate : appliquer les regroupements + moteur llm

## En clair

`ezk-backlog aggregate` sait déjà **proposer** des fusions de fiches (#223). Il ne sait pas les
**appliquer**, et son moteur « llm » n'existe pas encore. Cette fiche livre les deux.

Un nouveau geste, `backlog:apply`, applique pour de vrai une fusion ou un découpage décidé par le
PO. Les fiches sources passent `merged` ou `split`, avec leur provenance dans les deux sens. Tout
se fait en une seule transaction, qui revient en arrière au moindre échec. Le moteur « llm » reste
le jugement de l'agent : il écrit ses propositions dans un fichier, et le script les **valide**
(ids inventés, fiches déjà livrées, recouvrements) avant d'en faire le rapport.

**Si tu arrives frais.** `aggregate` est le « grand ménage » du backlog (ADR-0051). Le moteur
`script` (livré) regroupe mécaniquement. Le moteur `llm` (ici) juge par le sens. L'« apply » (ici)
transforme une proposition acceptée en réalité. Le LLM propose, le PO tranche, un script applique
(ADR-0001).

## Contexte / Problème

Ce qui est déjà là, à ne pas refaire :

- Le cœur `script` et son bin en lecture seule (#223).
- Les statuts `merged` / `split` et les champs `merged_into` / `split_into`, validés par le schéma
  (fiche `20260823121712652`, livrée). **La « gate dure » de la version précédente de cette fiche
  est donc levée.**
- `planShip` / `applyShip` (`src/backlog/ship-fiche.ts`) : la transaction de livraison (liens recalés,
  `git mv` vers `done/`, `BACKLOG.md` régénéré, retour arrière) admet déjà `merged` et `split`.
  L'apply la **réutilise** : pas de seconde transaction.

Ce qui manque : appliquer une fusion ou un découpage, et le moteur `llm`. Les champs inverses
`merged_from` et `split_from` sont **nouveaux** et optionnels : le schéma ne rejette aucun champ
inconnu, et le validateur en contrôle la réciprocité (ajouté ici).

## Proposition : décisions de cadrage

1. **L'écriture reste séparée de la lecture.** `aggregate` reste en lecture seule (ADR-0051 : « un
   geste séparé applique »). L'apply est un bin à part, `backlog:apply`, exposé par `ezk backlog apply`.
2. **Provenance dans les deux sens.** Fusion : chaque source porte `merged_into: "<id>"`, la
   résultante porte `merged_from: [...]`. Découpage : la source porte `split_into: [...]`, chaque
   enfant porte `split_from: "<id>"`. Le validateur contrôle la réciprocité.
3. **Créer la résultante est hors POC.** La résultante (ou les enfants d'un découpage) doit déjà
   exister : `add` d'abord, `apply` ensuite. Le geste « créer puis appliquer » va en Suite.
4. **Le moteur `llm` = l'agent + un contrat de fichier.** Le code n'appelle jamais un LLM (ADR-0001,
   ADR-0051). `--mode llm` imprime le dossier à juger et le format de réponse. L'agent écrit un JSON.
   `--proposals <fichier>` le valide et le rend. Un id inventé est refusé, jamais deviné.
5. **« Épics » : sans objet.** Le conteneur épic est retiré (A16). Le moteur `llm` propose des
   fusions et des découpages, rien d'autre.

## Critères d'acceptation

**Apply**
- [x] `backlog:apply merge --into <id> <source>…` : chaque source passe `status: merged`, reçoit
      `merged_into` et `pr: "merged — fusionnée dans <id>"`, part dans `features/done/` ; la résultante
      reçoit `merged_from` (trié, sans doublon) ; liens recalés ; `BACKLOG.md` régénéré.
- [x] `backlog:apply split <source> --into <idA>,<idB>…` : la source passe `status: split` avec
      `split_into`, part dans `done/` ; chaque enfant reçoit `split_from`.
- [x] Refus **avant toute écriture** (code 1) : id inconnu ; fiche déjà dans `done/` ou terminale ;
      résultante parmi les sources ; découpage avec moins de 2 enfants ou un enfant égal à la source ;
      liens cassés en hausse ; entrée de `PLAN.md` laissée « à faire » (gardes de `planShip`).
- [x] `--dry-run` n'écrit rien. Un échec en route remet le dépôt à l'état initial (un test le prouve).
- [x] `fiches:check` signale une provenance non réciproque (A dit `merged_into` B, B ne cite pas A)
      et un id fantôme dans `merged_from` / `split_from`.

**Moteur llm « propose »**
- [x] `aggregate --mode llm` imprime le dossier (fiches actives du scope : id, priorité, titre,
      labels) et le format JSON attendu. Fin du « non implémenté par ce cœur ».
- [x] `aggregate --mode llm|both --proposals <fichier>` valide chaque proposition : id inexistant ou
      déjà terminal, fiche déjà source d'une autre proposition, résultante parmi les sources, `why`
      vide. Chaque rejet est **listé avec sa raison**, jamais abandonné en silence. Un fichier
      illisible est une erreur franche (code 1).
- [x] `--mode both` croise les deux moteurs : cluster confirmé par le llm · cluster non retenu ·
      proposition trouvée « par le sens seulement ».
- [x] Chaque proposition valide nomme son geste `backlog:apply …`, prêt à copier, sans l'exécuter.
      `aggregate` n'écrit toujours rien.

**Livrables**
- [x] `SKILL.md` d'`ezk-backlog` (§ `aggregate`) à jour : gate levée, apply, contrat llm. Manifeste
      `ezk` et script pnpm ajoutés.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/backlog/__tests__/aggregate-apply.test.ts src/backlog/__tests__/aggregate-llm.test.ts
pnpm --dir products/mega-city backlog:apply merge --into <idRésultante> <idSource> --dry-run   # rien d'écrit
pnpm --dir products/mega-city backlog:aggregate --mode llm                                       # dossier + format
pnpm --dir products/mega-city backlog:aggregate --mode both --proposals propositions.json        # rapport validé
pnpm --dir products/mega-city fiches:check                                                       # provenance réciproque
```

## Suite (hors POC)

- Créer la résultante (ou les enfants) dans le même geste ; aujourd'hui : `add` d'abord.
- Proposer une réorganisation **par thème** (`labels:`) à la place de l'ancien « épic ».
- Appliquer une proposition par son **numéro** de rapport, au lieu de ses ids.

## Notes / décisions

- Fiche de suivi ouverte le 2026-09-10 au ship du cœur « propose » (#223 ; option (a) du PO).
- Design de référence : fiche parente [`20260812104022240`](20260812104022240_backlog-rationalisation-tags-script-llm.md)
  et [ADR-0051](../../products/mega-city/docs/adr/0051-aggregate-coeur-script-deterministe-vs-jugement-llm.md).
- **Groom du 2026-10-01** : la gate sur `20260823121712652` est levée (statuts `merged` / `split` dans
  le schéma depuis V0.1). Priorité P2 inchangée.
- **Livré le 2026-10-01** : `src/backlog/aggregate-apply.ts` (plan pur, réutilise `planShip`),
  `aggregate-llm.ts` (contrat du moteur llm), `bin/backlog-apply.ts`, `bin/backlog-aggregate.ts` (modes
  `llm` et `both`, `--proposals`), validateur de provenance réciproque. Tests : cœurs purs, plus les deux
  bins de bout en bout sur un dépôt git jetable (boucle fermée apply puis `fiches:check --strict`).
