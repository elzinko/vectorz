# ADR 0001 — Monorepo composable à cœur déterministe, catalogues host-agnostiques

- Statut : **proposé** (starter)
- Date : 2026-06-25

## Contexte

On veut un outil qui charge **d'un coup**, au démarrage d'une session dans un projet, la façon
dont une équipe d'agents travaille : leurs **compétences** (skills), les **règles** qu'ils suivent,
et leurs **règles d'interaction**. Trois besoins :

1. **Composer** des groupes de règles (bundles) en **profils** par sous-contexte (mobile, webapp, website).
2. **Capitaliser** : ajouter en cours de projet une compétence/règle/interaction, l'**historiser**,
   et que la prochaine session en bénéficie (« flywheel »).
3. **Fonctionner sur n'importe quel LLM** (Claude Code, Claude Desktop, Cursor, cop1…).

Deux contraintes fortes :

- **Fiabilité** — `lifefindsaway` est passé d'un cœur TypeScript (transitions d'état déterministes)
  à « le LLM fait tout » et a **perdu sa garantie de fonctionnement**. À ne pas reproduire.
- **Ne rien casser** — les skills `claude-skills` sont utilisés aujourd'hui (chargés dans des
  projets Claude Desktop) et doivent continuer pendant la transition.

## Décision

1. **Nouveau monorepo greenfield, plat, sans sous-modules git.** Bounded contexts en dossiers
   (`rules/ bundles/ agents/ skills/ profiles/ caps/ bin/ journal/`). Un seul remote.
2. **Frontière déterministe/bords, non négociable.** Le **cœur** (composer, `expand`, `bind`,
   `capture`→append/journal/commit) est un **script** sur des **listes** : toujours pareil, testable.
   Le **LLM** n'intervient qu'aux **bords** : **rédiger** du contenu (markdown) et **juger** la
   cohérence (avis non bloquant). Le LLM ne **range** jamais.
3. **Le format suit le contenu.** Prose → markdown+frontmatter (rules, agents, skills) ;
   composition pure → yaml (bundles, profiles).
4. **`Profile` = aggregate root** qui compose les deux catalogues (la LOI + l'ÉQUIPE).
   Seul lien inter-catalogue : un `Enforcement` de type `agent-check` qui nomme un Agent.
5. **Catalogues host-agnostiques + `caps/<host>/`.** Le corpus est du markdown/yaml neutre ;
   un adaptateur par hôte le matérialise dans la forme native. « N'importe quel LLM » = un cap de plus.
6. **Stratégie strangler-fig.** Le neuf vit **à côté** ; `claude-skills` + `install.sh` restent
   intacts ; migration du contenu au rythme du domaine qui se fige.

## Conséquences

**Devient plus facile** — commiter (1 repo), capitaliser (git + journal), bundler pour cop1/Desktop,
ouvrir en OSS plus tard (1 repo propre + licence), splitter par bounded context si besoin (dossiers nets).

**Coûts / à surveiller** — un seul historique git mêle les contextes (acceptable tant que solo) ;
discipline « jamais d'état dans le LLM » à tenir (mais `lifefindsaway` a déjà vacciné) ; le `bind`
doit rester couvert par des tests (c'est le cœur).

**À revisiter quand** — (a) on veut distribuer `iamthelaw` seul → extraire le dossier `rules/`+`bundles/` ;
(b) la webapp de config arrive → elle éditera les YAML `profiles/`/`bundles/` (trivial car data) ;
(c) un 3ᵉ hôte non-Claude → écrire son `cap`.

## Alternatives écartées

- **Faire évoluer `claude-skills` en place** — risque de casser l'usage quotidien. Rejeté (contrainte « ne rien casser »).
- **Sous-modules git** — complexité de commit refusée par l'utilisateur. Rejeté.
- **Tout en skill / « le LLM fait tout »** — c'est précisément l'échec `lifefindsaway`. Rejeté.
- **Markdown pour les profils/bundles** — aucune prose à porter ; yaml plus juste et webapp-friendly. Rejeté.
