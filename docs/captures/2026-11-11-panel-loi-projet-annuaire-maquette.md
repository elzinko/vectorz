---
type: panel
date: 2026-11-11
theme: "Maquette mission control : la page Loi devient une page du projet, les définitions de la méthode vont dans un Annuaire"
scope: "demande du PO sur la maquette (fils du 11 nov., 10:23 et 10:27) ; panel adverse en trois lentilles (architecte de la méthode, PO, architecture d'information), deux juges adverses (PO, gardien de la méthode), une synthèse ; aucune règle proposée, rien de committé"
participants: [architecture, produit, ux, po, methode]
---

**En clair :** La page Loi entre dans le menu de chaque projet, juste après Process. Elle ne garde que ce qui se règle pour ce projet : les 27 règles en vigueur, l'état des 11 paquets de règles (la ligne DoD quitte Configuration pour venir ici), et les boutons pour appliquer ou changer ce choix. Tout ce qui définit la méthode (skills, agents, catalogue des 96 règles, profils, commandes, glossaire) part dans une page « Annuaire de la méthode », atteinte par le menu et par un bouton en mots en haut de la page Loi ; le « i » reste une explication, jamais un lien. Les outils ne se règlent pas par projet : nous l'avons vérifié dans le code, et ce que tu veux régler « comme les plugins » s'appelle déjà Plugins dans Configuration. Plusieurs boutons de la page Loi restent grisés tant que la méthode ne publie pas les commandes qui les font marcher (ajouter une règle ou un paquet, connaître le profil lié).

## 1 · La demande

Le PO veut la Loi dans le menu de chaque projet, comme Process, et une page qui ne garde que ce qui se règle pour le projet (règles, paquets et DoD, outils selon lui). Les définitions (skills, agents, commandes, glossaire) partent dans une page à part. Il laisse ouverts : les paquets et profils, les agents (loi ou configuration ?), et demande un panel adverse.

## 2 · Les cinq points tranchés

- **agents** — La définition d'un agent (rôle, règles lues au démarrage, règles vérifiées, convoqué par quel skill) va dans l'annuaire (onglet Agents, page Agent, sans colonne modèle) ; son réglage pour ce projet (niveau, modèle, effort, réglé par) reste dans Configuration › Équipe, seul endroit avec un crayon ; la page Loi ne montre un agent que dans la colonne « Vérifiée par », et la page Agent ne porte qu'un lien « Réglé dans Configuration › Équipe » à la place du bloc à crayon.
- **paquets** — Une seule table des 11 paquets, sur la page Loi du projet, avec l'état de chacun ici (installé par la loi / choisi par le projet / lu au démarrage par … / disponible), la colonne « Réglé par » et des boutons Ajouter / Retirer marqués à publier ; la ligne DoD remplace celle de Configuration › Qualité ; la définition d'un paquet vit sur sa page d'objet Paquet (la page DoD généralisée), atteinte par son nom ; pas d'onglet Paquets dans l'annuaire.
- **profils** — Annuaire seulement : un onglet « Profils · 6 » (table courte : hôte, paquets, agents, skills, règles) et une page Profil, sans aucune action ; sur la page Loi, une seule ligne d'en-tête « déployée par le profil … », marquée à publier parce que ni bind ni ENTRY.md n'enregistrent le profil lié.
- **outils** — Les 113 outils ne se règlent pas par projet (vérifié : aucune clé de .vectorz/config.yml, rules.yml ou dor.yml ne touche un script ; ce sont des nœuds calculés depuis bin/*.ts et skills/*/scripts/*.sh), donc rien sur la page Loi ; l'onglet Outils disparaît, le script devient la colonne « Script » de l'onglet Commandes (filtre « scripts internes » pour les 113) et la section « Lance » de la page Skill, sous le mot « Scripts » jamais « Outils » ; ce que le PO veut régler « comme les plugins » s'appelle déjà Plugins et reste dans Configuration.
- **acces** — « Loi » entre dans le menu du projet juste après Process (titre « Loi — <projet> ») ; « Annuaire » remplace « Loi » dans le groupe « Méthode mega-city » (titre « Annuaire de la méthode ») ; on l'atteint aussi par un bouton en mots « Annuaire de la méthode → » dans l'en-tête de la page Loi, par le nom de chaque objet (règle, paquet, agent, skill) qui mène à sa page, et par la recherche globale ; le « i » reste une explication au survol, jamais une navigation.

## 3 · La page Loi du projet

Entrée de menu « Loi », placée juste après « Process » dans le menu du projet. Titre de page « Loi — vectorz », fil d'Ariane Projets › vectorz › Loi. Même panneau pour chaque projet, comme Process. Pas de sous-titre : le « i » du titre dit que la loi globale du poste est lue dans toutes les sessions, que cette page ne montre que ce qui s'ajoute ou se durcit ici, que les 17 règles lues au démarrage tiennent au poste tant que le profil lié n'est pas publié, et que les scripts de la méthode ne se règlent pas par projet (ce qui se règle est dans Configuration › Plugins).

### Ce qui s'applique ici (en-tête)
- Contenu : Quatre compteurs cliquables qui filtrent la table Règles : « 27 règles en vigueur » (10 installées + 17 lues au démarrage + 0 propres au projet) · « Loi installée : oui · 10 règles » · « Règles propres au projet : 0 » · « Paquets choisis par le projet : 0 ». Une ligne d'état du contrat du projet : valide / N erreurs / appliqué ou à appliquer. Une ligne « déployée par le profil … · à jour / à recompiler » (dessinée, marquée à publier). Pas d'empreinte ni de commit dans le corps : ils vont derrière le « i ». Remplace la ligne « Loi installée · 10 règles » de Configuration › Projet, qui disparaît (déplacée, pas copiée).
- Source : ezk law show --json --root <projet> (contrat law-show v1 : lois.projet.installee, comptes.partout / projet / demarrage) · ezk rules show --json --root <projet> (règles locales, paquets choisis, commit, empreinte ; commande publiée, contrat non versionné : à contractualiser) · à publier : le profil lié et la fraîcheur (ezk law status --root <projet> --json, prérequis : bind estampille ENTRY.md), les erreurs du contrat (ezk rules check --json).
- Actions : « Appliquer le contrat » (infobulle : ezk rules apply --root <projet> ; verbe réel, avec confirmation) · « Contrôler le contrat » (ezk rules check --root <projet> ; verbe réel) · « Mettre à jour la loi » (ezk law bind <profil> <projet> ; dessiné inactif tant que le profil lié n'est pas publié) · « Annuaire de la méthode → » (bouton en mots, ouvre la page Annuaire).

### Règles — en vigueur sur ce projet
- Contenu : La table principale, 27 lignes, avec en tête le compteur « 27 ici · 96 au catalogue → » (le lien ouvre l'onglet Règles de l'annuaire). Colonnes : Règle (→ page Règle) · Niveau MUST/SHOULD · Réglé par (méthode / profil lié / ce projet) · D'où (installée · lue au démarrage par /ezk-sprint … · propre au projet) · Paquet (→ page Paquet) · Garantie (gate du projet / revue liée / conseil ; « méthode » pour une règle de la méthode) · Vérifiée par (→ page Agent). Filtres : d'où · paquet · catégorie · niveau. Les 69 règles du catalogue sans effet n'apparaissent pas ici : elles sont une dette de la méthode, visible dans l'annuaire. Une règle propre au projet est une ligne de cette table, pas une section à part. Une règle de la méthode n'a pas de crayon ; son « i » dit qu'elle se change dans la méthode, par une rétro.
- Source : ezk law show --json --root <projet> (regles[] filtrées sur portee ∈ {partout, projet, demarrage} ; appliqueePar, verifieePar, bundles) · ezk rules show --json --root <projet> (origin global|local, guarantee gate|review|advisory par règle ; à contractualiser contracts/rules-show/v1 avant de brancher la colonne Garantie) · à publier : les titres en clair en français (plusieurs titres publiés sont en anglais).
- Actions : « Ajouter une règle du projet » (écrirait .vectorz/rules/<id>.md et son binding dans .vectorz/rules.yml ; à publier : ezk rules add, aujourd'hui check / show / apply seulement ; dessiné inactif) · sur une règle propre : « Modifier » (ouvre le fichier) et « Retirer » (à publier) · « Catalogue complet · 96 → » (annuaire, onglet Règles).

### Paquets — leur état sur ce projet
- Contenu : Une seule table des 11 paquets, avec l'état de chacun ici. Colonnes : Paquet (→ page Paquet) · Règles (n) · Réglé par (profil lié / ce projet / méthode) · État ici (installé par la loi · choisi par le projet · lu au démarrage par ezk-dev, ezk-reviewer · disponible) · action. Pour vectorz : base = installé par la loi (10 règles) ; dod = lu au démarrage, « DoD · 5 règles · commun à tous les projets · appliqué par ezk-dev, contrôlé par ezk-reviewer », ouvre la page DoD dont le fil d'Ariane devient vectorz › Loi › DoD ; les 9 autres = disponible. Cette ligne dod remplace la ligne « DoD · 5 règles » de Configuration › Qualité, qui ne garde que ses deux interrupteurs (revue adverse, gate de release) ; le « i » de « Revue adverse » nomme la DoD et y mène. Le « i » de la table dit : le projet ajoute et durcit, il ne desserre jamais un MUST global (ADR-0050) ; chaque paquet ajouté se paie en jetons à chaque session (ADR-0056) ; les lignes « disponible » sont là pour pouvoir choisir.
- Source : ezk law show --json --root <projet> (objets[type = bundle].regles ; regles[].bundles et portee ; appliqueePar via bundle:<id>) · ezk rules show --json (bundles choisis) · à publier : les paquets posés par le profil lié (même trou que le profil).
- Actions : « Ajouter » sur un paquet disponible / « Retirer » sur un paquet choisi (écriraient bundles: de .vectorz/rules.yml ; à publier : ezk rules bundles add|remove ; dessinés inactifs) · dod et base : aucune action, paquets de la méthode ou du profil (ADR-0071). « Appliquer le contrat » de l'en-tête rend le choix effectif.

## 4 · L'Annuaire de la méthode

Entrée de menu « Annuaire » dans le groupe « Méthode mega-city », à la place de l'actuelle entrée Loi. Titre de page « Annuaire de la méthode », fil d'Ariane Méthode mega-city › Annuaire › <onglet> › <objet>. Vocabulaire fixé : « Annuaire » pour les définitions de la méthode, « Catalogue » reste aux recettes, « Scripts » partout où l'on disait « Outils ». Écartés : « Catalogue » (pris), « Documentation » (connote la prose), « Référence » (vague). Six onglets (Skills, Agents, Règles, Profils, Commandes, Glossaire), un onglet Documents en dernier, et un bloc compact « Santé de la méthode » en bas de page. Plus d'onglet Paquets (la table vit sur la page Loi, la définition sur la page Paquet) ni d'onglet Outils.

### Skills · 26
- Contenu : Table : skill (→ page Skill) · ce qu'il fait (une phrase) · étage (méthode / module et sa famille / librairie, ADR-0039) · lit ses règles au démarrage (oui/non) · règles appliquées (n) · badge « aussi un agent ». Recherche et filtre par étage. Les trous deviennent des badges de ligne (ex. /ezk-retro : « agents non déclarés »), pas un bloc à part. Aucune colonne projet.
- Source : ezk law show --json (objets[type = skill] : litSesRegles, regles) — publié · à publier : description, sous-commandes, fichier, étage (taxonomie.yml) par ezk help --json ou dans objets[] de law-show (mission control n'a pas le droit de lire SKILL.md) ; badges : ezk graph check --json promu en contrat.

### Agents · 8
- Contenu : Table : agent (→ page Agent) · rôle (une phrase) · lit ses règles au démarrage (oui · n) · règles qu'il vérifie (n) · convoqué par (→ Skill, étape) · modèle et effort par défaut de la méthode (marqués à publier). Pas de colonne « Modèle sur vectorz » : c'est la table Équipe de Configuration, seul endroit avec un crayon. Badge pour ezk-chef : « convoqué par personne ». Sur la page Agent, le bloc « Sur vectorz » à crayon devient un seul lien « Réglé dans Configuration › Équipe » ; pas de « dernier run » (aucun contrat ne le publie).
- Source : ezk law show --json (objets[type = agent] : litSesRegles, regles ; regles[].verifieePar) — publié · à publier : rôle et description, « convoqué par » (roles: du graphe, ezk graph check --json promu), défauts de la méthode (TIER_DEFAULTS / ROLE_TIER de src/core/model-config.ts).

### Règles · 96
- Contenu : Tout le catalogue. Colonnes : Règle (→ page Règle) · Niveau · Catégorie · Portée dans la méthode · Paquets (→ page Paquet) · Appliquée par · Vérifiée par. Filtres-compteurs : lues partout 10 · lues au démarrage 17 · rangées sans effet 50 · orphelines 19 ; paquet (11) ; profil (6) ; catégorie. L'onglet affiche pour quel projet il lit la portée (--root) ; au niveau Global il ne montre que la portée globale. C'est la vue « catalogue » ; la vue « en vigueur ici », avec d'autres colonnes (Réglé par, D'où, Garantie), est sur la page Loi du projet.
- Source : ezk law show --json --root <projet> (regles[] : id, titre, niveau, categorie, portee, bundles, profils, appliqueePar, verifieePar ; comptes) — publié · à publier : law-debt.yml (règles agent-check non citées par leur agent) pour les badges de ligne ; ezk law show regle:<id> --json avec le texte complet pour la page Règle.

### Profils · 6
- Contenu : Table courte : profil (→ page Profil) · hôte cible (poste ~/.claude, projet piloté par cop1, Claude Desktop) · paquets · agents · skills · règles (n : 10 pour base, daily, desktop, global, mobile ; 77 pour cop1-target) · lié à (poste / tel projet, à publier). Aucune action : un profil se lie par ezk law bind, il ne s'édite pas depuis un projet. La page Profil est nouvelle et courte : ce qu'il installe, où il est déployé.
- Source : ezk law show --json (objets[type = profile].regles ; regles[].profils) — publié · à publier : composition et hôte (profiles/*.yml + README) par ezk law show profile:<id> --json (refusé aujourd'hui) ; « lié à » (ni le poste ni le projet n'enregistrent le profil lié).

### Commandes · 74
- Contenu : Table : domaine · verbe (→ page Commande) · ce qu'elle fait (résumé du manifeste) · écrit le projet (oui/non) · script lancé (bin/*.ts) · citée par (→ Skill, étape du process). Les 26 commandes de chat sont l'onglet Skills : pas de double compte. Cet onglet absorbe l'ancien onglet « Outils · 113 » : le script est une colonne ici ; un filtre « scripts internes » déplie les 113 scripts avec « lancé par » (commande) ou « utilisé par » (skill, pour skills/*/scripts/*.sh) ; les scripts d'un skill sont aussi la section « Lance » de sa page Skill. Pas de page Outil : un script se lit sur la Commande ou le Skill qui le lance. La page Commande est nouvelle et reprend le panneau « Commande ezk forge integrate » de l'ancienne Loi.
- Source : ezk-manifest.yml (domaine, verbe, run, summary, project) que mission control ne doit pas lire → à publier : ezk help --json (ezk help existe sans --json) · « citée par », « lance », « utilise » : ezk graph check --json promu en contrat (jamais un ezk graph show, qui n'existe pas).

### Glossaire · 16
- Contenu : Table : terme · définition en une phrase · où il joue (→ étape du Process ou page d'objet). Source unique des textes des boutons « i » de toute l'application : chaque « i » affiche l'entrée du glossaire, l'onglet en est l'index. L'entrée DoD renvoie vers la page Loi du projet, plus vers Configuration.
- Source : À publier : ezk glossaire show --json (terme, en clair, où il sert). Aujourd'hui le seul fichier, docs/glossaire-jargon-ezk.md, appartient au dépôt vectorz, hors products/mega-city : la méthode doit le reprendre avant de le publier. Un texte figé dans l'écran n'est pas une donnée publiée (ADR-086).

### Documents (dernier onglet, sous réserve)
- Contenu : Les documents de la méthode (benchmark BMAD, 4 schémas qualité, carte de la méthode) : titre · type (page / schéma) · fichier · « Ouvrir ». Reprend la carte « Documentation » de l'ancienne Loi et remplace la vue « Cartes » encore présente dans l'app réelle. Gardé parce que c'est la seule source déjà publiée hors law-show et que son retrait est un amendement d'ADR-086, pas une décision de maquette ; le PO le retire d'un clic s'il le juge hors sujet (voir désaccords).
- Source : ezk board maps --json (contrat board-maps v1 : documents[] id, titre, type, fichier) — publié · contenu par ezk board maps --file <id> <nom>.

### Pages d'objet (hors onglets : un objet = une page)
- Contenu : Skill, Agent, Règle : existantes, fil d'Ariane Méthode mega-city › Annuaire › …. Paquet : la page DoD actuelle devient la page du paquet dod et sert de gabarit aux 10 autres (règles, qui l'applique, qui le contrôle, profils qui l'installent, en vigueur sur le projet sélectionné : oui/non). Profil : nouvelle. Commande : nouvelle. Chaque page d'objet porte un seul composant réutilisé, « Sa place dans la méthode », le schéma centré sur l'objet (profil → paquets → règles → appliquée par / vérifiée par → skills → agents → scripts → commandes) : c'est l'ancienne carte « Comment ils interagissent », qui n'existe plus comme bloc à part. Pour un agent, un seul lien « Réglé dans Configuration › Équipe » ; aucune cellule de réglage hors Configuration.
- Source : ezk law show skill:<id> | agent:<id> --json (contrat law-object) · ezk law show --json (applique, est-vérifié-par) · à publier : ezk law show bundle:<id> | profile:<id> | regle:<id> --json ; arêtes compose / convoque / utilise / lance par ezk graph check --json promu en contrat.

### Santé de la méthode (bloc compact en bas de page)
- Contenu : Chiffres pour le mainteneur de la méthode, jamais sur la page Loi d'un projet : 69 règles sur 96 sans effet (50 rangées dans un paquet que rien ne lit, 19 orphelines → filtre de l'onglet Règles) · agents convoqués par personne (ezk-chef) · liens absents du graphe (ezk-archive → agent) · skills sans roles: (ezk-retro) · règles agent-check non citées (law-debt). Remplace les « Trous déclarés » de l'ancienne Loi.
- Source : ezk law show --json (comptes.rangee, comptes.orpheline) — publié · à publier : ezk graph check --json promu en contrat, law-debt.yml.

## 5 · Le menu du projet

- Vue d'ensemble
- Versions
- Objectifs
- Fiches
- Sprints
- Sessions
- Rétros
- Process
- Loi
- Configuration
- Recettes
- Groupe « Méthode mega-city » (sous le menu du projet) : Annuaire — seule entrée ; l'entrée Loi en sort ; la vue Cartes de l'app réelle disparaît, ses documents deviennent l'onglet Documents de l'annuaire ; le Catalogue des recettes reste atteint depuis la page Recettes du projet, comme aujourd'hui, pas une seconde entrée « Recettes »

## 6 · Ce que la méthode doit publier

- ezk help --json : les 74 commandes du manifeste (domaine, verbe, résumé, script lancé, écrit le projet) et la carte d'identité des 26 skills (description, sous-commandes, fichier) — le manifeste existe déjà, c'est la publication la moins chère et la première à faire ; mission control n'a pas le droit de lire ezk-manifest.yml ni SKILL.md (ADR-086).
- Le profil lié au projet : ezk law bind (lawgiver) estampille l'en-tête de .iamthelaw/ENTRY.md (profil, hôte, commit du catalogue) ; ezk law show --json l'expose en lois.projet.profil ; ezk law status --root <projet> --json dit si la loi installée est à jour (aujourd'hui status et doctor ne visent que ~/.claude et doctor exige le nom du profil) — pour l'en-tête de la page Loi.
- contracts/rules-show/v1 : contractualiser ezk rules show --json (origin global|local, guarantee gate|review|advisory par règle, paquets choisis, commit, empreinte) et ajouter ezk rules check --json (erreurs du contrat) — la colonne Garantie et l'état « choisi par le projet » ; la commande existe, le contrat non.
- Les verbes d'écriture du contrat local, pour que les boutons de la page Loi soient réels (ADR-086 §1.4 : mission control n'écrit que par ezk) : ezk rules add <id> --level, ezk rules bind <id> gate|review|advisory, ezk rules remove <id>, ezk rules bundles add|remove <paquet>. Aujourd'hui check / show / apply seulement.
- Promouvoir ezk graph check --json (qui existe) en contrat versionné « graph » : nœuds skills / agents / paquets / profils / scripts / commandes, arêtes compose / convoque / utilise / lance / roles, orphelins et trous — la source du schéma « Sa place dans la méthode », des colonnes « convoqué par » et « citée par », des 113 scripts sous les commandes et du bloc Santé. Ne jamais citer un « ezk graph show » : il n'existe pas.
- ezk law show bundle:<id> --json, profile:<id> --json et regle:<id> --json (les deux premiers sont refusés aujourd'hui, le troisième n'a pas le texte complet) — pour les pages Paquet, Profil (composition, hôte cible, « lié à : poste / projet ») et Règle.
- La carte d'identité des objets dans objets[] de law-show (ou un ezk catalogue show --json) : description, étage (taxonomie.yml), sous-commandes, fichier, modèle et effort par défaut de la méthode pour les agents (TIER_DEFAULTS / ROLE_TIER de src/core/model-config.ts).
- Un glossaire tenu par la méthode et publié : ezk glossaire show --json (terme, en clair, où il sert). Le seul fichier actuel, docs/glossaire-jargon-ezk.md, est dans le dépôt vectorz hors products/mega-city : le déplacer dans la méthode d'abord. Il nourrit l'onglet Glossaire et tous les textes des boutons « i ».
- ezk law show --root <projet> qui filtre la portée « demarrage » sur les skills et agents réellement déployés dans ce projet : sans cela le compte 27 est juste pour vectorz (profil global) mais faux pour un projet lié par cop1-target.
- Les titres en clair des règles, en français (plusieurs titres publiés sont en anglais : Testing Philosophy, Hexagonal Architecture…), et law-debt.yml publié pour les badges de l'onglet Règles.
- Fixer le vocabulaire une fois (ADR-086 §3) : config.example.yml dit encore « Plugin GitHub » quand l'amendement de l'ADR-0039 dit « module » ; le PO tranche le mot de la page Configuration ; « Annuaire » pour les définitions, « Catalogue » pour les recettes, « Scripts » à la place d'« Outils » partout.
- Si le PO veut un jour des outils réglables par projet : l'activation des modules techno par projet (ezk config modules …, modules[] dans config-show) — fonction de la méthode, affichée dans Configuration › Plugins, jamais dans Loi.
- Hors Loi mais même trou : ezk dor show --json pour la page DoR de Configuration.
- Dessiner et tester la maquette sur un projet qui a un .vectorz/rules.yml (samplerz, condition 6 de l'ADR-0050) : sur vectorz, 0 règle propre et 0 paquet choisi, la page Loi paraît vide.

## 7 · Désaccords entre juges et tranchés de la synthèse

- Profils : le juge 1 veut un onglet « Profils · 6 » (une table courte, pour que « c'est quoi un profil ? » ait une réponse visible) ; le juge 2 (gardien) veut une page Profil atteinte seulement par les six puces du filtre « profil » de l'onglet Règles (six objets qui changent rarement ne méritent pas d'onglet). Tranché ici en faveur de l'onglet : il n'affiche que des données publiées ou marquées à publier, il allège la barre de filtres de Règles que le juge 1 trouvait chargée, et le PO peut le replier en un clic.
- Onglet Documents : le juge 1 veut le retirer de l'annuaire (ni une définition ni un réglage ; les documents restent lisibles par la page Fichier) ; le juge 2 refuse qu'une maquette retire par décret un portage que l'ADR-086 liste comme livré (board-maps v1, seule source publiée hors law-show) : c'est un amendement d'ADR. Tranché ici : gardé en dernier onglet, sous réserve ; le PO tranche sa place avec l'amendement ADR-086 sur la vue Cartes.
- Schéma « Comment ils interagissent » : le juge 1 le juge jamais ouvert par un pilote ; le juge 2 refuse de retirer la carte LA LOI (ADR-0041) sans amendement. Tranché ici par un compromis : plus de carte à part dans l'annuaire, mais un seul composant « Sa place dans la méthode », centré sur l'objet, sur chaque page d'objet ; les arêtes non publiées (compose, convoque, utilise, lance) y sont marquées à publier.

## 8 · Les juges

- En clair : la proposition 2 (architecture d'information) gagne. Elle est la seule à ne laisser qu'une table de paquets, à déplacer sans recopier les deux lignes… — meilleure proposition : 2 ; totaux : [(0, 15), (1, 17), (2, 18)]
- Juge adverse, gardien de la méthode : rien à l'écran sans objet publié par un contrat ezk --json ou sans réglage réel dans .vectorz/ ou .iamthelaw/ ; les mots d… — meilleure proposition : 2 ; totaux : [(0, 15), (1, 16), (2, 17)]

## 9 · Application

Appliqué dans la maquette le 11 nov. (version 124 du canevas) : page Loi — vectorz (règles en vigueur, paquets), page Annuaire de la méthode (skills, agents, règles, profils, commandes, glossaire, documents, santé), menu du projet … Process · Loi · Configuration …, groupe Méthode mega-city → Annuaire ; Configuration perd les lignes « Loi installée » et « DoD » ; la page Agent renvoie son réglage vers Configuration › Équipe ; le schéma « Comment ils interagissent » devient « Sa place dans la méthode » sur la page Skill.

## Amendement du 2026-11-12 — le menu range par portée, pas par produit

**En clair :** le PO a rouvert le point 5 (« accès ») : un groupe de menu « Méthode mega-city » avec une seule entrée lui donnait l'impression que la méthode est un module branché sur mission control. Le code dit l'inverse : la méthode est ce que mission control lit (tout passe par `ezk … --json`, ADR-086), et ce qui se branche par projet, ce sont GitHub, la CI et Codex (ADR-0039, ADR-0059, ADR-0061). Le menu suit donc la portée : « Global » porte « Projets » et « Annuaire de la méthode » ; « Projet · <nom> » porte le reste. Le nom de la méthode ne vit plus que dans le titre de la page Annuaire et dans son « i » (« lu par ezk »). Appliqué à la maquette en version 140.

Même version : le vocabulaire d'écran parle Scrum (sprint, but du sprint, lot, incrément, rétro, session nommée par sa branche) ; « run » n'est plus un objet d'écran, il reste un mot du journal et de la ligne de commande, rendu « lancement » dans le fil d'une session ; « Objectif » reste le mot des milestones (décision PO du 11 nov.) ; la page Version n'a plus qu'un bouton « Versionner », dont les contrôles se lisent dans Configuration › Process › Livrer une version. Lecture à charge du 12 nov. (quatre lecteurs, quatre contradicteurs) : rapport dans le scratchpad de la session maquette, à reprendre dans la carte des écarts.
