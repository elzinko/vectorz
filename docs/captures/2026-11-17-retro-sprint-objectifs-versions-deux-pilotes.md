---
type: retro
date: 2026-11-17
theme: "Sprint « mission control lit les objectifs et les versions publiés par la méthode » : deux pilotes autonomes sur le même dépôt, un développeur isolé qui ne peut pas écrire"
scope: "sprint de la session « Méthode EZK sprint session » (lot de deux stories : objectifs publiés, versions publiées volet a), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; une session voisine « pilote » pilote aussi vectorz ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), décisions confiées à ezk-pm"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Le portier d'ezk-sprint dit quand une copie voisine est tenue par une session active. Aujourd'hui sa ligne dit seulement « non mergée » ; la session a rejoint ce sprint et rejoué sa gate pendant que son vrai propriétaire l'intégrait."
    kind: feature
    by: [produit, dev]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117141828100, priorité P1."
    date: 2026-11-17
  - proposition: "Deux sessions qui pilotent le même dépôt ouvrent chacune leur run de supervision. Aujourd'hui le second `run_start` est refusé, et le compte rendu de son sprint sort non daté."
    kind: feature
    by: [architecture, qualite]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117141828101, priorité P2."
    date: 2026-11-17
  - proposition: "`ezk run context` avertit quand le dossier de la session n'est pas dans le dépôt visé. Ouverte dans un dossier vide, la session n'a pas pu lancer l'agent développeur isolé, qui exige un dépôt git."
    kind: feature
    by: [dev]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117141828102, remontée en P1 (coût vécu supérieur à P2)."
    date: 2026-11-17
  - proposition: "Garder la revue adverse sur un patch déjà vert : elle a trouvé un défaut réel, un seul fichier de verdict abîmé qui faisait tomber tout le board. Constat, aucune règle neuve."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : constat, la revue tourne déjà sur chaque patch ; rien à écrire."
    date: 2026-11-17
---

**En clair :** le sprint a livré ses deux stories. Mission control peut lire le nom, les fiches livrées
et les versions de chaque objectif, et la prochaine coupe de version. Deux frictions ont coûté du temps
et des jetons : une seconde session pilotait le même dépôt sans que rien ne le dise clairement, et
l'agent développeur isolé n'a pas pu écrire dans le dossier de la story. La rétro propose trois
améliorations d'outillage et garde un constat.

## 1 · Les faits de départ

- Deux stories livrées en local : objectifs publiés (655e0ac5) et versions publiées, volet a
  (14381090), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-mission-control-lit-les-objectifs-et-les-version.md).
- À l'ouverture, le portier a signalé la copie du schéma zoomable comme « non mergée ». Elle était en
  fait tenue par la session voisine, active. Cette session l'a rejointe, a rejoué la gate et demandé
  l'accord d'ezk-pm, pendant que la voisine l'intégrait à 12 h 42. Rien n'a été intégré deux fois ;
  environ 100 000 jetons sont partis pour rien.
- Les deux sessions se sont ensuite réparti les fiches par message ; la voisine a livré cinq fiches,
  et chaque intégration de cette session a suivi un rebase puis une gate rejouée, sans conflit.
- `run_start` a été refusé : le run ouvert était celui de la voisine. Le sprint n'a donc pas de point
  de supervision, et son compte rendu n'est pas daté.
- La session s'est ouverte dans un dossier vide. L'agent ezk-dev, qui travaille dans un worktree
  isolé, n'a pas pu démarrer ; une fois la session déplacée dans le dépôt, il a démarré mais n'a pas pu
  écrire dans le worktree de la story, et son worktree vide a été effacé. Deux appels d'environ
  150 000 jetons chacun sont partis sans code. Un agent générique a joué le développeur, nommé tel
  dans le journal du sprint.
- La revue adverse a rendu GO deux fois, avec un défaut réel trouvé au second patch (un verdict de
  release illisible faisait tomber `board show`), corrigé avant intégration.

## 2 · Tour 1 — chaque lentille propose

- **Produit** : rendre visible qu'une copie voisine est tenue par une session vivante (P1).
- **Dev** : P1 aussi ; et avertir dès l'ouverture quand la session n'est pas dans le dépôt (P3).
- **Qualité** : un compte rendu non daté est une mesure perdue ; un run par session (P2). Garder la
  revue sur patch vert (P4).
- **Architecture** : le journal de supervision ne distingue pas deux pilotes du même dépôt (P2).

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient à P1, P2, P3 et P4. Écarté sans proposition : écrire une règle « vérifie
les sessions avant de rejoindre un sprint ». Une règle de discipline ne tient pas quand l'outil dit
« non mergée » ; le symptôme est structurel, d'où la feature P1. Le brief du développeur isolé, livré par
la voisine au même moment (1813d1de), couvre déjà le rapatriement par patch : pas de proposition en double.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Les notes du carnet ne portent pas sur ce sprint : elles attendent une rétro complète.

## 6 · Rangement

- [Le portier d'ezk-sprint dit quand une copie voisine est tenue par une session active](../../features/20261117141828100_portier-dit-copie-tenue-par-session-active.md) — P1.
- [Deux sessions qui pilotent le même dépôt ouvrent chacune leur run de supervision](../../features/20261117141828101_un-run-de-supervision-par-session.md) — P2.
- [`ezk run context` avertit quand le dossier de la session n'est pas dans le dépôt visé](../../features/20261117141828102_run-context-avertit-dossier-hors-depot.md) — P1.
- Même passe, hors rétro : la fiche [un seul verbe pour la coupe](../../features/done/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md) est groomée et découpée ; sa sœur [Retirer les anciens verbes de coupe](../../features/20261117141828103_retirer-anciens-verbes-de-coupe.md) porte le retrait.

## 7 · Ce qui reste au PO

Relire les décisions prises par délégation. Toutes sont réversibles : trois fiches en idée et un constat.
