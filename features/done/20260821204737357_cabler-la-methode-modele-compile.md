---
id: "20260821204737357"
title: "Compiler la méthode en un seul graphe que tout le monde lit"
type: feature
priority: P0
product: mega-city
version: v0.1.0
milestone: fondation
labels: [socle]
status: shipped
pr: "#265"
created: 2026-08-21
---

# Comment câbler la méthode pour qu'elle soit enfin lisible

## En clair

Le graphe de la méthode est **compilé une fois en un seul objet**, et la carte le lit : ces deux
morceaux sont livrés. Il restait trois choses, que ce sprint ferme. Un **seul vocabulaire** de
4 verbes remplace les 5 mots de lien, sans rien renommer sur disque. Les liens **skill → règle**
passent par des **ids** au lieu de chemins, et un validateur signale tout oubli. La **note BMAD**
est écrite. Ce qui n'entre pas dans ce premier incrément est écrit plus bas, en « Suite ».

## Où on en est (2026-09-30)

| Geste de la recommandation | État |
|---|---|
| 1. Compiler le graphe en un objet unique | **Livré.** `graph:compile` (commit `a4858f2`), carte branchée dessus (PR #234). |
| 2. Unifier les 5 mots de lien | **Livré par ce sprint.** 4 verbes fermés, posés comme alias dans le compilateur. Aucun champ renommé. |
| 3. Liens structurels par id, pas par chemin | **Premier incrément livré par ce sprint.** Champ `applies:` + validateur. Reliquat en « Suite ». |
| Note BMAD | **Livrée par ce sprint**, dans l'[ADR-0040](../../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md). |

## Le vocabulaire tranché

Quatre verbes, fermés. Chacun garde un couple « source → cible » précis, donc le typage tient.
Les champs sur disque ne bougent pas (décision D1 de l'ADR-0040).

| Verbe | Se lit | Champs qui le portent |
|---|---|---|
| **compose** | « X est fait de Y » | `composes` (skill → skill) · `competences` (agent → skill) · bundles et profils (`extends`, `rules`, `bundles`, `agents`, `skills`) |
| **convoque** | « X fait venir le rôle Y » | `roles` (skill → agent) · `participants` (règle d'interaction → agent) |
| **applique** | « X suit la règle Y » | `interactions` (agent → règle, profil → règle) · **nouveau** `applies` (skill → règle) |
| **est-vérifié-par** | « la règle X est contrôlée par Y » | `enforcements` de type `agent-check` (règle → agent) |

Cinq mots deviennent quatre. `composes` et `competences` disaient la même chose vue de deux
côtés : « je suis fait de ces briques ». Ils partagent donc le verbe **compose**.

## Critères d'acceptation

- [x] Un `pnpm` émet le graphe complet de la méthode en un objet typé (pas un Mermaid).
      Preuve : `pnpm --dir products/mega-city graph:compile`, commit `a4858f2`.
- [x] La webapp lit cet objet — aucune arête peinte à la main ne subsiste.
      Preuve : PR #234 et le test de parité `map-data-graph-parity.test.ts`.
- [x] Les 5 vocabulaires de lien sont tranchés en 4 verbes fermés, par alias dans le compilateur.
      Chaque arête compilée porte son `verb`. Un test refuse tout lien sans verbe. Aucun champ renommé.
      Preuve : PR #265, test `graph-vocabulary.test.ts`.
- [x] `graph:query` accepte un verbe **ou** un lien, en sens direct ou inverse
      (« qui applique cette règle ? » sans grep).
- [x] **Incrément** des références structurelles par id : le champ `applies:` (skill → règle) est lu
      par le graphe, et un id inconnu fait échouer la compilation. `graph:check` signale tout lien
      markdown par chemin vers un skill, un agent ou une règle qui n'est pas déclaré par id.
      Le catalogue réel est à **0** signalement (les liens existants sont déclarés).
      Preuve : PR #265, tests `structural-refs.test.ts` (dont l'invariant sur le catalogue réel).
- [x] BMAD : la note « ce qu'on reprend / ce qu'on écarte » est écrite dans l'ADR-0040.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:compile
pnpm --dir products/mega-city graph:query est-verifie-par clean-code/no-dead-code
pnpm --dir products/mega-city graph:query applique documentation-guidelines/human-facing-lisibility --inverse
pnpm --dir products/mega-city graph:check
```

- La 2e commande répond `ezk-reviewer` sans aucun grep. La 3e liste les 7 skills qui suivent la règle.
- La 4e sort `0 lien cassé` et `0 référence par chemin non déclarée`.
- **Sabotage A.** Écrire `applies: [regle-inexistante]` dans un `SKILL.md` : `graph:compile` refuse et nomme l'id.
- **Sabotage B.** Retirer `applies:` d'un skill qui garde son lien markdown vers une règle :
  `graph:check` sort en erreur et donne `fichier:ligne`.

## Suite (reliquat assumé de ce premier incrément)

- **Rule → rule.** Trois liens par chemin existent entre règles (`fiche-read-via-loader`,
  `merge-when-absent-default`). Aucun champ d'id n'existe pour cette relation. `graph:check` les
  liste en information, sans bloquer. Il faut d'abord choisir le verbe.
- **La carte** ne montre pas encore les liens « applique » skill → règle (elle les compte déjà).
- **`bind`** ne vérifie pas encore qu'une règle citée par `applies:` est bien dans le profil.
- **La prose** garde ses liens markdown pour la lecture (décision de la recommandation). Les ~600
  liens des fiches et des docs restent couverts par `check-links`, pas par le graphe.

## Sujet d'origine (2026-08-21, conservé)

Le sujet n'est pas samplerz — c'était un exemple. Le sujet, c'est **vectorz et la méthode
elle-même** : elle est un peu en bazar, et on veut la représenter **telle qu'elle est**
pour savoir quoi corriger. Le nœud du problème tient en une phrase : **aujourd'hui le
graphe de la méthode est re-deviné à chaque fois à partir de 30 fichiers, au lieu d'être
compilé une fois en un seul objet que tout le monde lit.** C'est la vraie cause du bazar,
et c'est aussi ce qui rend la webapp non fiable.

## Le constat, chiffré

La méthode a **déjà un modèle typé** : `products/mega-city/docs/domain.ts` (187 lignes)
définit proprement Rule, Bundle, Skill, Agent, Profile et les types de liens. Le problème
n'est donc **pas** l'absence de modèle. C'est que les **données** de ce modèle — les liens
réels — vivent éparpillées :

| Où vivent les liens aujourd'hui | Combien |
|---|---|
| `composes:` (skill → skills) dans des frontmatter | 11 fichiers |
| `enforcements:` (règle → qui la vérifie) | 14 fichiers |
| `competences:` (agent → skills) | 3 fichiers |
| `roles:` (orchestrateur → agents) | 2 fichiers |
| `interactions:` (agent → règles) | 2 fichiers |
| liens de prose (crochets + chemin `.md`) | ~600, qui cassent à chaque `ship` |

**Cinq mots différents pour « X est lié à Y », plus des liens markdown fragiles.** Pour
voir le graphe, il faut lancer un générateur qui relit tous les fichiers — et il n'émet
qu'**un bloc Mermaid**, jamais un objet interrogeable. La webapp, elle, n'a aujourd'hui
**rien à lire** : elle est peinte à la main (d'où le problème fondateur de l'épic — des
liens devinés par un LLM).

## Q1 — « la gestion des liens en markdown n'est pas adaptée ». Exact, et pour deux raisons distinctes

1. **Les liens de prose — un libellé suivi d'un chemin `.md` — encodent la structure dans
   un chemin de fichier.** Déplacer une fiche (`ship` la range dans `done/`) casse le lien. C'est toute
   la saga `check-links.sh` : on rattrape à la main un problème qu'on a créé en mettant du
   sens structurel dans un chemin. Un chemin n'est pas une identité.
2. **Le câblage en frontmatter est fragmenté.** Cinq champs, 30 fichiers, aucun endroit
   unique où lire ou interroger le graphe. On ne peut pas demander « qui applique cette
   règle ? » sans grep. La donnée existe, mais elle n'est **jamais rassemblée**.

Racine commune : **le graphe est DÉRIVÉ par reconstruction, jamais STOCKÉ comme objet de
première classe.**

## Q2 — « une autre approche pour lier tout ça sans frontmatter ? est-ce une bonne idée ? »

C'est le bon instinct, mais la réponse n'est pas « supprimer le frontmatter ». C'est un
arbitrage entre deux endroits où la déclaration peut vivre :

| Approche | Avantage | Défaut |
|---|---|---|
| **Frontmatter co-localisé** (aujourd'hui) | le lien vit **à côté** de la chose → on n'oublie pas de le mettre à jour quand on touche le skill | éparpillé, non interrogeable, 5 dialectes |
| **Un manifeste central** (un seul fichier graphe) | interrogeable, un seul endroit, un seul format | **dérive** : on édite le skill, on oublie le manifeste |
| **Modèle compilé** (recommandé) | garde la co-localisation ET produit un objet unique interrogeable | demande une étape de compilation (elle existe déjà à moitié) |

**La bonne idée n'est pas de quitter le frontmatter — c'est de le COMPILER.** On garde la
déclaration à côté de chaque skill/agent/règle (pour ne pas perdre la localité), mais un
script la **compile en UN seul objet typé** (le graphe), et **tout le lit** : la webapp,
les vérificateurs, les diagrammes. C'est exactement la « rampe vers un modèle typé » que
le skill `ezk-diagram` avait déjà notée comme évolution, et que `domain.ts` avait déjà
préparée côté types. Il manque juste l'instance compilée.

## Q3 — « comment fait BMAD avec son code ? »

Vérifié sur le tag archivé `epoch-1-bmad-final` (le cœur BMAD n'est pas vendoré ici ; les
**prises** le sont) + connaissance générale de BMAD. Le point important : **BMAD ne fait
rien de magique.** Il fait la même chose, en plus discipliné.

- **Une taxonomie stricte de fichiers** : agents, tasks, templates, checklists, workflows,
  agent-teams, data — chacun un type, pas cinq mots pour la même relation.
- **UN bloc de dépendances par agent** : l'agent liste les tasks/templates/checklists
  qu'il utilise, par identifiant — un seul vocabulaire, pas cinq.
- **Une équipe compose des agents par id** (fichier `agent-team`), comme un profil.
- **Une étape de BUILD** qui résout tout ça et **aplatit en un seul fichier** livré au LLM
  — exactement le rôle du `bind` de mega-city.
- **Des prises d'overlay** (`*.customize.yaml`, structure `persona / critical_actions /
  memories / menu / prompts`) qui personnalisent **sans toucher la source**.

**La leçon** : BMAD = déclarations co-localisées + **un** vocabulaire + une taxonomie
stricte + un build qui compile en un objet. Mega-city a déjà le build (`bind`) et le
modèle typé (`domain.ts`). Ce qui lui manque face à BMAD : **un seul vocabulaire de lien**
et **un graphe compilé**. On n'a pas à copier BMAD — on a à finir ce qu'on a commencé.

## La recommandation — trois gestes

1. **Compiler le graphe en un objet unique.** `domain.ts` est le schéma ; il manque
   l'**instance** : un `pnpm` qui lit tous les frontmatter et émet UN graphe (JSON typé).
   La webapp lit **ça**, plus jamais les fichiers un par un → chaque trait dessiné a une
   source **par construction** (ça résout le problème fondateur de l'épic).
2. **Unifier les 5 mots de lien.** `composes` / `roles` / `competences` / `interactions` /
   `enforcements` se recouvrent et se confondent. Décision de conception à trancher : un
   vocabulaire cohérent (par ex. distinguer *compose une brique* / *convoque un rôle* /
   *applique une règle* / *est vérifié par*). C'est le vrai travail de fond.
3. **Les liens structurels deviennent des identifiants, pas des chemins markdown.** La
   prose garde ses liens markdown pour la lecture ; mais « le skill X applique la règle Y »
   est un **id résolu par le modèle**, pas un chemin fragile. Ça tue le `check-links` rot
   pour toute la partie structurelle.

## Ce que ça débloque

- **La webapp devient fiable** : elle affiche le graphe compilé, donc **tout est sourcé** —
  fin de l'interprétation LLM, qui est la raison d'être de l'épic parent.
- **On voit enfin la méthode telle qu'elle est** : un seul objet, interrogeable, d'où les
  incohérences sautent aux yeux (« cette règle n'est appliquée par personne », « ce skill
  ne compose rien »).
- **Corriger un lien** = éditer un frontmatter + recompiler ; la carte suit toute seule
  (fille « corriger un lien faux » de l'épic).

> Les critères d'acceptation et la vérification d'origine sont remontés en tête de fiche,
> mis à jour sur le reste réel.

## Notes

- **Décision PO du 2026-08-21 (doctrine)** : la règle « pas d'outillage sans preuve dans ≥ 2
  projets » (ADR-0013) **n'est pas un interdit** — c'est une **question** (« pourquoi pas
  maintenant ? »). Le PO peut savoir à l'avance ce qui va servir. À reporter dans ADR-0013
  (amendement) : garde-fou, pas barrière. Ça débloque ce chantier-ci, qui sert la méthode
  entière et n'a pas à attendre un « 2e projet ».
- Fiche sœur : « la carte ne montre pas LA LOI » (`20260821172716537`) — cette compilation
  est ce qui la rend possible proprement.
- Le modèle typé était **déjà prévu** : `ezk-diagram` (note « rampe vers un modèle typé »),
  `domain.ts` (schéma), `bind` (build). Ce chantier ne crée pas un concept — il **relie**
  trois pièces existantes.
- **Confirmé par le benchmark (2026-08-25)** — le rapport
  [BMAD vs ezk](../../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md) (Dim 5) montre la cible
  concrète : BMAD **compile** ses manifests (`agent-manifest.csv`, `bmad-help.csv`, empreintes SHA-256)
  en une couche de build séparée, alors qu'ezk a le **schéma** (`domain.ts`) sans **instance**. C'est le
  seul point où BMAD gagne franchement côté modèle — un argument de plus pour ce chantier.
