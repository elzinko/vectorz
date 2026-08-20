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
(idea → todo → in-progress → shipped). Le **product-builder** (`ezk-product-builder`) enchaîne les
sprints de façon autonome. Chaque **sprint** (`ezk-sprint`) transforme **une fiche en une PR** :
BDD → TDD → gate (tests/CI locale) → archi → revue → squash-merge. Au **ship**, la fiche repart
enrichie dans le backlog.

**Les liens qui comptent** : le sprint **convoque les agents** de l'équipe (architecte, dev TDD,
QA, reviewer) ; LA LOI **guide** le sprint ; le ship **réalimente** le backlog. Autour du flux, trois
cérémonies de cycle de vie : `ezk-start` **ouvre** la session (garde-fou en lecture seule),
`ezk-archive` la **clôt** sans rien perdre (handoff), et `ezk-retro` **améliore la méthode** en
proposant de nouvelles règles — qui retournent dans LA LOI. La boucle se referme.

Couleurs : **bleu = la loi**, **ambre = l'équipe (commandes + rôles)**, **vert = le flux / le PO**,
**gris = l'assemblage (keystone, bind, hôtes)**.

## Limites connues — v1, à corriger (audit du 2026-08-20)

Cette première carte est **utile mais pas encore exacte**. Trois défauts identifiés, à traiter
avant de la considérer comme la carte de référence :

1. **Les liens sont majoritairement inférés, pas déclarés.** Le graphe réellement
   machine-lisible (frontmatter `composes:`, ADR-0025) compte **7 arêtes** sur 2 skills ;
   la carte en dessine une quarantaine. Le reste vient de ma lecture de la prose des
   `SKILL.md` et de `method-map.md`. C'est exactement la « prose load-bearing » que
   ADR-0012/0025 voulaient supprimer.
2. **`bind → caps/host` est faux comme séquence.** ADR-0003 : `bind` est une fonction pure
   qui **utilise** un `Cap` (un module par hôte, choisi via un registre) et retourne un plan
   d'écriture ; c'est `io/apply.ts` qui écrit. Le cap n'est pas l'étape d'après le bind,
   il est *dedans*.
3. **Les rôles ne sont pas dans le graphe.** `composes:` relie skill→skill uniquement.
   La relation la plus importante d'une méthode scrum — *le sprint convoque l'équipe* —
   n'est déclarée nulle part ; elle n'existe qu'en prose.

Corollaire : la carte mélange des liens de natures différentes (utilise-comme-brique,
convoque-un-rôle, est-guidé-par-une-règle, précède) sous une seule flèche. C'est la raison
principale pour laquelle la logique des liens est difficile à lire.
