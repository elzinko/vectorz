---
id: "20261031160441559"
title: "Un seul vocabulaire pour les boards : commandes mortes, mots à plusieurs sens, mémoires"
type: chore
priority: P2
product: mega-city
milestone: board
version:
depends: ["20261102123552185"]
labels: [board, documentation, vocabulaire]
status: ready
pr:
evidence: none # documentation et messages ; pas d'écran nouveau
created: 2026-10-31
---

## En clair

Les documents parlent des tableaux de bord avec des mots qui changent de sens d'une page à l'autre, et
citent des commandes qui n'existent plus. Un lecteur ne sait pas quel board fait foi. Cette fiche
applique partout le vocabulaire décidé dans l'ADR-086 et corrige les commandes mortes.

## Contexte / Problème

L'enquête du 2026-10-31 a examiné environ 1 440 occurrences. Elle a trouvé :

- des décisions qui se contredisent (ADR-074 « un seul board », ADR-0062, l'ancien ADR-086) ;
- des faits faux (cop1 « renvoie par un lien » alors qu'il garde une copie figée de 10 fichiers) ;
- des commandes mortes : `pnpm ezk:map`, `pnpm ezk dashboard`, et le script `ezk:map` lui-même cassé ;
- des mots à plusieurs sens : *board*, *cockpit*, *dashboard*, *Moniteur*, *mission-control* ;
- des mémoires de l'assistant contradictoires ou périmées.

Liste complète, avec fichier et ligne : [les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md),
constat 4. Vocabulaire : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
section « Un seul vocabulaire ».

## Valeur

Un lecteur neuf comprend du premier coup quel board ouvrir et ce qu'il montre. Les commandes citées
marchent.

## Proposition

Un passage, dans cet ordre, après [le retrait de la page web](done/20261102123552185_retirer-la-page-web-de-la-methode.md) :

1. corriger ou retirer les commandes mortes, dont les scripts `ezk:map` des deux `package.json` et
   l'aide de `bin/ezk-map.ts` ;
2. appliquer le vocabulaire dans les skills, les guides et les messages affichés ;
3. ajouter aux ADR-074 et ADR-021 une ligne « amendé par l'ADR-086 » ;
4. trancher la copie figée `products/cop1/packages/web/public/v1` : archive assumée, ou retrait ;
5. corriger les mémoires de l'assistant ;
6. mettre le glossaire à jour.

## Critères d'acceptation

- [x] `grep` ne trouve plus `ezk:map`, `ezk dashboard` ni « Moniteur » dans un document actif, hors
      glossaire et historique. Exceptions bornées : les cinq guides de l'ancien écran, marqués « Ancien
      écran, retiré », en attente de [leur réécriture](20261102234112839_reecrire-guides-ancien-ecran-supervision.md).
- [x] Chaque commande citée dans un document actif s'exécute, hors les cinq mêmes guides, dont le
      bandeau dit que leurs commandes ne sont plus garanties.
- [x] Les ADR-074 et ADR-021 renvoient vers l'ADR-086.
- [x] La copie `public/v1` est tranchée, et la décision écrite.
- [x] Les mémoires de l'assistant ne se contredisent plus sur les boards : chaque mémoire qui parle
      des boards est relue, et le corps de PR liste les lignes corrigées.

## Comment vérifier

```bash
grep -rnE "ezk:map|ezk dashboard|\bMoniteo?u?r\b" --include='*.md' --include='*.yml' --include='*.yaml' . \
  | grep -vE "node_modules|\.claude/|features/|docs/(sessions|captures|adr|runs|plans|benchmarks)/|products/mega-city/docs/adr/|retro-notes/traitees|glossaire|public/v1|backlog-carte" \
  | grep -vE "docs/(DOGFOOD|demo-desktop-checklist|USER-GUIDE-web-ui)\.md|docs/tests/(moniteur-smoke|auth-panel)\.md"
```

Signal observable : la commande ne rend rien. Les deux filtres sont l'historique (premier), puis les
cinq guides en attente de réécriture (second).

## Notes

- Fiche sœur du milestone `board`, découpée le 2026-10-31 (ADR-086).
- Indépendante des trois autres : elle peut se construire à tout moment.
- 2026-11-02 : [l'amendement de l'ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) retire la page web de la méthode. « Board de la
  méthode » désigne désormais ce que publient `ezk board show` et les contrats, plus une page. La
  commande `ezk board open` part avec [le retrait](done/20261102123552185_retirer-la-page-web-de-la-methode.md).
- Groom du 2026-11-03 (run autonome) : la fiche se construit après le retrait de la page web, qui
  supprime déjà `bin/ezk-map.ts` et les scripts `ezk:map`. Il reste les mots et les renvois. Un
  « document actif » est un skill, un agent, une règle, un guide de `docs/` hors `adr/`, `captures/`
  et `sessions/`, un README ou un `CLAUDE.md` ; les fiches livrées, les corps de PR locaux et les
  revues sont de l'historique. Pour la copie `public/v1`, la proposition est l'archive assumée :
  l'entrée « v1 / archives » de mission control la nomme déjà ainsi, et un README d'une ligne le dira.
  Les mémoires à corriger sont celles de l'assistant dans ce projet.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). `public/v1` = archive
  assumée, confirmé. Coupe si la story gonfle : les messages affichés par le code passent dans une
  fiche à part.
- Revue adverse du 2026-11-03 : NO-GO sur les cinq guides de l'ancien écran (le mot remplacé y
  rendait des phrases fausses). Décision ezk-pm, option A : texte d'origine, bandeau « Ancien écran,
  retiré », réécriture dans la fiche sœur. `docs/backlog-carte.md` est un instantané daté du 2026-08-05 :
  de l'historique, laissé tel quel.
