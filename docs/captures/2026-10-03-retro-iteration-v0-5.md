---
type: retro
date: 2026-10-03
theme: "itération V0.5 du 2026-10-03 : trois sprints autonomes, et ce qu'ils ont coûté au PO"
scope: "run ezk-product-build --max-sprints 3 (PR #343, #344, #345), la PR #340 venue d'une autre session, et les six notes du carnet"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "Le lanceur ezk, ship-merge.sh et ezk run report disent quand le dossier principal de vectorz est en retard sur origin/main, avec la commande à lancer (git pull), au lieu du seul « SIGNAL behind »"
    kind: feature
    by: [architecture, qualite, dev, produit]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : fiche 20261003201034897, P1"
    date: 2026-10-03
  - proposition: "ezk run context et ezk-backlog groom listent les PR ouvertes et les branches parallèles qui touchent PLAN.md, le lot ou la fiche visée, avant d'ouvrir un sprint ou de groomer"
    kind: feature
    by: [architecture, qualite, dev, produit]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : fiche 20261003201034990, P1"
    date: 2026-10-03
  - proposition: "Un contrôle refuse un titre de section en double dans un SKILL.md, et les tests qui lisent le vrai dépôt vérifient une invariante au lieu de figer une donnée (id de fiche ouverte, statut d'ADR)"
    kind: feature
    by: [architecture, qualite, dev]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035080, P2"
    date: 2026-10-03
  - proposition: "Le bilan de fin de run pose la rétro due comme un choix chiffré (complète ou légère, avec son coût mesuré) ; en mode économe, elle ne se lance pas seule"
    kind: regle
    target: skill:ezk-product-build
    by: [qualite, produit, juge]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent), amendée par le juge : règle token-economy/retro-due-choix-chiffre (SHOULD), liée à ezk-product-build (applies)"
    date: 2026-10-03
  - proposition: "Ne jamais couper (| head, | tail) la sortie d'une commande qui écrit"
    kind: regle
    target: global
    by: [dev]
    status: ❌
    decision: "Écartée (choix délégué par le PO à l'agent) : un seul cas, sans dégât, critère difficile à mesurer ; à ressortir s'il revient"
    date: 2026-10-03
  - proposition: "Une fiche pour les points 3 et 4 du portier d'ezk-archive : fiche livrée dite « non livrée », ADR dit « non fusionné », lus sur un worktree en retard"
    kind: feature
    by: [qualite]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035168, P2"
    date: 2026-10-03
  - proposition: "Enrichir la fiche « product-build auto : fenêtre de contexte » avec les mesures du jour : jetons par revue et par appel d'agent, à afficher dans le bilan de run"
    kind: action
    by: [produit]
    status: ✅
    decision: "Faite (choix délégué par le PO à l'agent) : cas et mesures du jour ajoutés à la fiche 20260830094601309"
    date: 2026-10-03
  - proposition: "Enrichir la fiche « Les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres » avec les trois alertes du run"
    kind: action
    by: [qualite, dev]
    status: ✅
    decision: "Faite (choix délégué par le PO à l'agent) : cas des trois alertes ajouté à la fiche 20261003011750521"
    date: 2026-10-03
  - proposition: "Activer la suppression automatique des branches après fusion dans les réglages du dépôt GitHub, pour qu'une fusion depuis l'interface ne laisse plus de branche distante"
    kind: action
    by: [dev]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : réglage du dépôt GitHub, geste du PO (Settings, General, « Automatically delete head branches »)"
    date: 2026-10-03
  - proposition: "Ficher le défaut : plus aucun récit de session sur main depuis le 2026-08-30, la vue « Historique des runs » est figée"
    kind: feature
    by: [produit]
    status: ✅
    decision: "Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035260, P2"
    date: 2026-10-03
---

# Rétro — itération V0.5 du 2026-10-03

**En clair :** le run a livré trois fiches de la V0.5 en autonomie, mais le PO a dû intervenir quatre
fois : une PR d'une autre session changeait le lot, un `ezk` en retard a fait échouer un bilan, une
branche distante est restée, et la rétro due ne s'est pas lancée. L'équipe propose surtout de **rendre
visible** ce qui a surpris : le retard du `ezk` du poste, les PR parallèles, les doublons de texte. Le
PO a délégué le choix : neuf propositions retenues, une règle écartée, et le carnet est vidé.

## 1 · Les faits de départ

- **S1.** Le `ezk` du poste exécute le code du dossier principal de vectorz. Après la fusion de #343,
  `ezk run report` a encore échoué depuis un worktree : le dossier principal n'avait pas été mis à jour.
  `ship-merge.sh` n'affichait que « SIGNAL …/vectorz behind ».
- **S2.** Le portier d'ezk-sprint a levé la même alerte aux trois ouvertures de sprint : des worktrees
  voisins propres. Trois passages outre, journalisés.
- **S3.** La PR #340 (rétro muti, autre session) changeait une fiche du lot et ajoutait une fiche à la
  V0.5 pendant le démarrage du run. Le PO a dû le signaler ; le lot a été réordonné à la main.
- **S4.** Codex était à court de quota : la revue locale a tenu le plancher (3 GO). Coût des 3 revues :
  183k, 145k et 134k jetons.
- **S5.** La CI prend 5 à 10 minutes par PR. Parade : empiler la fiche suivante, puis rebaser après le
  squash. Deux fois sans conflit.
- **S6.** La rétro due en fin de run (`--retro end`) ne s'est pas lancée : le mode économe dit de
  prévenir avant un coût élevé. Le PO l'a lancée à la main.
- **S7.** `ezk-backlog/SKILL.md` portait une section entière en double, reste de deux PR fusionnées.
  Trouvée par hasard.
- **S8.** Une fusion depuis l'interface GitHub (#345) a laissé la branche distante. Le PO a demandé si
  elle servait encore, puis l'a supprimée.
- **S9.** Les points 3 et 4 du portier d'ezk-archive gardent le défaut corrigé par #345 pour les
  branches. Aucune fiche ne les porte.
- **S10.** Le bilan de fin de run dit « Jetons : non mesurés ».
- **S11.** Un `| head -2` dans un essai a tué un `ezk backlog ship` avant qu'il écrive. Rien d'abîmé.
- **S12.** En fin de session, l'app a recyclé le worktree de la session pour une autre.
- **Carnet (6 notes)** : N1 plusieurs sessions dans le même dossier · N2 des tests figent l'état réel du
  backlog · N3 coût par fiche au-dessus de la cible · N4 plus aucun récit de session sur main · N5 un
  test de mutation a effacé du travail (muti) · N6 deux groomings parallèles de la même fiche.

## 2 · Tour 1 — chaque lentille propose

- **Architecture** : `ezk` exécute toujours le code du dépôt courant (S1) ; tests en invariantes (N2) ;
  contrôle des titres en double (S7) ; PR et branches parallèles visibles avant un lot ou un groom
  (S3, N6).
- **Qualité** : le retard du `ezk` dit avec sa commande (S1) ; test des titres en double, adossé à N2
  (S7) ; enrichir la coordination multi-sessions (S3, N6) ; la rétro due prime sur « préviens » (S6).
- **Dev** : `ezk doctor` qui compare au `origin/main` (S1) ; enrichir le contexte de run (S3) ; contrôle
  des SKILL.md et des tests figés (S7, N2) ; ne jamais couper une commande qui écrit, commiter avant de
  muter (S11, N5).
- **Produit** : le contexte de run liste les PR qui touchent le lot (S3) ; le retard dit en clair (S1) ;
  jetons par fiche dans le bilan (S4, S10, N3) ; la rétro due s'annonce puis se lance (S6).

## 3 · Tour 2 — confrontation et convergence

Tour 2 **léger**, décidé par le PO pour le coût : un seul agent (produit) a relu les quatre copies et
rendu le consensus. Le tour 1 avait coûté environ 400k jetons (97k à 103k par lentille) ; le tour 2,
105k.

- **Fusionné** : les quatre lectures de S1 en une feature (le message d'action, pas un nouveau
  lanceur : la délégation au worktree existe depuis #343). S7 et N2 en une feature de contrôle.
- **Rallié par tous** : S3 et N6 en une seule feature, pour le contexte de run **et** le groom.
- **Écarté** : N1 et S12 (couverts par la fiche en grooming « La note de passation et le carnet de
  rétro survivent à la suppression d'un worktree » et par la mémoire de session) ; N5 (un seul cas, dans
  un autre dépôt).

**Le carnet, note par note** (toutes déplacées dans `docs/retro-notes/traitees/`) :

- N1 plusieurs sessions dans le même dossier : traitée par la fiche en grooming « La note de passation
  et le carnet de rétro survivent à la suppression d'un worktree » (PR #346), qui sort la note de
  passation du worktree.
- N2 tests qui figent l'état du backlog : traitée par la proposition 3.
- N3 coût par fiche : traitée par les propositions 4 et 7.
- N4 récits de session absents de main : traitée par la proposition 10.
- N5 test de mutation sur un fichier non commité (muti) : écartée, un seul cas dans un autre dépôt, et
  le geste sûr est connu (commiter avant de muter).
- N6 groomings parallèles de la même fiche : traitée par la proposition 2.

## 4 · Le juge de cohérence

Avis rendu par le pilote, sans appel à `ezk-steward`, pour tenir le coût voulu par le PO.

- **Rétro due en mode économe** : la version du tour 2 (« elle se lance sans attendre ») **contredit**
  la règle `token-economy/checkpoint-before-cost` (confirmer avant une phase coûteuse). Cette rétro l'a
  montré : elle a coûté deux fois l'estimation, et le PO a choisi une version légère. Proposition
  amendée : le bilan pose la rétro comme un choix chiffré.
- **Ne pas couper une commande qui écrit** : aucune contradiction, aucun doublon. Mais un seul cas,
  sans dégât, et un critère difficile à mesurer. Avis : écarter, ou en faire un correctif de code.
- Les features et actions ne sont pas des règles : pas d'avis requis.

## 5 · Ce qui est proposé au PO

| # | Fait vécu | Proposition | Mesure |
|---|---|---|---|
| 1 | S1 | `ezk`, `ship-merge.sh` et `run report` disent le retard du dossier principal, avec `git pull` | sur un cas en retard, la commande s'affiche ; 0 échec muet sur 3 runs |
| 2 | S3, N6 | `run context` et `groom` listent les PR et branches parallèles qui touchent le lot ou la fiche | 0 grooming jeté et 0 réordre manuel sur 5 lots |
| 3 | S7, N2 | contrôle des titres en double dans les SKILL.md ; tests en invariantes | le test échoue sur un doublon rejoué ; 0 id figé dans les tests |
| 4 | S6 | règle `skill:ezk-product-build` : la rétro due est un choix chiffré du bilan | 3 runs ≥ 2 sprints : la rétro est proposée avec son coût, jamais oubliée sans trace |
| 5 | S11 | règle `global` : ne pas couper une commande qui écrit | 0 commande d'écriture tronquée sur 5 sessions |
| 6 | S9 | fiche pour les points 3 et 4 du portier d'ezk-archive | fiche créée, prête au grooming |
| 7 | S4, S10, N3 | enrichir la fiche « fenêtre de contexte » des mesures du jour | le prochain bilan chiffre les jetons |
| 8 | S2 | enrichir la fiche des portiers avec les trois alertes du run | la fiche cite le cas daté |
| 9 | S8 | activer la suppression automatique des branches fusionnées sur GitHub | 0 branche distante restante après une fusion depuis l'interface |
| 10 | N4 | ficher l'absence de récit de session sur main | fiche créée |

## 6 · Suivi des décisions de la rétro précédente

Rétro précédente : `docs/captures/2026-10-03-retro-session-2026-10-02.md`.

- **Règle « un critère se coche dans la PR, avant le merge »** : a tenu. Les trois fiches du run ont
  coché leurs critères dans leur PR ; le critère « premier ship muti à la main » de la fiche 731 est
  passé en « Mesure de suivi ». Trop tôt pour la mesure sur 5 fiches (3/5).
- **Fiche « une seule commande gate »** : pas encore construite. Le run a rejoué trois commandes à
  chaque fiche ; le besoin tient.
- **Fiche « ship une seule fois, après Codex »** : Codex absent ce soir ; le ship est resté le dernier
  commit de chaque PR, posé une fois. Trop tôt.
- **Fiche « la revue rejoue les scripts bash sur des entrées hostiles »** : pas construite ; la revue de
  #345 a raisonné sur les entrées hostiles sans les rejouer. Le besoin tient.
- **Écartée « sceller un SPRINT.md resté ouvert »** : pas revenue dans ce run.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1 · retard du `ezk` du poste dit avec sa commande | ✅ Retenue (choix délégué par le PO à l'agent) : fiche 20261003201034897, P1 | 2026-10-03 |
| 2 · PR et branches parallèles visibles avant un lot ou un groom | ✅ Retenue (choix délégué par le PO à l'agent) : fiche 20261003201034990, P1 | 2026-10-03 |
| 3 · titres en double et tests en invariantes | ✅ Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035080, P2 | 2026-10-03 |
| 4 · règle : la rétro due est un choix chiffré | ✅ Retenue (choix délégué par le PO à l'agent), amendée par le juge : règle token-economy/retro-due-choix-chiffre (SHOULD), liée à ezk-product-build (applies) | 2026-10-03 |
| 5 · règle : ne pas couper une commande qui écrit | ❌ Écartée (choix délégué par le PO à l'agent) : un seul cas, sans dégât, critère difficile à mesurer ; à ressortir s'il revient | 2026-10-03 |
| 6 · fiche pour les points 3 et 4 du portier | ✅ Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035168, P2 | 2026-10-03 |
| 7 · enrichir la fiche « fenêtre de contexte » | ✅ Faite (choix délégué par le PO à l'agent) : cas et mesures du jour ajoutés à la fiche 20260830094601309 | 2026-10-03 |
| 8 · enrichir la fiche des portiers | ✅ Faite (choix délégué par le PO à l'agent) : cas des trois alertes ajouté à la fiche 20261003011750521 | 2026-10-03 |
| 9 · suppression automatique des branches fusionnées | ✅ Retenue (choix délégué par le PO à l'agent) : réglage du dépôt GitHub, geste du PO (Settings, General, « Automatically delete head branches ») | 2026-10-03 |
| 10 · ficher l'absence de récit de session | ✅ Retenue (choix délégué par le PO à l'agent) : fiche 20261003201035260, P2 | 2026-10-03 |

Le PO a délégué le choix à l'agent (« choisis stp, je ne comprends pas »). L'agent a suivi le consensus du tour 2 et l'avis du juge.

## 8 · Glossaire

- **Dossier principal** : le checkout de vectorz hors worktree (`~/git/bacasable/vectorz`). Le `ezk`
  installé sur le poste exécute son code.
- **Worktree** : un dossier de travail séparé sur le même dépôt ; l'app en crée un par session.
- **Portier** : le script qui inspecte l'état avant d'ouvrir un sprint (`ezk-sprint`) ou de clore une
  session (`ezk-archive`).
- **Carnet** : `docs/retro-notes/`, où une session dépose une friction pour la rétro suivante.
- **Tour 2 léger** : un seul agent relit les copies du tour 1 et rend le consensus, au lieu de quatre.
