# ADR-074 — Le board unifié : run → moments → fiches, et deux portées de configuration

- **Statut** : Accepté (2026-10-13)
- **Compose** (sans les rouvrir) :
  - [ADR-036](ADR-036-transport-emission-separable-du-runtime.md) — noyau d'émission ↔ transports interchangeables (monitoring live). Le board **lit** le journal, il ne l'écrit pas.
  - [ADR-038](ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) — reporting post-hoc vs monitoring live. Le board est la surface de **monitoring** (vivacité, où en est chaque projet), distincte du pack de review.
  - [ADR-033](ADR-033-port-metrique-qualite-produit.md) — les métriques se **lisent** par un port, jamais réécrites : le board agrège par référence.
- **Fiches** : [20261007135620590](../../features/20261007135620590_refondre-vue-supervision-moniteur-lisible.md) (design de référence, guidé par maquette) ; le socle [20261004101755756](../../features/done/20261004101755756_contrat-bus-catalogue-moments.md) (catalogue des moments, livré) ; les 8 tranches de build (milestone `board`, version `v0.17.0`).
- **Déciders** : PO (Thomas). Conçu **par maquette** (17 itérations), départagé par des agents UX, validé par le PO le 2026-10-12.

## Contexte

La webapp cop1 avait **trois tableaux de bord éparpillés** : le Moniteur (les runs), le cockpit (les projets et leur config), et ezk:map / board (le plan et l'avancement). Ils se contredisaient (« 0 run » d'un côté, « 32 » de l'autre), affichaient « tokens non mesurés » partout, et mélangeaient du texte résumé **inventé à la main** avec les vraies données.

Le besoin : **un seul board**, lisible d'un coup d'œil, qui dit vrai. On l'a conçu par maquette avant de coder. Cet ADR grave les décisions de structure que la maquette a tranchées.

## Décision

1. **Un seul board** remplace les trois surfaces. Une navigation par projet, plus une page globale de config outil.

2. **Modèle `run → moments → fiches`.** Un **run** est une session de la méthode. Il contient des **moments** (les étapes de process : idéation, grooming, DoR, sprint, revue, rétro, release-gate, tag). Chaque moment traite une ou plusieurs **fiches**. On ne montre jamais « le run entier » hors contexte : on le regarde **par lentille** — son côté cadrage dans la vue Cadrage, son côté sprints dans la vue Développement. Un run qui fait les deux apparaît dans les deux, chacune ne montrant que sa tranche.

3. **Affichages déterministes.** Le texte d'une ligne d'activité est le **nom de session du run** (vraie donnée) ; les pastilles sont les **vrais moments**. Aucun résumé rédigé à la main. Les métriques et coûts viennent du journal.

4. **Configuration à deux portées.**
   - Le **projet** parle en **tiers abstraits** : modèle `high / middle / low`, effort idem, un tier par rôle. Ça vit dans `.vectorz/config.yml` et **voyage avec le repo**.
   - L'**outil** (poste) **résout** le tier en modèle concret, **par IDE**. Ce mapping **ne voyage pas** avec le repo : il vit au niveau du poste, sur une page globale.
   - **Pourquoi le mapping est au niveau de l'outil, pas du projet** : si le projet écrivait « middle = Opus 4.8 », il casserait le jour où on l'ouvre dans un IDE qui n'a pas Opus. Le projet reste portable en parlant tiers ; l'outil résout. C'est une indirection, comme des jetons de couleur résolus par un thème.

5. **Garde-fous de la config.** Trois tiers figés (pas d'invention de tiers, sinon la matrice de mapping explose). Un défaut plus des surcharges par rôle (pas une case par rôle à remplir). La surcharge du mapping par un projet reste **en réserve** (soupape rare, pas exposée d'emblée).

## Conséquences

- **Ce qui devient plus simple** : une seule vérité par projet ; piloter en lisant les vrais runs ; porter un projet d'un IDE à l'autre sans toucher sa config.
- **Ce qui devient plus exigeant (dépendance données)** : pour que l'activité et les coûts soient **vrais**, le journal doit enregistrer les moments par run et par fiche, et les tokens. Le socle « catalogue des moments » est **livré** (v0.7) ; l'attribution des tokens par fiche/sprint/version relève du cluster métriques (fiches 0052 / 0055). Le board se construit **après** ce socle.
- **À revisiter** : le catalogue des moments doit couvrir toutes les étapes que le board affiche ; la complétude déterministe du graphe de process est le sujet de la fiche 20260830110131228 (étapes comme données).
- **Pas de fiche chapeau** : les 8 tranches de build sont des sœurs, liées par `milestone: board` + `version: v0.17.0`, qui référencent cette décision et la maquette. La fiche 20261007135620590 reste le **document de design** (la maquette), pas un parent.
