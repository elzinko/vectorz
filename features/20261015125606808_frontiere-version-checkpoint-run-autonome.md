---
id: "20261015125606808"
title: "La version est un checkpoint du run : lançable à l'entrée, scellable à la sortie"
type: feature
priority: P2
product: mega-city
milestone: autonomie-run
version:
labels: [methode, ezk-product-build]
status: idea
pr:
evidence: none # pilote de run, pas d'écran
created: 2026-10-15
blocked:
---

# 20261015125606808 — La version est un checkpoint du run : entrée et sortie

**En clair.** Une version n'est pas une étape de *build*, c'est un **checkpoint** avec deux gates.
À l'**entrée** : on ne lance les sprints d'une version que si **toutes ses fiches sont prêtes**
(DoR-ok). À la **sortie** : on ne **scelle** (pose l'étiquette) que si **toutes ses fiches sont
livrées ou reportées** hors de la version. Aujourd'hui le run autonome franchit ces deux bords **en
silence** — il démarre sans vérifier, et il s'arrête muet à la frontière. On veut deux gates
**explicites** : un script vérifie le **mécanique** (prêtes / livrées) ; les **décisions** (reporter
une fiche, apposer le sceau) restent au PO, et le run les **fait surface** au lieu de deviner.

**Si tu arrives frais.** Le *run autonome* = `ezk-product-build run --mode auto`, qui enchaîne les
sprints seul. Une *version* = le lot de livraison (champ `version:` des fiches). *Sceller* =
`ezk backlog version close <v> --tag` (poser l'étiquette git). Garde-fou
[ADR-0070](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) : on ne
tire pas la version suivante tant que la courante n'a pas son étiquette.

## Contexte / Problème

Discussions PO des 2026-10-15 et 2026-10-16, et audit du découpage (2026-10-15). Deux bords d'une même
frontière, aujourd'hui tous deux **muets** :

- **Entrée muette.** Rien ne répond « cette version est-elle **lançable** ? » avant de lancer ses
  sprints. `version check` ne signale même pas une fiche `idea` dans le lot
  (`src/backlog/versions.ts:180`). Une version a été lancée en portant des fiches pas prêtes (v0.16),
  vu seulement à la clôture.
- **Sortie muette.** Sur un backlog loti, quand le run a construit tout le constructible, `plan-lot`
  ne rend plus rien et le run **s'arrête sans rien demander**. ADR-0070 bloque la version suivante
  tant que la courante n'est pas scellée, mais le run ne dit ni pourquoi il s'arrête, ni ce qu'il
  reste à décider.

Le manque est le même aux deux bords : la **condition mécanique** (prêtes / livrées) n'est pas rendue
en une **gate explicite**, et les **décisions** qui restent (reporter une fiche, sceller) ne **font
pas surface**.

## Proposition

Modéliser la version comme **un checkpoint à deux gates**, sur la doctrine ADR-0001 (le script
vérifie le mécanique, le PO décide, le run fait surface) :

### Gate d'entrée — « version lançable »

Avant de lancer les sprints d'une version, un verdict **lecture seule** composant les briques
existantes (`version check` + `dor health` + `run eligibility`) : « lançable : N prêtes, 0 idée,
M réservées-PO ». Vert = toutes les fiches sont prêtes (DoR-ok). Sinon, le run **groome** ce qui
manque (c'est la Phase 1 du mode auto en 2 phases), ou **fait surface** ce qu'il ne peut pas groomer
seul. Soupape PO journalisée, comme le gate `ready`.

### Gate de sortie — « version scellable »

Quand le run atteint la frontière, la version doit être **propre** : chaque fiche prévue est
**livrée** ou **reportée hors de la version**. Pour chaque fiche **non livrée**, le PO décide **selon
ce qui la bloque** (table ci-dessous) : reporter à la version suivante, parker, clôturer, ou tenir.
Une fois la version propre, le **sceau** (tag) est apposé **par le PO — y compris en mode auto** si
tout est OK, ou par pré-autorisation déjà livrée en v0.15 (`--seal-versions local`, `--versions all`).
Le run ne scelle jamais sans décision ni pré-autorisation ; mais il **ne s'arrête plus muet** : il
présente la liste des fiches non livrées, leur raison, et la décision attendue.

### La décision dépend de ce qui bloque (PO 2026-10-16)

Le sort d'une fiche non livrée **dépend de sa raison de blocage** — d'où l'intérêt des raisons
**typées** de `blocked` (fiche sœur « raisons typées pour blocked »). Rappel : `ready` veut dire bien
écrite et tirable, pas garantie livrable.

| Pourquoi la fiche n'est pas livrée | Décision typique au frontière |
|---|---|
| Dépendance externe dure (service, secret, repo absent) | reporter à la version où la dépendance arrive |
| Geste réservé au PO (vidéo, test machine, arbitrage, panel) | le PO fait le geste, ou reporte |
| Prémisse absente du code (fiche `ready`, surfaces inexistantes) | re-groomer, ou reporter / clôturer |
| Invalidée par un pivot (ADR postérieur) | révoquer `ready`, clôturer ou superseder |
| Collision de concurrence / budget épuisé | **pas** une décision de frontière : le run réessaie plus tard |

## Critères d'acceptation

> Modèle tranché par le PO et mécanisme conçu en panel (2026-10-16, ADR-0080) ; reste à groomer pour le build.

- [ ] En `--mode auto`, backlog loti : une version ne **démarre** ses sprints que si toutes ses fiches
      sont prêtes, ou le run fait surface ce qui manque (gate d'entrée).
- [ ] À la frontière, le run **ne s'arrête plus en silence** : il présente les fiches non livrées,
      **leur raison de blocage**, et la décision attendue (reporter / parker / clôturer / sceller).
- [ ] Le **sceau** peut être apposé par le PO en mode auto quand la version est propre ; les drapeaux
      v0.15 (`--seal-versions local`, `--versions all`) **lèvent** la demande (comportement inchangé).
- [ ] Backlog **non loti** : aucune frontière, le run enchaîne jusqu'à épuisement du stock prêt
      (non-régression).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# dérouler un run --mode auto sur un plan jouet loti portant une fiche bloquée :
# - à l'entrée, la gate « lançable » refuse ou fait surface le manque ;
# - à la sortie, le run présente la fiche non livrée + sa raison + la décision, au lieu de s'arrêter muet ;
# - avec --seal-versions local / --versions all : plus de demande de sceau ;
# - sur un plan non loti : aucune frontière, le run va jusqu'au bout du stock prêt.
```

## Notes / décisions

- **Fusion (2026-10-16).** Cette fiche absorbe la **gate d'entrée** (« version lançable », issue de
  l'audit du découpage et de la note de rétro du 2026-10-15) : entrée et sortie sont les deux bords
  **d'un même checkpoint de version**. Un seul concept, une seule fiche.
- **Tranché par le PO (2026-10-16).** (1) Peu importe le mode, on ne franchit pas tant que la condition
  mécanique n'est pas remplie (prêtes à l'entrée, livrées/reportées à la sortie). (2) En auto
  multi-versions, le PO décide du sort des fiches non livrables **selon leur raison de blocage**. (3) Le
  sceau est un geste PO, apposable **en mode auto** si tout est OK (ou pré-autorisé v0.15).
- **Conception retenue — panel du 2026-10-16, gravée dans [ADR-0080](../products/mega-city/docs/adr/0080-checkpoint-de-version.md) (GO unanime).** Une brique pure à deux verdicts calculés ; « faire surface » = STOP dans la boucle (pas de moment de bus neuf) ; **tag honnête par report-hors** ; dépendances = **signal** (plan + milestone), pas un graphe ; pas d'extension du modèle de process maintenant. Garde-fous : anti-waterfall (verdict + groom progressif) et anti-Goodhart (seule « concurrence/budget » s'auto-résout, le reste escalade ; push = 4-STOP ; bilan de sceau honnête). Points laissés **ouverts** dans l'ADR : `current` sur tags locaux, et le but de version.
- Sœur du thème « autonomie du run » livré en v0.15 : filtre d'éligibilité, boucle multi-versions,
  auto-tag opt-in. En multi-sessions, la décision de scellage passe par la session **MASTER pilote**.
- **Placement** : aucune version ouverte ne porte ce thème ; à affecter par le PO. Priorité P2.
- Origine : note de rétro « frontière de version / checkpoint » (2026-10-15), audit du découpage
  (2026-10-15), clarifications PO (2026-10-16).
- **Confirmation PO (2026-10-16) — les 4 capacités du run auto.** En `--mode auto`,
  `ezk-product-build` est autonome et peut : (1) amener toutes les fiches d'une version en `ready`
  avant de lancer les dev, ou **reporter** à une version ultérieure celles qu'il ne peut pas groomer
  pour une raison valable, **tant que ça ne casse pas le plan** ; (2) développer au maximum les fiches
  de la version, et pour une fiche bloquée la **mettre de côté** (status `blocked`) si ce n'est pas
  grave pour la suite, ou la **reporter** ; (3) **sceller** quand chaque fiche est **traitée** —
  livrée, ou **reportée hors version** (re-version si possible, sinon park) ; (4) passer à la version suivante (grooming, sprint) si
  plusieurs versions sont demandées (boucle multi-versions, livrée en v0.15).
  Deux précisions que ces points font surgir :
  - *« sans casser le plan » = un contrôle de dépendances.* Reporter ou bloquer une fiche n'est permis
    que si rien d'aval ne la requiert ; sinon le report **cascade** (on reporte aussi les dépendantes)
    ou le run **fait surface** le conflit. C'est la condition réelle derrière « si ce n'est pas grave
    pour la suite ».
  - *Tag honnête (point 3, tranché en panel).* Une fiche encore bloquée à la frontière **sort** de la
    version — on lui **propose une autre version** si possible, **sinon on la parke** (réversible). Le
    panel a **écarté** le marquage « différée, en place » : il ferait mentir le tag et imposerait un
    sous-état que chaque vue devrait exclure. Le tag = le lot réellement livré.
- **Besoin transverse (PO 2026-10-16) : désigner une version / un sprint cible au lancement.** Pouvoir
  lancer `ezk-sprint` / `ezk-product-build` (et consorts) en **précisant la version ou le sprint
  visé** (ex. `--version <v>`). Aujourd'hui le périmètre se déduit (ADR-0070) ; un paramètre explicite
  manque. À capturer à part (fiche dédiée, ou absorbé par le brainstorm DSL côté grammaire des flags) —
  noté ici car il conditionne les 4 capacités ci-dessus.
