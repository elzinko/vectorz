# Cadrage — faire tourner des agents de la méthode sur des LLM locaux (2026-10-16)

Repérage **avant panel + ADR**. Question du PO : peut-on lancer **certains** sous-agents de la
méthode sur ses **LLM locaux** ? Ce document pose le **pourquoi**, la **contrainte dure** de Claude
Code, et met **deux architectures** face à face. Il ne tranche pas : c'est l'**entrée du panel**.

> **Révisé le 2026-10-16, après le panel adverse.** Trois corrections décidées avec le PO :
> l'axe « coût » est remplacé par **temps + confiance** (une exécution locale est gratuite) ; le
> repli automatique vers Claude est remplacé par un **routeur local fail-closed** ; la liste des
> rôles candidats est remplacée par la règle **faiseurs / contrôleurs**.

## En clair

Claude Code ne sait pas, nativement, envoyer un sous-agent chez un fournisseur **local** pendant
que le chef de session reste chez Anthropic. Le routage doit donc vivre **hors de la session**.
Le **coût n'est pas l'enjeu** : une exécution locale tourne sur ta machine, elle est **gratuite**.
Les deux seuls prix sont le **temps** (le local est plus lent) et la **confiance** (le modèle est
plus faible et peut se tromper en silence). La vraie question n'est donc pas « est-ce rentable »,
mais « **quel travail peut tourner plus lentement et rester digne de confiance** ».

## Si tu arrives frais

- **Agent / rôle** : un membre de l'équipe (architecte, dev, reviewer…). La méthode en a ~7.
- **Sous-agent** : un agent lancé par le chef de session via l'outil Task.
- **Fournisseur (provider)** : qui sert le modèle — Anthropic (Claude) ou un serveur local
  (Ollama, LM Studio, llama.cpp).
- **Alias** : le nom de modèle demandé (`opus` / `sonnet` / `haiku`). C'est **la seule chose**
  qu'un sous-agent fait varier et qu'un outil extérieur peut lire.
- **Routeur (aiguilleur)** : un intermédiaire entre Claude Code et les fournisseurs, qui lit
  chaque requête et l'envoie au bon backend. Il peut tourner **en local**.
- **Fail-closed** : un réglage « en cas de pépin, on **s'arrête** » — comme une porte coupe-feu
  qui se verrouille — par opposition à « on bascule ailleurs ».
- **LLM local** : un modèle qui tourne sur ta machine, données jamais sorties.

## La contrainte dure (non négociable)

Claude Code applique le fournisseur à **toute la session** (variable `ANTHROPIC_BASE_URL`). Le
champ `model` d'un agent n'accepte que des **aliases Claude**. Il n'existe **aucun** moyen natif
d'envoyer le sous-agent A chez Anthropic et le sous-agent B en local dans la **même** session.

- Preuve : demande ouverte [Claude Code issue #38698](https://github.com/anthropics/claude-code/issues/38698)
  (mars 2026), sans date de livraison.
- Conséquence directe : « dire à Claude, en session, de router les agents locaux » **n'est pas une
  option**. Tout passe **hors-session**.

```
Toi ──> tag le rôle ──> une couche à part : rôle → moteur
                               │
Claude Code ──(demande <alias>)──> ROUTEUR LOCAL ──> ton Ollama   (local, gratuit)
            ──(demande <alias>)──> ROUTEUR LOCAL ──> Anthropic    (Claude, quota Max)
```

Claude ne **choisit** pas le local. Il **demande un alias**. Le routeur tranche.

## Le pourquoi — l'axe est le temps et la confiance, pas l'argent

Une exécution locale tourne sur ta machine : son coût est **nul**. L'argent n'entre pas dans la
décision. Il reste **deux prix** : le **temps** (le local est plus lent, avec plus de reprises) et
la **confiance** (un modèle local est plus faible et peut répondre faux **sans lever d'erreur**).

Deux moteurs tiennent sous cet angle.

| Moteur | Ce qu'on y gagne | Le prix à payer |
|---|---|---|
| **Soulager le quota Max** | Le local fait le travail **gratuitement** ; le quota de l'abonnement reste pour les rôles qui comptent. | Du **temps** : le local est plus lent. |
| **Confidentialité** | Le code et les données **ne sortent pas** de ta machine. | Du temps **et** un garde-fou dur : aucun repli vers un tiers (voir **fail-closed**, plus bas). |

Ce qui **disparaît** de la décision : le coût au token. Il n'existe ni en local (gratuit) ni sur
Max (forfait). La question n'est donc jamais « est-ce rentable » — c'est « quel travail peut
tourner plus lentement **et** rester digne de confiance ».

## Quels rôles peuvent partir en local — la règle faiseurs / contrôleurs

Le bon partage n'est **pas** « mécanique contre jugement ». C'est **qui fait** contre **qui
contrôle**.

- **Les faiseurs** produisent un travail que **quelque chose d'autre vérifie ensuite**. `ezk-dev`
  écrit du code, et les tests le valident. Un faiseur peut partir en local : s'il se trompe, le
  contrôle le rattrape.
- **Les contrôleurs** sont le **filet de sécurité**. `ezk-qa` écrit les tests qui **définissent**
  « terminé » et pilote le navigateur. `ezk-reviewer` dit GO / NO-GO. `ezk-archive` est déjà
  **pin Opus** parce qu'il rend un **jugement**, et il écrit la note que **tu lis**. Un contrôleur
  faible dit « tout est vert » sans vérifier — tu perds le filet **sans le voir**.

| Rôle | Famille | Candidat local ? |
|---|---|---|
| `ezk-dev` | faiseur (son code est vérifié par les tests) | **Oui** |
| `ezk-qa` | contrôleur (écrit la Definition of Done, pilote l'E2E) | **Non** |
| `ezk-reviewer`, `ezk-architect`, `ezk-pm` | jugement / restitution PO | **Non** |
| `ezk-archive`, `ezk-steward` | jugement / restitution lue par l'humain | **Non** |

Cas de casse à retenir : un `ezk-qa` local qui rate un appel d'outil fabrique un « E2E vert » qui
n'a **jamais** tourné. Tu crois que c'est testé ; ça ne l'est pas.

L'estampille vit sur le **rôle**, pas sur la tâche. Mais « local-safe » n'est pas qu'une propriété
du rôle : elle dépend aussi du **modèle local précis** (à épingler) et du type de tâche.

## Les deux architectures

### Architecture A — Routeur devant

- **Principe** : un routeur (claude-code-router, LiteLLM…) entre Claude Code et les backends. Le
  discriminant = l'**alias** du rôle. Table « alias <local> → mon Ollama ; opus/sonnet → Anthropic ».
- **Fail-closed possible** : le routeur peut tourner **en local** et être réglé pour **s'arrêter**
  en cas d'échec, au lieu de rebasculer vers Anthropic. C'est **ça** qui rend la confidentialité
  tenable — rien ne sort. Limite : il ne voit que « marche / plante », **jamais** « c'est faux ».
- **À bâtir** : une couche qui mappe un rôle vers un **moteur local** (hors des fichiers d'agents,
  voir plus bas) + la config du routeur.
- **On gagne** : mélange **fin par rôle** ; l'orchestrateur Claude reste **unique**.
- **On paie** : dépendance à un routeur **non officiel** (fragile aux montées de version de Claude
  Code) ; un process de plus à surveiller ; débogage opaque (Claude ignore qu'il parle local) ;
  **qualité** du local non garantie (réponse fausse mais confiante).
- **Réversibilité** : **bonne** côté infra — on retire le routeur, tout repasse Claude.

### Architecture B — Sessions 100 % locales pour les lots

- **Principe** : certains lots de tâches tournent dans des **sessions entières** pointées local
  (`ANTHROPIC_BASE_URL`), orchestrées depuis l'extérieur (la CLI ezk). Claude garde les sessions
  « nobles ».
- **À bâtir** : un découpage « ce lot → session locale » + l'orchestration externe.
- **On gagne** : **zéro routeur tiers** ; chaque session est **cohérente** (un seul fournisseur) ;
  isolation nette ; fail-closed naturel (pas d'autre backend joignable).
- **On paie** : on **perd l'orchestrateur unique** ; couture à écrire pour rapatrier les
  résultats ; grain = **le lot**, pas le rôle ; moins fluide.
- **Réversibilité** : bonne, mais le découpage « lot local » **s'incruste** dans la méthode.

### Où vit l'estampille « local »

Dans **une couche à part**, **hors** du fichier de l'agent. Pourquoi : le fichier d'un agent doit
rester le même partout (Claude Code, Cursor…) et ne pas « mentir » sur le moteur. Mettre « local »
dans le frontmatter committé ferait relire le rôle comme du Claude par un autre hôte, et casserait
la séparation que la fiche 0023 a posée (`model_tiering` Claude ≠ provenance locale). Tu changes la
couche, jamais les agents.

### Face à face

| Axe | A — Routeur | B — Sessions locales |
|---|---|---|
| Grain | rôle (fin) | lot / session (gros) |
| Orchestrateur unique | **conservé** | **perdu** |
| À bâtir | couche rôle→moteur + routeur | découpage + orchestration CLI |
| Dépendance externe | routeur **non officiel** | aucune (`base-url` natif) |
| Fail-closed | à régler dans le routeur | **naturel** |
| Soulage le quota Max | oui, au rôle | oui, au lot |
| Débogage | opaque (hop invisible) | clair (un seul backend) |
| Réversibilité infra | très bonne | bonne |
| Risque principal | run « vert » sur le mauvais backend | perte de fluidité / couture |

## Ce que le panel doit trancher (questions fermées)

1. **Le pourquoi est-il réel, et lequel prime** — soulager le quota Max (prix : temps) ou
   confidentialité (prix : temps + fail-closed) ? Sinon : **stop**.
2. **Quelle architecture** — A, B, ou **aucune maintenant** ?
3. **Grain de l'estampille** — rôle (confirmé) ; « local-safe » dépend aussi du **modèle épinglé**.
4. **Qualité / garde-fou** — **pas de repli automatique vers Claude** : un routeur **fail-closed**
   s'arrête au lieu de rebasculer (rien ne sort, la confidentialité tient). Reste ce que le routeur
   ne sait **pas** faire : repérer une réponse locale **fausse mais confiante**. Qui qualifie un
   rôle « local-safe », et rejoue la qualif à **chaque changement de modèle** ?
5. **Non-régression** — « sans réglage, rien ne change » : garanti **par construction** (sans tier
   local configuré, le résolveur rend les aliases Claude d'aujourd'hui). Testable comme « table de
   routage inchangée », pas comme « comportement identique » (un LLM n'est pas déterministe).

## Portée

- **Dans la portée** : la méthode ezk / mega-city et ses rôles.
- **Hors portée, mais prior art** : **cop1 le produit** a déjà un `OllamaAdapter` (paquet
  `llm-intelligence`). C'est une **brique technique réutilisable**, mais c'est le produit qui
  **parle à** des LLM locaux, pas la méthode qui **tourne dessus**. À ne pas confondre — la
  distinction est déjà écrite dans la fiche 0023 (ancrages).

## Panel adverse suggéré

- **Architecte** : « La couche rôle→moteur reste-t-elle hors des artefacts portables ? »
- **Dev** : « Qui fait tourner le routeur / la session locale au quotidien ? Reproductible entre postes ? »
- **PO** : « Le gain de quota vaut-il le temps perdu et le risque qualité ? »
- **Reviewer qualité** : « Un modèle local qui répond faux sans erreur passe le gate. Comment on le détecte ? »
- **Juge** : tranche A / B / rien, et fixe le périmètre de l'ADR.

## Prochaine étape

Le panel adverse a tourné le 2026-10-16 ; ses contraintes les plus dures sont **intégrées
ci-dessus** (fail-closed, faiseurs / contrôleurs, « local » = provenance hors des fichiers
d'agents). Prochaine étape = un **ADR** sous `products/mega-city/docs/adr/` (numéro ≥ 0082), une
fois le moteur confirmé (quota Max ou confidentialité).

### Points d'ancrage

- Résolveur + crochet hôte : [Config des modèles : schéma à deux portées + résolveur pur](../../../../features/20261013132218242_config-modeles-schema-et-resolveur-pur.md)
- Doctrine des modèles : [ezk-model-and-lisibility.md](../ezk-model-and-lisibility.md)
- Distinction `model_tiering` (Claude) vs provenance locale : [fiche 0023](../../../../features/done/0023-exposer-model-tiering-config.md)
- Deux portées de config : [ADR-074](../../../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md)
- Multi-client + modèles par hôte : [ADR-0047](../adr/0047-multi-client-cursor-et-modeles-par-hote.md), [ADR-0048](../adr/0048-contenu-mono-source-modele-en-surcouche.md)
- Contrainte native Claude Code : [issue #38698](https://github.com/anthropics/claude-code/issues/38698)
