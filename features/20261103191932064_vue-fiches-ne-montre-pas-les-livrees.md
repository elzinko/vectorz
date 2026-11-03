---
id: "20261103191932064"
title: "La vue Fiches de mission control ne montre jamais les fiches livrées"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: ready
pr:
evidence: before-after
created: 2026-11-03
---

# La vue Fiches de mission control ne montre jamais les fiches livrées

**En clair.** Dans mission control, cocher « réalisées » dans la vue Fiches ne fait rien : la colonne « Livrées »
reste à 0, alors que la vue d'ensemble compte 360 fiches livrées. Choisir le lot d'une version
taguée, v0.22.0 par exemple, affiche « 0 fiche(s) ». La fiche livrée en v0.17.0 promettait ce filtre.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **majeure**.

Reproduction :

1. Lance mission control, projet vectorz, onglet « Fiches ».
2. Clique « réalisées » : l'en-tête dit « 103 fiche(s) », la colonne « Livrées » reste à 0.
3. Choisis « v0.22.0 » dans « Lot » : « 0 fiche(s) », toutes les colonnes vides.
4. `curl -s http://127.0.0.1:<port>/api/board` : `vectorz.fiches` ne contient que les 103 fiches
   actives, aucune de `features/done/`.

## Proposition

Le défaut a deux étages, et la correction aussi.

- **La méthode publie les fiches livrées.** `ezk backlog show --json`, sans id, ajoute une liste
  légère `livrees` : pour chaque fiche de `features/done/`, son id, son titre, sa priorité, sa version
  et sa PR. Le champ s'ajoute au contrat sans changer `schema_version`, comme les ajouts précédents. Le
  détail complet d'une fiche livrée reste servi par `ezk backlog show <id> --json`.
- **Mission control les affiche.** Le traducteur lit `livrees` sans confiance aveugle : une entrée mal
  formée est ignorée. Chaque fiche livrée devient une carte « Livrées » de la vue Fiches, rangée dans
  sa version. Une méthode plus ancienne, sans `livrees`, garde l'affichage d'aujourd'hui.

## Critères d'acceptation

- [ ] `ezk backlog show --json` publie `livrees`, une entrée par fiche de `features/done/`, avec id,
      titre, priorité, version et PR. Le schéma et l'exemple du contrat le décrivent.
- [ ] `/api/board` sert ces fiches au statut `done`.
- [ ] Dans la vue Fiches, « réalisées » fait apparaître les fiches livrées, et le lot v0.22.0 montre
      ses fiches.
- [ ] Une réponse de la méthode sans `livrees` garde l'affichage d'aujourd'hui.
- [ ] Une fiche livrée sans version obéit au filtre « réalisées » : décoché par défaut, elle ne
      s'affiche pas. 278 des fiches de `done/` n'ont pas de version.

## Comment vérifier

1. `ezk --root . backlog show --json | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d['livrees']))"`
   affiche le nombre de fiches de `features/done/`.
2. Les tests du contrat, du traducteur et de la vue Fiches passent.
3. Mission control lancé, la vue Fiches avec « réalisées » montre la colonne « Livrées » remplie.
   Captures avant et après dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B1), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Voisine livrée : [la vue Fiches du board](done/20261012231419224_board-vue-fiches-filtre-categorie.md), dont un
  critère disait « cocher réalisées les fait apparaître ». Régression probable depuis le branchement
  du board sur les données de la méthode.
- Indice relevé avant le groom : `ezk backlog show --json` ne publie que les fiches actives
  (`backlog-show.ts`, filtre `!f.done`), et le traducteur de mission control saute aussi les fiches
  livrées (`ezkPlanTranslator.ts`, `if (f.done) continue`).
- **Groomée `ready` le 2026-11-03** (run autonome) : une liste légère plutôt que le
  détail complet de 360 fiches, pour garder la réponse de la méthode raisonnable. La fenêtre d'une
  fiche livrée montre ce que la liste porte ; son détail complet reste à une commande.
- **Vu au build le 2026-11-03** : le filtre « réalisées » ne gouvernait pas les fiches sans version.
  Sans ce réglage, les fiches livrées sans version auraient envahi la vue par défaut. Preuve : 113
  fiches par défaut après la correction, contre 109 avant ; 469 avec « réalisées ».
