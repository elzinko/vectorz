---
type: retro
date: 2026-11-02
theme: "Run autonome, sprint 9 : le pilotage et le process dans mission control"
scope: "sprint 9 du 2026-11-02 (deux stories, milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Les tests qui lancent git, tsx ou un sous-process déclarent un délai large, comme le test du contrat board-show le fait depuis le 2026-11-01. La gate ne tombe plus sur un dépassement de 5 secondes quand la machine est chargée."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 9 a livré en local deux vues de mission control : le pilotage (milestones et
sessions closes) et le process (chaque fiche sur son étape). La revue a dit GO du premier coup, et le
groom a trouvé un vrai défaut avant le build : la méthode interrogeait GitHub sur un projet qui l'avait
coupé. Un seul accroc, d'outillage : deux tests ont dépassé leur délai de 5 secondes sous charge. Une
proposition attend la décision du PO ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : le pilotage (`c5c0af6e`) et le process (`036e3256`). Une seule revue
  adverse pour les deux patchs : GO et GO. Ses deux remarques mineures ont été appliquées avant la
  livraison.
- La leçon du sprint 8 a servi : le patch confié à la revue gardait cette fois ses captures, et la revue
  n'a rien bloqué.
- Le groom a confronté la fiche « process » au code. La collecte lisait le dossier courant au lieu du
  projet visé, et lançait `gh` sur vectorz, qui a coupé GitHub : deux PR lues sur GitHub en 2,6 s. Les
  deux défauts sont devenus des critères, corrigés et prouvés par un faux `gh` qui note ses appels.
- Deux tests ont dépassé 5 secondes, chacun pendant qu'une autre suite tournait : celui de l'agent QA
  de mission control, et celui de la vue « board » de la méthode, à 5,08 s. Chacun passe seul. La
  gate, relancée seule, est verte : 2411 tests et 47 suites de scripts. Le sprint 8 avait déjà perdu
  une suite de scripts à deux lancements simultanés.
- Pour chaque capture, il a fallu recopier la config locale de mission control dans le dossier de
  travail : c'est la proposition du sprint 7 sur la préparation d'un dossier neuf, toujours en attente,
  pas une nouvelle.
- Le compte rendu du sprint 9 est juste : 2 fiches livrées, 33 minutes. Ce contre-exemple affine la
  fiche existante
  [un compte rendu de sprint non daté le dit d'emblée](../../features/20261101131506082_compte-rendu-de-sprint-non-date-sans-faux-zero.md) :
  le défaut dépend de la fenêtre, pas du ship local. C'est un enrichissement, pas une nouvelle décision.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : donner un délai large aux tests qui lancent des sous-process (P1).
- **Dev** : P1 ; ne plus lancer deux suites lourdes en même temps (P2).
- **Architecture** : rien de neuf ; la troisième source de mission control suit le patron des deux
  premières.
- **Produit** : le compte rendu de sprint, contre-exemple ajouté à la fiche existante.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée : trois dépassements en deux sprints, tous sous charge, et un remède déjà éprouvé dans
  le même dépôt (le délai de 60 s du test du contrat board-show).
- P2 est écartée : c'est une discipline de l'orchestrateur, et P1 rend la gate sûre même quand elle
  n'est pas tenue.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochaines gates, aucun échec par « Test timed out in 5000ms ».

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
