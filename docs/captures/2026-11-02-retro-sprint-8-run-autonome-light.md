---
type: retro
date: 2026-11-02
theme: "Run autonome, sprint 8 : le pouce de revue passe par la méthode"
scope: "sprint 8 du 2026-11-02 (deux stories, milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Comprendre pourquoi la suite de scripts de la méthode a échoué une fois sur « lib introuvable » alors que le fichier était là, puis la rendre sûre quand deux lancements tournent dans le même dossier : soit ils passent tous les deux, soit le second refuse en le disant."
    kind: spike
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 8 a livré en local le pouce de revue par la méthode : une commande
`ezk review verdict`, puis le bouton de mission control qui la lance. Le code a tenu du premier coup,
essai réel compris. Deux accrocs, tous deux de méthode et non de code : un patch de revue amputé de
ses captures, et un échec passager des tests de scripts sans cause trouvée. Une seule proposition
attend la décision du PO ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : la commande `ezk review verdict` (`382412eb`) et le pouce dans
  mission control (`b6711c6b`). La seconde était construite sur la branche de la première ; après
  l'intégration de la première, elle a été reposée sur main sans difficulté.
- Essai réel réussi du premier coup : un clic sur 👍 dans mission control a fait écrire le pouce par la
  commande de la méthode, et la fenêtre l'a affiché à la relecture.
- La revue adverse a rendu GO sur la commande, et NO-GO sur le bouton pour une seule raison : les
  captures avant/après manquaient au patch relu. Elles étaient dans le commit. L'orchestrateur les
  avait retirées du patch pour l'alléger, alors que git résume un fichier image en une ligne. Le
  relecteur avait prévu le cas : captures présentes, blocage levé.
- Les tests de scripts de la story 1 ont échoué une fois : `test-mainsync.sh` n'a pas trouvé
  `lib-worktree-safety.sh`, pourtant présent et intact depuis la création du dossier. Relancée seule,
  puis en entier, la suite est passée (47 sur 47). Hypothèse non prouvée : un premier lancement, mal
  arrêté, tournait encore dans le même dossier.
- Le compte rendu du sprint 8 se trompe comme celui du sprint 7 : 1 fiche annoncée, celle d'une autre
  session, pour 2 livrées. Le cas est ajouté à la fiche existante
  [un compte rendu de sprint non daté le dit d'emblée](../../features/20261101131506082_compte-rendu-de-sprint-non-date-sans-faux-zero.md) :
  un enrichissement, pas une nouvelle décision.
- Le groom du sprint 9 a confronté les fiches au code, et en a tiré un vrai défaut : la collecte du
  « process » de la méthode appelle GitHub même sur un projet `github: false`. Il est devenu un
  critère de la fiche [mission control montre le process](../../features/done/20261102123552183_mission-control-montre-le-process.md),
  pas une proposition de rétro.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : comprendre l'échec passager des tests de scripts, et rendre la suite sûre face à deux
  lancements dans le même dossier (P1).
- **Dev** : P1 ; ne plus filtrer les captures du patch confié à la revue (P2).
- **Architecture** : rien de neuf ; la chaîne « bouton, daemon, commande ezk » respecte l'ADR-086 sans
  détour.
- **Produit** : le compte rendu de sprint qui se trompe, déjà couvert par une fiche existante,
  enrichie.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 devient une exploration : la cause n'est pas prouvée, et un seul cas a été vu. La minceur de la
  preuve est signalée, elle ne bloque pas : au PO de dire si l'exploration vaut maintenant.
- P2 est écartée : la consigne existe déjà dans `ezk-sprint` (« le chemin du patch à `ezk-reviewer`,
  `git diff origin/main...HEAD` », sans filtre). L'orchestrateur s'en est écarté ; une seconde règle
  ferait doublon.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : deux `test:scripts` lancés en même temps dans un même dossier finissent tous les deux verts, ou
  le second s'arrête avec un message qui nomme le premier.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
