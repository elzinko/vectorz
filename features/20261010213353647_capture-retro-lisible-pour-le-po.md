---
id: "20261010213353647"
title: Une capture de rétro (et tout artefact committé lu par le PO) doit être lisible, et quelque chose doit le vérifier
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [lisibilité, retro]
status: idea
pr:
evidence: none
created: 2026-10-10
---

# 20261010213353647 — Une capture de rétro lisible pour le PO (et un garde-fou qui le vérifie)

**En clair.** Quand un run ou une cérémonie laisse un fichier que le PO va lire (une capture de
rétro, une note de passation), **rien ne vérifie qu'il est compréhensible**. Le relecteur
automatique regarde du **code**, pas de la prose. Résultat : ces fichiers glissent dans le
jargon de la machine et le PO n'y comprend rien — alors que c'est justement sur eux qu'il
décide. On veut fermer ce trou : la lisibilité de ces artefacts devient un **critère tenu**, pas
un vœu.

**Si tu arrives frais.** Le *PO* (product owner, ici l'humain) pilote : il lance le travail et
décide à partir des **rapports** qu'on lui laisse. Une *capture de rétro* est un fichier
Markdown dans `docs/captures/` qui résume une rétrospective. Le *relecteur* (`ezk-reviewer`) est
l'agent qui juge un changement **de code** avant de le fusionner — il ne lit pas les captures.
La *lentille nouveau-venu* (fiche 0191) est déjà la façon de juger « est-ce qu'un lecteur neuf
comprend ? », mais elle s'applique aux corps de PR et aux fiches, pas aux captures.

## Contexte / Problème

- **Symptôme daté (PO, 2026-10-10).** À la clôture d'un run `ezk-product-build` autonome, la
  capture de rétro committée était illisible pour le PO : « le rapport de rétro n'est pas
  compréhensible pour moi… c'est un peu le comble ». Elle recopiait le vocabulaire interne
  (« portier », « bundle », « graph:check », noms de scripts).
- **Pourquoi ça arrive.** La règle « écrire clair pour l'humain »
  ([`human-facing-lisibility`](../products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md))
  existe et couvre explicitement les rétros. Mais rien ne la **contrôle** sur une capture : le
  relecteur juge des diffs de code, pas la prose d'un fichier de doc. Elle tient donc par la
  seule discipline du rédacteur — qui dérive sur un run long et technique.
- **Lentille déjà construite, mais pas branchée ici.** La fiche 0191
  ([done/0191](done/0191-lisibilite-templates-llm-au-moment-genere.md)) a posé la lentille
  nouveau-venu pour les corps de PR et les fiches. Les **captures** et les **notes de passation**
  restent hors de sa portée.

## Proposition

1. **Étendre la lentille nouveau-venu aux artefacts committés que le relecteur ne voit pas** :
   captures de rétro (`docs/captures/`) et notes de passation.
2. **Un garde-fou mécanique léger** qui, avant commit/acceptation, repère ce qu'un script peut
   voir : absence d'ouverture « En clair », termes internes non définis dans le corps (noms de
   scripts, ids de fiche/ADR nus) hors d'une section « Annexe technique ».
3. Garder le **motif annexe** : le détail machine va en bas, sous « Annexe technique » ; le corps
   reste en langage courant (symptôme vécu + image + idée).
4. Ne pas réinventer la règle de clarté : la **réutiliser**, juste élargir **où** elle est tenue.

## Critères d'acceptation

- [ ] Une capture de rétro committée ouvre par « En clair » et met le vocabulaire interne (noms
      de scripts, ids, numéros d'ADR) dans une « Annexe technique », pas dans le corps.
- [ ] Un contrôle (script ou étape obligatoire documentée) **signale** une capture bourrée de
      termes internes non définis avant qu'elle soit committée.
- [ ] La portée inclut au moins les captures `docs/captures/` et les notes de passation ; elle
      s'appuie sur la lentille de la fiche 0191, sans la dupliquer.
- [ ] Mesure (reprise de 0191) : sur les 3 prochaines captures, un lecteur neuf reformule le
      sujet en une phrase (3/3).

## Comment vérifier

```bash
# le garde-fou repère une capture trop jargonneuse (exemple : la 1re version du 2026-10-10)
# et laisse passer sa réécriture claire
```

La commande exacte dépend de la forme retenue au grooming (script de vérification, ou lentille
`ezk-reviewer` étendue). À préciser quand la fiche est tirée.

## Glossaire

- `capture de rétro` — un fichier `docs/captures/AAAA-MM-JJ-*.md` qui résume une rétrospective.
- `lentille nouveau-venu` — lire un texte comme si on découvrait le sujet, et vérifier qu'on
  reformule le besoin en une phrase (fiche 0191).
- `annexe technique` — la section en bas d'un artefact où va le vocabulaire machine, hors du
  corps lu couramment.

## Notes / décisions

- Née de la rétro du run « règles composables » du 2026-10-10 (grain n°5), capture
  [docs/captures/2026-10-10-retro-run-regles-composables.md](../docs/captures/2026-10-10-retro-run-regles-composables.md).
- Le PO l'a désignée comme le point le plus important de ce retour.
- Voisines à **référencer, pas fusionner** : [0191 — lentille nouveau-venu](done/0191-lisibilite-templates-llm-au-moment-genere.md)
  (corps de PR / fiches, livrée) et [0188 — ADR aussi lisibles qu'un article](0188-adr-lisibles-comme-articles.md).
- Priorité P1 proposée (le PO a souligné l'importance) ; à confirmer.
