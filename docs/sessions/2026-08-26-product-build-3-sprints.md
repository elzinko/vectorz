# Clôture — Product-build autonome, 3 sprints

## En clair

En une session, le product-builder a livré **3 features en autonomie**, chacune **revue par un
contradicteur indépendant** (un modèle différent qui cherche à casser le code), chacune **mergée
sur `main`** avec son backlog rangé. Voici ce qui a été fait, comment ça a été prouvé, et ce que
la session a appris.

Modes de la session : `build --checkpoints auto --tokens cap(~400k/sprint) --check-ready false`.
Tu es intervenu uniquement aux **3 checkpoints de budget** (un par enveloppe de sprint).

---

## Les 3 features livrées

### Sprint 1 — `ezk-ci harden` · [PR #171](https://github.com/elzinko/vectorz/pull/171)

- **Quoi.** Le skill `ezk-ci` savait *mesurer* et *proposer* des réglages de frugalité CI ; il
  sait maintenant les **appliquer** à un workflow (POC : le `paths-ignore` qui évite de lancer la
  CI sur des changements de docs).
- **Preuve.** 12 tests, typecheck vert, smoke CLI (audit lecture seule → apply → idempotence).
- **Le moment clé.** Le reviewer adverse a trouvé que mon premier jet **effaçait en silence** de
  la config existante (un `paths-ignore` déjà rempli était écrasé). **NO-GO.** Corrigé : le code
  **fusionne** au lieu d'écraser, prouvé par un test rejouant le cas exact. Puis GO.

### Sprint 2 — filet anti-« vues qui mentent » · [PR #173](https://github.com/elzinko/vectorz/pull/173)

- **Quoi.** Au `ship`, l'index `BACKLOG.md` était régénéré, mais pas les autres vues
  (`PORTFOLIO.md`, `PLAN.md`) : elles présentaient une fiche livrée comme « à faire ». Un filet
  détecte désormais ces incohérences, et la procédure `ship` régénère/cure ces vues.
- **Preuve.** 11 tests, suite complète verte. Filet lançable en garde-fou (`check-planning-views`).
- **Dogfooding.** Dès sa première exécution, le filet a **attrapé la dette du sprint 1** : la
  PR #171 figurait encore comme `todo` dans `PORTFOLIO.md`. Réparé dans la foulée.

### Sprint 3 — `ezk-bug` · [PR #174](https://github.com/elzinko/vectorz/pull/174)

- **Quoi.** Un skill d'intake : transforme un bug signalé « à la voix » en **fiche reproductible**
  (repro via le Playwright MCP partagé → statut de repro → `ezk-backlog add`). Un bug non
  reproduit reste **quand même** une fiche (`hors-portée`), jamais un silence.
- **Preuve.** 9 tests (les 4 cas de repro + validation), suite complète verte (546/546).
- **Revue.** GO après que le reviewer a tenté de le casser (validation contournable, injection,
  confusion avec `ezk-qa`) — rien n'a cédé.

---

## Rétrospective — ce que la session a appris

### 1. La revue adverse gagne son coût

**Symptôme.** Sprint 1 : le reviewer indépendant a trouvé une **perte de données silencieuse**
qu'**aucun test ne couvrait**. 1 P0 réel bloqué sur 3 sprints.
**À garder.** Revue adverse obligatoire, sur un modèle différent du dev. C'est le garde-fou qui a
le plus payé.

### 2. Le `ship` doit régénérer *toutes* les vues, pas seulement l'index

**Symptôme.** Au ship de #171, j'ai régénéré `BACKLOG.md` mais oublié `PORTFOLIO.md` et
`board.html` → 3 vues périmées.
**Déjà corrigé** (par le sprint 2 lui-même) : la procédure `ship` documente les 3 vues, et le
filet `check-planning-views` doit être **vert après chaque ship** (critère mesurable).

### 3. Le multi-worktree est fragile — vérifier l'état après tout événement

**Symptôme.** Pendant le sprint 3, après une déconnexion/reconnexion du serveur MCP, **mon
worktree a été remis sur sa branche d'origine** (état initial). Rien perdu (le commit était en
sécurité dans git), mais j'ai dû diagnostiquer et rebasculer. Et chaque `ship` oblige à opérer
sur `main` via le worktree principal (`git -C`, pull/mv/regen/push).
**Proposition.** Réflexe systématique : vérifier `branche + HEAD` après tout événement inhabituel
avant d'éditer. Documenter le pattern « ship sur main via worktree principal ».

### 4. Le coût d'un sprint = surtout la revue

**Symptôme.** Chaque sprint approche le plafond ~400k, dont **~90–200k pour la revue adverse**
(1 tour, 2 quand il y a un NO-GO à re-vérifier).
**Proposition.** 1 tour de revue par défaut ; le 2ᵉ tour réservé aux NO-GO (comme au sprint 1).

### 5. La supervision est best-effort — et l'a montré

**Symptôme.** Les gates MCP se sont déconnectés en cours de sprint 3 → journal de supervision
incomplet. Sans impact sur le code (best-effort, classe B, comme prévu par le contrat).

---

## Ce qu'il te reste

- **Backlog** : 3 fiches shippées, toutes les vues synchronisées, filet vert. Fiches `ready`
  restantes (P2) : « Recette + gardien (ezk-chef) », « doctrine de composition des features ».
- **Dette légère notée** (sur `ezk-bug`, non bloquante) : injection markdown possible dans le
  corps de fiche (opérateur de confiance, POC acceptable) ; placement de `ezk-bug` en bande
  « cérémonies » à ré-arbitrer (le validateur ne teste que la complétude).
- **Reprendre** : `/ezk-product-build build --checkpoints auto --tokens cap --check-ready false`
  repartira sur la prochaine fiche prête.
