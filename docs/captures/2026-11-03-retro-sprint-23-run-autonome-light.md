---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 23 : un vieux SPRINT.md committé ne bloque plus le sprint"
scope: "sprint 23 du run autonome, clos le 2026-11-03 (une story de preuve, dernière fiche constructible sans le PO) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "La matrice de validation d'une livraison reprend le compte de tests de la gate, lu par un script dans la sortie de la gate, au lieu d'un nombre recopié à la main. Au sprint 23, l'agent a écrit 2 314 tests au lieu de 2 315, dans le corps de PR et dans la revue."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 23 a livré une preuve, pas un correctif. Un vieux `SPRINT.md` committé,
comme celui de muti, ne bloque plus l'ouverture ni la clôture d'un sprint. Un test le fixe désormais.
La revue a réintroduit le bug de deux façons, et le test les a attrapées. Une erreur de recopie de
chiffre a été corrigée après coup. Une proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`76a76cef`) : un cas de plus dans `test-sprint-lifecycle.sh`, sans
  changement de `sprint.sh`.
- La fiche avait été déclarée prête le 2026-10-24, puis révoquée : sa prémisse ne se reproduisait plus.
  Le groom du 2026-11-03 l'a réduite à la preuve sur le cas exact de muti.
- La revue a muté une copie de `sprint.sh` deux fois : l'instantané recompté comme sprint ouvert, puis
  repris sans vérifier la branche. Le test est passé rouge les deux fois.
- L'agent a recopié à la main le compte de tests de la gate : 2 314 au lieu de 2 315. Corrigé dans le
  corps de PR et dans la revue, par un commit à part.
- Le compte rendu du sprint est juste : 13 minutes, une fiche.
- Après ce sprint, aucune fiche ne se construit sans toi : toutes les autres attendent une décision,
  un panel, un design ou un découpage.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : le compte de tests vient de la gate, pas d'une recopie (P1).
- **Dev** : P1 ; c'est le principe du trio gabarit, extracteur, rendu : le script sort les faits.
- **Architecture** : rien de neuf ; la preuve par mutation a montré qu'un test de non-régression mord.
- **Produit** : rien de neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : un chiffre recopié finit faux, et il part dans un document committé.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochaines livraisons, le compte de tests de la matrice égale celui de la sortie de la
  gate.

## 6 · Décisions du PO

En attente. Le run autonome s'arrête sans appliquer cette proposition : elle attend ta décision.
