---
id: "20260821204737357"
title: Câbler la méthode par un modèle compilé, pas 30 frontmatter — et ce que BMAD apprend
type: feature
priority: P1
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---

# Comment câbler la méthode pour qu'elle soit enfin lisible

## En clair

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

## Critères d'acceptation

- [ ] Un `pnpm` émet le graphe complet de la méthode en un objet typé (pas un Mermaid).
- [ ] La webapp lit cet objet — aucune arête peinte à la main ne subsiste.
- [ ] Les 5 vocabulaires de lien sont tranchés en un jeu cohérent (ou justifiés distincts).
- [ ] Les références structurelles skill/agent/règle passent par id, plus par chemin markdown.
- [ ] BMAD : la note « ce qu'on reprend / ce qu'on écarte » est écrite (co-localisation +
      un vocabulaire + build oui ; taxonomie et bundling à leur échelle = à juger).

## Comment vérifier

Aujourd'hui (analyse) : ouvrir `domain.ts` et constater que le schéma existe mais qu'aucune
instance compilée n'est produite. Après construction : demander au graphe « qui applique la
règle `clean-code/no-dead-code` ? » et obtenir une réponse **sans grep**. Sabotage : ajouter
une arête dans un frontmatter → elle apparaît dans l'objet compilé ET sur la webapp, sans
retouche manuelle.

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
