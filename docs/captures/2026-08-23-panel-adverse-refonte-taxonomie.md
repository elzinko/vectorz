# Panel adverse — refonte taxonomie / vocabulaire scrum / bundles (2026-08-23)

**En clair.** Trois attaquants indépendants (sans mémoire de session) ont attaqué le plan
de refonte porté par les fiches `20260823124042571` (taxonomie), `20260823124042708`
(bundles) et `20260823124042842` (vue d'avancement). Verdict du juge : **le plan initial
ne tient pas en l'état** — la fusion `ezk-session` et les deux nouvelles bandes sont
écartées ; survivent une séquence de petits pas dont le premier est de **réparer les
liens `composes:` manquants** pour laisser le critère mécanique trancher.

- Sujet cadré par : retours PO du 2026-08-23 sur la carte compilée (PR #162).
- Référence Scrum : Scrum Guide 2020 (scrumguides.org), récupéré le 2026-08-23.
- Attaquants : A = architecte adverse · B = puriste Scrum · C = pragmatiste YAGNI.
- Juge : session principale (synthèse ci-dessous, rapports verbatim en annexe).

---

## Verdict du juge, finding par finding

### Écarté — la fusion `ezk-session` (start + archive)

Tuée trois fois, pour des raisons indépendantes qui se cumulent :

| Attaque | Preuve |
|---|---|
| A-1 (P0) : **inexécutable aujourd'hui** | le binder ne sait pas retirer un skill renommé (`applyGlobalPlan` n'itère que le nouveau plan, amendement ADR-0020) ; le correctif est la fiche `20260813131737962`, toujours `idea`. Après re-bind, trois skills concurrents installés. |
| C-2 (P0) : **auto-contradictoire** | `ezk-archive` est aussi un AGENT ; fusionner le skill crée le « doublon sémantique » que la règle de nommage de la même fiche interdit. |
| A-5/C-1 (P0/P1) : **churn record** | ~105-116 fichiers touchés (mesuré), plus que le pire rename passé (`ezk-pr-pilot`, 63 fichiers, coût sous-estimé ×5). |
| A-6 (P1) : **gain nul** | scripts portiers distincts, verdicts distincts (CLEAR/ALERT vs CLEAN/DIRTY), politiques de délégation opposées ; aucune confusion utilisateur documentée. |

**Remplacée par** : deux phrases de doc croisée dans chaque SKILL.md (« ouverture ↔
clôture, voir l'autre »). Si une confusion réelle apparaît un jour, elle sera documentée
et la fusion re-proposable — après le correctif binder.

### Écarté — les deux nouvelles bandes (« Sessions & hôte », « Librairie »)

| Attaque | Preuve |
|---|---|
| A-2 (P0) : **la prémisse est fausse** | `ezk-sprint` déclare `composes: [… ezk-start]` — par le critère mécanique d'ADR-0020, `ezk-start` est de la MÉTHODE, pas de l'hôte. Le reclassement proposé contredisait le graphe compilé que la même session venait de livrer. |
| A-3 (P0) : **le critère mécanique meurt à 6 bandes** | « composé par aucune cérémonie » est un seul bit ; il ne peut pas départager 3 bandes non-cérémonie. Régression vers le défaut déclaratif d'ADR-0022. |
| C-4 (P1) : **3ᵉ refonte en 24 jours** | 3 bandes (30/07) → 4 (20/08) → 6 proposées (23/08). On rouvrait une décision jamais testée par l'usage. |
| C-3/A-10 (P0/P2) : **le critère « plus de hors-bande » coûte 5 lignes** | ajouter les 5 skills à la table 4-bandes existante suffit. |

**Remplacé par** : compléter les 4 bandes existantes (arbitrage PO par skill, éclairé par
le critère mécanique réparé), la table déplacée de `map-data.ts` vers **un YAML unique**
(option jugée strictement supérieure au frontmatter `bande:` par A-8 — le frontmatter
re-éparpillerait ce que PR #162 vient de centraliser, et contredirait « la bande se lit
mécaniquement » (C-5)).

### Retenu — prérequis : réparer les arêtes `composes:` manquantes

A-4 (P0) : le graphe compilé est **incomplet** — `skills/README.md` affirme
qu'`ezk-codex` est composé par `ezk-sprint` (étape 10) et `ezk-pr` (ship), mais aucun
des deux ne le déclare en frontmatter. Garbage in : la carte « fidèle par construction »
affiche fidèlement des bandes fausses. Déclarer les arêtes d'abord ; le critère mécanique
retrouve alors son autorité et tranche les rangements.

### Retenu (reformulé) — l'honnêteté du vocabulaire Scrum (rapport B)

B ne demande pas la conformité — il exige que les mots gardés disent vrai :

- **« Sprint » désigne un run mono-fiche sans timebox** (1 feature = 1 branche = 1 PR),
  pas le conteneur du Guide (B-1, P0). Renommer le skill serait un churn du type que C
  vient de tuer → on ne renomme PAS ; on **étiquette juste** (carte, prose).
- **« Scrum master » est revendiqué par ezk-sprint à contresens** (il exécute et juge ;
  le SM du Guide sert et établit Scrum) (B-2, P0) → débaptiser le persona dans la prose.
- **« La validation ≠ Sprint Review »**, doublement : merger n'est pas inspecter avec
  les parties prenantes, ET le flux nominal merge à l'étape 10 d'`ezk-sprint` — une
  fiche normale ne passe jamais par `ezk-pr` (B-3, P0) → l'étape 4 s'appelle
  « livraison (release gate) », et la carte le dit.
- **« DoD » recouvre deux choses** dans ezk-sprint (Gherkin = critères d'acceptation ;
  checklist de sortie = hygiène git) (B-4, P1) → réserver chaque mot.
- **Zéro Product Goal** dans tout le dépôt (B-5, P1) → une ligne en tête de `PLAN.md`.
- **« Plusieurs sprints en parallèle » = l'aveu que ce ne sont pas des Sprints** ; et
  `SPRINT.md` singleton est déjà corrompu par l'entrelacement (le fichier du sprint 0191
  contient une décision de la fiche /ezk-help) (B-6, P1). Deux issues : assumer le
  vocabulaire kanban (runs parallèles + limite de WIP), ou créer l'objet sprint.
  **C'est la pièce d'évidence qui déclenchera — ou non — sprint-as-data.**

### Retenu (réduit) — bundles et vue d'avancement

- Bundles : **seuls les 2 orphelins réels** (`documentation-guidelines`, `hexagonal`)
  se suppriment maintenant — `cop1-target` consomme les 8 autres miroirs (C-6), et
  `expand` **ignore silencieusement** les références inconnues : une migration ratée
  perdrait de LA LOI sans bruit (A-9). Le modèle thème/bundle attend sa douleur.
- Vue d'avancement : **lot 0 = board compilé depuis le frontmatter existant** (fiches ×
  priorité × statut, même invariant de test que la carte). Sprint-as-data attend que le
  board prouve le manque — avec B-6 comme pièce au dossier (C-7 : « le 4ᵉ système scrum
  d'un historique qui en a tué 3 »).

### Retenu (reformulé) — la règle de nommage

Telle que rédigée, elle naissait violée par ses propres exemples (« cérémonie → verbe » :
les 4 cérémonies sont des noms) (A-9) et un enforcement-audit par LLM ne bloque rien
pour un flux de création quasi nul (C-9). **Version retenue** : une règle DESCRIPTIVE
que le catalogue actuel passe, enseignée au point de création (chemin ezk-ezk /
skill-creator), vérifiée par steward en conseil, pas en blocage.

---

## Le plan par étapes (chacune : petite, réversible, apprend quelque chose)

| # | Geste | Taille | Ce qu'on apprend |
|---|---|---|---|
| 1 | **Déclarer les arêtes `composes:` manquantes** (ezk-codex ← sprint, pr ; balayage des autres écarts prose/frontmatter) puis `graph:check` + `map:data` | XS | ce que dit VRAIMENT le critère mécanique |
| 2 | **Compléter les 4 bandes** (5 skills arbitrés par le PO, table déplacée en YAML unique, 1 ligne d'amendement ADR-0020) | XS | le « problème de taxonomie » survit-il à une carte propre ? |
| 3 | **Vocabulaire honnête** : étiquettes de la carte corrigées (≈/≠, « livraison »), persona « scrum master » débaptisé, DoD vs critères d'acceptation séparés, Product Goal en tête de PLAN.md | S | la confusion baisse-t-elle sans aucun rename ? |
| 4 | **Doc croisée start ↔ archive** (2 phrases chacun) | XS | la confusion visée par ezk-session existe-t-elle encore ? |
| 5 | **Supprimer les 2 bundles orphelins** | XS | rien ne casse ⇒ thème/bundle peut attendre |
| 6 | **Board d'avancement lot 0** (compilé du frontmatter existant, zéro objet nouveau) | M | quelle donnée manque vraiment (sprint-as-data se décide LÀ) |
| 7 | **Règle de nommage descriptive** (le catalogue actuel passe ; enseignée à la création) | S | un garde-fou vaut-il mieux qu'une doctrine ? |

Jamais deux étapes en parallèle ; chaque étape se livre seule (PR ou commit dédié),
avec son arbitrage PO quand il y en a un (étape 2 : le rangement des 5 skills).

---

## Annexe — rapports verbatim

### Rapport A — architecte adverse

1. **[P0] La fusion `ezk-session` est inexécutable proprement aujourd'hui : le binder ne sait pas retirer un skill renommé.** Preuve : ADR-0020, amendement ⚠️ — `applyGlobalPlan` (`src/io/apply.ts:296-335`) n'itère que le nouveau plan ; le correctif est la fiche `20260813131737962`, toujours `status: idea`. Conséquence : après re-bind, `~/.claude/skills/ezk-start` et `ezk-archive` restent installés à côté d'`ezk-session` — trois descriptions déclenchantes concurrentes, soit exactement la confusion `ezk-pr-pilot`/`ezk-pr` que l'ADR documente. Le critère d'acceptation « les anciens noms redirigent ou sont retirés » repose sur une capacité non construite, et la fiche ne séquence pas cette dépendance.
2. **[P0] Le rangement d'`ezk-start` en « hôte LLM » contredit le graphe compilé que l'épic vient de livrer.** Preuve : `skills/ezk-sprint/SKILL.md:3` déclare `composes: [ezk-backlog, ezk-ci, ezk-commits, ezk-start]` — une cérémonie compose `ezk-start`. Par le critère mécanique d'ADR-0020 §1, c'est de la méthode. Conséquence : la fiche re-classe au jugement contre le signal machine ; soit le critère fait foi et la prémisse de la fiche est fausse, soit la fiche tue le critère.
3. **[P0] À 6 bandes, le critère mécanique meurt : « composé par aucune cérémonie » cesse de discriminer.** Preuve : ce prédicat devrait départager outillage / Sessions-hôte / Librairie — trois bandes, un seul bit. ADR-0020 §1 classait déjà les `supervision-*` en outillage par ce critère ; la fiche les déplace à la main. Conséquence : la bande redevient déclarative, exactement le défaut d'ADR-0022 que 0020 dit avoir corrigé. Régression doctrinale, pas une extension.
4. **[P0] Dériver la taxonomie « depuis les fichiers » compilerait du faux : le graphe `composes:` est déjà incomplet et déjà en désaccord avec la table.** Preuve : `skills/README.md:40` affirme qu'`ezk-codex` est « Composé par ezk-sprint (étape 10) + ezk-pr (ship) », mais aucun des deux ne le déclare en frontmatter ; et `ezk-archive` n'est composé par aucune cérémonie tout en étant rangé « Artefacts » dans la table officielle. Conséquence : garbage in — la carte « fidèle par construction » afficherait fidèlement des bandes fausses. Réparer les arêtes est un préalable, pas un détail.
5. **[P1] Le churn de la fusion dépasse le pire rename mesuré, sur un identifiant ambigu.** Preuve : `ezk-archive` = 78 fichiers / 183 occurrences + `ezk-start` = 27 / 55 (hors node_modules et done/), contre 63 / 194 pour `ezk-pr-pilot` — coût « sous-estimé d'un facteur 5 » (ADR-0020 §2). Et `ezk-archive` est à la fois un skill et un agent (modèle épinglé `claude-opus-4-8`) : un rename mécanique ne sait pas quelle occurrence désigne quoi, et la prose de symétrie se corrompt — piège déjà documenté. Conséquence : risque maximal pour un gain nul en comportement.
6. **[P1] La fusion n'achète rien de mesurable : c'est une concaténation de dossiers.** Preuve : scripts portiers distincts, vocabulaires de verdict distincts (CLEAR/ALERT vs CLEAN/DIRTY), politiques opposées (start ne délègue jamais ; archive délègue sur DIRTY à un sous-agent Opus épinglé), descriptions de 1155 et 657 caractères dont la fusion exploserait la surface de déclenchement ou en sacrifierait la moitié. Aucune fiche ne documente une confusion utilisateur entre les deux. Conséquence : « un skill, un cycle de vie » est un argument esthétique payé au prix fort.
7. **[P1] Les bandes cessent d'être une partition de skills, sans spec.** Preuve : la proposition range « (rôle) ezk-steward » dans Librairie alors que la bande Rôles = tous les agents ; et se plaint de l'agent `ezk-archive` « parmi les juges » — problème d'agent qu'aucune bande de *skills* ne résout. Conséquence : `Bande`, le test « chaque skill a une bande » et le rendu de la carte changent de forme, sans dire si un agent peut avoir deux maisons.
8. **[P1] L'option `bande:` en frontmatter re-éparpille ce que PR #162 vient de centraliser.** Preuve : 23 déclarations auto-attribuées, aucune vue d'ensemble en un diff, dérive non arbitrée, aucun garde-fou sur l'auto-classement d'un nouveau skill. L'option « YAML unique » est strictement supérieure — la table `BANDES` actuelle déplacée de `.ts` vers `.yml`. Conséquence : la fiche présentait comme équivalentes une bonne option cosmétique et une mauvaise option structurelle.
9. **[P2] La règle de nommage est morte-née telle que rédigée, et la fiche bundles traîne une machinerie pour un seul consommateur.** Preuve : « cérémonie → verbe de rituel » — les 4 cérémonies existantes sont des noms ; la règle naît violée par toute sa bande. Côté bundles : seul `cop1-target` cite les 8 miroirs non orphelins, les ids de thèmes sont identiques aux ids de bundles, et `expand` ignore silencieusement les références inconnues. Conséquence : nouveau kind de lien dans expand/graph/carte/tests pour un profil, avec un risque de LOI silencieusement perdue à la migration ; le 80 % : supprimer les 2 miroirs orphelins et laisser vivre.
10. **[P2] Les critères d'acceptation ne testent pas la refonte : « plus aucun skill hors bande » s'obtient en éditant 5 lignes.** Preuve : ajouter les 5 ids à la table `BANDES` existante suffit — sans nouvelle bande, sans fusion, sans frontmatter. Conséquence : la fiche ne peut pas prouver sa propre nécessité.

VERDICT : la proposition **ne tient pas en l'état** — seule la règle de nommage (reformulée) et la table complétée en un fichier unique survivent ; condition principale : aucune bande nouvelle ni fusion `ezk-session` tant que les arêtes `composes:` manquantes ne sont pas déclarées (le critère mécanique réparé tranchera le nombre de bandes) et que le binder ne sait pas retirer un skill renommé.

### Rapport B — puriste Scrum adverse

1. **[P0] « Sprint » désigne ici un pipeline mono-fiche sans timebox — l'inverse exact du conteneur du Guide.** Preuve : `ezk-sprint/SKILL.md` — invariant « 1 feature = 1 branche = 1 PR », « Périmètre borné par sprint (1 feature, POC) » ; la carte place « Le sprint » comme étape n°3 DU cycle, alors que le Guide fait du Sprint le conteneur de TOUS les événements. Ni timebox, ni sélection multiple, ni but distinct des items : du one-piece flow. → Renommer « run de fiche », ou re-fonder : le Sprint = la session (timebox réel) contenant plusieurs runs.
2. **[P0] Le titre « Scrum Master » est revendiqué par ezk-sprint, qui fait précisément ce qu'un SM ne fait pas — et personne ne porte « établit Scrum ».** Preuve : `ezk-sprint/SKILL.md:18` « Tu es le **scrum master** », l.29 « orchestration et **jugement** », étape 10 il squash-merge lui-même ; ezk-product-builder définit le SM comme « celui qui exécute un sprint » — contresens frontal. L'accountability réelle est éclatée entre rules/LA LOI, ezk-retro et ezk-start/archive. → Débaptiser le persona et assumer que le SM effectif = {LA LOI compilée + ezk-retro}.
3. **[P0] « La validation = Sprint Review » est fausse deux fois : ce n'en est pas une, et le modèle se contredit sur son emplacement.** Preuve : « La PR est testée puis squash-mergée » = release gate, pas une inspection de l'Increment avec parties prenantes ; ADR-0016:76 mappe la Sprint Review sur les étapes 6/9 d'ezk-sprint, pas sur ezk-pr ; et le flux nominal merge à l'étape 10 d'ezk-sprint — une fiche normale ne passe jamais par ezk-pr. → Renommer l'étape 4 « La livraison (release gate) » ; la seule Review réelle est le checkpoint inter-sprint.
4. **[P1] « Definition of Done » recouvre deux choses différentes dans le même fichier, dont aucune n'est la DoD du Guide.** Preuve : `ezk-sprint/SKILL.md:79` « scénarios Gherkin = la Definition of Done » (critères d'acceptation par item) vs l.148-154 une checklist de sortie incluant « squash-mergée » et « branche supprimée ». → Réserver « DoD » à la part uniforme (gate locale verte + E2E + revue GO), dire « critères d'acceptation » pour le Gherkin, sortir l'hygiène git de la DoD.
5. **[P1] Les engagements d'artefacts sont troués : zéro Product Goal, un Sprint Goal dégénéré, l'Increment jamais nommé.** Preuve : `grep -ri "product goal"` = 0 occurrence ; la table d'ADR-0016 omet Increment, DoD, les deux Goals et le Sprint lui-même ; le « but de sprint en une ligne » ≡ le titre de la fiche puisque sprint = 1 fiche. → Écrire un Product Goal en tête de `features/PLAN.md` ; assumer Sprint Goal ≡ fiche.
6. **[P1] « Plusieurs sprints en parallèle » (souhait PO) est l'aveu que ce ne sont pas des Sprints — et l'état du système ne sait déjà pas les représenter.** Preuve : le Guide fait du Sprint le battement unique d'une équipe ; ezk-start gère « worktrees parallèles » et « rejoindre le sprint en vol » ; `SPRINT.md` est un singleton racine déjà corrompu par l'entrelacement — le fichier « Sprint — 0191 » (2026-08-14) contient la décision ezk-pm de la fiche 20260816131704335 (/ezk-help, 2026-08-16). → Soit assumer le vrai nom (runs parallèles + limite de WIP : du Kanban, et c'est bien), soit créer l'objet sprint (id, dates, fiches) qui rendrait le parallélisme représentable.
7. **[P1] « Équipe scrum » : le Guide exige une équipe auto-gérée ; ici les rôles sont des sous-routines jetables que l'orchestrateur peut absorber.** Preuve : « leur contexte est jetable », « Si un sous-agent n'est pas installé, porte la casquette toi-même » ; les Developers n'assistent pas au « planning ». → Dire « pipeline à rôles convoqués » ; la vraie valeur — seconde opinion inter-modèles — n'a pas besoin du mot « équipe ».
8. **[P2] « Sprint Retrospective » : l'événement qui conclut CHAQUE Sprint est devenu une cérémonie à la demande.** Preuve : carte « Après un ou plusieurs sprints » ; frontmatter ezk-retro « déclenchée À LA DEMANDE » ; ADR-0016:77 étire la case jusqu'au handoff ezk-archive. → « Rétro de méthode (à la demande) », ou câbler une cadence (esprit du review-tous-les-5-sprints d'ADR-0016 §4).
9. **[P2] « Sprint Planning » : les trois questions du Guide reçoivent trois réponses dégénérées — mapping nominal, pas réel.** Preuve : Pourquoi ≡ titre de fiche, Quoi = pop mécanique d'UNE fiche, Comment = pipeline fixe ; capacité = budget tokens. C'est du replenishment Kanban de qualité (gate DoR + soupape PO journalisée — à garder) sous un faux nom. → Le mot maison « tirage » est déjà honnête ; retirer la glose « Sprint Planning » de la carte.
10. **[P2] Hygiène du vocabulaire : le seul objet nommé « daily » du modèle compilé est un profil de binding ; le bandeau « la méthode scrum d'abord » cadence par le scope.** Preuve : profil `daily` homonyme du Daily Scrum absent ; le Guide cadence par le temps. À créditer : ezk-steward et ezk-archive déclarent « pas un rôle scrum ». → Renommer le profil `daily`, bandeau « inspiré de Scrum ».

VERDICT : partiellement trompeur — le socle backlog (fiches, DoR, groom, ordre) est mappé honnêtement, mais les cinq mots porteurs (Sprint, Scrum Master, Sprint Review, DoD, équipe) sont gardés avec un autre sens ; correction n°1 : re-fonder « sprint » — le renommer « run de fiche », ou en faire le vrai conteneur — et les autres étiquettes retomberont juste d'elles-mêmes.

### Rapport C — pragmatiste YAGNI adverse

1. **[P0] La fusion `ezk-session` est un rename plus gros que le pire déjà mesuré, pour zéro comportement nouveau.** Preuve : `ezk-archive` = 87 fichiers / 192 occurrences, `ezk-start` = 29 / 56 — `ezk-archive` seul dépasse `ezk-pr-pilot→ezk-pr` (63 / 194), coût sous-estimé ×5, renames passés ayant corrompu des textes comparant deux noms. Conséquence : des jours de churn pour renommer deux skills qui marchent.
2. **[P0] La fiche taxonomie viole sa propre loi de nommage.** `ezk-archive` est aussi un agent (cible de délégation du skill). Fusionner le skill en `ezk-session` sans toucher l'agent crée le « doublon sémantique » que le point 3 de la même fiche interdit ; toucher l'agent aussi double le churn. Conséquence : livrables 2 et 3 de la fiche s'annulent.
3. **[P0] « Hors bande » n'est pas un bug, c'est un choix écrit dans le code.** `map-data.ts:23-24` : « le bruit doit se voir, pas se lisser ». Le critère « plus aucun skill hors bande » s'atteint en ajoutant 5 chaînes à la table existante + 1 ligne d'amendement ADR-0020. Conséquence : on paierait 100× le prix d'un critère atteignable en une édition de table.
4. **[P1] Troisième refonte de taxonomie en 24 jours.** 3 bandes (30/07) → 4 (20/08) → 6 proposées le 23/08. L'histoire locale documente le mode d'échec : deux décisions concurrentes = zéro décision, noms fantômes pendant 3 semaines. Conséquence : on rouvre une décision avant qu'aucun usage ne l'ait testée.
5. **[P1] Le frontmatter `bande:` contredit le principe acté il y a 3 jours.** ADR-0020 : « la bande se lit mécaniquement, elle ne se décrète pas ». Conséquence : deux sources de vérité concurrentes — la panne que l'ADR décrit lui-même.
6. **[P1] Supprimer les bundles-miroirs casse un consommateur vivant.** `profiles/cop1-target.yml` cite 8 des 10 miroirs ; seuls `documentation-guidelines` et `hexagonal` sont orphelins. Le PO a dit « laisser vivre » et la fiche s'auto-déclare « pas une urgence ». Conséquence : du code neuf dans `expand` + migration de profil pour une douleur que personne n'a.
7. **[P1] Sprint-as-data = le 4ᵉ système scrum d'un historique qui en a tué 3.** ADR-0013 : « risque n°1 : la surproduction de méta-outillage… trois systèmes scrum parallèles » abandonnés. La fiche en fait « le vrai premier lot » — le morceau le plus risqué en premier. Or le board se compile depuis le frontmatter existant : `BACKLOG.md` est déjà auto-généré dessus.
8. **[P2] Aucune des 3 fiches ne touche la douleur mesurée.** 135 fiches actives, 80 idées, 43 todo de médiane créée le 2026-07-15. Le plan en ajoute 3. Conséquence : on réétiquette les rayonnages pendant que le stock pourrit.
9. **[P2] La règle de nommage « enforced par ezk-steward » ne bloque rien.** Les skills naissent via ezk-ezk→skill-creator, à qui ADR-0020 confie déjà d'« enseigner des noms qui existent ». Un enforcement par agent LLM = arbitrages de faux positifs pour un flux de création quasi nul.
10. **[P2] La fiche 1 empile 5 livrables** plus un panel en prérequis. Conséquence : une fiche ingroomable qui restera `idea`, comme les 80 autres.

SÉQUENCE MINIMALE : 1. Bander les 5 hors-bande dans les 4 bandes existantes (5 chaînes + 1 ligne ADR, arbitrage PO). 2. Croiser start/close par la doc, pas par le rename. 3. Board lot 0 sur les données existantes (zéro objet nouveau). 4. Supprimer les 2 bundles réellement orphelins. Supprimé/reporté : les 2 nouvelles bandes, la fusion, la migration frontmatter, sprint-as-data, la suppression des 8 miroirs consommés, le sucre `theme:`.

VERDICT : Ce plan re-remue une structure stabilisée il y a trois jours pour des problèmes d'esthète, alors que 5 lignes de table, 2 phrases de doc et un board sur données existantes atteignent l'essentiel des critères — tout le reste doit attendre une douleur prouvée.
