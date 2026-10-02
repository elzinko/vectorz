---
id: "20261002205205417"
title: "Régler le modèle et l'effort de chaque agent, projet par projet"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [installation, ezk-map]
status: ready
pr:
evidence: auto
created: 2026-10-02
---

# 20261002205205417 — Régler le modèle et l'effort de chaque agent, projet par projet

**En clair.** Aujourd'hui, chaque agent a un seul modèle, le même dans tous tes projets. Tu ne
peux donc pas essayer Opus 5.5 sur samplerz sans le changer aussi pour vectorz. Cette fiche range
les agents en trois niveaux : performant, standard, économe. Chaque projet dit quel modèle et quel
effort mettre derrière chaque niveau, et peut régler un agent à part. Tu le vois et tu le modifies
depuis le tableau de bord. Sans réglage, rien ne change.

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

**1. Des niveaux plutôt que des noms de modèle.** Chaque agent appartient à un niveau. Le niveau
dit de quoi l'agent a besoin. Le projet dit quel modèle et quel effort mettre derrière.

| Niveau | Agents | Défaut de la méthode |
|---|---|---|
| performant | architecte, PO, reviewer | `claude-opus-4-8` · `high` |
| standard | dev, QA, archive | `sonnet` · `medium` |
| économe | steward, chef | `sonnet` · `low` |

Les défauts reprennent exactement les réglages d'aujourd'hui. Un projet qui ne règle rien ne voit
aucune différence.

Le projet règle un niveau en une ligne. Pour un cas à part, il saisit directement le modèle d'un
agent : c'est le repli. Exemple pour samplerz :

```yaml
# samplerz/.vectorz/config.yml
modeles:
  performant: { model: claude-opus-5-5, effort: xhigh }   # architecte, PO, reviewer
  # standard et économe : non réglés → défaut de la méthode
agents:                                                   # le repli : un agent réglé à part
  ezk-reviewer: { model: claude-opus-4-8, effort: high }
```

L'ordre de priorité :

1. le réglage de l'agent ;
2. le niveau réglé par le projet ;
3. le défaut de la méthode.

Une valeur inconnue est refusée, avec un message clair. Sinon Claude Code la remplacerait en
silence par un autre modèle (constat de la fiche 0144).

**2. Le réglage arrive à l'agent par un pointeur mince, posé dans le projet.**

```
~/.claude/agents/ezk-architect.md          agent global : claude-opus-4-8 · high (inchangé)
samplerz/.claude/agents/ezk-architect.md   pointeur : claude-opus-5-5 · xhigh
                                           + « joue le rôle écrit dans <source> »
```

Claude Code préfère l'agent du projet à l'agent global du même nom. Le pointeur porte le modèle et
l'effort, puis charge le rôle depuis sa source. Le texte du rôle n'est donc jamais recopié
(ADR-0048). Le `bind` du projet n'écrit un pointeur que pour un agent dont le réglage diffère du
défaut. Ce pointeur est prouvé avec Cursor depuis le 2026-09-04. Il reste à le prouver avec Claude
Code : c'est la première marche du build.

Un seul point calcule « projet + agent → modèle + effort ». C'est une fonction pure, qui laisse une
place à l'hôte. La fiche multi-client n'aura qu'à traduire trois niveaux en noms Cursor, au lieu de
huit agents.

Piste écartée : passer le modèle au moment de l'appel de l'agent. L'appel n'accepte que des noms
courts (`opus`, `sonnet`…), et pas d'effort.

**3. Voir et modifier, en terminal et dans le tableau de bord.**

- `ezk --root <projet> config` affiche, pour chaque agent : son niveau, son modèle, son effort, et
  la source de la valeur. La source est le défaut, le niveau du projet ou le réglage de l'agent.
- Une commande `ezk config` règle un niveau ou un agent. Elle réutilise l'écriture actuelle, qui
  garde les commentaires du fichier. Puis elle met à jour les pointeurs du projet.
- La page « config » du tableau de bord gagne une section « Agents » : le même tableau. On y
  modifie un niveau ou un agent. L'écriture passe par le même code que la commande.
- Cette écriture est la deuxième du tableau de bord. L'[ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)
  n'en autorise qu'une, les pouces 👍/👎 : cette fiche l'amende. La nouvelle route reprend les mêmes
  gardes, et n'écrit que dans `.vectorz/config.yml` du projet choisi.

**Hors périmètre.**

- Les commandes (skills) : elles tournent dans ta session, avec le modèle choisi dans l'app.
  Décision PO du 2026-10-02 : les agents d'abord.
- Cursor : c'est la fiche multi-client, qui ajoutera l'axe « hôte ».

## Critères d'acceptation

- [ ] Sans section `modeles:` ni `agents:`, chaque agent garde exactement son modèle et son effort
      d'aujourd'hui. Le `bind` n'écrit aucun pointeur dans le projet.
- [ ] Les trois niveaux par défaut valent exactement les réglages des fichiers d'agents. Un test
      casse si l'un des deux bouge sans l'autre.
- [ ] Régler `performant` dans samplerz fait tourner l'architecte, le PO et le reviewer de samplerz
      sur ce modèle et cet effort. Les mêmes agents lancés dans vectorz gardent leur défaut.
- [ ] Un agent réglé à part l'emporte sur son niveau.
- [ ] Le pointeur ne recopie pas le rôle. Modifier le rôle source une fois suffit, pour tous les
      projets.
- [ ] Un modèle, un effort, un niveau ou un agent inconnu est refusé. Le message nomme la clé et la
      valeur. Rien n'est remplacé en silence.
- [ ] `ezk --root <projet> config` affiche, pour chaque agent : niveau, modèle, effort et source.
- [ ] Modifier un réglage par la commande garde les commentaires du fichier et met les pointeurs du
      projet à jour. Revenir au défaut retire le pointeur.
- [ ] Le tableau de bord montre ce tableau pour le projet choisi. Il permet de modifier un niveau ou
      un agent. Ensuite, `ezk config` affiche la nouvelle valeur.
- [ ] La route qui écrit la config refuse tout ce que refuse celle des pouces (ADR-0057) : méthode,
      `Host`, `Origin`, type, taille, projet inconnu. Elle refuse aussi un niveau, un agent ou une
      valeur inconnus. Un amendement de l'ADR-0057 consigne cette deuxième écriture.
- [ ] Le calcul « projet + agent → modèle + effort » est une fonction pure, testée. Il accepte un
      hôte en plus, sans changer de forme.

## Comment vérifier

Les noms exacts des sous-commandes se fixent au build. La procédure, elle, ne bouge pas.

```bash
# 1. non-régression : la gate mega-city reste verte
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts

# 2. régler le niveau performant de samplerz, puis comparer les deux projets
ezk --root <chemin-de-samplerz> config modeles set performant --model claude-opus-5-5 --effort xhigh
ezk --root <chemin-de-samplerz> config   # → ezk-architect : performant · claude-opus-5-5 · xhigh · niveau du projet
ezk config                               # depuis vectorz → ezk-architect : performant · claude-opus-4-8 · high · défaut

# 3. le pointeur est posé dans samplerz : il porte le modèle, pas le texte du rôle
head -8 <chemin-de-samplerz>/.claude/agents/ezk-architect.md

# 4. un agent réglé à part l'emporte sur son niveau
ezk --root <chemin-de-samplerz> config agents set ezk-reviewer --model claude-opus-4-8 --effort high
ezk --root <chemin-de-samplerz> config   # → ezk-reviewer : performant · claude-opus-4-8 · high · réglage de l'agent

# 5. une valeur invalide est refusée, avec la clé et la valeur dans le message
ezk --root <chemin-de-samplerz> config modeles set performant --effort extra
```

6. Dans samplerz, lancer l'architecte. Puis lire le modèle et l'effort dans le journal de ce
   sous-agent : Claude Code note les deux pour chaque réponse, sous-agents compris (constaté le
   2026-10-03).

   ```bash
   grep -hoE '"(model|effort)":"[^"]*"' ~/.claude/projects/<dossier-de-samplerz>/*/subagents/*.jsonl | sort | uniq -c
   # → "model":"claude-opus-5-5" et "effort":"xhigh"
   ```

7. `ezk dashboard` → choisir samplerz → page « config » → section « Agents ». Le tableau est le
   même qu'à l'étape 2. Modifier une ligne, puis relancer `ezk --root <chemin-de-samplerz> config`.

## Glossaire

- `niveau` — ce dont un agent a besoin : performant, standard ou économe. Le projet dit quel modèle
  et quel effort mettre derrière chaque niveau.
- `pointeur mince` — un petit fichier d'agent posé dans le projet. Il porte le modèle et l'effort,
  puis dit à l'agent de jouer le rôle écrit ailleurs. Il ne recopie pas ce rôle.
- `bind` — la commande qui installe agents, skills et règles dans un projet ou dans `~/.claude`.
- `hôte` — l'outil qui fait tourner les agents : Claude Code aujourd'hui, Cursor demain.
- `ADR` — une décision d'architecture écrite, rangée dans `products/mega-city/docs/adr/`.
- `grooming` — la séance qui fait mûrir une fiche jusqu'à ce qu'elle soit prête à construire.

## Notes / décisions

- **Créée le 2026-10-02** à la demande du PO. Décisions prises à la création : une nouvelle fiche
  plutôt qu'enrichir la fiche multi-client ; P1 ; version V0.6, jalon `cockpit` ; les agents
  d'abord, pas les commandes.
- **Prête le 2026-10-03** (porte de « prête » passée : problème, valeur, critères et dépendances
  constatées). Le critère « tableau de bord » suppose la page « config » de la fiche du tableau de
  bord. **Ordre fixé par le PO le 2026-10-03 : le tableau de bord d'abord, cette fiche ensuite.**
- **Groomée le 2026-10-02 : des niveaux, avec un repli par agent.** Le PO veut « faire abstraction
  des modèles » ; si c'est trop compliqué, « saisir le nom du modèle et l'effort ». Les deux tiennent
  ensemble : trois niveaux, plus un réglage par agent qui l'emporte. Le mécanisme retenu est le
  pointeur mince (ADR-0048). L'appel avec modèle est écarté.
- **Cette fiche rouvre l'alternative D de l'ADR-0047.** L'ADR avait écarté les niveaux le
  2026-09-03, faute de vouloir réécrire les agents et toucher la config Claude. Ici, la config Claude
  ne bouge pas : les défauts reprennent les réglages actuels. L'ADR l'annonçait « réintroductible
  sans rien casser ». Au build : un amendement à l'ADR-0047 consigne cette réouverture.
- **« Effort extra » lu comme `xhigh`.** La liste des efforts vient de
  `products/mega-city/docs/domain.ts`, ligne 134. Validé par le PO avec la proposition.
- **Dépendances.**
  - Dépendance samplerz — accès constaté le 2026-10-03. Dépôt git dans `~/git/samplerz`, sur `main`.
    Il n'a ni `.claude/agents/` ni `.vectorz/` : un pointeur n'y écraserait rien.
  - Dépendance modèle `claude-opus-5-5` avec `effort: xhigh` dans un fichier d'agent — accès
    constaté le 2026-10-03, par l'essai ci-dessous.
  - Dépendance pointeur mince avec Claude Code — constaté le 2026-10-03 (Claude Code 2.1.274).
    Jusque-là, il n'était prouvé qu'avec Cursor. Trois preuves, toutes réunies :
    1. l'agent du projet prend le pas sur l'agent global du même nom ;
    2. le journal du sous-agent dit `"model":"claude-opus-5-5"` et `"effort":"xhigh"`, et non
       `claude-opus-4-8` · `high`, le réglage de l'agent global ;
    3. l'agent cite « Tu es l'architecte de l'équipe. » et nomme le fichier source lu. Le pointeur
       ne contenait pas cette phrase : le rôle a bien été chargé, pas recopié.

    L'essai, depuis un dossier jetable :

    ```bash
    # .claude/agents/ezk-architect.md du dossier jetable = pointeur :
    #   front-matter  name: ezk-architect · model: claude-opus-5-5 · effort: xhigh
    #   corps         « lis <vectorz>/products/mega-city/agents/ezk-architect.md et joue ce rôle »
    claude -p "Lance le sous-agent ezk-architect : recopie la première phrase de ton rôle, puis le fichier lu (ou AUCUN)." \
      --model sonnet --allowedTools Read Agent Task --add-dir <vectorz>/products/mega-city/agents
    grep -hoE '"(model|effort)":"[^"]*"' ~/.claude/projects/<dossier-jetable>/*/subagents/*.jsonl | sort | uniq -c
    ```
- **Questions ouvertes, à trancher au build.**
  - Les pointeurs du projet : committés dans le dépôt du projet, ou ignorés par git ?
  - Le modèle de secours (`model_spare`) de l'architecte, du PO et du reviewer : le niveau le
    porte-t-il aussi ?
  - La liste des modèles acceptés : où la tenir, et qui l'ajoute quand un modèle sort.
  - Les noms exacts des clés (`modeles:`, `agents:`) et des sous-commandes.
- **Dépendance : `ezk --root <projet> config` n'existe pas encore** (constaté le 2026-10-02).
  `ezk config` ne lit que le projet courant. La fiche du tableau de bord ajoute `--root` dans ses
  critères. Si elle n'est pas livrée avant, cette fiche le construit, une seule fois.
- **Fiches liées.**
  - [ezk multi-client : cap Cursor + modèle & effort configurables par hôte](20260901173549334_ezk-multi-client-cursor-modeles-par-hote.md) :
    même calcul, axe « hôte ». Avec les niveaux, elle n'aura que trois lignes à traduire. Parkée.
  - [Un seul tableau de bord pour tous tes projets](20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md) :
    la page « config » où s'ajoute la section « Agents ». Même version V0.6.
  - [Frontmatter des agents : model, effort, isolation](done/0144-frontmatter-tuning-agents-model-effort-isolation.md)
    et [sérialiser model/effort dans les caps](done/0148-serialiser-model-effort-isolation-dans-les-caps.md) :
    l'origine des champs `model` et `effort`.
- **Décisions d'architecture à lire.**
  [ADR-0047](../products/mega-city/docs/adr/0047-multi-client-cursor-et-modeles-par-hote.md) (modèles par hôte, alternative D),
  [ADR-0048](../products/mega-city/docs/adr/0048-contenu-mono-source-modele-en-surcouche.md) (le rôle à un seul endroit, le pointeur),
  [ADR-0050](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md) (la couche `.vectorz/` du projet),
  et la doctrine des modèles : [`ezk-model-and-lisibility.md`](../products/mega-city/docs/ezk-model-and-lisibility.md).
- **Code existant à réutiliser.** Le lecteur de config :
  `products/mega-city/src/loaders/project-config.ts`. La commande : `products/mega-city/bin/ezk-config.ts`.
