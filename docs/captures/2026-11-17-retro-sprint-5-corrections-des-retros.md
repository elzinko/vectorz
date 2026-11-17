---
type: retro
date: 2026-11-17
theme: "Sprint 5 du 17 novembre « deux corrections nées des rétros du jour » : des rouges qui ne venaient pas du code"
scope: "dernier sprint de la session « Méthode EZK sprint session » (lot de deux stories : `ezk pr emit-local` garde chaque `--validation`, le portier dit quand une copie voisine est tenue par une session active), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), décisions confiées à ezk-pm"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Le test du portier simule une bibliothèque absente sans déplacer le vrai fichier. En la déplaçant, il a fait échouer deux suites d'une gate jouée en même temps dans le même dossier."
    kind: feature
    by: [qualite, dev]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117165112300, priorité P1 (rouges faux)."
    date: 2026-11-17
  - proposition: "`ezk-backlog add` et `ready` refusent d'écrire une fiche que `backlog check` juge non conforme. Une fiche d'une session voisine, committée avec `evidence: required`, a fait rougir le test de conformité du corpus de cette session."
    kind: feature
    by: [architecture, produit]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : fiche 20261117165112301, priorité P2 (plus intrusive, après la précédente)."
    date: 2026-11-17
  - proposition: "Garder une revue adverse par lot, même pour des correctifs nés d'une rétro : la revue partagée a rendu un NO-GO justifié sur le portier. Constat, aucune règle neuve."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO (ezk-pm) : la pratique est déjà dans ezk-sprint ; rien à écrire."
    date: 2026-11-17
---

**En clair :** le sprint a livré ses deux corrections. Le corps de PR local garde toutes ses lignes de
validation, et le portier distingue une copie tenue par une session vivante. Deux fois, la gate est passée
au rouge sans que le code soit en cause : un test qui déplace un fichier partagé, puis une fiche mal formée
venue de la session voisine. La rétro propose deux corrections pour que ces rouges ne reviennent pas.

## 1 · Les faits de départ

- Deux stories livrées en local (604e5a50 et 062937f2), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-deux-corrections-nees-des-retros-du-jour.md).
- La revue partagée a dit GO sur la première story et NO-GO sur la seconde : la promotion « session active »
  aurait fait passer le dossier principal en alerte à presque chaque sprint. Corrigé, puis GO en re-revue.
- Première gate du portier : deux suites rouges, « lib introuvable ». Cause : le test du portier renomme un
  instant `lib-worktree-safety.sh`, et deux exécutions tournaient dans le même dossier. Rejouées seules : vertes.
- Seconde gate : un test rouge, la conformité du corpus, à cause d'une fiche de la session voisine. Elle l'a
  corrigée avant d'intégrer ; après recalage, le test est vert.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : un rouge faux use la confiance dans la gate ; ne plus déplacer de fichier en test (P1).
- **Dev** : P1 ; une variable d'environnement suffit.
- **Architecture** : contrôler une fiche au moment où on l'écrit, pas seulement dans la gate (P2).
- **Produit** : P2 évite qu'une session casse la gate de l'autre ; garder la revue par lot (P3).

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient à P1, P2 et P3. Rien d'écarté.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

- La note « Un test du portier déplace une lib partagée et casse une gate parallèle », déposée pendant le
  sprint : **traitée**, elle devient la proposition P1.
- Les autres notes du carnet ne portent pas sur ce sprint : elles attendent une rétro complète.

## 6 · Rangement

- [Le test du portier simule une bibliothèque absente sans déplacer le vrai fichier](../../features/20261117165112300_test-portier-simule-lib-absente-sans-la-deplacer.md) — P1.
- [`ezk-backlog add` et `ready` refusent d'écrire une fiche que `backlog check` juge non conforme](../../features/20261117165112301_add-et-ready-refusent-une-fiche-non-conforme.md) — P2.

## 7 · Ce qui reste au PO

Relire les décisions prises par délégation. Toutes sont réversibles : deux fiches en idée et un constat.
