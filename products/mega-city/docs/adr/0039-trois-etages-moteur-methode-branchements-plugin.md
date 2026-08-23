# ADR 0039 — Trois étages (moteur / méthode / branchements) et le mot « plugin »

- Statut : **accepté**
- Date : 2026-08-23
- Décideur : PO (plan « trois étages » approuvé le 2026-08-23) ; panels préalables tenus
  (panel adverse du 2026-08-23, capture
  `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md` ; critique d'architecte
  sur le séquençage). Consomme la fiche `0170` (modèle d'extension/plugin).

## En clair

Le dépôt mélangeait trois natures de briques sous un seul vocabulaire : la mécanique
générique, l'instance scrum, et les outils qui se branchent dessus. Cet ADR les nomme,
range chaque brique dans son étage via UN fichier de données validé en complétude, et
définit ce qu'est un « plugin » mega-city — avec un exemple qui tourne déjà.

## Contexte

Diagnostic PO (2026-08-23, sur la carte compilée) : la bande « Cérémonies » montrait des
skills, `ezk-archive` traînait dans les rôles, cinq skills restaient « hors bande », et
le laïus « des Juges appliquent la loi » confondait la méthode agile et le moteur de
règles. La fiche `0170` demandait depuis juillet un contrat d'extension explicite
(quoi/où se branche un adaptateur, frontière avec le packaging) avant tout adaptateur
GitHub. Le panel adverse a écarté les remèdes coûteux (2 bandes de plus, fusion
`ezk-session`, frontmatter `bande:`) et imposé : YAML unique, zéro rename, petits pas.

## Décision

### 1. Trois étages + la fabrique

| Étage | La question | Contenu |
|---|---|---|
| **Le moteur** | *avec quoi tout est construit* | `rules/`, `bundles/`, `profiles/`, `bind`/caps — le code et les objets qu'il compose. Ne connaît PAS scrum. |
| **La méthode** | *l'instance scrum* | cérémonies (`method/ceremonies.yml`), rôles (agents pm/architect/dev/qa/reviewer), artefacts (backlog, fiches, plan). Bandes internes : ADR-0020, amendée (§3). |
| **Les branchements** | *hors méthode, activables* | familles : `hote-llm` (sessions), `github` (codex), `observabilite` (supervision-*), `techno` (outillage), `plugin` (overlays §4). |
| *La librairie* | *la fabrique (méta)* | `ezk-ezk` (crée les skills), `ezk-steward` (garde le dépôt). |

L'étage est un axe de **nature** ; les bandes d'ADR-0020 restent l'axe de **fonction**,
désormais interne à l'étage méthode. Le critère mécanique d'ADR-0020 reste vrai dans
son sens d'origine (non-composé ⇒ pas méthode) ; il **informe** l'étage, il ne le
décrète pas — être composé par une cérémonie ne suffit pas à être de la méthode
(`ezk-ci` est composé par le sprint et reste un branchement techno).

### 2. La classification vit dans UN fichier de données

`products/mega-city/taxonomie.yml` — jamais de frontmatter par skill (verdict panel :
l'éparpillement est la panne, pas la solution). Le compilateur de la carte
(`src/core/taxonomie.ts`) VALIDE en **complétude** : chaque skill et chaque agent du
catalogue a exactement un étage ; id inconnu, doublon, oubli, ou bande citant un skill
hors-méthode ⇒ échec de régénération, CI rouge. « Chaque brique rangée » est un
invariant testé, pas une promesse.

### 3. Rangements actés (PO, 2026-08-23) — amende la table d'ADR-0020

- `ezk-commits` → branchement **techno** (« la partie commit est un outillage »).
- `ezk-archive` (skill ET agent exécutant) → branchement **hôte LLM** (l'archivage est
  une contrainte des sessions LLM, pas un rituel agile).
- `ezk-start` → **méthode** (« une étape liée au sprint ») ; `ezk-backlog` → méthode.
- `ezk-codex` → branchement **GitHub** ; `supervision-*` → branchement **observabilité**.
- `ezk-ezk` + `ezk-steward` → **librairie**.
- `vz-product-builder` → branchement **plugin** (§4).
- Conséquence sur ADR-0020 : l'ex-bande « Outillage » est **promue** famille de
  branchements ; les bandes restantes de la méthode = Cérémonies, Rôles (les agents
  méthode), Artefacts (`ezk-backlog`, `ezk-start`). Aucune bande nouvelle.
- Les rôles hors-méthode à venir (ex. `ezk-writer`, rédaction d'articles) se rangent en
  branchement — affichés « en dehors » de la méthode, comme demandé.

### 4. « Plugin » (overlay) — la réponse à la fiche 0170

**Un plugin mega-city est un OVERLAY déclaratif : une brique qui CHARGE la doctrine
d'une brique du catalogue et la SURCHARGE par déclaration, sans modifier ni le
catalogue ni le moteur.** Premier exemple vivant : `vz-product-builder` — il charge
`ezk-product-builder` et le surcharge en 3 points (corpus de reviewers à la place des
checkpoints humains, budget `cap`, supervision obligatoire), zéro skill `ezk-*` modifié.

Références (repris / écarté) :
- **BMAD** (customize/overlay, docs.bmad-method.org « expand for your org ») — REPRIS :
  l'override par couche (agent / workflow / config), déclaratif, un outil qui génère et
  valide. ÉCARTÉ : le format TOML et le registre central — notre couche de déclaration
  est le markdown+frontmatter existant.
- **Plugin Claude Code officiel** (`anthropics/claude-plugins-official`, plugin
  `github` : `plugin.json` + `.mcp.json`) — REPRIS comme référence de **packaging**
  pour la fiche `0087` (distribuer la méthode). ÉCARTÉ ici : le plugin Claude Code est
  un mécanisme de DISTRIBUTION vers un hôte, pas notre modèle d'extension interne.
  (Faux ami confirmé : ses `hooks/hooks.json` = événements harness, pas hooks git.)

Réponses aux questions de la fiche 0170 :
- **Sens de sync des adaptateurs** (ex. GitHub Issues, fiche 0171) : local → externe
  UNIQUEMENT par défaut ; le backlog markdown reste la source de vérité.
- **Activation** : explicite, par configuration du projet — jamais « toujours-on ».
- **Frontières** : `0087` = DISTRIBUER la méthode (packaging hôte) · adaptateur
  outillage = un branchement famille `github`/`techno` activable · `0093`
  (BacklogStore interchangeable) = hors scope jusqu'à un trigger réel (inchangé).
- **Formalisation différée** (YAGNI assumé) : le dossier dédié et la règle du jeu
  complète des plugins s'écrivent au moment du DEUXIÈME plugin — un seul exemple ne
  justifie pas un framework.

### 5. Généralisation des profils (actée, construite plus tard)

Un profil est une composition `{bundles + agents + skills}` appliquée à une CIBLE — et
la cible n'est déjà pas toujours un projet : `global`/`daily` équipent le poste
(`~/.claude`), `desktop` une session Claude Desktop (les caps ignorent `projectDir`).
La généralisation voulue par le PO (profil d'agent, profil d'outil) = ajouter des
cibles de bind, pas changer le moteur — c'est la porte vers d'autres méthodes que
scrum sur le même moteur. Actée comme direction ; construite quand un cas réel le tire.

### 6. Perspective (2 lignes, pas un chantier)

`ezk-ezk` pourra un jour offrir des sous-commandes d'extraction (tirer des règles d'un
projet existant, détailler/valider une règle) — noté, non planifié.

## Conséquences

**Plus facile** — la carte range chaque brique par étage (compilé, testé) ; le « sans
bande » a disparu par construction ; l'adaptateur GitHub (0171) a enfin son contrat
d'entrée ; le mot « plugin » a une définition et un exemple.

**À surveiller** — la tentation de créer des familles de branchements à la demande
(le vocabulaire est fermé : en ajouter une = amender cet ADR) ; le deuxième plugin
déclenchera la formalisation (§4) ; les étiquettes de la carte doivent suivre ce
vocabulaire (lot 3 du plan : débaptiser « scrum master », séparer DoD/critères).

## Alternatives écartées

- **Deux bandes de plus (« Sessions & hôte », « Librairie »)** — tuait le critère
  mécanique d'ADR-0020 et rouvrait une taxonomie stabilisée 3 jours avant. Rejeté
  (panel A-3, C-4).
- **`bande:`/`etage:` en frontmatter par skill** — ré-éparpille ce que le compilateur
  vient de centraliser ; dérive non arbitrée. Rejeté (panel A-8, C-5).
- **Fusion `ezk-session` (start+archive)** — inexécutable tant que le binder ne sait
  pas retirer un ancien nom, churn record, doublon avec l'agent. Rejeté (panel A-1,
  C-1/C-2) ; remplacé par la doc croisée (lot 4 du plan).
- **Généraliser les profils maintenant** — aucun cas réel ne le tire. Différé (§5).
