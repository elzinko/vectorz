---
id: "20261016081021364"
title: "Séquencer par milestone + dépendances inter-milestones (au lieu du train de versions)"
type: refactor
priority: P2
product: mega-city
milestone:
version:
labels: [methode, backlog, versioning, milestone, sequencement]
status: idea
blocked:
pr:
evidence: none # modèle/outillage de méthode, pas d'écran ; prouvé par tests du séquenceur
created: 2026-10-16
---

# 20261016081021364 — Séquencer par milestone + dépendances inter-milestones

**En clair.** Aujourd'hui les versions forment un **train numérique** : on ne tire que la plus basse
non taguée, et toute version plus haute attend derrière, même sans rapport (cas vécu : v0.23 prête,
coincée derrière v0.18–v0.22). Un **panel adverse a tranché le 2026-10-16** ([ADR-0081](../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md)) :
on **fait maintenant le petit noyau utile**, et on **diffère le gros chantier** (refondre l'ordre
par milestone avec un vrai graphe de dépendances) tant qu'un besoin réel n'est pas prouvé.

**Si tu arrives frais.** Un *milestone* est un thème de travail (champ `milestone:`, ADR-0017) ;
une *version* est un lot de release numéroté (`v0.X.Y`). `depends:` est un champ de fiche qui existe
**déjà**, où l'on écrit « cette fiche en attend une autre » — mais que l'outil **ne lit pas encore**.

## Décision du panel (ADR-0081)

Revue adverse à 3 lentilles (architecte, dev, PO/YAGNI) le 2026-10-16 → option **B**. Détail et
verrous : [ADR-0081](../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md) ·
record : [capture du panel](../docs/captures/2026-10-16-panel-sequencement-version-milestone.md).

### Le noyau — à faire maintenant

- **Lire `depends:`** (l'ajouter au type `Fiche` + au loader) et le **vérifier en avertissement, pas
  en barrage** : signaler un `PLAN.md` ou un `version:` qui place une fiche avant une dépendance non
  livrée ; refuser un cycle. Contrôle pur, avant la sélection — `ADR-0070` inchangé.
- **Désambiguïser « en cours »** : deux libellés (lot incomplet vs version active).
- **Découper le grain** `board` → `board-fondation` / `board-multisession` (geste de grooming).
- **Débloquer une version haute sans lien avec le train** par `--all-versions` ou renumérotation
  (déjà câblé).

Ce noyau est cheap, ne touche **pas** au rôle de `version` et ne rouvre ni ADR-0070 ni ADR-0080.

### Le basculement — différé

`version` → simple étiquette, `milestone` = unité séquencée, vrai **graphe (DAG)** inter-milestone,
migration du stock : reste **`idea`**, bloqué derrière les 4 verrous plus bas. Le détail de la cible
est conservé ci-dessous pour le jour où on la rouvrira.

## Le problème (pourquoi cette idée existe)

Le tirage est gouverné par la version en cours — la plus basse non taguée (ADR-0070). Bonne discipline
de cadence, mais elle **confond deux choses** : la **version** (étiquette de release, ordre strict) et
le **milestone** (thème de travail, qui s'étale déjà sur plusieurs versions). Preuve vivante : le
milestone « board » couvre **v0.17 ET v0.23**, avec cinq versions sans rapport coincées entre les
deux. La seule vraie dépendance (board multi-session s'appuie sur board fondation) est **thématique**,
pas numérique.

En face, `depends:` existe mais le séquenceur **avoue ne pas le lire** — la dépendance est **déclarée
mais inerte**. C'est le point que le noyau corrige en premier.

## Le basculement, en détail (la cible différée)

Démêler l'axe unique en trois rôles :

- **milestone** = l'unité qu'on séquence (le lot de travail cohérent) ;
- **depends** = les arêtes entre milestones → un **graphe orienté** (DAG), pas une file ;
- **version** = l'étiquette de release, posée quand un milestone sort (dérivée).

Le séquenceur tirerait alors le prochain milestone **dont toutes les dépendances sont livrées**.
Deux couches complémentaires :

- **`depends:` = les rails** — les contraintes dures, vérifiables par la machine (cycle, ordre topo) ;
- **`PLAN.md` = le marbre** — le chemin *choisi* parmi les ordres que les rails autorisent (curé,
  révisable, committé). Le DAG contraint la roadmap ; la roadmap raffine le DAG en linéarisant ce
  qu'il laisse parallèle.

```
DAG (depends:)    board-fondation ──▶ board-multisession    arête dure (23 après 17)
                  milestone X    milestone Y                parallèles : ordre libre
Roadmap (PLAN.md) fondation → multisession → X → Y          ton choix, dans les rails
```

## Les 4 verrous du basculement (ce qui doit être vrai avant de le construire)

1. **Preuve d'usage chiffrée** : un seuil fixé d'avance (ex. ≥ N arêtes inter-milestone réelles que
   l'ordre du plan n'exprime pas). Aujourd'hui : **0 arête inter-milestone**.
2. **Trou de modèle résolu** : agréger `depends:` par-fiche → par-milestone, et détecter le cycle
   **au niveau agrégé** (un graphe par-fiche sain peut boucler au niveau milestone).
3. **Milestone promu en objet** : sinon un 3ᵉ sens sur une chaîne libre qui porte déjà `parked`.
4. **ADR amendés, pas contredits en silence** : ADR-0070 a rejeté les deux axes (« un seul, décision
   PO ») → amender ; ADR-0080 étendre.

## Comment vérifier

**Le noyau (testable maintenant) :**

- `depends:` est **lu** par le séquenceur (fini le « non lu ») ;
- une entrée de plan placée avant une dépendance non livrée est **signalée** (avertissement) ;
- une dépendance en cycle est **refusée** ;
- « en cours » affiche deux libellés distincts (lot incomplet vs version active).

**Le basculement (quand il partira) :**

- un milestone B qui ne dépend que de A se tire **dès que A est livré**, sans traverser les milestones
  sans rapport.

## Notes / décisions

- **Tranché par panel (ADR-0081, 2026-10-16)** : noyau maintenant, basculement différé — voir la
  section « Décision du panel » ci-dessus.
- **Aligne ADR-0080** : « dépendances = **signal**, pas graphe ; pas d'extension du modèle de process
  maintenant ». Cette fiche **est** l'extension différée. Voir
  [ADR-0080](../products/mega-city/docs/adr/0080-checkpoint-de-version.md) et la fiche
  [checkpoint de version](20261015125606808_frontiere-version-checkpoint-run-autonome.md).
- **Entoure / amende** [ADR-0070](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md)
  (le tirage reste dans la version en cours) : la soupape `--all-versions` est le palliatif actuel,
  et le noyau s'y appuie pour débloquer v0.23.
- **Câblage, pas greenfield** : les champs `milestone:` (ADR-0017) et `depends:` existent déjà ;
  il s'agit de les relier au séquencement.
- **Fait neuf du code** : deux axes d'ordre coexistent déjà — le tirage lit `version:`, le board range
  par un `MILESTONE_ORDER` codé en dur (`avancement-data.ts`) qui n'alimente que l'affichage.
- **Voisines** (cluster « cycle de vie des versions ») :
  [cycle de vie d'une version](20261014200651962_cycle-vie-version-preparer-figer-developper.md),
  [frontière de version = checkpoint](20261015125606808_frontiere-version-checkpoint-run-autonome.md),
  [groom par version](20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md).
- **Noyau sorti en fiche tirable** :
  [lire `depends:` + désambiguïser « en cours »](20261016114857813_lire-depends-et-desambiguiser-en-cours.md)
  (prête). Cette fiche-ci reste la **cible différée**.
