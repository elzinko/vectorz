---
type: retro
date: 2026-11-17
theme: "Fin du run autonome de l'après-midi : la coupe de version en un verbe, le ménage des anciens verbes, un avertissement à l'ouverture"
scope: "rétro de fin de run de la session « Méthode EZK sprint session », sur ses deux derniers sprints (« un seul verbe pose la version », puis « retirer les anciens verbes de coupe et avertir hors du dépôt »), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), décisions confiées à ezk-pm"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "`ezk pr emit-local` garde toutes les valeurs quand `--validation` est passé plusieurs fois, ou refuse net. Aujourd'hui il ne garde que la dernière, sans prévenir : quatre corps de PR ont perdu leurs lignes « tests » et « revue »."
    kind: feature
    by: [qualite, dev]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117155515200, priorité P1 (bug d'outillage, perte silencieuse)."
    date: 2026-11-17
  - proposition: "Finir la coupe de version selon l'ADR-0088 §2.2 : le compte « p parkées, d différées » par objectif, le rejeu des avertissements `depends:` au dry-run, et la même borne d'étiquettes pour `board show` et pour le verbe."
    kind: feature
    by: [architecture, produit]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117155515201, priorité P2."
    date: 2026-11-17
  - proposition: "Garder la procédure du développeur isolé livrée ce matin : deux sprints de suite, l'agent ezk-dev a travaillé détaché sur le bon commit, sans commit, et son travail est revenu par patch sans perte. Constat, aucune règle neuve."
    kind: action
    by: [dev, qualite]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : constat, la procédure est déjà dans ezk-sprint ; rien à écrire."
    date: 2026-11-17
  - proposition: "Relever la priorité de la fiche du portier qui ignore les sessions actives : trois ouvertures de sprint sur trois ont demandé un passage outre, pour la même copie voisine."
    kind: action
    by: [produit]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : la fiche 20261117141828100 reste P1, pas P0 (le passage outre contourne sans casser) ; elle passe en tête des fiches de rétro."
    date: 2026-11-17
---

**En clair :** les deux derniers sprints ont livré trois fiches. La méthode pose désormais une version
en un seul verbe, `ezk backlog version tag`. Les trois anciens chemins pour le faire sont retirés. Et
le contexte de run avertit quand la session s'ouvre hors du dépôt. La rétro relève un défaut de
l'outillage qui perd des lignes de validation sans prévenir, et ce qui reste de la coupe de version.

## 1 · Les faits de départ

- Trois stories livrées en local, d'après les comptes rendus du jour : le verbe de coupe (e9541392),
  le retrait des anciens verbes (87b5e270) et l'avertissement hors dépôt (fiche « `ezk run context`
  avertit quand le dossier de la session n'est pas dans le dépôt visé »).
- La revue adverse a trouvé un vrai défaut dans le verbe de coupe : un numéro proposé déjà tagué sur
  une branche de maintenance aurait laissé un commit orphelin sur `main`. Corrigé avant intégration.
- La revue partagée du dernier sprint a prévenu d'un piège de rebase entre ses deux stories, qui
  touchaient les mêmes fichiers. Les conflits ont été résolus en cinq minutes.
- `ezk pr emit-local --validation` répété n'a gardé que sa dernière valeur. Les corps de PR de quatre
  fiches ont été réparés à la main (a2cf6571).
- La procédure du développeur isolé a tenu deux fois : aucun appel perdu, contre deux appels perdus
  au sprint précédent.
- Le portier d'ouverture a demandé un passage outre à chaque sprint, pour la copie de la session
  voisine. Le défaut est déjà en fiche, née de la rétro précédente.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : une perte silencieuse dans un livrable est grave ; accumuler ou refuser (P1). Garder
  la procédure du développeur isolé (P3).
- **Dev** : P1 ; P3, la procédure évite les patchs perdus.
- **Architecture** : la coupe de version n'est pas finie au sens de l'ADR (P2).
- **Produit** : P2 pour que la page Versions dise tout ; relever le portier (P4).

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient à P1, P2, P3 et P4. Écarté sans proposition : régénérer les données de
l'ancienne carte interactive de cop1, qui citent encore `ezk run versions`. C'est une archive figée de
l'ancien tableau de bord, jamais régénérée par la méthode.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Les notes du carnet ne portent pas sur ces sprints : elles attendent une rétro complète.

## 6 · Rangement

- [`ezk pr emit-local` garde chaque `--validation`, au lieu de la dernière](../../features/20261117155515200_pr-emit-local-garde-chaque-validation.md) — P1.
- [Finir la coupe de version : parkées et différées par objectif, avertissements depends:, une seule borne](../../features/20261117155515201_finir-la-coupe-adr-0088-parkees-depends.md) — P2.
- [Le portier d'ezk-sprint dit quand une copie voisine est tenue par une session active](../../features/20261117141828100_portier-dit-copie-tenue-par-session-active.md) — reste P1, en tête.

## 7 · Ce qui reste au PO

Relire les décisions prises par délégation. Toutes sont réversibles.
