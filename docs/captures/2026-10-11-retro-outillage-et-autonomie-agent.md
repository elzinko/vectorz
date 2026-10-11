---
type: retro
date: 2026-10-11
theme: "Frictions d'outillage et d'autonomie de l'agent, vues pendant une longue session muti"
scope: "session muti 2026-10-10/11 (build WebSocket+jauges, prix €19/€9.90, manifeste + migration secrets, spike) — frictions de MÉTHODE"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "Affûter la règle verify-access-before-asking : une commande de méthode qu'on dit à l'humain de lancer doit d'abord être vérifiée à jour (ezk help)"
    kind: regle
    target: global
    by: [qualite, dev]
    status: ✅
    decision: "Amendée : agent-ops/verify-access-before-asking (clause « commande à jour » + mesure)"
    date: 2026-10-11
  - proposition: "ezk run context / run report doivent refléter le PROJET hôte (pas le dépôt de méthode), et run report doit accepter le flux local github:false (comme ship accepte « local (<sha>) »)"
    kind: feature
    by: [architecture]
    status: ✅
    decision: "Fiche créée au backlog vectorz : 20261011113632532"
    date: 2026-10-11
  - proposition: "Spike : clarifier/outiller le flux d'ajout d'une règle (fichier + bundle + profil + bind) — une règle n'est active qu'une fois dans un bundle"
    kind: spike
    by: [dev, architecture]
    status: ✅
    decision: "Fiche créée au backlog vectorz : 20261011113632688"
    date: 2026-10-11
---

**En clair :** sur une longue session, trois frictions de méthode sont ressorties : j'ai donné une
commande périmée (`lawgiver` au lieu de `ezk law`), un outil de run a montré le mauvais dépôt, et
« entériner une règle » s'est révélé plus compliqué que créer un fichier (il faut un bundle). La plus
grosse friction — « l'agent demande à l'humain ce qu'il pourrait faire seul » — est **déjà capitalisée**
cette session (règle `agent-ops/verify-access-before-asking` + spike 20261010213000378). Tu as 3
propositions à trancher ci-dessous ; rien n'est rangé sans ton feu vert.

## 1 · Les faits de départ

- L'agent a demandé des gestes qu'il pouvait faire (changement Vercel alors que la CLI était là ; 3
  allers-retours dashboard LemonSqueezy alors que le jeton API était au trousseau). **Déjà traité** :
  règle `agent-ops/verify-access-before-asking` créée + câblée au bundle `base`, spike exécuté.
- L'agent a dit à l'humain de lancer `lawgiver bind-global` — commande **supprimée**, remplacée par
  `ezk law bind-global`. L'humain l'a découvert seul.
- « Entériner la règle » : l'agent a cru qu'il suffisait de créer le fichier `rules/…/…md`. Or la loi
  globale ne tire que les règles d'un **bundle** ; l'humain a fait le `bind` avant que la règle y soit
  → elle était absente de la loi déployée.
- `ezk run context` lancé depuis le worktree muti a affiché la base/worktree de **vectorz**, pas de
  muti. `ezk run report` a refusé le flux local (il exige `--pr '#<numéro>'`), inutilisable en
  `github:false`.
- `.env` non cloné dans les worktrees → copie manuelle pour faire tourner la gate. **En cours de
  traitement** : migration des secrets au trousseau (8 faits) + fiche `ezk-secret sync` (idea).
- Mineur : `pr emit-local --validation` casse si une valeur contient une virgule.

## 2 · Tour 1 — chaque lentille propose

- **Architecture** : `run context`/`run report` confondent racine de méthode et racine de projet →
  bug de conception, ils doivent lire les faits du **projet hôte**. `run report` doit couvrir
  `github:false` (ref locale).
- **Qualité** : donner une commande périmée est un défaut de vérification — même famille que
  « vérifier avant de demander ». Affûter la règle existante (inclure la fraîcheur des commandes).
- **Dev** : le flux d'ajout d'une règle (fichier + bundle + profil + bind) est non évident et sujet à
  oubli → documenter ou outiller (vérifier d'abord ce que fait `ezk law capture`).
- **Produit** : la grosse leçon (agent plus autonome) est déjà encodée par la nouvelle règle ; le
  `.env` worktree est en cours via le trousseau. Ne pas empiler de règles sur du déjà-traité.

## 3 · Tour 2 — confrontation et convergence

- **Retenu** : (règle) affûter `agent-ops/verify-access-before-asking` plutôt qu'une 2ᵉ règle — même
  symptôme, on **amende** pour inclure la fraîcheur des commandes de méthode.
- **Retenu** : (feature) corriger `run context`/`run report` (projet hôte + ref locale) — symptôme
  structurel, une règle de discipline ne le règle pas.
- **Retenu** : (spike) outiller/documenter l'ajout d'une règle — structurel, revient à chaque règle.
- **Écarté** : rien de neuf sur « agent autonome » (déjà la règle) ni sur `.env` worktree (déjà en
  cours). La robustesse de `pr emit-local` aux virgules reste un détail, noté, non proposé.

## 4 · Le juge de cohérence

- **P1 (règle, amende `agent-ops/verify-access-before-asking`)** : cohérente. Pas un doublon (elle
  étend la même règle sur un axe voisin : instruire l'humain avec une commande à jour), pas de
  contradiction avec `rules/`.
- **P2, P3** : ce ne sont pas des règles (feature, spike) → pas de passage juge.

## 5 · Ce qui est proposé au PO

1. **(règle, global)** *Fait* : commande `lawgiver bind-global` périmée donnée à l'humain. *Proposition* :
   ajouter à `agent-ops/verify-access-before-asking` que toute commande de méthode qu'on dit à l'humain
   de lancer est vérifiée à jour (`ezk help`) d'abord. *Mesure* : sur 5 prochaines sessions, 0 commande
   de méthode périmée/renommée transmise à l'humain.
2. **(feature → backlog vectorz)** *Fait* : `run context` montre vectorz au lieu de muti ; `run report`
   refuse `github:false`. *Proposition* : les faire refléter le projet hôte + accepter une ref locale.
   *Mesure* : `run context` depuis un projet hôte montre l'`origin/main`/worktree du projet ; `run report`
   accepte `local (<ref>)`.
3. **(spike → backlog vectorz)** *Fait* : règle entérinée sans bundle → absente de la loi déployée.
   *Proposition* : documenter/outiller le flux fichier+bundle+profil+bind. *Mesure* : la prochaine règle
   ajoutée atterrit dans la loi au **premier** bind, 0 oubli de bundle.

## 6 · Suivi des décisions de la rétro précédente

Sans objet pour cette session (les rétros vectorz récentes — 2026-10-10/11 — portent d'autres sujets ;
cette rétro est déclenchée depuis une session muti et ne suit pas leurs décisions).

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| P1 — affûter la règle (commande à jour) | ✅ Amendée : `agent-ops/verify-access-before-asking` | 2026-10-11 |
| P2 — run context/report : projet hôte + ref locale | ✅ Fiche `20261011113632532` | 2026-10-11 |
| P3 — spike flux d'ajout d'une règle | ✅ Fiche `20261011113632688` | 2026-10-11 |

## 8 · Glossaire

- **bundle** : fichier `bundles/<id>.yml` listant des ids de règles ; un profil tire des bundles. Une règle hors bundle n'est déployée par aucun profil.
- **bind / bind-global** : `ezk law bind-global <profil>` écrit skills, agents et loi dans `~/.claude`.
- **github:false** : projet (muti) sans PR GitHub — merge local sur main, pas de `#numéro` de PR.
- **worktree** : copie de travail isolée ; son `.env` (gitignoré) n'est pas cloné.
