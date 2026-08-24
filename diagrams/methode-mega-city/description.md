# La méthode mega-city en une carte

La méthode mega-city (univers Judge Dredd : des **Juges** appliquent **la loi** pour des
**projets**, sur n'importe quel LLM) tient dans **deux catalogues** qui se composent, plus un
**flux de travail** qui les met en oeuvre. Cette carte montre l'assemblage — le « comment tout
tient ensemble » — pas le détail de chaque commande (ça, c'est la carte dynamique interactive).

**Point d'entrée** : le **PO** (l'humain) décide et garde la main. Rien ne se lance sans lui.

**Catalogue 1 — LA LOI** (bleu) : `rules/` sont des règles minimales et composables ; `bundles/`
les regroupent (mécanisme `extends`). C'est le référentiel qui *guide* le travail (Definition of
Done, clean code, archi hexagonale, etc.).

**Catalogue 2 — L'ÉQUIPE** (ambre) : `agents/` sont 7 rôles (chacun avec ses `compétences` = les
skills qu'il sait invoquer, et ses `interactions` = les règles qu'il respecte) ; `skills/` sont 23
commandes `ezk-*`, des playbooks indépendants de l'hôte.

**Le keystone** (gris) : `profiles/` est la clé de voûte — un profil *compose* la loi (bundles) et
l'équipe (agents + skills) en un tout cohérent. Puis `bin/ bind`, **déterministe**, matérialise ce
profil dans la **forme native de chaque hôte** — `caps/<host>/` : Claude Code, Claude Desktop,
Cursor, cop1… La règle d'or (leçon `lifefindsaway`) : le LLM **rédige et juge** (consultatif, non
déterministe), le **script range** (append, journal, commit, bind — toujours pareil, testable).

**Le flux de travail** (vert) : c'est ce qui se passe quand on développe. Le **backlog**
(`ezk-backlog`) est le stock de fiches, source de vérité, qui avance par états
(idea → todo → in-progress → shipped). Le **product-builder** (`ezk-product-build`) enchaîne les
sprints de façon autonome. Chaque **sprint** (`ezk-sprint`) transforme **une fiche en une PR** :
BDD → TDD → gate (tests/CI locale) → archi → revue → squash-merge. Au **ship**, la fiche repart
enrichie dans le backlog.

**Les liens qui comptent** : le sprint **convoque les agents** de l'équipe (architecte, dev TDD,
QA, reviewer) ; LA LOI **guide** le sprint ; le ship **réalimente** le backlog. Autour du flux, trois
cérémonies de cycle de vie : `ezk-sprint:check` **ouvre** la session (garde-fou en lecture seule),
`ezk-archive` la **clôt** sans rien perdre (handoff), et `ezk-retro` **améliore la méthode** en
proposant de nouvelles règles — qui retournent dans LA LOI. La boucle se referme.

Couleurs : **bleu = la loi**, **ambre = l'équipe (commandes + rôles)**, **vert = le flux / le PO**,
**gris = l'assemblage (keystone, bind, hôtes)**.

## Les trois défauts de la v1 — corrigés (2026-08-20/21)

La première version de cette carte était **utile mais pas exacte**. Les trois défauts
identifiés à l'audit ont été traités ; ils sont conservés ici parce qu'ils expliquent la
forme actuelle.

1. **Les liens étaient inférés, pas déclarés.** Le graphe machine-lisible ne comptait que
   **7 arêtes** sur 2 skills, quand la carte en dessinait une quarantaine — le reste venait
   de ma lecture de la prose. C'était très exactement la « prose load-bearing » que
   ADR-0025 voulait supprimer.
   **→ Corrigé** : tout le catalogue est annoté, et les arêtes de composition de la carte
   sont désormais le **miroir exact** du bloc généré par `pnpm composes:graph`, vérifié par
   comparaison automatique. Une arête ajoutée à la main sans déclaration correspondante est
   une invention, et se voit.

2. **`bind → caps/host` était faux comme séquence.** ADR-0003 : `bind` est une fonction
   **pure** qui *utilise* un `Cap` (un module par hôte, choisi dans un registre) et retourne
   un **plan d'écriture** ; c'est `io/apply.ts` qui écrit, et lui seul. Le cap n'est pas
   l'étape d'après le bind — c'est un composant qu'il consomme.
   **→ Corrigé** : le moule précède l'assemblage, les flèches disent « fournit le moule à »
   et « résolu par », et `io/apply` apparaît comme le seul à écrire.

3. **Les rôles n'étaient pas dans le graphe.** `composes:` ne relie que skill→skill ; la
   relation centrale du scrum — *le sprint convoque l'équipe* — n'était déclarée nulle part.
   **→ Corrigé** : le champ `roles:` existe, il est **lu, vérifié et testé** (ADR-0020
   amendé). Un profil qui binde `ezk-sprint` sans ses juges est désormais signalé.

**La règle apprise en chemin**, au prix de trois erreurs successives : `composes:` et
`roles:` déclarent l'**inconditionnel**. Un besoin occasionnel — `ezk-pr` qui dégaine
`device`/`apk` pour une PR mobile, `ezk-archive` qui n'appelle son agent que si le dépôt est
sale — se documente en prose. Le déclarer comme requis fabrique de fausses alertes dans le
vérificateur.

## Ce qui reste

- **Le bloc d'arêtes de la carte est recopié, pas généré.** Il peut donc re-diverger. Le
  contrôle de miroir l'attrape, mais la vraie sortie est de le générer.
- **Quatre cartes de la méthode coexistent** (`docs/method-map.md`,
  `diagrams/ezk-methode-globale/`, `diagrams/0028-org-chart-roles/`, celle-ci). Aucune n'est
  générée, donc toutes dérivent. À consolider.
