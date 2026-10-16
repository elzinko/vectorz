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

**En clair.** Aujourd'hui les versions forment un **train numérique** : on ne tire que la plus
basse non taguée, et toute version plus haute attend derrière, même si elle n'a aucun rapport.
Cas vécu : v0.23 (board multi-session) est prête, mais coincée derrière v0.18–v0.22 qui ne la
concernent pas. L'idée : **séquencer par milestone**, avec des **dépendances explicites entre
milestones**, pour enchaîner dans n'importe quel ordre compatible — au lieu d'un ordre imposé par
les numéros.

**Si tu arrives frais.** Un *milestone* est un thème de travail (champ `milestone:`, ADR-0017) ;
une *version* est un lot de release numéroté (`v0.X.Y`). `depends:` est un champ de fiche qui
existe **déjà**, mais que l'outil de séquencement **ne lit pas encore**.

## Contexte / Problème

Le tirage est gouverné par la version en cours — la plus basse non taguée (ADR-0070). Bonne
discipline de cadence, mais elle **confond deux choses** :

- la **version** = l'étiquette de release (numéro, ordre strict) ;
- le **milestone** = le thème de travail, qui **s'étale déjà** sur plusieurs versions.

Preuve vivante : le milestone « board » couvre **v0.17 (10 fiches) ET v0.23 (8 fiches)**. Le même
thème vit dans deux seaux numériques, avec cinq versions sans rapport coincées entre les deux. La
seule vraie dépendance — « board multi-session (v0.23) s'appuie sur board fondation (v0.17) » — est
**thématique**, pas numérique. Le train la noie dans une file de six versions.

En face, `depends:` existe comme champ (plusieurs fiches le portent), mais le séquenceur **avoue
ne pas le lire** (`version check` : « le champ `depends:` n'est pas encore lu »). La dépendance est
donc **déclarée mais inerte**.

## Piste (à challenger)

Démêler l'axe unique en trois rôles distincts :

- **milestone** = l'unité qu'on séquence (le lot de travail cohérent) ;
- **depends** = les arêtes entre milestones → un **graphe orienté** (DAG), pas une file ;
- **version** = l'étiquette de release, posée quand un milestone sort (dérivée, cosmétique).

Le séquenceur tire alors le prochain milestone **dont toutes les dépendances sont livrées**, dans
n'importe quel ordre compatible. Exemple : `board-fondation` → `board-multisession`, sans traverser
v0.18–v0.22.

## Questions ouvertes (ce qui bloque encore la DoR)

1. **Rôles version vs milestone** : la version devient-elle une simple étiquette, coexiste-t-elle,
   ou disparaît-elle ? C'est le cœur de l'emmêlement actuel.
2. **Grain** : « board » est trop gros pour un lot — c'est en fait deux milestones
   (`board-fondation`, `board-multisession`). Quelle granularité, et qui la fixe ?
3. **Graphe** : dépendances inter-milestones = un DAG → détection de cycle + ordre topologique ;
   `depends:` est aujourd'hui par-fiche, pas par-milestone — comment on l'agrège.
4. **Release humaine** : les humains lisent des numéros (`v0.X`). Garde-t-on un numéro comme
   étiquette finale, posée à la sortie d'un milestone ?

## Comment vérifier (à préciser au grooming)

- Un milestone B qui ne dépend que de A se tire **dès que A est livré**, sans traverser les
  milestones sans rapport.
- Une dépendance en cycle est **refusée** (le séquenceur ne boucle pas).
- `depends:` est **lu** par le séquenceur (fini le « non contrôlé »).

## Notes / décisions

- **Structurel** : touche le modèle du process → passe par un **ADR + panel adverse** avant toute
  construction (comme ADR-0070 et ADR-0017). Ne pas bricoler dans un coin.
- **Rejoint l'audit du 2026-10-15** (découpage de la méthode) : la « gate version prête » y était
  pointée comme la **composition manquante n°1**, avec des manques de modèle. Cette fiche en est
  probablement un. *(Audit en mémoire de session, pas encore un doc committé.)*
- **Entoure / amende** [ADR-0070](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md)
  (le tirage reste dans la version en cours) : l'idée **remplace** l'ordre numérique par un ordre de
  dépendances. La soupape `--all-versions` d'ADR-0070 est le palliatif actuel.
- **Câblage, pas greenfield** : les champs `milestone:` (ADR-0017) et `depends:` existent déjà ;
  il s'agit de les **relier** au séquencement et de recadrer les rôles.
- **Voisines** (cluster « cycle de vie des versions » — à regrouper peut-être) :
  [cycle de vie d'une version](20261014200651962_cycle-vie-version-preparer-figer-developper.md),
  [frontière de version = checkpoint](20261015125606808_frontiere-version-checkpoint-run-autonome.md),
  [groom par version](20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md).
