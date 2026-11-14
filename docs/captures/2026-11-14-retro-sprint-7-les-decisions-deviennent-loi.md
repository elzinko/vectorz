---
type: retro
date: 2026-11-14
theme: "Run autonome du 2026-11-14 au soir, sprint « Les décisions deviennent loi » : le panel de la coupe, l'ADR-0088 et les mots de l'écran"
scope: "sprint 7 du journal de branche (lot de deux stories documentaires : amendements d'ADR du 12 novembre, trancher la coupe), run lancé par le PO via /goal (ezk-product-build --mode auto, mandat jusqu'à minuit, relayé par la session pilote) ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Quand une story affirme un fait dont la preuve arrive par une autre story du même lot (ici : « vérifiées par le panel » alors que la capture du panel était dans la story voisine), le lot se construit dans l'ordre de la preuve : la story qui apporte la preuve passe d'abord, l'autre la cite. Au sprint 7, l'ordre inverse a coûté un NO-GO et un rebasage."
    kind: action
    by: [qualite, architecture]
    status: ⏳
  - proposition: "Un critère d'acceptation qui ne peut devenir vrai que par un acte du PO (ratifier un ADR, répondre oui) se nomme comme tel dans la fiche au grooming (« décision PO : … »), pour que la story puisse être livrée avec ce seul critère ouvert, reporté et visible, au lieu de bloquer le lot. Au sprint 7, « ADR-0088 accepté ou rejeté » a laissé la story de la coupe reportée alors que tout son travail est dans main."
    kind: action
    by: [produit, dev]
    status: ⏳
  - proposition: "Le relecteur adverse reçoit, avec le patch, l'état des faits hors dépôt que la story suppose (un panel joué, une décision relayée), daté et sourcé ; sinon il juge faux ce qui est vrai mais pas encore committé. Au sprint 7, le premier NO-GO venait de là."
    kind: action
    by: [qualite]
    status: ⏳
  - proposition: "Le compte rendu de sprint perd les lettres accentuées dans son nom de fichier : « Les décisions deviennent loi » devient `les-d-cisions-deviennent-loi`. Le slugifier translittère (é → e) au lieu de remplacer la lettre par un tiret ; le jalon de supervision suit la même règle."
    kind: feature
    by: [dev]
    status: ⏳
---

**En clair :** le sprint a gravé les décisions des 11, 12 et 14 novembre dans les documents de décision, joué
le panel adverse de la coupe et posé la décision sur la coupe en « proposé », en attente de ton oui. Deux stories documentaires, deux revues adverses,
trois NO-GO corrigés en moins d'une heure. Ce qui a coûté : construire d'abord la story qui citait une
preuve apportée par l'autre, et un critère qui ne dépend que d'un oui du PO. Quatre propositions attendent.

## 1 · Les faits de départ

- Deux stories livrées en local, documents seuls : les amendements d'ADR du 12 novembre (ADR-086, 079,
  074, 0054, 0056, 0064 ; « Le run » devient « Le sprint ») et la coupe (capture du panel, ADR-0088,
  six amendements, deux fiches requalifiées). Gate complète verte trois fois (2338 tests, 48 suites).
- Le panel adverse a tourné en 38 minutes (trois lentilles, deux juges, 1,8 million de jetons) et a
  trouvé un blocage dans le code que le dossier ignorait : la passe `dod-mecanique` de la gate échoue sur
  toute coupe neuve.
- Première revue de la story des ADR : NO-GO, parce que le texte disait « vérifiées par le panel » alors
  que la capture du panel n'était pas encore dans le dépôt ; l'ordre des stories a été inversé, la story
  de la coupe est passée d'abord, puis rebasage et re-revue.
- Première revue de la story de la coupe : NO-GO, le sort de la règle `changelog` manquait dans l'ADR
  et une puce d'amendement était doublée par un script d'édition rejoué sans garde ; corrigé, GO.
- La story de la coupe est reportée au close : son dernier critère, « ADR-0088 accepté ou rejeté »,
  attend les quatre oui du PO, posés par la session pilote ; tout le reste est dans `main`.
- Quatre questions ont été remontées au PO sans bloquer le run (règle du mandat : poser, continuer).
- Le [compte rendu du sprint](../sprints/2026-11-14-sprint-les-d-cisions-deviennent-loi.md) s'appelle
  `les-d-cisions-deviennent-loi` : le slug a perdu le « é » de « décisions ».

## 2 · Tour 1 — chaque lentille propose

Porté par l'orchestrateur, à travers les quatre lentilles (mode léger).

- **Qualité** : P1, l'ordre de la preuve ; P3, le relecteur reçoit les faits hors dépôt.
- **Architecture** : P1 ; un lot cohérent a un ordre, et c'est la preuve qui le donne.
- **Produit** : P2, nommer au grooming les critères qui ne dépendent que du PO.
- **Dev** : P2 ; une story entière dans `main` qui reste « non livrée » brouille le bilan. P4, le slug du
  compte rendu translittère les accents.

## 3 · Tour 2 — confrontation et convergence

- P1 est gardée en action : elle change l'ordre dans lequel l'orchestrateur construit un lot.
- P2 est gardée en action, à trancher par le PO : elle touche la façon d'écrire une fiche au grooming.
- P3 est gardée en action : elle change le brief que l'orchestrateur donne au relecteur.
- P4 est gardée en fiche : un correctif du slugifier, petit et testable.
- Écarté : rendre les scripts d'édition idempotents par une règle ; c'est une hygiène d'agent, pas une
  règle de la méthode.

## 4 · Le juge de cohérence

Aucune règle neuve proposée : pas de juge convoqué.

## 5 · Les mesures

- Sprint 7 : 1 h 06 (17 h 54 → 19 h 00 UTC, d'après le compte rendu), jetons non mesurés au grain sprint
  (le compte rendu le dit, pas de faux zéro) ; deux stories, deux revues adverses (trois NO-GO corrigés),
  une gate complète par revue, 0 fichier de code touché hors deux libellés.
- Le panel : 3 lentilles, 2 juges, 38 minutes, 1,8 million de jetons ; 10 questions, 4 renvoyées au PO.

## 6 · Décisions

Quatre propositions en ⏳ : le PO tranche. Rien n'est rangé sans son feu vert.
