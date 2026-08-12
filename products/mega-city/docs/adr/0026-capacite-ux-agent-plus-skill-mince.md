# ADR 0026 — capacite UX : un agent `ezk-ux` (role design) + un skill MINCE `ezk-ux` pilote par un MOTEUR DE REGLES UX (profils composables + extract)

- Statut : **proposé** (révisé le 2026-08-09 après la passe de preuve sur elzinko — retour PO : moteur de regles + profils + extract)
- Date : 2026-08-09
- S'appuie sur : [ADR-0020](0020-capacite-partagee-brique-autonome.md) (brique autonome / test d'autonomie), [ADR-0021](0021-cloture-portier-deterministe-ranger-rediger-juger.md) (regle d'or), [ADR-0013](0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) (entonnoir : proposer, jamais fabriquer), [ADR-0007](0007-ezk-ezk-meta-skill-orchestrateur-mince.md) (orchestrateur mince), [ADR-0010](0010-sunset-iamthelaw-le-repo-meurt-le-format-survit.md) (le format regles survit)
- Forme jumelle : **copywriterz ADR-0011/0012** (regles de style .md par tag → profils nommes) — meme pattern, autre domaine (style d'ecriture ↔ style visuel)
- Premier consommateur : refacto UX de la demo web **elzinko** (2 ecrans, auth, moteur de regles, profils) — **preuve faite** (passe audit→plan→apply→verify + responsive, commits `5630049` et `3b3e0eb`)

## Contexte

La boucle `ezk-sprint` a un **juge du comportement** (`ezk-qa`) et un **juge du code**
(`ezk-reviewer`), mais **aucun juge de l'UX**. Le polissage visuel — pourtant acte par la
doctrine (« POC fonctionnel d'abord, polissage ensuite ») — est laisse au hasard. Symptome
vecu : l'UI d'elzinko a grossi organiquement et fait bricole.

Cadrage produit (product-brainstorming) : le trou est un **ROLE manquant**, pas une methode
manquante. Les methodes existent deja : `ezk-design-system` (tokens/atomes/styleguide +
coherence), `design:design-critique`, `design:accessibility-review`, `design:ux-copy`,
`web-artifacts-builder` / `artifact-design`. Un **gros** skill de refacto re-dupliquerait tout
ca (viole ADR-0013 « skill-creator unique fabrique » et la doctrine ezk-ezk « ne pas
reimplementer les sous-skills »). Ce qui manque vraiment :

1. un **role** qui possede la passe design et sait *quand* la jouer ;
2. des **yeux** : sans voir l'app qui tourne (navigateur + screenshot avant/apres), un agent
   UX est aveugle — c'est la **capability** cle.

## Decision

**Option B.** Creer, comme le duo `ezk-archive` (skill mince -> agent a modele/effort figes) :

1. **Skill `ezk-ux`** (playbook host-agnostique, invocable `/ezk-ux`, composable) — MINCE :
   il **orchestre** (il ne reimplemente pas). Sous-commandes `help | audit | plan | apply | verify | extract`.
   - `audit` : compose `design:design-critique` + `design:accessibility-review` +
     coherence vs `ezk-design-system` (lit `docs/design-system.md` s'il existe),
     **evalue par rapport au profil UX actif** (§1bis) plutot qu'au feeling.
   - `plan` : une liste **priorisee impact/effort** des correctifs (le seul livrable vraiment neuf),
     chaque correctif rattache a la regle du profil qu'il retablit.
   - `apply` : applique les correctifs (edits), delegue la micro-copie a `design:ux-copy`,
     le rendu soigne a `artifact-design` / `web-artifacts-builder`.
   - `verify` : lance l'app (`/run`) et **capture avant/apres** via un MCP navigateur.
   - `extract` : voir §1ter — moissonne des regles candidates, ne les active jamais.
   - Passe le **test d'autonomie** (ADR-0020) : marche dans un repo sans autre skill ezk.

**1bis. Moteur de regles UX — la loi design, composable en profils** (retour PO ; heritage
   direct de iamthelaw/mega-city `rules/` + `bundles/` + `profiles/`, et forme jumelle du
   moteur copywriterz ADR-0011/0012, qui vient d'etre eprouve) :
   - **une regle UX = un fichier `.md` + frontmatter** (`id`, `tags[]`, `priority`,
     `enabled`) dont le corps est une consigne de design en langage naturel — regles de
     **structuration** (hierarchie, densite, breakpoints, panneau lateral vs empile…) et de
     **design system** « qu'on aime » (un seul accent fort, focus-visible partout, resultat
     en heros…). Le vocabulaire epouse `ezk-design-system` (tokens/atomes) sans le dupliquer.
   - **un profil UX = une composition nommee de regles** (par tags) + description — le PO
     choisit un profil pour une passe `ezk-ux` (ex. `mobile-first-sobre`, `dense-desktop`).
   - **selection/composition deterministes** (tri par priorite, dedup) ; le LLM applique et
     juge, il ne compose pas — regle d'or ADR-0021, identique a copywriterz `rules.ts`.
   - **rangement** : bibliotheque starter dans mega-city (`rules/` catalogue 1 — LA LOI,
     bundle design) ; un projet peut porter ses regles/profils locaux — « le projet declare,
     la methode lit » (ADR-0020 §4).

**1ter. `ezk-ux extract` — moissonner des regles, jamais les decreter** (retour PO) :
   le LLM **propose** des regles candidates a partir (a) de l'**historique de commits** UI
   du repo (les corrections recurrentes revelent les preferences), (b) du **design global
   existant** (CSS/tokens/composants — ce qui est deja vrai partout est une regle de fait),
   (c) d'**extrapolations** marquees comme telles. Sortie : des regles `proposed`
   (`enabled: false`) suggerees dans un profil **editable**, validees regle par regle par
   l'operateur — discipline entonnoir ADR-0013 et miroir exact du flux feedback→regle
   d'elzinko (copywriterz ADR-0011 §7). `extract` n'ecrit jamais une regle active.

2. **Agent `ezk-ux`** (`agents/ezk-ux.md`, 1 fichier) — le **role** design de la boucle :
   - `model: claude-opus-4-8` (jugement visuel fort), `effort: high` ;
   - `competences: [ezk-ux, ezk-design-system]` (+ invoque `design:*` et `artifact-design` au besoin) ;
   - `interactions: [clean-code/no-dead-code]` + une regle « regle d'or » : **l'agent juge et
     redige** (critique, plan, edits, micro-copie), **le script range** (capture des screenshots,
     application deterministe) — ADR-0021.

3. **Branchement dans `ezk-sprint`** : une **phase « polissage »** apres `ezk-reviewer` (code
   vert) et **avant** la validation E2E de `ezk-qa`. Ordre : TDD -> reviewer -> **ezk-ux** -> QA -> PR.
   Cablage en **prose** tant que `composes:` (ADR-0012 mega-city) n'existe pas.

4. **Fabrication par la filiere** (ADR-0013) : `ezk-ezk create` -> `skill-creator` pour le skill ;
   l'agent `.md` est ecrit a la main (idiome `ezk-qa`/`ezk-reviewer`).

## Options considerees

### A. Agent `ezk-ux` seul (methode dans le corps de l'agent)
| Dimension | Evaluation |
|---|---|
| Complexite | Faible (1 fichier) |
| Reutilisation | **Faible** — pas invocable `/ezk-ux`, non composable par pr-pilot/preview |
| Doctrine | OK mais rate le « brique autonome reutilisable » (ADR-0020) |

Rejetee : l'operateur veut du **reutilisable** ; une methode captive d'un agent n'est pas une brique.

### B. Agent `ezk-ux` + skill MINCE `ezk-ux` — **RETENUE**
| Dimension | Evaluation |
|---|---|
| Complexite | Moyenne (2 artefacts, idiome `ezk-archive`) |
| Reutilisation | **Forte** — `/ezk-ux` direct + composable + role de sprint |
| Duplication | Nulle SI le skill reste orchestrateur (garde-fou explicite) |

### C. Agent + GROS skill (refait critique/a11y/design-system)
Rejetee : duplication frontale, viole ADR-0013 + doctrine ezk-ezk.

### D. Rien — invoquer `design-critique` + `ezk-design-system` au cas par cas
Rejetee : ne comble pas le trou (pas de role, pas de « quand », pas de plan priorise, pas de
boucle de verif navigateur). C'est l'etat actuel, justement insuffisant.

## Consequences

- **Plus facile** — un juge UX dans la boucle ; une passe de refacto invocable et reproductible ;
  le plan priorise impact/effort (le manque reel) est enfin outille ; les gouts de design du PO
  deviennent des **regles versionnees composables** au lieu d'etre re-expliques a chaque passe ;
  `extract` capitalise automatiquement ce que les commits/l'existant revelent ; capitalisable sur
  tous les POC (samplerz, muti…).
- **Plus dur** — +1 agent et +1 skill au catalogue ; **discipline** : le skill DOIT rester mince
  (le garde-fou = il compose `ezk-design-system`/`design:*`, il ne les refait pas) ; un corpus de
  regles UX a curer (nommage, dedup, priorites — meme charge que copywriterz ADR-0011) ;
  dependance a un **MCP navigateur** (Claude-Browser ou Playwright, deja utilise par `ezk-qa`) + `/run`.
- **A revisiter** — cablage `ezk-sprint -> ezk-ux` en prose jusqu'a `composes:` ; **un seul format
  de regle** a terme entre copywriterz (`rules.ts`) et ezk-ux (ne pas laisser deux dialectes
  frontmatter diverger — candidat : l'extraire en brique partagee ADR-0020) ; besoin eventuel d'un
  `design:figma` si le design part de maquettes ; frontiere fine entre « refacto » (ezk-ux) et
  « imposer le systeme » (ezk-design-system) a garder nette.

## Action items

1. [x] Valider d'abord **sur elzinko** (test le moins cher du cadrage) : passe UX reelle
   audit→plan→apply→verify + refonte responsive, screenshots avant/apres (commits copywriterz
   `5630049`, `3b3e0eb`) → confirme : le manque etait bien « role + orchestration », pas « methode ».
2. [ ] **Definir le format de regle UX + la bibliotheque starter** (`rules/` bundle design +
   2-3 profils exemples) — en reprenant le frontmatter eprouve de copywriterz ADR-0011.
3. [ ] `ezk-ezk create` sur une fiche `ezk-ux` → `skill-creator` redige le skill mince
   (`help|audit|plan|apply|verify|extract`).
4. [ ] `extract` MVP : sources commits + design existant, sortie regles `proposed` dans un
   profil editable (jamais actives d'office).
5. [ ] Ecrire `agents/ezk-ux.md` (opus/high, competences `[ezk-ux, ezk-design-system]`, regle d'or).
6. [ ] Brancher la phase « polissage » dans `ezk-sprint` (prose) entre reviewer et QA.
7. [ ] Statut proposé → accepté (operateur) ; nom « Dredd » eventuel via `docs/naming.md`.
