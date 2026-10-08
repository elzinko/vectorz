---
id: "20261004101755756"
title: "Écrire le contrat du bus : le catalogue des moments de la méthode"
type: feature
priority: P1
product: mega-city
milestone:
version: v0.7.0
labels: [github-optionnel, plugins]
status: shipped
pr: "local (f56d17f5)"
evidence: none # document et fichier de données, aucun écran
created: 2026-10-04
---

# 20261004101755756 — Écrire le contrat du bus : le catalogue des moments de la méthode

**En clair.** L'ADR-0061 décide que tout outil se branchera sur la méthode par un « bus », sans
toucher au texte des skills. Mais la liste des moments que la méthode annonce n'est écrite nulle
part. On l'écrit : un catalogue des moments, avec pour chacun sa sorte d'échange et ce qu'il
transporte. C'est ce contrat qui permettra de brancher GitHub, GitLab, Codex ou Slack sans
interférence, et de générer un diagramme lisible.

**Si tu arrives frais.** Le *bus* est le canal commun où la méthode annonce ses moments et où les
plugins se branchent. Il est décrit dans la section « Perspective » de
[ADR-0061](../../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).

## Contexte / Problème

L'ADR-0061, accepté le 2026-10-04, fixe trois rôles : la méthode décide **quand**, le projet
**qui**, le plugin **comment**. Il distingue trois sortes d'échanges :

- **événement** : la méthode annonce et continue ; zéro, un ou plusieurs abonnés ;
- **commande** : la méthode attend un résultat ; un seul exécutant, choisi par la config ;
- **avis** : la méthode attend un verdict ; plusieurs avis, combinés par une règle écrite.

Il dit aussi : « on n'attend pas pour fixer le contrat », car un deuxième plugin écoute déjà la
méthode, la supervision ([ADR-0039](../../products/mega-city/docs/adr/0039-trois-etages-moteur-methode-branchements-plugin.md)
§4 demandait d'attendre ce deuxième plugin).

Aujourd'hui, les moments existent mais sont éparpillés :

- la supervision a ses propres noms (`run_start`, `gate_reached`, `gate_resumed`, `escalate`,
  `heartbeat`, `run_finished`), décrits dans `products/mega-city/src/supervision/README.md` et
  recopiés dans le texte d'`ezk-sprint` et d'`ezk-product-build` ;
- les gestes GitHub deviennent des verbes du guichet `ezk forge` (`changes`, `integrate`), par la
  fiche [20261004083838593](../20261004083838593_guichet-unique-github-archive-reconcile.md) ;
- la fiche [0171](../0171-adapter-github-issues-push-only.md) ajoute des moments à elle : créer une
  issue au passage en `ready`, une release à la clôture d'une version ;
- la revue a sa règle « plancher et filet » dans
  [ADR-0059](../../products/mega-city/docs/adr/0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md).

Sans catalogue commun, chaque nouveau plugin inventera ses propres noms de moments, et le bus
deviendra illisible avant d'exister.

## Proposition

Écrire le contrat, **sans construire le bus** :

1. **Un ADR du bus**, comme l'annonce l'ADR-0061 : les trois rôles, les trois sortes d'échanges,
   les cinq règles de non-interférence, la forme du manifeste d'un plugin.
2. **Un catalogue des moments**, en fichier de données lisible par une machine. Pour chaque
   moment : son nom, sa sorte (événement, commande ou avis), l'étape de la méthode qui l'émet, ce
   qu'il transporte, et ses clients d'aujourd'hui.
3. **La correspondance avec l'existant** : chaque événement de la supervision, chaque verbe
   d'`ezk forge` et chaque moment de la fiche 0171 trouve sa place dans le catalogue, ou la raison
   de son absence est écrite.
4. **Un test de forme** : le catalogue respecte son schéma (nom unique, sorte connue, étape
   connue).

Hors périmètre : le code du bus, la découverte des plugins, le diagramme généré. Ils viendront
canal par canal, comme l'ADR-0061 le prévoit.

## Critères d'acceptation

- [ ] Un ADR du bus existe, au statut « Proposé », et renvoie à l'ADR-0061.
- [ ] Le catalogue liste chaque moment avec son nom, sa sorte, son étape émettrice, son contenu et
      ses clients actuels.
- [ ] Les six événements de la supervision y sont tous rattachés, ou leur absence est justifiée.
- [ ] Les verbes `changes` et `integrate` d'`ezk forge` y figurent comme commandes.
- [ ] Les moments de la fiche 0171 (issue au passage en `ready`, release en fin de version) y
      figurent comme événements.
- [ ] La revue y figure comme avis, avec la règle de l'ADR-0059.
- [ ] Un test échoue si le catalogue contient un nom en double ou une sorte inconnue.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
bash products/mega-city/bin/check-links.sh products/mega-city docs/adr
```

Puis relire l'ADR du bus et le catalogue : un lecteur neuf doit pouvoir dire, pour un moment pris
au hasard, quand il se produit, s'il bloque la méthode, et quel outil peut s'y brancher.

## Glossaire

- **Moment** — un point du déroulé de la méthode où elle annonce quelque chose ou demande quelque
  chose : « branche validée », « intégrer », « revue demandée ».
- **Bus** — le canal commun où la méthode annonce ses moments et où les plugins se branchent.
- **Événement, commande, avis** — les trois sortes d'échanges du bus ; voir « Contexte ».
- **Manifeste** — le fichier où un plugin déclare ce qu'il exécute, écoute et rend.

## Notes / décisions

- Décidé par l'ADR-0061, section « Perspective », sous-section « Faut-il attendre un deuxième
  plugin ? ».
- Voisines : [20261004083838593](../20261004083838593_guichet-unique-github-archive-reconcile.md)
  (le guichet, premier canal), [20260830110131298](../20260830110131298_supervision-ezk-plugin-separable.md)
  (sortir la supervision du texte des skills, futur canal des événements),
  [0029](../0029-contrat-supervisabilite-v02-differes.md) (la v0.2 du contrat de supervisabilité,
  différée).
- Référence externe : les « Enterprise Integration Patterns » pour nommer les motifs (canal
  publier-s'abonner, aiguillage, diffuser puis rassembler).
- 2026-10-07 : groomée et passée `ready` (go du PO). **Clé de voûte de la V0.7 « Voir sous le
  capot »** : l'ordre choisi est le socle d'abord, et cette fiche en est la première brique (le
  journal durable des moments rattachés à une fiche / un sprint / une version). Priorité montée
  P2 → P1 : tout le socle en dépend. DoR déjà tenue — critères testables, « Comment vérifier »
  rejouable, glossaire, lentille « si tu arrives frais ». Rien à construire ici d'autre que le
  contrat (ADR du bus + catalogue), le code du bus reste hors périmètre.
