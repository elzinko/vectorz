---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 18 : la revue adverse se saute en mode POC seulement"
scope: "sprint 18 du run autonome, clos le 2026-11-03 (une story sensible, première fiche du milestone methode-configurable) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Un compte rendu de sprint sans point de passage à son nom reste non daté. Aujourd'hui, le repli « dernier point de passage du run » lui prête la fenêtre du sprint précédent : le sprint 18 affiche la durée et les jetons du sprint 17."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "Quand une fiche change une règle d'un skill, sa revue cherche toutes les étapes du skill qui disent le contraire, pas seulement celle qu'elle modifie."
    kind: action
    by: [qualite, architecture]
    status: ⏳
---

**En clair :** le sprint 18 a créé la seule dérogation au plancher de revue. Un humain peut mettre un
projet en mode POC ; la revue adverse est alors sautée et tracée, jamais la gate locale. La revue a
d'abord dit NO-GO : l'étape de fusion du skill exigeait encore la revue. C'est corrigé et gardé par un
test. Le compte rendu du sprint, lui, a repris la fenêtre du sprint 17. Deux propositions attendent ta
décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`ec8b20e3`), sur ta décision du 2026-10-09 écrite dans la fiche. Le
  réglage `review: { adverse: skip }` n'est posé par aucun projet.
- La revue adverse a dit NO-GO une fois. L'étape 7 d'`ezk-sprint` sautait la revue en mode POC, mais
  l'étape 10 exigeait encore « revue adverse traitée » avant toute fusion. Un agent aurait reçu deux
  ordres contraires. Corrigé, puis GO ; un test garde l'accord des deux étapes.
- La preuve des critères « skip » et « tracé » est le texte du skill. Aucun vrai sprint POC n'a été
  rejoué : la fiche le dit.
- Le run de supervision avait été clos avant ce sprint. Sans point de passage à son nom, la clôture a
  pris le dernier point du run, celui du sprint 17 : le compte rendu du sprint 18 affiche ses 12 minutes
  et ses jetons. La liste des fiches livrées, elle, est juste, grâce au filtre par lot du sprint 14.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : un compte rendu sans point de passage à son nom reste non daté (P1) ; la revue d'une
  règle de skill cherche toutes les étapes qui la contredisent (P2).
- **Dev** : P1 ; le repli date juste quand le nom du point diffère, mais il emprunte quand le sprint n'a
  pas de point du tout.
- **Architecture** : P2 ; une règle répartie sur plusieurs étapes d'un même texte se contredit vite.
- **Produit** : rien de neuf ; le mode POC reste à éprouver sur un vrai projet.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : le chiffre faux est écrit et committé dans un compte rendu.
- P2 est gardée, en action : la revue a trouvé la contradiction, mais un premier passage qui l'aurait
  cherchée évitait un aller-retour.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : un sprint sans point de passage à son nom produit un compte rendu « non mesuré », jamais la
  fenêtre d'un autre sprint.
- P2 : sur les 3 prochaines fiches qui changent une règle de skill, 0 NO-GO pour une contradiction
  entre deux étapes du même skill.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer ces propositions : elles attendent ta décision.
