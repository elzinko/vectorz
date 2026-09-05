---
id: "20260905134937885"
title: Revue adverse locale vs Codex — mesurer avant d'arbitrer (peut-on sortir la PR du chemin ?)
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-09-05
---

## En clair

Question ouverte, à trancher **par la mesure**, pas au ressenti. On veut savoir si la
revue adverse locale (`ezk-reviewer`, plusieurs passes en parallèle) peut **égaler ou
compléter** les retours de Codex. Attention : remplacer **Codex** touche le grain de
*revue* ; retirer la **PR** touche le grain de *merge* (fixé par l'ADR-037) — deux
décisions distinctes. Un premier test à l'aveugle existe déjà (2026-09-05) ; il sert de
baseline. Rien ne se
décide avant d'avoir mesuré **performance ET efficience**.

## Contexte / problème

La revue de référence sur les PR vectorz est aujourd'hui **Codex** (revue automatique à
l'ouverture d'une PR). Elle est de bonne qualité, mais elle impose une PR GitHub. Donc
l'exposition du code, une latence, et une dépendance à un service externe.

On aimerait **accélérer et sécuriser** : revue 100 % locale, lancée en parallèle. Cela
retire la dépendance à **Codex** (le grain de *revue*). Retirer la **PR** elle-même est un
autre sujet : l'**ADR-037** fait de la PR l'unité atomique de merge, de CI et de revert.
Ce chantier porte sur le grain de *revue* ; toucher au grain de *merge* imposerait de
**revisiter ADR-037** (décision séparée, pas un corollaire).

Deux inconnues bloquent la décision :

1. Le local, seul, tient-il le niveau de Codex sur les défauts qui comptent ?
2. Les verdicts locaux **ne sont archivés nulle part** aujourd'hui. Rien n'est donc
   mesurable, et rien ne se comparera dans le temps tant que ce trou n'est pas comblé.

## Baseline mesurée (2026-09-05)

Test à l'aveugle : `ezk-reviewer` (Opus, **une seule passe**) rejoué sur le **code
d'origine** de trois PR (le premier commit, avant les corrections Codex), puis comparé
aux findings Codex de l'époque.

- Recouvrement : **9 des 17** défauts Codex retrouvés, dont **6 des 9 graves**.
- Le local **priorise parfois mieux** (un bug de fuseau horaire monté en P0) et **trouve
  ce que Codex rate** (des renvois croisés cassés vers un ADR et une fiche d'agent, hors
  du diff que Codex ne regarde pas).
- Le local a **manqué 3 défauts graves** : une erreur masquée en « zéro PR », une
  invocation ambiguë, une borne de sprint qui ne borne pas. Deux familles ressortent :
  **erreurs silencieuses** et **rétro-compatibilité / contrats**.
- Coût : **~100 000 jetons par PR et par passe**.
- Conclusion provisoire : angles morts **différents** de Codex → les deux sont
  **complémentaires**, pas interchangeables.
- ⚠️ **Biais à corriger** : ces 9/17 prennent **Codex comme référence**. Un protocole
  honnête bâtit d'abord un **oracle indépendant** — l'**union adjugée** des défauts des
  deux relecteurs, faux positifs inclus — puis mesure le rappel de *chacun* contre cet
  oracle. Sinon « local + Codex » gagne par construction (retour Codex sur cette fiche).

## Proposition (pistes à instruire, non figées)

1. **Durcir le local** : un relecteur dédié « erreurs silencieuses / chemins d'erreur » +
   un « rétro-compatibilité / contrats » (les deux familles manquées à la baseline).
2. **Paralléliser** : N relecteurs en même temps (coût = jetons, mais pas de PR ni
   d'exposition).
3. **Archiver chaque verdict** de revue locale — prérequis absolu à toute mesure
   (format : voir la section dédiée ci-dessous).
4. **Définir la mesure** : performance (taux de recouvrement des défauts graves, faux
   positifs) ET efficience (jetons/PR, temps réel, exposition, dépendance à GitHub).
5. **Modèle cible probable** : local en parallèle par défaut, Codex en **filet** sur les
   features sensibles.

## Format d'archivage des verdicts (piste privilégiée)

Besoin : chaque revue doit laisser une trace **lisible** par un humain **et** exploitable
par un **script**, le tout versionné.

- **A — deux fichiers par revue** : une synthèse `.md` lisible + un `.json`/`.yaml` de
  données. Net, mais **deux fichiers à garder synchrones**, qui peuvent diverger.
- **B — tout en markdown** : un seul fichier, mais le script doit **parser de la prose**
  pour extraire les chiffres. Fragile — c'est la perte redoutée.
- **C — un fichier, en-tête YAML + corps (recommandé)** : un seul `.md` par revue. Le
  **front-matter** porte les données machine (verdict, coût en jetons, durée, liste des
  défauts : fichier, ligne, sévérité, catégorie). Le **corps** porte la synthèse lisible.
  Le script ne lit que l'en-tête — rapide et robuste, **sans parser le corps**. Zéro
  désynchro, versionné nativement, et **déjà le patron maison** (fiches backlog, ADR).

Par-dessus, un **index agrégé GÉNÉRÉ** : un script balaie tous les verdicts et émet un
tableau (CSV/JSON) pour l'analyse a posteriori (doctrine ADR-0001 : le script range, on ne
recompte pas à la main). C'est **lui**, le « format exploitable par script en complément ».
La séparation lisible / machine se fait donc par **niveaux** (verdict unitaire hybride +
index généré), pas par deux fichiers à chaque revue.

**Réutiliser l'existant, ne pas créer un second store (retour Codex).** Un pack de revue
markdown-first est **déjà** défini par l'**ADR-038** : `features/reviews/<id>/REVIEW.md`,
contrat `method-review@0.1`, port `ReviewEmitter`. Le verdict adverse doit **étendre ce
pack** — une section verdict, ou un émetteur qui écrit les données machine dans le
front-matter du `REVIEW.md` — plutôt qu'ouvrir un `docs/reviews/` concurrent (qui
scinderait découverte et outillage). L'option C ci-dessus décrit donc **le format d'une
entrée du pack existant**, pas un nouveau namespace ; l'index agrégé se branche sur
`features/reviews/`.

## Critères d'acceptation (à compléter au grooming)

- [ ] Un protocole de mesure **reproductible** existe (échantillon de PR, revue à
      l'aveugle, comparaison local vs Codex).
- [ ] Les verdicts de revue locale sont **archivés** de façon exploitable et versionnée.
- [ ] Une métrique chiffrée **départage** local seul / local durci / local + Codex, sur
      performance **et** efficience.
- [ ] Le protocole s'appuie sur un **oracle indépendant** (union adjugée des deux
      relecteurs), pas sur Codex comme référence.
- [ ] L'archivage **étend le pack ADR-038** (`features/reviews/`), sans store concurrent.
- [ ] La décision « retirer la **PR** » (grain de merge, ADR-037) est traitée **à part** de
      « remplacer Codex » (grain de revue).
- [ ] Une **recommandation de workflow** est actée : quand PR + Codex, quand local seul.

## Comment vérifier

- Rejouer le protocole sur un échantillon de PR récentes et produire le **tableau
  comparatif** (retrouvés / manqués / bonus / coût).
- Vérifier que chaque revue locale **laisse une trace versionnée** (fichier de verdict),
  là où aujourd'hui il n'y a rien.

## Notes

- La baseline détaillée a été produite en session le 2026-09-05. Les diffs d'origine et
  les findings Codex étaient en scratch éphémère ; le résumé chiffré ci-dessus est la
  **trace durable**.
- Fiches voisines — **relier, pas dupliquer** :
  - [0161](0161-ezk-challenge-panel.md) — panel de challenge adverse réutilisable :
    l'**outil** des passes locales multiples ; cette fiche-ci en est l'**usage mesuré**.
  - [0051](0051-observabilite-qualite-produit.md) et
    [0058](0058-rapport-qualite-pr.md) — mesurer / rapporter la qualité : là c'est la
    qualité du **logiciel** ; ici on mesure la qualité de la **revue**.
  - [20260830110131158](20260830110131158_revue-adverse-skippable-flag.md) — revue
    adverse skippable par flag : levier de workflow adjacent.
  - [0165](0165-contrat-ameliorabilite-v01-mvp-b.md) et
    [0046](0046-differes-contrat-ameliorabilite-parking.md) — contrat d'améliorabilité :
    cadre général de mesure de la méthode.
- Tension à garder en tête : **sans PR GitHub, pas de Codex** (Codex est une app GitHub
  branchée sur les PR). vectorz est déjà **public**, donc l'argument « confidentialité »
  vaut surtout pour les repos privés.
- Décisions d'archi à respecter : **ADR-037** (la PR = unité atomique de merge/CI/revert),
  **ADR-038** (pack de revue markdown-first `features/reviews/`).
- Retours Codex sur cette fiche (PR #213, 2026-09-05) **intégrés** : oracle indépendant,
  séparer revue/merge (ADR-037), réutiliser le pack (ADR-038).
