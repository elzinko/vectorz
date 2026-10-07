# ADR-0067 — Les outils d'une recette : capacité d'abord, un MCP local si possible, un script sinon

**Statut :** Accepté — ratifié par le PO (Thomas) le 2026-10-07.
**Date :** 2026-10-07
**Deciders :** PO (Thomas)
**S'appuie sur :** [ADR-0005](0005-modes-de-consommation-export-mcp.md) (transport de la méthode : export statique primaire, MCP optionnel), [ADR-0058](0058-les-outils-entrent-dans-le-graphe.md) (les outils entrent dans le graphe), [ADR-0061](0061-un-seul-guichet-pour-github.md) (port + adaptateurs)
**Amende :** `recipes/RECIPE_TEMPLATE.md` (section Ustensiles) et le bundle `rules/recipe/*`

## En clair

Une recette n'est pas un script qu'on rejoue : c'est une **procédure transférable** qu'on adapte pour intégrer une feature générique dans un projet qui peut être d'une autre techno. Sa section « Ustensiles » ne doit donc pas imposer un outil ; elle doit nommer une **capacité** (ce qu'on veut faire), puis indiquer **avec quoi** la faire. Ordre de préférence : un **MCP déjà existant** — idéalement un **MCP local installable** dans Claude Desktop/Code —, sinon un **script local** pour le moment, et si un outil manque, on le créera. On ne bascule pas « tout en MCP » : on prend le MCP **quand il existe**, le script **sinon**.

## Contexte — les forces en présence

- **Correction du PO (2026-10-07).** Une recette n'est **pas rejouable en headless/CI**. C'est une procédure générique, adaptée projet par projet. Le `source:` du front-matter **prouve** que ça a marché une fois, quelque part ; on le lit pour adapter, on ne le relance pas tel quel. L'ancienne idée d'un « plancher reproductible headless » (brouillon de cet ADR) est donc écartée : elle décrivait une contrainte qui n'existe pas.
- **Deux couches à ne pas confondre.** La question « CLI ou MCP » vit sur **deux axes** distincts :
  - *Axe A — le transport de la méthode vers l'agent.* Comment l'agent reçoit skills/recettes/règles. Claude Code les lit en **fichiers natifs** (c'est le choix d'ADR-0005 : export statique primaire). Un serveur **MCP** peut, en plus, exposer ce même contenu à d'autres clients. **Prior art :** *Superpowers* est une **librairie de skills** ; *OpenSpec* est un **CLI + des specs dans le repo**. Chacun offre *aussi* un **wrapper MCP** pour les clients qui ne parlent que MCP. Le MCP y est un **transport**, pas la méthode. Donc « superpowers/openspec sont des MCP » est inexact : ils sont skills/CLI, et le MCP est une porte de distribution en plus.
  - *Axe B — l'outil qu'une recette pilote* (le fournisseur : Vercel, IONOS, R2, `act`…). C'est **le sujet de cet ADR**.
- **Le MCP a de vrais atouts comme outil (Axe B) :** entrées/sorties typées (pas de fragilité shell), découvrable par l'agent, et parfois seule voie (IONOS DNS n'a pas de CLI → `dns-ionos-mcp`).
- **Tous les MCP ne se valent pas.** Un **MCP local installable** (stdio, configuré une fois dans le client) ne redemande rien à chaque session. Un **connecteur cloud à OAuth interactif** (Vercel, GitHub) redemande une autorisation par session et ne sert à rien hors session — la table de la recette `lancement-app` le documente déjà. La préférence du PO va aux **MCP locaux**, précisément parce qu'ils évitent ce piège.
- **« Outil » est déjà un concept de première classe** (ADR-0058), mais il ne désigne aujourd'hui que des **scripts**. Un MCP n'est pas encore modélisé comme outil.

## Décision

**D1 — La section « Ustensiles » devient capacité-d'abord.** Chaque entrée nomme une **capacité** (un verbe : « poser un enregistrement DNS », « déposer un binaire », « rejouer la CI en local »), puis **avec quoi** la réaliser. Le gabarit cesse de dire « CLI d'abord ».

**D2 — Ordre de préférence de l'outil, explicite :**
1. **Un MCP qui existe déjà**, de préférence **local et installable** (Claude Desktop/Code). On l'utilise et on **indique comment** (quel serveur MCP, quels verbes).
2. **Sinon, un script local / CLI / API REST** — ce qui marche aujourd'hui sans MCP. « Pour le moment » est assumé : c'est un repli, pas un échec.
3. **Si aucun outil n'existe et qu'il en faut un**, la recette le **note comme outil à créer** (candidat `tool`, cf. ADR-0058).

**D3 — Une note d'honnêteté, pas un verrou.** Quand l'outil d'une capacité est un **connecteur cloud à OAuth interactif** (dépend de la session, meurt hors session, se re-autorise à chaque fois), la recette le **signale**. Ce n'est pas bloquant : c'est une mise en garde de portabilité, pour que le lecteur sache que cet outil se comporte mal en autonomie ou d'un projet à l'autre. Le cas `dns-ionos-mcp` (MCP par token, pas d'OAuth interactif) reste parfaitement légitime.

**D4 — Une règle légère porte D2/D3.** Nouvelle règle `recipe/tools-capability-first` (SHOULD, `agent-check` par `ezk-chef`, comme le reste du bundle) : « la section Ustensiles nomme des capacités ; pour chacune, un outil préféré (MCP local > script/CLI/REST), et un signalement si l'outil est un connecteur à OAuth de session. » Convention jugée, pas moteur.

## Options considérées

### Option A — Statu quo (« CLI d'abord »)
| Dimension | Évaluation |
|---|---|
| Complexité | Nulle (en place) |
| Clarté | Faible : « CLI d'abord » se lit « CLI seul », ne nomme pas la capacité, laisse `dns-ionos-mcp` en exception muette |

**Rejetée :** ne reflète pas la préférence MCP-local du PO, ni la nature transférable des recettes.

### Option B — « Que des MCP »
| Dimension | Évaluation |
|---|---|
| Faisabilité | Mauvaise : beaucoup de fournisseurs n'ont pas de MCP (R2, Lemon Squeezy…) ; certains MCP sont des connecteurs OAuth fragiles |

**Rejetée :** on ne peut pas garantir un MCP pour chaque capacité ; forcer le MCP exclurait des capacités réelles.

### Option C — Capacité d'abord, MCP-local préféré, script sinon (retenue)
| Dimension | Évaluation |
|---|---|
| Complexité | Faible : convention de gabarit + 1 règle SHOULD |
| Coût | Une phrase au gabarit, une règle, jugée par un gardien déjà là (`ezk-chef`) |
| Alignement | Prolonge au niveau doc le port/adaptateur d'ADR-0061 (capacité = port ; MCP/script = adaptateurs) |

**Pour :** épouse la préférence du PO, accueille le MCP sans en dépendre, garde le script comme repli honnête, rend `dns-ionos-mcp` explicable au lieu d'exceptionnel.
**Contre :** « capacité » peut devenir du jargon vide si mal écrit → mitigé en réécrivant **une** recette témoin d'abord.

## Analyse des compromis

Le vrai choix n'est pas CLI **contre** MCP, c'est **nommer la capacité** puis **prendre le meilleur outil disponible**, avec une préférence ordonnée. C'est le motif port/adaptateur d'ADR-0061 appliqué au niveau d'une recette : la capacité est le **port**, le MCP local ou le script sont des **adaptateurs**, et la disponibilité (et la portabilité) décide lequel citer. SOLID au niveau doc : la recette dépend d'une abstraction (la capacité), pas d'un outil concret figé. Aucune contradiction avec ADR-0005 : celui-ci parle du **transport de la méthode** (Axe A), celui-là de **l'outil d'une recette** (Axe B).

## Conséquences

- **Plus facile :** lire une recette (l'intention avant l'outil) ; préférer un MCP local quand il existe ; garder un script sans culpabiliser ; expliquer `dns-ionos-mcp`.
- **Plus dur :** écrire une recette demande de nommer la capacité, pas juste de citer un outil. Léger surcoût de rédaction.
- **À revisiter :** voir les MCP **dans la carte** de la méthode suppose d'étendre ADR-0058 — différé (ci-dessous).

## Explicitement différé

- **Direction B — MCP comme nœud du graphe.** Étendre ADR-0058 pour qu'un `tool` ait une espèce `script | mcp`. Bloqué sur une question non tranchée : **qu'est-ce qui *prouve* un outil MCP ?** Un script a un `fichier:ligne` ; un MCP n'a qu'une config (`.mcp.json`) ou une entrée de manifeste. À cadrer avant d'ajouter l'espèce. Non nécessaire pour D1–D4.
- **Axe A — un transport MCP de la méthode** (exposer skills/recettes vectorz à d'autres clients, comme *Superpowers MCP* le fait). C'est le « mode dynamique MCP » déjà différé par ADR-0005. Hors sujet ici.

## Action items (si on exécute)

1. [ ] Réécrire **une** recette témoin (`lancement-app`, qui a déjà sa table CLI/MCP) au format capacité-d'abord — vérifier qu'elle est plus claire, pas moins.
2. [ ] Amender `recipes/RECIPE_TEMPLATE.md` : section « Ustensiles » → « capacité d'abord ; MCP local préféré, script sinon ; signaler un connecteur OAuth de session ».
3. [ ] Ajouter la règle `rules/recipe/tools-capability-first.md` (SHOULD, gardien `ezk-chef`).
4. [ ] Noter dans `dns-ionos-mcp` qu'elle est MCP-par-token (pas d'OAuth interactif) : cas sain, pas une exception.
