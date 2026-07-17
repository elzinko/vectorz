# Panel adverse — ADR-032 « émission = adaptateur séparable » (PROPOSÉ)

**Verdict : `revoir-en-profondeur`.** Les 4 lentilles convergent ; le juge confirme sur pièce en
corrigeant 4 sur-affirmations. **12 findings majeurs + 5 mineurs confirmés**, **4 rejetés**.
Ce n'est pas « corriger-puis-geler » : la **Décision**, la **table des options**, le **corollaire
BMAD** et le **critère du spike** changent tous. **La gravure elle-même reste au PO** — le panel ne
tranche pas « on grave ou pas ».

## Les 4 lentilles

| Lentille | Angle | Ce qu'elle a apporté |
|---|---|---|
| **architecte** | sens des dépendances, SRP, frontières | claim « DIP-correct » infondé côté surface observable ; Option C sans propriétaire de vocabulaire ; SRP de la carte (3 axes) ; le kit livré implémente l'Option A « rejetée » |
| **red-team** | falsifier la thèse, chercher le mensonge structurel | homme de paille de la table des options ; parade « golden events » qui ne couvre aucun de ses deux vecteurs ; champs typés non observables (injection) ; carte qui contourne le kit |
| **faisabilité-repo** | ce qui existe *vraiment* en fichiers | BMAD expose son point d'extension et cop1 l'utilise déjà ; aucune source BMAD vendorée ; poste d'observation supprimé par E4 ; `files_hash` non émis |
| **cohérence-corpus** | D8/D12/D13, ADR-021/028/030/031, fiches, carte vivante | D12 tronqué & inversé ; norme ADR-030:19-22 violée ; doublon 0048/0058 ; classe de conformité jamais nommée ; method-map ratifie un ADR proposé |

## Confirmés — les 3 qui ne se corrigent pas à la marge

1. **La table des options est bâtie contre un homme de paille.**
   ADR-032:76 « Marche pour BMAD ? **Non** (exigerait de réécrire BMAD) » est réfuté par le repo :
   `BmadBridgeService.ts`:26-71 injecte **déjà** des consignes dans les agents BMAD via le point
   d'extension que **BMAD documente** (`_bmad/_config/agents/bmm-dev.customize.yaml`:16-17), zéro
   source touchée — et pour cause : `find _bmad -type f` = 27 fichiers, **aucune source vendorée**.
   Le « ✅ RETENU » de l'Option B ne repose donc sur **aucune comparaison valide**. Corollaire : le
   critère du spike « 0 ligne de source BMAD modifiée » (ADR-032:65, 0048:28) est **VACUOUS** —
   l'overlay le satisfait aussi ⇒ **le spike ne peut pas trancher le pattern**.
   *Appliqué* : Option A′ (overlay natif) réintroduite avec la ligne honnête « **Oui, sans
   réécriture** » ; A/A′/B/B′ ré-évaluées sur le seul axe qui les sépare (**levier d'arrêt + statut
   D12**) ; aucun « RETENU » ; action item 4.

2. **Le payoff porte sur une moitié du contrat, et l'ADR ne l'écrit jamais.**
   `grep -niE 'classe|conformit|files_hash|resumed|arrêt|stop|D3|invariant'` sur l'ADR → **une seule
   ligne** (:93). Jamais l'arrêt au gate, jamais `gate.resumed`, jamais l'invariant, jamais la classe.
   Or capture:299-300 « `gate.reached` … la méthode **s'arrête ici (D3)** » ; capture:263-266
   « **écrire une ligne JSONL n'arrête aucun process** » ; capture:117-118 le fail-safe est **le trou
   unanime** du prior art ; `reduceState.ts`:156 (`state.activity_while_gate_open`) lève l'invariant
   mécaniquement.
   *Appliqué* : E2 — « **observabilité par enveloppe**, conformité partielle » ; tableau
   peut/ne-peut-pas ; **précision du juge** contre la forme absolue des lentilles : un adaptateur qui
   **PILOTE** détient le levier (`BMADSessionPort.ts`:52-59) — c'est la **formulation** d'ADR-032:59
   (« on lit ses sorties observables ») qui s'en prive, pas une loi de la nature ⇒ Option B′ ajoutée.

3. **L'ancrage inverse D12 sous couvert de généralisation.**
   ADR-032:8-11 « généralise D12 … **il ne l'étend ni ne le modifie** » cite le shim en laissant
   tomber « **de transition** », « **marqué legacy** », « **voué à disparaître** » **et la clause
   principale** « l'**émetteur canonique est fourni par la méthode** » (capture:249-252) — puis érige
   l'adaptateur externe en « RETENU » (:80-85) et disqualifie l'émission dans la méthode (:75-78).
   Geste que le jumeau **ADR-030:19-22 s'interdit explicitement** (« jamais comme autorités
   étendues »), et dont ADR-032:3 se réclame pourtant (« comme ADR-030/031 »).
   *Appliqué* : citation **intégrale** de D12 en en-tête ; **E0** pose les deux issues honnêtes
   (i) re-cadrage transition / (ii) « cet ADR RÉVISE D12 » ⇒ **arbitrage PO** ; **numérotation propre
   E1…E6** (norme ADR-030).

## Confirmés — les autres majeurs

| # | Finding | Appliqué |
|---|---|---|
| 4 | **Champs typés non observables au bord** — les dériver du texte = l'interprétation que D8 interdit, et rouvre le trou d'injection (capture:209-210, :300-301). Le kit ne l'a pas : types **en bande** (`runtime.ts`:219-225 ; `mcp-server.ts`:64) | **E3** : inférence sur contenu libre **INTERDITE** pour `outcome`/`escalation.type`/`upgrade_ok` ⇒ Option C ou source déterministe ; sinon events **exclus de toute policy de siège auto** |
| 5 | **`gate.resumed` n'est pas un moment observable** : réponse corrélée à un id que seul l'émetteur détient (`runtime.ts`:209-213, id produit par :198-201) ; en moniteur, **self-reported** (capture:305-309). Or c'est le **pivot de l'invariant** (capture:348-350) | **E4** : wrapper restreint aux moments **unidirectionnels** ; **synthèse INTERDITE** — sinon le compteur de violations est **structurellement à 0** et l'invariant redevient le « slogan invérifiable » corrigé le 2026-07-13 (capture:371-373). `method-map.md`:58 à corriger (AI 6) |
| 6 | **Le seul kit qui existe implémente l'Option A « rejetée »**, et l'ADR ne le dit jamais (`README.md`:33-36, :41-60) ; son modèle de menace présuppose même que **l'appelant EST la méthode** (`mcp-server.ts`:7-9) | Option A **nommée comme le chemin livré** ; section « Ce que cet ADR réviserait ». **2 précisions du juge** contre la lentille architecte : (a) « livré **et testé** » sur-affirmé — `__tests__/kit-emetteur.feature`:6 met les consignes **hors Gherkin** (runtime testé, template non) ; (b) `README.md`:35-36 = « **choix du propriétaire de la méthode** », pas un chemin imposé |
| 7 | **Le poste d'observation du corollaire est supprimé par E4** (`BMADSessionPort.ts`:52-59 → 0039:33-34, :37-38) ; `_bmad-output/` ne contient que du markdown, **aucun flux horodaté** ; et le repo a **déjà tranché l'inverse** : 0058:63-69 « BMAD **ÉMET** le contrat (kit 0050) … sans pilotage cop1 » | **Risque 1** + action item 2 : nommer le poste post-E4 **ou reconnaître qu'il n'y en a pas** ; confrontation explicite au re-scope PO |
| 8 | **« Conforme » sans jamais nommer de classe** (`grep -i classe` → 0), alors que le contrat l'EXIGE (capture:255-257) et que le corpus l'applique (`README.md`:11-12 ; ADR-028:90, :130) | Section « Classe de conformité » : **classe B + « fidélité du mapping non vérifiée ; invariant non vérifiable »**. Créer une 3ᵉ classe = **réouverture du gelé = PO** |
| 9 | **La parade « golden events » ne couvre aucun de ses deux vecteurs** : un golden test compare à une **fixture** en **dry-run** (0067:33-35) — il ne voit pas un non-arrêt ; et `seq` est calculé par **l'écrivain** (`journal.ts`:117) ⇒ un moment non observé **ne fait aucun trou** (capture:288 aveugle) | Risque 3 : parades **d'exécution** — (a) interdiction de synthèse ; (b) **`files_hash` exigé** dans `run.started` (capture:295, :357-358 ; **non émis** : `runtime.ts`:166-169). **Précision du juge** : `files_hash?` est **OPTIONNEL** ⇒ **renfort manquant, pas dette de conformité**. Golden test conservé comme garde-fou de **forme** |
| 10 | **« DIP-correct » faux côté surface observable** : concrétion **sans propriétaire, sans version, sans test** (prose :26-27 ; format à trancher :107) — et l'ADR nomme la conséquence 40 lignes plus loin (:96-97). Côté contrat l'abstraction existe (capture:285-291 ; `journal.ts`:21) | Section « constat, sans remède imposé » : (a) surface **déclarée/versionnée/possédée** ⇒ Option C **porteuse** et « contract-blind » → « **vocabulary-blind mais interface-aware** » ; ou (b) découplage **de VOCABULAIRE** assumé, gain = **indépendance de versionnement**. **Le juge ne choisit pas le remède** |
| 11 | **Personne ne nomme les moments (Option C)** ; les deux cas possibles réintroduisent le couplage ou tuent la garantie, alors que :83 revendique « Découplage Net » | Cas (a)/(b) **écrits et exhaustifs** ; (a) ⇒ carte livrée dans la **même PR** que la méthode + golden test = garde-fou d'**exécution** ; (b) ⇒ « contract-blind » **faux**. Choix = **PO** (AI 8) |
| 12 | **Doublon de backlog non réconcilié** : `grep 0058\|0050` sur l'ADR → **aucune occurrence** ; 0048 duplique 0058 **en plus pauvre** sans la citer (0058 : échelle graduée :25-34, prérequis « après 0050 verte » :38-39, « ADR au démarrage … tranché AVANT de coder » :43, journal-validator :44, trademark :48/:52-53 ; 0048:35 = « À définir au grooming »). Ignorance **unilatérale** : 0039:58-59 cite bien 0058 | 0050 et 0058 cités ; AI 3 (réconciliation + prérequis de séquencement). « Laquelle vit ? » = **PO** |

## Confirmés — mineurs

- **ADR-021 cité dans un état qu'il n'a pas** : `grep -niE 'event|évén|journal|jsonl|hexagon'` sur
  ADR-021 → **0 occurrence** ; il range même le MCP en « optionnel et différé » (:53-55) alors que le
  chemin nominal du kit **est** un MCP. La révision est **annoncée, pas écrite** (capture:389-390).
  ⇒ formule corrigée ; « hexagonal (ADR-021) » **retiré** de :85. **Note du juge** : **ADR-031:9
  porte la formule IDENTIQUE** — copier-coller de corpus, à corriger **aux deux endroits** (AI 7).
- **La carte vivante ratifie un ADR PROPOSÉ** (`method-map.md`:7, :62, :84 ; statut absent) **et met
  les noms d'OUTILS MCP dans la boîte « contrat · vocabulaire stable »** (:66 vs `mcp-server.ts`:40,
  59, 79, 96, 114 ; les vrais types sont en capture:294-324 — ADR-032:41 les utilise correctement).
  **Nuance du juge** : :79-85 porte bien un ⚠️ « État réel » — la carte n'est pas muette sur l'écart,
  elle ne dit simplement pas que **le pattern n'est pas tranché**. ⇒ AI 6.
- **Rien n'oblige la carte à passer par le kit** (:27 « écrit `events.jsonl` », sans invariant), alors
  que les garanties sont **du code** : `upgrade-ok.ts`:50-57 (« aucun paramètre qui force `true` ») ;
  `journal.ts`:107-123 (enveloppe/`seq`/`event_id`) ; `runtime.ts`:132-153 (confinement). ⇒ **E5** —
  la correction **la moins chère du lot**.
- **Action item 4 ambigu** — « trancher … **le schéma du contrat** qu'elle valide » rouvre le gelé par
  la bande (`journal.ts`:21 ; capture:289-290). ⇒ reformulé (AI 5).
- **SRP** — 3 axes de changement (version du contrat capture:385-388 / surface observable / **hôte
  d'émission** capture:253-257), que le kit sépare déjà (`README.md`:7-12). ⇒ **E6**.

## Rejetés (non appliqués)

1. **« 0048 choisit les 3 moments qui n'exigent aucun arrêt »** (architecte) — **factuellement faux et
   auto-contradictoire** : `gate.reached` est **précisément** le moment qui exige l'arrêt
   (capture:299-300). Le **défaut réel existe et est confirmé ailleurs**, mais il est autre :
   0048:27-28 compte des « **événements conformes** » (la **forme** des lignes), jamais un arrêt
   effectif, et **omet `gate.resumed`**.
2. **« Un wrapper externe ne peut PAS produire un `gate.reached` honnête » / « FAUX par
   construction » / conformité par enveloppe « structurellement fausse »** — **sur-généralisé**. Un
   adaptateur qui **PILOTE** détient le levier (`BMADSessionPort.ts`:52-59 ; 0058:28-29 revendique
   classe A, zéro ligne changée). Confirmé sous la **forme restreinte** (wrapper d'**observation**,
   celui qu'ADR-032:59 choisit), rejeté sous la forme absolue — **la nuance désigne la vraie faille**.
3. **« Un wrapper n'est ni A ni B ⇒ ADR-032 crée une 3ᵉ classe ⇒ il étend le gelé »** —
   **interprétation présentée comme un fait**. L'axe A/B (capture:255-257) oppose **machinerie
   déterministe** vs **bonne volonté d'un LLM** ; un adaptateur déterministe est du code, que le repo
   range en A (0058:29). Le vrai constat : l'axe est **sous-spécifié** pour la **fidélité d'un mapping
   tiers** — un trou, **pas** une extension. Le fait vérifiable (`grep -i classe` = 0) est **confirmé
   séparément**.
4. **« Aucun schéma du contrat n'existe en repo »** (faisabilité-repo) — **trompeur**. Le contrat a
   une forme normative (squelette v0.1 gelé, capture:272-362), une **URI versionnée**
   (`journal.ts`:21) et une forme **exécutable** (`products/cop1/packages/journal-validator/`,
   invariant en `reduceState.ts`:156). Ce qui manque, c'est un schéma **de la carte**
   (`emission-map`) — **c'est ça** qui rend 0067:31-32 invérifiable aujourd'hui. La lecture de
   cohérence-corpus est retenue ; celle-ci est rejetée.

## Ce qui survit

**L'émission EST séparable comme vocabulaire** — le contrat le dit déjà (capture:257-258) — et pour
une méthode qu'on **ne peut pas modifier**, un adaptateur externe peut produire la moitié
**observabilité**, jamais la moitié **fail-safe**. Mais ce noyau **est le shim que D12 admettait déjà
comme dette de transition** (capture:249-252), **pas** un pattern de premier ordre, et **pas** une
généralisation « sans rouvrir ».
