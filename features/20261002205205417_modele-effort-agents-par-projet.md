---
id: "20261002205205417"
title: "Régler le modèle et l'effort de chaque agent, projet par projet"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [installation, ezk-map]
status: idea
pr:
evidence: auto
created: 2026-10-02
---

# 20261002205205417 — Régler le modèle et l'effort de chaque agent, projet par projet

**En clair.** Aujourd'hui, chaque agent a un seul modèle, le même dans tous tes projets. Tu ne
peux donc pas essayer Opus 5.5 sur samplerz sans le changer aussi pour vectorz. Cette fiche
ajoute un réglage par projet : pour chaque agent, un modèle et un effort, rangés dans la config du
projet. Tu le vois et tu le modifies depuis le tableau de bord. Sans réglage, rien ne change.

**Si tu arrives frais.** Un *agent* est un rôle de l'équipe : architecte, PO, reviewer, dev… Chacun
est décrit dans un fichier de `products/mega-city/agents/`. L'*effort* dit combien l'agent
réfléchit avant de répondre : `low`, `medium`, `high`, `xhigh` ou `max`. Le *tableau de bord* est
la page web locale de la méthode, ouverte par `ezk dashboard`.

## Contexte / Problème

Le PO pilote plusieurs projets avec la méthode : vectorz, samplerz, muti… Le 2026-10-02, il veut
tester sur samplerz **Opus 5.5 en effort « extra »** pour les agents qui décident : architecte, PO,
reviewer. Les autres projets doivent garder leur réglage.

Aujourd'hui, c'est impossible.

- **Le modèle est écrit dans le fichier de l'agent.** `ezk-architect.md` porte
  `model: claude-opus-4-8` et `effort: high`. `ezk-pm` et `ezk-reviewer` aussi. Le dev, la QA et
  le steward sont sur `sonnet`.
- **Tous les projets lisent les mêmes fichiers.** L'install globale pose des liens vers le dépôt
  vectorz. Changer un modèle pour samplerz le change partout.
- **La config par projet existe, mais ne parle pas des agents.** `.vectorz/config.yml` ne règle
  que GitHub : PR, CI, revue Codex. `ezk config` sait déjà la lire et l'écrire.
- **Le tableau de bord ne montre pas la config d'un projet.** La fiche sœur du cockpit prévoit une
  page « config », mais en lecture seule.

**Valeur.** Tu choisis la puissance, donc le coût, projet par projet. Tu peux tester un nouveau
modèle sur un projet cobaye sans risquer les autres. Et tu vois d'un coup d'œil quel cerveau
travaille sur quel projet.

## Proposition

Trois morceaux, du plus simple au plus visible.

**1. Une section `agents:` dans la config du projet.** Pour chaque agent, un modèle et un effort.
Une valeur absente garde le défaut écrit dans le fichier de l'agent. Exemple pour samplerz :

```yaml
# samplerz/.vectorz/config.yml
agents:
  ezk-architect: { model: claude-opus-5-5, effort: xhigh }
  ezk-pm:        { model: claude-opus-5-5, effort: xhigh }
  ezk-reviewer:  { model: claude-opus-5-5, effort: xhigh }
```

Une valeur inconnue est refusée, avec un message clair. Sinon Claude Code la remplacerait en
silence par un autre modèle (constat de la fiche 0144).

**2. Le réglage arrive vraiment à l'agent.** C'est le point dur. Il se tranche avec l'architecte au
grooming. Deux pistes :

- **A — des agents propres au projet.** Le `bind` du projet pose ses propres agents dans
  `.claude/agents/`, avec le modèle de la config. Claude Code préfère l'agent du projet à l'agent
  global du même nom. Contrainte : le texte du rôle ne doit pas être recopié (ADR-0048). Le
  fichier du projet doit donc être un lien ou un pointeur.
- **B — le réglage passé à l'appel.** Les commandes qui lancent un agent lisent la config et
  passent le modèle à l'appel. À vérifier : quels noms de modèle l'appel accepte, et s'il accepte
  un effort.

Dans les deux cas, un seul point calcule « projet + agent → modèle + effort ». Ce point laisse une
place à l'hôte (Claude Code, Cursor) : la fiche multi-client le réutilisera.

**3. Voir et modifier, en terminal et dans le tableau de bord.**

- `ezk --root <projet> config` affiche, pour chaque agent, le modèle et l'effort effectifs, et leur
  source : défaut ou projet.
- Une commande `ezk config` modifie le réglage d'un agent. Elle réutilise l'écriture actuelle, qui
  garde les commentaires du fichier.
- La page « config » du tableau de bord gagne une section « Agents » : le même tableau, chaque
  ligne modifiable. L'écriture passe par le même code que la commande.

**Hors périmètre.**

- Les commandes (skills) : elles tournent dans ta session, avec le modèle choisi dans l'app.
  Décision PO du 2026-10-02 : les agents d'abord.
- Cursor : c'est la fiche multi-client, qui ajoutera l'axe « hôte ».

## Critères d'acceptation

- [ ] Sans section `agents:` dans la config, chaque agent garde exactement le modèle et l'effort
      de son fichier. Rien ne change pour un projet qui ne règle rien.
- [ ] Avec la section de l'exemple dans samplerz, l'architecte lancé dans samplerz tourne sur le
      modèle et l'effort réglés. Le même agent lancé dans vectorz garde son défaut.
- [ ] Le rôle d'un agent reste écrit à un seul endroit. Le réglage par projet ne recopie pas son
      texte.
- [ ] Un modèle ou un effort invalide est refusé. Le message nomme l'agent et la valeur. La valeur
      n'est jamais remplacée en silence.
- [ ] `ezk --root <projet> config` affiche, pour chaque agent, le modèle, l'effort et leur source.
- [ ] Une commande `ezk config` modifie le réglage d'un agent sans effacer les commentaires du
      fichier.
- [ ] Le tableau de bord montre ce tableau pour le projet choisi et permet d'en modifier une
      ligne. Ensuite, `ezk config` affiche la nouvelle valeur.
- [ ] Le calcul « projet + agent → modèle + effort » est une fonction pure, testée. Il accepte un
      hôte en plus, sans changer de forme.

## Comment vérifier

Les noms exacts des sous-commandes se fixent au grooming. La procédure, elle, ne bouge pas.

```bash
# 1. non-régression : la gate mega-city reste verte
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts

# 2. régler l'architecte de samplerz, puis comparer les deux projets
ezk --root <chemin-de-samplerz> config agents set ezk-architect --model claude-opus-5-5 --effort xhigh
ezk --root <chemin-de-samplerz> config   # → ezk-architect : claude-opus-5-5 · xhigh · projet
ezk config                               # depuis vectorz → ezk-architect : claude-opus-4-8 · high · défaut

# 3. une valeur invalide est refusée, avec l'agent et la valeur dans le message
ezk --root <chemin-de-samplerz> config agents set ezk-architect --effort extra
```

4. Dans samplerz, lancer l'architecte et constater le modèle utilisé. La preuve dépend de la piste
   retenue : le fichier d'agent du projet (piste A) ou la trace de l'appel (piste B).
5. `ezk dashboard` → choisir samplerz → page « config » → section « Agents ». Le tableau est le
   même qu'à l'étape 2. Modifier une ligne, puis relancer `ezk --root <chemin-de-samplerz> config`.

## Glossaire

- `bind` — la commande qui installe agents, skills et règles dans un projet ou dans `~/.claude`.
- `hôte` — l'outil qui fait tourner les agents : Claude Code aujourd'hui, Cursor demain.
- `ADR` — une décision d'architecture écrite, rangée dans `products/mega-city/docs/adr/`.
- `grooming` — la séance qui fait mûrir une fiche jusqu'à ce qu'elle soit prête à construire.

## Notes / décisions

- **Créée le 2026-10-02** à la demande du PO. Décisions prises à la création : une nouvelle fiche
  plutôt qu'enrichir la fiche multi-client ; P1 ; version V0.6, jalon `cockpit` ; les agents
  d'abord, pas les commandes.
- **« Effort extra » lu comme `xhigh`.** La liste des efforts vient de
  `products/mega-city/docs/domain.ts`, ligne 134. À confirmer au grooming.
- **Questions ouvertes au grooming.**
  - Piste A ou B, avec l'architecte.
  - Régler agent par agent, ou par famille : « performant » pour architecte, PO et reviewer,
    « économe » pour les autres ? La demande parle du « modèle performant des agents importants ».
    L'ADR-0047 a écarté les familles pour l'axe hôte (décision D5). À reconfirmer pour l'axe projet.
  - La liste des modèles acceptés : où la tenir, et qui l'ajoute quand un modèle sort.
  - L'ordre avec la fiche du tableau de bord. Si sa page « config » n'existe pas encore, livrer
    d'abord le fichier et `ezk config`, le tableau de bord ensuite.
- **Dépendance : `ezk --root <projet> config` n'existe pas encore** (constaté le 2026-10-02).
  `ezk config` ne lit que le projet courant. La fiche du tableau de bord ajoute `--root` dans ses
  critères. Si elle n'est pas livrée avant, cette fiche le construit, une seule fois.
- **Fiches liées.**
  - [ezk multi-client : cap Cursor + modèle & effort configurables par hôte](20260901173549334_ezk-multi-client-cursor-modeles-par-hote.md) :
    même calcul, axe « hôte ». Parkée.
  - [Un seul tableau de bord pour tous tes projets](20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md) :
    la page « config » où s'ajoute la section « Agents ». Même version V0.6.
  - [Frontmatter des agents : model, effort, isolation](done/0144-frontmatter-tuning-agents-model-effort-isolation.md)
    et [sérialiser model/effort dans les caps](done/0148-serialiser-model-effort-isolation-dans-les-caps.md) :
    l'origine des champs `model` et `effort`.
- **Décisions d'architecture à lire.**
  [ADR-0047](../products/mega-city/docs/adr/0047-multi-client-cursor-et-modeles-par-hote.md) (modèles par hôte),
  [ADR-0048](../products/mega-city/docs/adr/0048-contenu-mono-source-modele-en-surcouche.md) (le rôle à un seul endroit),
  [ADR-0050](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md) (la couche `.vectorz/` du projet),
  et la doctrine des modèles : [`ezk-model-and-lisibility.md`](../products/mega-city/docs/ezk-model-and-lisibility.md).
- **Code existant à réutiliser.** Le lecteur de config :
  `products/mega-city/src/loaders/project-config.ts`. La commande : `products/mega-city/bin/ezk-config.ts`.
