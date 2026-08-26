# Clôture — Product-build autonome, 4 sprints

## En clair

En une session, le product-builder a livré **4 features en autonomie**, chacune **revue par un
contradicteur indépendant**, chacune **mergée sur `main`** avec son backlog rangé. Tu es
intervenu uniquement aux **checkpoints de budget** (un par enveloppe de sprint).

Modes : `build --checkpoints auto --tokens cap(~400k/sprint) --check-ready false`.

---

## Les 4 features livrées

### Sprint 1 — `ezk-ci harden` · [PR #171](https://github.com/elzinko/vectorz/pull/171)
Applique les réglages de frugalité CI d'un workflow, sans écraser la config. **Le reviewer a
bloqué une perte de données** (écrasement de `paths-ignore`), corrigée + testée (fusion).

### Sprint 2 — filet anti-« vues qui mentent » · [PR #173](https://github.com/elzinko/vectorz/pull/173)
Détecte une fiche livrée encore présentée comme « à faire » dans `PORTFOLIO.md`/`PLAN.md`.
**Dogfooding** : a attrapé la dette du sprint 1 dès sa première exécution.

### Sprint 3 — skill `ezk-bug` · [PR #174](https://github.com/elzinko/vectorz/pull/174)
Transforme un bug signalé en fiche reproductible (repro Playwright → `ezk-backlog add`). Un bug
non reproduit reste **quand même** une fiche. GO après tentative de cassage.

### Sprint 4 — Doctrine de composition + avancement des épics · [PR #175](https://github.com/elzinko/vectorz/pull/175)
Une **doctrine** (fusion / épic / division tranchés par une seule question) + le board affiche
enfin l'**avancement cumulé** de chaque épic, avec un statut **calculé**. **Le rebond** : le
reviewer a bloqué non pas un bug, mais une **contradiction avec la loi** — la doctrine allait
contre l'ADR-0017 (A8). Résolu par un **amendement ADR (A15)** qui **attend ta ratification**.

---

## Rétrospective — ce que la session a appris

### 1. La revue adverse gagne son coût
Sprint 1 : le reviewer indépendant a bloqué une **perte de données** qu'aucun test ne couvrait.
À garder : revue adverse obligatoire, sur un modèle différent du dev.

### 1 bis. La revue adverse protège aussi la LOI, pas seulement le code
Sprint 4 : le reviewer a bloqué une **contradiction entre une doctrine et un ADR accepté** (A8) —
pas un bug. Réviser une décision de méthode structurante passe par un **amendement formel**
(A15 supersède A8), jamais par une doctrine qui l'écrase en silence. **Garde-fou tenu** :
l'amendement posé en autonomie reste **« à ratifier PO »**.

### 2. Le `ship` doit régénérer *toutes* les vues, pas seulement l'index
Au ship de #171, `BACKLOG.md` régénéré mais pas `PORTFOLIO.md`/`board.html` → vues périmées.
Corrigé (par le sprint 2 lui-même) : la procédure `ship` couvre les 3 vues + le filet vert.

### 3. Le multi-worktree est fragile — vérifier l'état après tout événement
Le worktree de session a été **remis sur sa branche d'origine** après une déconnexion MCP (rien
perdu, mais diagnostic + rebascule). Et chaque `ship` opère sur `main` via le worktree principal.
Réflexe : vérifier `branche + HEAD` après tout événement inhabituel.

### 4. Le coût d'un sprint = surtout la revue
~400k/sprint, dont ~90–200k pour la revue adverse. 1 tour par défaut, 2 sur NO-GO (sprints 1 et 4).

---

## Ce qu'il te reste

- **⚠️ À ratifier** : l'amendement **ADR-0017 A15** (statut d'épic dérivé au board) — posé en
  autonomie sur la base du grooming panel, il attend ton dernier mot.
- **Backlog** : 4 fiches shippées, toutes les vues synchronisées, filet vert. **1 seule fiche
  `ready` restante** : « Recette + gardien (ezk-chef) » — après elle, il faudra groomer/idéer
  (décision humaine que le builder ne prend pas seul).
- **Dette légère notée** : sur `ezk-bug`, injection markdown théorique + placement de bande à
  ré-arbitrer ; sur D4, un épic aux enfants `shipped` hors `done/` (état anormal) afficherait `idea`.
- **Reprendre** : `/ezk-product-build build --checkpoints auto --tokens cap --check-ready false`.
