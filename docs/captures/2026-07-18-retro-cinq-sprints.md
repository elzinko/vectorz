# Rétrospective — session du 18 juillet 2026 (5 sprints)

> **C'est quoi ce document ?** Le compte rendu complet de la **première rétrospective**
> jouée avec le skill `/ezk-retro` : qui a dit quoi, ce qui a été retenu, ce qui a été
> écarté et pourquoi. Les décisions finales appartiennent au PO — leur état est en
> [fin de document](#7--décisions-du-po). Un [glossaire](#8--glossaire) traduit les
> termes d'équipe.

- **Date** : 2026-07-18
- **Périmètre passé en revue** : les 5 sprints autonomes du jour (skills ezk-article,
  ezk-diagram, ezk-ci, clôture du kit de supervision, incrément vz-product-builder)
  + le lot documentation/config du branchement Claude Desktop (guide utilisateur,
  revue par personas, PR #37).
- **Participants** : 4 agents-lentilles (architecture, qualité, développement,
  produit) + 1 juge de cohérence (le gardien de la librairie) + le PO (décideur final).
- **Déroulé** : symptômes → tour 1 (propositions indépendantes) → tour 2
  (confrontation et convergence) → juge de cohérence → décision PO.

---

## 1 · Les faits de départ (les « symptômes »)

Une rétro ne part pas d'opinions mais de **choses qui se sont réellement passées**.
Neuf faits observés pendant la session, tous vérifiables dans l'historique git :

| # | Ce qui s'est passé (en clair) |
|---|---|
| S1 | Un document d'architecture a été **cité sans avoir été lu** : la citation était fausse. Le relecteur l'a repérée → travail refusé, puis corrigé après lecture réelle. |
| S2 | Au moment d'un commit, **tout un dossier a été ajouté d'un coup** : un fichier en cours d'édition (une autre fiche) est parti avec, par accident. |
| S3 | Une **configuration publiée dans la doc n'avait jamais été essayée** : elle était cassée (3 erreurs). C'est un relecteur-test qui a *exécuté* les commandes qui l'a découvert. |
| S4 | Le système de sécurité qui valide les commandes (côté Claude, hors repo) est **tombé en panne plusieurs fois**, interrompant le travail. |
| S5 | La seule doc de branchement disponible était écrite **pour des intégrateurs**, pas pour des utilisateurs : le PO a dû réclamer une version compréhensible. |
| S6 | Une vieille branche git semblait contenir du travail non fusionné ; en réalité **tout était déjà sur main** — il a fallu le vérifier à la main, ligne par ligne. |
| S7 | Une fiche déclarée « prête à construire » dépendait d'un **repo externe jamais vérifié** avant de démarrer le sprint. (Ça a marché, mais par chance.) |
| S8 | En fin de session, **plus aucune fiche prête** dans le backlog : un prochain run autonome serait resté bloqué au départ. |
| S9 | *(Positif à retenir)* La **relecture par plusieurs profils de lecteurs**, dont un qui exécute vraiment les instructions, a trouvé 3 bugs bloquants + des défauts de clarté. Excellent rapport coût/efficacité. |

---

## 2 · Tour 1 — chaque lentille propose (indépendamment)

Chaque agent a reçu les faits ci-dessus et a proposé 2 à 4 améliorations **sans voir
les propositions des autres**. Résumé fidèle :

### Lentille architecture
- **A1** — Une règle : « toute référence qui sort d'un document doit être *prouvée* » —
  un texte cité doit avoir été lu, une commande publiée doit avoir été exécutée. Sa
  lecture des faits : S1 et S3 sont **le même défaut** (on publie un pont vers
  l'extérieur sans avoir vérifié qu'il tient).
- **A2** — Vérifier les dépendances externes d'une fiche **au moment où on la déclare
  prête**, pas au moment où on la construit (S7).
- **A3** — Séparer systématiquement **deux documents** : la référence technique (pour
  intégrateurs) et le guide (pour utilisateurs) — deux publics, deux docs (S5).
- *S'interdit* : créer une nouvelle catégorie de règles ou un nouveau skill de
  vérification (inflation).

### Lentille qualité (QA)
- **Q1** — Tout bloc de commande publié doit être **copié-collé et exécuté** avant
  fusion (S3).
- **Q2** — Toute citation d'un document dans une justification exige **sa lecture dans
  le même temps** (S1).
- **Q3** — Les commits de livraison doivent **nommer les fichiers un par un** (S2).
- **Q4** — Ajouter un champ structuré « dépendances vérifiées » dans les fiches (S7).
- *S'interdit* : créer un rôle « testeur de doc » dédié.

### Lentille développement / outillage
- **D1** — Un garde-fou **automatique** (hook git) contre l'ajout d'un dossier entier
  au commit (S2).
- **D2** — Un **script** qui extrait les blocs de commandes d'une doc et les exécute
  automatiquement avant fusion (S3).
- **D3** — Un **script** qui détecte automatiquement si une branche est déjà absorbée
  par main (S6).
- **D4** — Dépendance externe testée et **datée** au moment du grooming (S7).
- *S'interdit* : transformer la panne du système de sécurité (S4) en règle — c'est un
  problème d'infrastructure, pas de méthode.

### Lentille produit / flux
- **P1** — À la clôture d'une session, vérifier qu'il reste **au moins N fiches
  prêtes** par backlog, sinon alerter (S8).
- **P2** — Même idée que A2/D4/Q4 : dépendance externe **constatée** avant le tampon
  « prête » (S7).
- **P3** — Rendre **obligatoire** la relecture multi-profils (dont un lecteur qui
  exécute) pour tout livrable destiné à un utilisateur (S9, S3, S5) — aujourd'hui ce
  filet n'existe que si le PO le réclame.
- *S'interdit* : une règle sur les pannes du système de sécurité (S4).

---

## 3 · Tour 2 — confrontation et convergence

Chaque agent a ensuite vu les propositions des trois autres. C'est là que la cérémonie
a fait son travail : **fusionner les doublons et choisir la forme la plus légère**.

| Point débattu | Issue du débat |
|---|---|
| A1, Q1 et Q2 disent la même chose | **Fusionnées en une seule règle** (« références prouvées »). La QA retire ses deux versions au profit de la formulation architecture, plus générale. Unanimité pour un niveau **obligatoire** (les deux incidents étaient réels, une simple recommandation ne les aurait pas arrêtés). |
| A2 = D4 = P2 = Q4 (dépendances externes) | Fusionnées. Le **champ structuré** de la QA est rejeté à 4 voix contre 0 (trop lourd, invite l'inflation de schéma) au profit d'une **simple ligne datée** dans la fiche : « dépendance X — accès constaté le [date] ». |
| Discipline ou automatisme pour les commits ? (Q3 vs D1) | **La lentille dev retire son propre hook** : « juger si un dossier est la bonne portée demande un jugement — c'est au dev de le faire au moment du commit, pas à un script de le deviner ». Discipline d'abord ; on outillera **seulement si ça se reproduit** (seuil : 2 récidives sur 5 sprints). |
| La relecture multi-profils : règle ou nouveau point de contrôle ? (A3 + P3) | **Fusionnées en une règle**, sans créer de point d'arrêt supplémentaire dans le flux. Le produit précise le périmètre pour éviter que la règle gonfle : s'applique à ce qui est **destiné à être lu hors de l'équipe** (guides, README d'accueil, docs de config publiées) ; exclut les documents internes (ADR, fiches, notes de sprint). |
| Le script « branche absorbée » (D3) | Débattu : l'auteur le retire, deux lentilles le soutiennent quand même. Tranché… par le juge, au temps suivant (voir §4 — il existait déjà !). |
| Combien de fiches prêtes en réserve ? (P1) | 3 voix pour **au moins 1** par backlog (« un plancher tirable, pas un stock »), 1 voix pour 2 (dev : « une seule fiche prête peut se faire retirer entre-temps »). Consensus : **1**, position minoritaire consignée ici. |
| Les pannes du système de sécurité (S4) | **Hors rétro, à l'unanimité** : c'est de l'infrastructure externe, pas un levier de méthode. |

---

## 4 · Le juge de cohérence

Le gardien de la librairie a relu chaque proposition **contre les règles existantes et
le backlog** (pour éviter doublons et contradictions). Verdicts :

| Proposition | Verdict | Détail |
|---|---|---|
| Références prouvées | ✅ Cohérente | Rien d'existant ne couvre ça. Précision ajoutée : « publié » = ce qui part en revue/PR, pas les notes de travail. |
| Dépendances au tampon « prête » | ✅ Cohérente | Devient le **4ᵉ point** de la check-list existante du gate (problème / valeur / critères / *dépendances*). |
| Doc utilisateur + relecture profils | ✅ Cohérente, à condition | Une règle voisine existe déjà (`user-guide.md`, niveau « recommandé ») : **l'enrichir sur place** plutôt que créer un doublon. Le passage éventuel en « obligatoire » = décision PO. |
| Commits fichier par fichier | ✅ Cohérente | Rien d'existant sur ce point dans l'étape de livraison. |
| Script « branche absorbée » | ❌ **Doublon** | **Ce script existe déjà** — livré par la fiche 0076 (`ezk-archive/scripts/check.sh`) : il classe déjà les branches automatiquement. Trois lentilles l'avaient soutenu sans le savoir. Abandonné. |
| Réserve de fiches prêtes en clôture | ✅ Cohérente | Devient la **8ᵉ vérification** du rituel de clôture. Garde-fou confirmé : jamais de tampon « prête » posé automatiquement — ça reste le geste du PO. |

> Le moment le plus utile de la cérémonie : sans ce juge, l'équipe aurait reconstruit
> un outil qu'elle possède déjà.

---

## 5 · Ce qui est proposé au PO (version finale, en clair)

Cinq propositions ont survécu. Pour chacune : le fait vécu → ce qu'on propose → comment
on saura que ça marche.

1. **« Vérifier avant de citer. »** *(règle, obligatoire)*
   Hier : une citation fausse (document jamais lu) et une config cassée (jamais
   essayée) sont parties en publication. Demain : on ne publie ni citation non lue, ni
   commande non exécutée pour de vrai. → *Mesure : zéro incident de ce type sur les 5
   prochains sprints.*

2. **« Vérifier les prérequis avant de tamponner une fiche "prête". »** *(règle)*
   Hier : une fiche « prête » dépendait d'un repo externe jamais vérifié. Demain : le
   tampon « prête » exige une ligne datée « dépendance X — vérifiée le [date] ».
   → *Mesure : zéro sprint bloqué au démarrage pour une dépendance manquante.*

3. **« Toute doc destinée à un utilisateur = un guide dédié + une relecture par
   3 profils de lecteurs, dont un qui exécute vraiment. »** *(règle — niveau à
   trancher : obligatoire ou recommandé)*
   Hier : tu as dû réclamer une doc lisible, et c'est le relecteur-exécutant qui a
   trouvé 3 bugs. Demain : ce filet ne dépend plus d'une demande de ta part.
   → *Mesure : plus aucune réclamation de doc a posteriori ; zéro config cassée publiée.*

4. **« Au commit de livraison, nommer les fichiers un par un. »** *(geste, pas de
   nouvel outil)*
   Hier : un dossier ajouté en bloc a embarqué un fichier par accident. Demain :
   toujours énumérer, plus jamais « ajoute tout le dossier ». Un automatisme ne sera
   construit **que** si ça se reproduit. → *Mesure : zéro fichier hors-sujet dans les
   commits de livraison sur 5 sprints.*

5. **« Ne jamais clore une session avec un frigo vide. »** *(vérification de clôture)*
   Hier soir : plus aucune fiche prête — le prochain run autonome serait resté bloqué.
   Demain : le rituel de clôture vérifie qu'il reste **au moins 1 fiche prête par
   backlog** et te propose d'en préparer sinon. (Il propose — le tampon reste à toi.)
   → *Mesure : zéro run autonome démarré à sec.*

**Écartés en route** (tracés pour mémoire) : le script « branche absorbée » (doublon
d'un outil existant) · le hook git automatique (retiré par son auteur : un jugement ne
se scripte pas) · le champ structuré « dépendances » (trop lourd) · un point d'arrêt
supplémentaire dans le flux pour la doc (coût inutile) · les pannes du système de
sécurité (infrastructure, pas méthode).

---

## 6 · Ce que la cérémonie a montré (méta)

- Le **processus fonctionne** : les doublons ont fusionné, deux auteurs ont retiré
  leurs propres idées face aux arguments, le juge a évité une re-construction inutile.
- Chaque proposition est **rattachée à un fait vécu** et **mesurable** — donc
  *retirable* si elle ne prouve rien (principe : construire → prouver → retirer).
- Point d'amélioration de la cérémonie elle-même : la **restitution initiale au PO
  était trop jargonneuse** (codes internes R1/R2, sigles). Leçon retenue : la
  restitution suit les mêmes règles de clarté que les docs utilisateur. Ce document
  en est la correction.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1 · Vérifier avant de citer | ✅ Adoptée — **obligatoire** → règle `documentation-guidelines/proven-outbound-references` | 2026-07-18 |
| 2 · Prérequis au tampon « prête » | ✅ Adoptée → 4ᵉ slot (conditionnel) du gate `ready` d'ezk-backlog | 2026-07-18 |
| 3 · Doc utilisateur + relecture 3 profils | ✅ Adoptée — **recommandée** (SHOULD) → règle `user-guide` enrichie sur place | 2026-07-18 |
| 4 · Commits fichier par fichier | ✅ Adoptée → étape de livraison d'ezk-sprint | 2026-07-18 |
| 5 · Réserve de fiches prêtes en clôture | ❌ **Rejetée** — « on peut très bien arrêter la session en disant que le frigo est vide, et rouvrir une session d'idéation/grooming » | 2026-07-18 |

Le PO a de plus demandé **deux fiches** issues de la rétro elle-même :
- **0079** — graver la « restitution lisible au PO » dans les skills (la leçon du §6 ne
  doit pas vivre qu'en mémoire d'agent) ;
- **0080** — `ezk-retro` produit systématiquement ce type de compte rendu (le présent
  document devient le gabarit).

*(Rangement appliqué via la PR liée à cette capture.)*

## 8 · Glossaire

| Terme | En clair |
|---|---|
| **Backlog** | La liste ordonnée des choses à construire (les « fiches »). |
| **Fiche « prête » (ready)** | Une fiche assez précise pour être construite sans revenir vers toi : problème, valeur et critères d'acceptation posés. Le tampon « prête » est un geste du PO. |
| **DoR / DoD** | *Definition of Ready / Done* — la check-list qui définit « prête à construire » / « vraiment terminée ». |
| **Gate** | Un point de contrôle bloquant (ex. : le tampon « prête », les tests avant fusion). |
| **Ship / livraison** | Le moment où une fiche terminée est marquée livrée et archivée. |
| **PR (pull request)** | Une proposition de fusion de code, relue et testée avant d'entrer dans `main`. |
| **Squash-merge** | Fusionner une PR en un seul commit propre. |
| **Lentille** | Un agent qui regarde le même sujet avec un angle imposé (architecture, qualité, dev, produit). |
| **Juge de cohérence** | L'agent qui vérifie qu'une proposition ne contredit pas ou ne duplique pas une règle existante. |
| **MUST / SHOULD** | Niveau d'une règle : obligatoire / recommandé (contournable en le justifiant). |
| **Rétro (Sujet A)** | L'amélioration déclenchée *par l'humain* (cette cérémonie). Le « Sujet B », complémentaire, est l'amélioration déclenchée *par des mesures chiffrées* — pas encore construite (fiches 0044 racine et 0061 mega-city). |
