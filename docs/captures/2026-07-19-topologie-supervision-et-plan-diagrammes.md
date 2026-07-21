# Topologie de supervision — analyse, corrections, et plan de diagrammes

**Date** : 2026-07-19 · **Origine** : questions PO (« installe-t-on vectorz dans un
projet ? », « un monitoring par projet ou un seul superviseur mutualisé ? », « il me faut
les diagrammes d'architecture standard »).

**Méthode** : atelier multi-agents — 4 lecteurs-enquêteurs sur les pièces du dépôt, un
architecte (options + plan de diagrammes), un **vérificateur adverse** qui a contrôlé
chaque citation sur pièce. Verdict du vérificateur : **fiable avec corrections** — 8
citations fausses et 7 affirmations non sourcées relevées, toutes intégrées ci-dessous.

> ⚠️ Cette capture consigne une **analyse**, pas une décision. Les arbitrages listés en
> §5 appartiennent au PO.

---

## 1. Corrections d'abord (ce qui était faux dans l'analyse initiale)

Ces points ont été affirmés puis **réfutés sur pièce**. Ils sont consignés en tête parce
que plusieurs circulaient déjà dans les échanges.

| Affirmation réfutée | Réalité constatée |
|---|---|
| Les fichiers matérialisés dans le projet cible portent un **en-tête « généré par mega-city @version » et un pin de version** | **Aucune occurrence dans le code.** `src/caps/claude-code.ts` écrit un en-tête sans version ; aucun numéro n'est émis nulle part. La phrase vient d'ADR-021 §Synchronisation, qui précise lui-même « Phasage (aucune implémentation dans cet ADR) », et vise un cap cop1 **qui n'existe pas** dans `src/caps/`. |
| Le kit émetteur fait **~85 lignes** (script ~50 + consignes ~15 + hooks ~20) | Le kit livré fait **583 lignes** (`journal.ts` 127 + `mcp-server.ts` 158 + `runtime.ts` 241 + `upgrade-ok.ts` 57). Aucun « script d'append autonome » n'existe. Le chiffre ~85 désigne, dans la fiche mega-city 0050, le **coût d'adoption** — pas la taille du kit. |
| Les **hooks** font partie du périmètre livré | Non : fiche mega-city 0077 en `todo`, sans PR. La fiche 0050 les sort explicitement en fiche de suite. |
| Plafond dur de **512 travaux supervisés** | C'est un plafond de **surveillance instantanée** (protection contre l'épuisement de descripteurs de fichiers). Au-delà, les travaux restent **découverts** et rattrapés par le rescan de 30 s. Ce n'est pas une limite de capacité — l'argument contre le mutualisé était surévalué. |
| `.supervision/` est **gitignoré d'office** | C'est une **règle écrite** (fiche 0030, capture du 14/07), pas un état constaté : aucun `.gitignore` du dépôt ne contient `supervision`, et le kit n'écrit aucune entrée. |
| Le lecteur de journal est **shippé** (fiche racine 0031, PR #2) | Le front-matter dit `shipped`, mais **les six critères d'acceptation sont non cochés**. Le dépôt a par ailleurs un piège documenté sur les numéros de PR pré-subtree — le « #2 » mérite vérification avant d'être cité comme preuve. |
| Le MCP est une dépendance « optionnelle et différée » (ADR-021 point 6) | **Citation périmée** : la décision D12 (13/07) dit « le MCP émetteur est le chemin nominal pour Claude Desktop » ; la fiche 0050 le note « dé-parqué le 2026-07-14 » ; c'est l'étape 1 de la fiche 0030. |
| « Le projet cible doit tourner même si mega-city est absent » (ADR-021) | ADR-021 dit cela de **cop1**, pas d'un projet cible quelconque — et **D5 révise** la formule : « cop1 exige UNE méthode valide implémentant le contrat ; config invalide ⇒ arrêt immédiat au démarrage ». |

Deux lacunes de sourcing également relevées : **ADR-028** (lecteur de journal en mode
moniteur) n'était cité nulle part alors qu'il gouverne le sujet ; et la **borne écrite
Q3** (« une instance, un projet — multi-projets explicitement hors périmètre ») couvre
littéralement le « pas 2 » recommandé plus bas, ce que l'analyse initiale passait sous
silence.

---

## 2. « Installe-t-on vectorz dans un projet ? »

**Non.** Rien ne s'installe au sens d'un moteur embarqué. Deux choses seulement
atterrissent dans le dépôt cible :

1. **Au moment du déploiement** — des fichiers de configuration natifs de l'hôte :
   `.claude/agents/*.md`, `.claude/skills/*.md`, un fichier d'entrée de règles, un bloc
   managé dans `CLAUDE.md` (le reste préservé), des hooks posés seulement s'ils
   n'existent pas. Ils sont **commités dans le dépôt cible**. Le lien vivant (symlink)
   est explicitement rejeté par ADR-021 : dépendance recopiée, pas suivie.
   ⚠️ **Sans marque de version aujourd'hui** (cf. §1) : le modèle « une version par
   projet » est la doctrine, pas encore la réalité.
2. **Au moment d'un travail** — un dossier de journal `<projet>/.supervision/runs/<id>/`,
   créé dans l'arbre principal du projet.

**Formule exacte** : on n'installe pas vectorz dans un projet — on **matérialise dans le
projet la sortie d'une version donnée de vectorz**, et on y laisse un journal. Le projet
cible n'a aucune connaissance de vectorz à l'exécution : le point de contact est un
**format de fichiers**, pas une interface logicielle.

---

## 3. Quatre topologies

| | Ressources | Ce qui existe déjà |
|---|---|---|
| **A. Tout par projet** — chaque projet a son superviseur complet | N processus résidents, N ports, N configs, N redémarrages (mais **chacun à sa fenêtre sûre** — un avantage) | **Tout.** C'est le mode supporté aujourd'hui et celui du MVP démo (fiche 0030) |
| **B. Émission par projet + LECTURE mutualisée** | 1 processus, 1 port, 1 config. Coût dominé par la surveillance de fichiers ; l'état vit dans les projets, pas dans le superviseur | **L'essentiel du chemin de lecture** : la liste de dossiers surveillés est déjà un tableau, le lecteur prend déjà plusieurs racines, chaque instantané porte déjà son projet d'origine |
| **C. Tout mutualisé** — un pilote central qui lance/héberge N applis | Un chantier de développement, pas un réglage : registre de projets, politique par projet, concurrence sur les commandes, matrice de compatibilité de versions | **Presque rien.** Tout le pilotage est mono-projet en code |
| **D. Zéro superviseur résident** — journal seul, lecture à la demande | Aucune ressource permanente | **C'est le défaut actuel** : la liste surveillée est vide par défaut, donc la supervision est dormante tant que personne n'active rien |

**Le déblocage : la question se tranche rôle par rôle** (décision D13 — lanceur,
moniteur, siège) :

- **Lire (moniteur)** — mutualisable presque gratuitement : il ne fait que lire, il n'a
  aucun levier d'exécution. Manque **une seule fiche d'interface** : afficher et
  regrouper par projet. (Le projet d'origine est présent dans les données du front mais
  n'est jamais rendu — c'est un composant déclaré à l'intérieur d'un seul fichier de vue.)
- **Lancer / tenir le siège** — à garder par projet : code explicitement mono-projet,
  et les mutualiser rouvre le versionnement, la config par projet et le rayon de panne.

**Limites constatées du mutualisé (B)** : liste plate sans regroupement tant que l'UI
n'est pas faite ; seuil de « présumé mort » global au superviseur, donc pas de politique
par application ; et un redémarrage de mise à jour **commun à tous** les projets
surveillés (conséquence de D1 : jamais de migration à chaud).

---

## 4. Trajectoire recommandée (par l'architecte — à arbitrer)

- **Pas 1** — ne rien changer : finir le MVP démo en topologie A. La borne écrite « une
  instance, un projet » tient tant que le bout-en-bout n'est pas prouvé.
- **Pas 2** — mutualiser **le moniteur seulement**, dès qu'un 2ᵉ projet existe. Aucune
  architecture nouvelle ; une fiche d'UI. ⚠️ Ce pas est **littéralement ce que la borne
  Q3 déclare hors périmètre** — l'ouvrir est donc un arbitrage de périmètre produit,
  pas une question de faisabilité.
- **Pas 3** — ne **pas** mutualiser le lanceur ni le siège.
- **À refuser explicitement pour l'instant** : la topologie C. Rien n'existe, elle va à
  contre-courant de la doctrine (statique, versionné, zéro runtime partagé), et elle
  suppose un registre de projets inexistant (cf. fiche mega-city 0082). Si le PO la veut,
  elle mérite **son propre ADR et son propre panel** — pas un glissement par accumulation
  de réglages.

---

## 5. Arbitrages qui appartiennent au PO

1. Accepte-t-on de trancher **rôle par rôle** plutôt qu'en bloc ?
2. Ouvre-t-on le multi-projets **maintenant**, ou tient-on la borne écrite jusqu'à ce que
   la démo soit verte de bout en bout ?
3. **Qui déclare** la liste des projets supervisés ? (invariant proposé : l'humain édite,
   jamais le modèle, jamais une auto-découverte du disque — cf. fiche 0082)
4. Veut-on un **registre central** projet → version → méthode ? Il n'existe pas.
   (`portfolio.sh` est un faux ami : il agrège deux backlogs internes du dépôt, pas des
   projets clients — mais son motif est le bon germe.)
5. Accepte-t-on que mettre à jour un superviseur partagé impose **un redémarrage pour
   tous** les projets qu'il surveille, à un moment où aucun n'est en vol ?
6. Finance-t-on la **fiche d'interface** (affichage/regroupement par projet) ? Sans elle,
   un lecteur mutualisé donne une liste illisible dès 2 projets.
7. Seuil de « présumé mort » : **global** au superviseur (aujourd'hui) ou **par projet**
   (chantier nouveau) ?
8. **Vocabulaire** : garde-t-on le mot « héberger » ? En mode moniteur, le superviseur ne
   lance ni n'héberge aucune application — il **lit des journaux**. « Héberger N applis »
   est un produit différent, non couvert par les fiches actuelles.

---

## 6. Plan de diagrammes (corrigé)

Sept vues, **une question par vue**, 4 à 7 boîtes chacune. À dessiner **après** l'arbitrage
de topologie — dessiner le détail avant de trancher la structure, c'est documenter du faux.

| # | Vue | La question à laquelle elle répond |
|---|---|---|
| 1 | **Contexte** (flowchart) | Qui parle à qui, et où passe la frontière du produit ? *(la réponse visuelle à « installe-t-on vectorz ? »)* |
| 2 | **Conteneurs** — une instance, un projet (flowchart) | Quels processus tournent pendant un travail, et **lequel écrit quoi** ? *(un seul écrivain par fichier ; annoter la classe de conformité)* |
| 3 | **Composants du kit émetteur** (flowchart) | Comment une méthode devient supervisable **sans dépendre du superviseur** ? |
| 4 | **Composants du superviseur** (flowchart) | Par où passe un événement, du fichier à l'écran — et **qu'est-ce qui est mono-projet aujourd'hui** ? *(colorier : vert = déjà multi-projets (lecture), rouge = mono-projet (pilotage))* |
| 5 | **Déploiement A vs B** (deux sous-graphes côte à côte) | Combien de processus, de ports et de configs selon la topologie ? |
| 6 | **Séquence — vie d'un travail supervisé** | Que se passe-t-il dans l'ordre, et **où l'humain intervient-il** ? |
| 7 | **Séquence — adoption d'une version** | Comment change-t-on de version **sans jamais casser un travail en cours** ? |

**Corrections à appliquer en dessinant** (relevées par le vérificateur sur le plan
initial) :

- Vue 3 : le **serveur MCP doit y figurer** — il était omis alors qu'il est livré, qu'il
  est l'étape 1 du MVP, et qu'il porte la propriété centrale citée (la racine du projet
  est fixée à l'initialisation du serveur, jamais en paramètre d'outil).
- Vue 3 : **ne pas chiffrer le kit à ~85 lignes** (c'est 583 ; ~85 est le coût
  d'adoption) et **ne pas présenter les hooks comme livrés**.
- Vue 4 : le plafond de surveillance est un plafond de **watchers simultanés**, pas de
  capacité — l'annoter correctement.
- Vue 4 : citer **ADR-028**, qui gouverne le lecteur en mode moniteur.
- Vue 1 : ne pas afficher de **pin de version** dans les fichiers matérialisés (il
  n'existe pas) — ou l'afficher explicitement comme *cible non implémentée*.

---

## Références

Captures : `2026-07-13-contrat-methode-et-versions.md` (D1, D2, D5, D11, D12, D13, Q3),
`2026-07-14-revue-groupe-deux-sieges.md` (étape 0, DP1, DP6, DP7).
ADR : 021 (frontière d'intégration), 025 (monorepo), 027 (parapluie), **028** (lecteur en
mode moniteur).
Fiches : racine 0030 (MVP démo, en cours), 0031 (lecteur — statut à vérifier), 0038 (E3),
0050 (release + pastille) ; mega-city 0050 (kit émetteur, livré), 0058 (2ᵉ méthode), 0077
(hooks, à faire), 0078 (installation un-clic), **0082** (registre de supervision).
