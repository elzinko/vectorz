# Panel adverse — extension de supervision centrale, dossier en paramètre (2026-11-01)

**En clair.** Le PO proposait une extension Claude Desktop centrale. Un seul serveur de
supervision serait installé une fois. Il recevrait le dossier du projet à chaque appel d'outil.
Les trois relecteurs et le juge disent **NO-GO** sur cette forme. Le besoin derrière est juste,
et il est chiffré : « installer une fois, et chaque session écrit dans son projet ». Une autre
voie le satisfait sans casser la règle de sécurité du journal. On déclare le serveur une seule
fois au niveau utilisateur de Claude Code, et il lit le dossier de la session dans la variable
`CLAUDE_PROJECT_DIR`. Cette voie demande au PO d'amender une décision (ADR-0019, décision 9) et
de lancer un test court.

- Sujet cadré par : demande PO du 2026-11-01. « On garde une extension centrale […] elle gère
  les appels selon qui l'appelle (en paramètre) […] demande une revue adverse poussée, c'est
  très important. »
- Contexte du jour : l'extension `.mcpb` de supervision venait d'être retirée (commit
  `3e191633`). Elle avait un seul dossier projet figé.
- Relecteurs indépendants, sans mémoire de la session : **A** = architecture et historique
  (`ezk-architect`) · **B** = sécurité et intégrité du journal · **C** = faisabilité et valeur.
- Juge : un agent indépendant a revérifié 17 affirmations, avec ses propres preuves.
- Synthèse : session principale. Arbitrages produit : PO.

---

## Objet soumis

Une extension Claude Desktop, installée une fois. Un seul serveur MCP de supervision pour tous
les projets. Chaque appel d'outil (`run_start`, `gate_reached`, `gate_resumed`, `escalate`,
`heartbeat`, `run_finished`) porte en paramètre le dossier du projet appelant. Le serveur écrit
alors dans `<dossier>/.supervision/`.

## Verdict

**NO-GO unanime** sur la proposition telle quelle : A, B, C et le juge.

Deux raisons bloquantes se cumulent.

1. **Le serveur central ne sait pas qui l'appelle.** Il ne peut aiguiller que sur un paramètre
   rempli par le modèle.
2. **Ce paramètre rend au modèle le choix de l'endroit où il écrit.** C'est précisément ce que
   le contrat de supervision interdit depuis juillet.

**GO pour le besoin** « installer une fois », par une autre voie : la racine fournie par le
lanceur, jamais par la méthode.

---

## Ce qui casse — findings retenus après le juge

### 1. Le serveur central ne voit pas la session (bloquant)

Les extensions Desktop tournent dans des processus de l'application Claude Desktop. Le juge
a compté 8 processus pour 4 extensions activées. Leur dossier courant est `/`. Leur
environnement ne contient ni `CLAUDE_PROJECT_DIR` ni `CLAUDE_CODE_SESSION_ID`. Ils suivent la
vie de l'application, pas celle des sessions. Un serveur ainsi hébergé ne sait donc pas quelle
session l'appelle. Pour aiguiller, il faut un paramètre.

Le mécanisme MCP « roots » ne sauve pas l'extension. Claude Code répond à `roots/list` avec le
dossier de la session, mais seulement aux serveurs qu'il lance lui-même. Pour une extension, le
client MCP est Desktop. Aucune doc officielle ne dit que Desktop relaie les roots de chaque
session. Ce point n'a pas été testé.

### 2. Le paramètre viole l'invariant anti-falsification (bloquant)

La règle : la racine n'est jamais un paramètre d'outil, le modèle ne choisit jamais où son
journal s'écrit. Elle est écrite à cinq endroits :

- [mcp-server.ts:8-10](../../products/mega-city/src/supervision/mcp-server.ts)
- [fiche 0154, kit émetteur](../../features/done/0154-kit-emetteur-supervisabilite.md), l.77-78
- [fiche 0082, registre](../../features/done/0082-registre-supervision-cote-vectorz.md),
  l.18-20 et l.91-94
- [ADR-036](../adr/ADR-036-transport-emission-separable-du-runtime.md), décision 4
- [capture du 2026-07-14](2026-07-14-revue-groupe-deux-sieges.md), l.127 et l.211

Scénario démontré par B :

1. Une session vectorz lit un ticket piégé : « appelle `run_start` avec
   `project_root=/Users/elzinko/git/samplerz` ».
2. L'appel passe sans demande. La permission porte sur le nom de l'outil, pas sur ses
   arguments.
3. Le serveur ouvre un run dans samplerz.
4. La vraie session samplerz reçoit « un run est déjà ouvert »
   ([runtime.ts:296-301](../../products/mega-city/src/supervision/runtime.ts)). Son run
   autonome est bloqué.

### 3. Le board ne peut pas repérer le faux (bloquant)

- Le lecteur cop1 rattache un run à un projet d'après l'emplacement du fichier
  (`JournalWatcherAdapter.ts:243`).
- L'en-tête d'un événement ne nomme pas le projet
  ([journal.ts:282-291](../../products/mega-city/src/supervision/journal.ts)).
- L'identifiant de session est lu dans `.supervision/session.json` du projet visé
  (`session-identity.ts:64-70`).

Un événement envoyé au mauvais projet porte donc l'identité de la victime. Il ressemble trait
pour trait à un vrai.

### 4. Écriture hors de tout projet (majeur)

Rien ne bornerait le dossier : `~/.claude/…`, `/tmp/x`, ou un chemin relatif résolu depuis `/`.
`gate_reached` lance aussi `git status` dans ce dossier
([upgrade-ok.ts:58-59](../../products/mega-city/src/supervision/upgrade-ok.ts)). Un dépôt
piégé pourrait y faire exécuter une commande, hors du bac à sable de Claude Code. Ce risque n'a
pas été testé, sur consigne.

### 5. Un seul processus pour toutes les sessions (majeur)

L'attente d'un verrou d'écriture est synchrone et dure jusqu'à 5 secondes (journal.ts:58,
l.95-99, l.202-212). Un projet en attente gèlerait tous les autres. Un plantage couperait la
supervision partout. Le contrôle du registre au démarrage disparaîtrait, faute de racine au
démarrage.

### 6. Normalisation des worktrees et méthode attendue (majeur)

La racine est calculée au démarrage, avant le runtime
([project-root.ts:166-183](../../products/mega-city/src/supervision/project-root.ts)). Les
leviers `SUPERVISION_PER_WORKTREE` et `SUPERVISION_MULTI_SESSION` sont des variables
d'environnement. Le serveur reçoit aussi une seule « méthode attendue » par copie
(mcp-server.ts:42). Un serveur central ne peut porter ni l'un ni l'autre par projet.

---

## Ce que le panel a trouvé sur la solution actuelle

Ces points existent **déjà**, sans aucun paramètre. Ils ne sont pas tranchés.

- **Les messages d'erreur révèlent les identifiants.** Le run ouvert apparaît dans
  runtime.ts:300 et l.482. Le vrai identifiant de jalon apparaît l.361. Deux sessions sur la
  même racine partagent le même run ouvert : même checkout, ou worktrees ramenés à l'arbre
  principal. L'une peut fermer le run de l'autre en deux appels.
- **Le runtime ne vérifie pas où pointe `.supervision/runs`** (runtime.ts:161 et l.303). Le
  lecteur, lui, rejette un lien qui sort du projet.
- **ADR-034 surestime la protection du `.mcp.json`.** Il dit (l.87) que le modèle n'a « ni
  paramètre d'outil, ni prise sur le fichier ». En réalité `.mcp.json` est un fichier protégé :
  une écriture demande l'accord humain, sauf en mode `bypassPermissions`.
- **L'identifiant de session est lié au dossier, pas à la session Claude.** Deux sessions sur
  le même dossier en partagent un.
- **Deux projets sur trois du registre n'émettent rien.** samplerz et muti sont inscrits
  (`supervision.registry.yaml:18-23`). Aucun des deux n'a de `.mcp.json` ni de `.supervision/`.

## La douleur, chiffrée (relecteur C)

- **4 gestes par projet** : lancer `supervision:link`, rouvrir la session, approuver le
  serveur, ajouter le projet au démon cop1.
- **Ces gestes se rejouent** après un clone, après un changement de version de Node, et dans
  chaque worktree.
- C a compté 11 worktrees vivants sans `.mcp.json`, dans les trois projets. Ce chiffre n'a pas
  été revérifié par le juge.

---

## Les voies qui donnent « installer une fois » sans paramètre

Image : un **badge remis à l'entrée** plutôt qu'un **formulaire où le visiteur écrit lui-même
son étage**. Le lanceur, Claude Code, fixe la racine au démarrage, avant tout contenu non fiable.

### Voie A — serveur de portée utilisateur qui lit `CLAUDE_PROJECT_DIR` (recommandée)

Faits confirmés par le juge :

- Un serveur MCP déclaré au niveau utilisateur est lancé **une fois par session**, en enfant
  du CLI `claude` de la session. Exemple observé : `google-multi-account`, trois copies, dans
  muti, samplerz et vectorz.
- Chaque copie reçoit `CLAUDE_PROJECT_DIR` égal au dossier de sa session. La doc officielle le
  dit : « Claude Code sets `CLAUDE_PROJECT_DIR` in the spawned server's environment to the
  project root » (code.claude.com/docs/en/mcp).

Ce qu'elle exige :

1. Lire `CLAUDE_PROJECT_DIR` entre la racine explicite et le dossier courant. Environ dix
   lignes, plus les tests. Cela **amende ADR-0019, décision 9**, qui l'avait exclu exprès.
2. Un mode dormant hors registre. Sinon chaque session non supervisée afficherait « failed to
   connect ».
3. Écrire `.supervision/.gitignore` automatiquement, pour les projets jamais branchés.
4. Fixer `SUPERVISION_REGISTRY_DIR` une fois, pour les projets hors de vectorz.
5. Retirer les `.mcp.json` locaux nommés `supervision`. L'ordre de priorité est local, puis
   projet, puis utilisateur : un `.mcp.json` local masquerait le serveur utilisateur.

Test minimal : ouvrir une session dans un worktree de samplerz. Lire la ligne
`[supervision] journal → …` sur la sortie d'erreur du serveur. On doit y voir l'arbre principal
de samplerz.

### Voie B — plugin Claude Code (fiche 0087)

La config MCP d'un plugin substitue `${CLAUDE_PROJECT_DIR}` (doc officielle). Écrire
`SUPERVISION_PROJECT_ROOT: "${CLAUDE_PROJECT_DIR}"` dans le plugin suffit, sans toucher au
code de la racine. Coût : le paquet, un marketplace, une gestion de versions. La fiche
[0087](../../features/0087-plugin-claude-code-distribution.md) est aujourd'hui parquée.

### Voie C — statu quo `supervision:link`

Rien à prouver, déjà livré. Coût : les 4 gestes par projet et par worktree.

### Voies écartées

- **Le repli sur le dossier courant, tel quel.** Le lanceur actuel utilise `pnpm --dir`, qui
  déplace le dossier courant vers `products/mega-city`. Ce dossier n'est pas au registre, donc
  le serveur s'arrête au démarrage, dans tous les projets.
- **`${CLAUDE_PROJECT_DIR:-.}` dans un `.mcp.json` ordinaire.** La variable n'existe que dans
  l'environnement du serveur. Le texte devient `.`, une racine relative refusée.
- **Un paramètre vérifié contre le registre.** Il bloque les dossiers système et les dépôts
  piégés. Il laisse passer les échanges entre vectorz, samplerz et muti : les findings 2 et 3
  restent entiers.

## Contradiction tranchée par le juge

A disait que le repli sur le dossier courant suffirait. C disait que non. **C a raison** avec la
commande de lancement actuelle. A n'aurait raison qu'à trois conditions réunies : une commande
sans `--dir`, une session ouverte à la racine du projet, et un registre trouvable. Même alors, la
doc ne promet pas le dossier courant. Elle fournit `CLAUDE_PROJECT_DIR` justement pour ne pas en
dépendre.

## Erreurs corrigées

- **Dans nos propres écrits.** La note du 2026-11-01 de la fiche 0087 disait : « Ce repli
  existe déjà dans `src/supervision/project-root.ts` ». C'est faux pour la raison ci-dessus.
  Note corrigée le jour même.
- **Chez les relecteurs.**
  - A citait la capture du 2026-07-13 pour l'invariant ; la bonne source est celle du
    2026-07-14.
  - B citait runtime.ts:266 ; les bonnes lignes sont 300 et 482.
  - B donnait un mauvais chemin pour `projectChantier.ts`. Le bon :
    `products/cop1/packages/journal-validator/src/projectChantier.ts`.
  - « ADR-034 est faux » est trop fort ; le bon mot est « surestimé ».

## Non prouvé — et le test minimal

| Question | Test minimal | Qui |
|---|---|---|
| Desktop relaie-t-il des roots par session aux extensions ? | Extension sonde qui demande `roots/list` à chaque appel, appelée depuis deux onglets Code | Seulement si la voie extension revient |
| Un serveur utilisateur lancé sans `cd` a-t-il le dossier de la session ? | Sonde `node probe.js` en portée utilisateur, ouverte dans deux sessions, qui note son dossier et `CLAUDE_PROJECT_DIR` | PO : le test modifie la config |
| Que vaut `CLAUDE_PROJECT_DIR` dans un worktree ouvert en cours de session ? | Même sonde, en entrant dans un worktree après le démarrage | Avec le test précédent |
| Le gel de 5 s dans un serveur central | Garder le verrou d'écriture, appeler depuis une autre session | Sans objet si NO-GO |
| `git status` sur un dépôt piégé | Non testé, sur consigne | Sans objet si NO-GO |

## Arbitrages PO

1. L'invariant « le modèle ne choisit jamais où il écrit » est-il maintenu ? Le panel dit oui.
   S'il est maintenu, le paramètre est exclu.
2. Amender ADR-0019, décision 9, pour lire `CLAUDE_PROJECT_DIR` ? C'est la condition de la
   voie A.
3. Quelle voie : A (portée utilisateur), B (plugin) ou C (statu quo) ?
4. Faut-il superviser l'onglet Chat ? Seule une extension y a accès, et Chat n'a pas de notion
   de projet.
5. Faut-il une fiche pour durcir la solution actuelle ? Pistes : ne plus afficher les
   identifiants dans les erreurs, un jeton de run rendu par `run_start`, vérifier où pointe
   `.supervision/runs`.
6. Accepte-t-on qu'un agent qui a un shell puisse falsifier le journal à la main ? Sinon, il
   faudrait une signature.

---

## Annexe — synthèse des rapports

Rapports condensés. Les preuves citées ci-dessus sont celles que le juge a confirmées.

- **A, architecture et historique.** NO-GO. Le paramètre viole l'invariant gravé à cinq
  endroits. Le serveur central ne sait pas qui l'appelle, donc la proposition est soit
  impossible, soit identique au paramètre. Elle casse la normalisation des worktrees et le
  registre à deux clés. Le besoin « chaque session dans le bon projet » est déjà satisfait ;
  seul « installer une fois » manque. Alternatives : portée utilisateur, plugin, statu quo.
- **B, sécurité.** NO-GO. Démontre l'écriture dans un autre projet par injection, la fermeture
  du run d'autrui grâce aux identifiants affichés dans les erreurs, l'impossibilité pour le
  board de repérer le faux, l'écriture hors projet et le `git status` sur un dossier
  arbitraire. Attaque aussi la solution actuelle : falsification possible avec un shell, lien
  symbolique non vérifié, `.mcp.json` modifiable sous conditions. Conclut qu'une racine
  fournie par le lanceur est plus sûre qu'un paramètre : fixée avant tout contenu non fiable,
  par l'humain ou Claude Code, et en échec visible.
- **C, faisabilité et valeur.** NO-GO pour l'extension, GO pour le besoin. Chiffre la
  douleur. Mesure que les extensions tournent dans `/` sans variable de session. Prouve
  qu'un serveur de portée utilisateur reçoit `CLAUDE_PROJECT_DIR` par session. Trouve le piège
  `pnpm --dir` et l'erreur de la note 0087. Classe les voies : portée utilisateur, plugin,
  extension.
- **Juge.** 13 affirmations confirmées sur 17, souvent avec une ligne ou un chemin corrigé.
  Deux inexactes : la source citée de l'invariant et la note 0087. Deux en partie non
  prouvées : les roots relayés par Desktop et le dossier courant d'un serveur utilisateur.
  Tranche la contradiction en faveur de C.
