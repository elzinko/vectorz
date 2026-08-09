# ADR 0023 — la connexion à l'abonnement Claude (Max/Pro) est une capacité partagée (brique autonome), pas un skill projet ni une recette

- Statut : **proposé**
- Date : 2026-08-08
- S'appuie sur : [ADR-0020](0020-capacite-partagee-brique-autonome.md) (brique autonome), [ADR-0021](0021-cloture-portier-deterministe-ranger-rediger-juger.md) (ranger/rédiger/juger), [ADR-0013](0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) (recipy ≠ fabrique)
- Preuve terrain : projet **samplerz** (`src/samplerz/web/discover_router.py`, `credentials.py`, ADR-024/025 samplerz)

## Contexte

Besoin récurrent : **faire appeler Claude par un outil local sans créer de clé API Anthropic**
(`sk-ant-api…`), en s'authentifiant sur l'**abonnement Claude Max/Pro** de l'opérateur.

Le mécanisme est déjà **implémenté et éprouvé** dans samplerz (BYOK, versant abonnement) :

1. `claude setup-token` — **commande officielle** de Claude Code (présente : « Set up a
   long-lived authentication token ») — ouvre le navigateur, l'opérateur autorise avec son
   abonnement, la CLI **imprime** un token `sk-ant-oat…`. Ce n'est PAS une extraction
   sournoise des credentials de Claude Code : c'est le point de sortie **prévu pour ça**
   (le login normal planque le token dans le keychain, illisible par un SDK ; `setup-token`
   l'imprime — samplerz `discover_router.py:264-289`).
2. Le token est exporté en **`ANTHROPIC_AUTH_TOKEN`**. Le SDK `anthropic` (et l'API REST) le
   mappe sur l'en-tête **`Authorization: Bearer`** — là où une clé console passe par
   `x-api-key`. Host inchangé : `api.anthropic.com`, aucun `base_url`, aucun en-tête beta
   côté samplerz (`anthropic_client.py:28-42, 114-158`).
3. Persistance : `~/.samplerz/credential.json` (`{"kind":"oauth","token":"…"}`, 0600),
   rehydraté au boot (`credentials.py:49-111`, ADR-024 samplerz).

Ce besoin a **≥ 2 consommateurs** : samplerz (déjà), la démo web locale d'**elzinko**
(`apps/web/serve.mjs` + `apps/web/api/reformulate.js`, qui n'accepte aujourd'hui qu'une clé
console via `x-api-key`), et tout futur outil local. La question posée : **quelle forme**
mega-city — skill host-agnostique, capacité partagée (ADR-0020), ou recipy/recette (ADR-0013) ?

## Décision

1. **Forme : capacité partagée = brique autonome** (ADR-0020). On crée un skill-brique
   dédié — nom fonctionnel de travail **`ezk-claude-auth`** (nom produit « Dredd » à figer
   via [`docs/naming.md`](../naming.md) ; candidat : *lawgiver* — l'arme du Juge, verrouillée
   sur son porteur = un credential lié à ton identité qui autorise tes outils à agir). Il
   **passe le test d'autonomie** (ADR-0020 §2) : dans un repo où **aucun autre skill ezk**
   n'est installé, `connect` donne un `ANTHROPIC_AUTH_TOKEN` fonctionnel.
2. **Frontière ranger/rédiger/juger** (ADR-0021, règle d'or). Le **script range** :
   `scripts/connect.sh` lance `setup-token`, capture le token, le **vérifie** par un ping réel
   1-token, l'exporte / le persiste, sait aussi le **lire** depuis `~/.samplerz/credential.json`.
   La **SKILL.md rédige/juge** : `help | connect | status | disconnect`, arbre de décision
   (token présent ? valide ? expiré → reconnecter), avertissements. Le LLM ne range jamais.
3. **« Le projet déclare, la méthode lit »** (ADR-0020 §4). Le **mode d'auth** (clé console /
   abonnement Max / Ollama) est une **déclaration projet** — c'est ça, la « recette » au sens
   informel de l'opérateur (cf. ADR-0020 : « docker n'est qu'une recette »). La brique
   **fournit** le mode abonnement ; le projet **choisit**. elzinko déclarera : mode
   `subscription`, commande de démarrage `node apps/web/serve.mjs`.
4. **Intégration elzinko** (premier consommateur) : `reformulate.js` accepte un token
   d'abonnement et émet `Authorization: Bearer` (en gardant `x-api-key` pour les clés
   console) ; `serve.mjs` injecte `ANTHROPIC_AUTH_TOKEN` depuis l'environnement → **plus rien
   à saisir dans la page**. Composition en **prose** tant que `composes:` (ADR-0012) n'existe pas.

## Options considérées

### A. Skill projet (loger dans elzinko / un skill spécifique elzinko)
| Dimension | Évaluation |
|---|---|
| Complexité | Faible |
| Réutilisation | **Nulle** — captif d'un projet |
| Autonomie (ADR-0020 §2) | **Échoue** — ≥ 2 consommateurs |

**Contre :** rejoue la duplication déjà vue (samplerz a écrit son adaptateur seul) ; le besoin est **de méthode**, pas de projet.

### B. Étendre `ezk-preview` (ou un orchestrateur)
**Contre :** `ezk-preview` a un **autre métier** (exposer vers l'extérieur, avec ses règles de sécurité credentials) — il deviendrait une « brique grasse » (mot pour mot le rejet de l'option D d'ADR-0020). Et un orchestrateur **ne possède pas** une capacité que d'autres consomment (ADR-0020 §1).

### C. `recipy` / recette (au sens ADR-0013)
**Contre :** `ezk-recipy` est un **entonnoir de sourcing** dont la sortie est une *fiche backlog* — il **ne fabrique jamais** de SKILL.md (ADR-0013 §1). Mauvais métier. (La « recette » informelle = le *mode d'auth*, retenue en option E via la déclaration projet.)

### D. `cap/<host>`
**Contre :** les caps sont des **adaptateurs d'hôte** (claude-code / claude-desktop, matérialisation native d'un profil). Une capacité de credential n'est pas un adaptateur d'hôte.

### E. Capacité partagée / brique autonome — **RETENUE**
| Dimension | Évaluation |
|---|---|
| Complexité | Faible/moyenne (SKILL.md + 1 script) |
| Réutilisation | **Forte** — tout outil local, hors méthode |
| Autonomie (ADR-0020 §2) | **Passe** |
| Frontière (ADR-0021) | Respectée (script range / skill juge) |

## Conséquences

**Plus facile** — n'importe quel outil local (Node, Python, `curl`) s'authentifie sur
l'abonnement en une brique ; la démo elzinko tourne **sans clé API** ; le mécanisme est
documenté **une fois** au lieu d'être re-dérivé par projet.

**Plus dur** — +1 skill au catalogue (la discipline du test d'autonomie doit être re-tenue) ;
**le token expire et n'a AUCUN refresh** (samplerz : rotation manuelle) → le playbook doit
porter le chemin de reconnexion ; la composition reste en prose sans `composes:` (ADR-0012).

**À surveiller / limite explicite** — utiliser un token d'**abonnement** Max/Pro pour piloter
une **app séparée** relève des **conditions d'abonnement Anthropic**, sur lesquelles le code
samplerz est muet. La brique est cadrée **usage personnel / dev** — à documenter dans la
SKILL.md, jamais à masquer. Ne pas lire le keychain de Claude Code (chemin non sanctionné) :
`setup-token` est la seule porte.

## Action items

1. [ ] **Fabriquer la brique via la filière** (ADR-0013 : `skill-creator` = unique fabrique) —
   `ezk-ezk create` sur une fiche `ezk-claude-auth` : `SKILL.md` + `scripts/connect.sh`
   (`help | connect | status | disconnect`), test d'autonomie comme critère d'acceptation.
2. [ ] **Valider les en-têtes réels** d'un appel REST avec un `sk-ant-oat…` (Bearer suffit ? un
   `anthropic-beta` est-il requis ?) — samplerz passe par le SDK Python, elzinko fait un `fetch` brut.
3. [ ] **elzinko** : `reformulate.js` → support `Authorization: Bearer` ; `serve.mjs` → injecte
   `ANTHROPIC_AUTH_TOKEN` ; déclarer le mode d'auth + la commande `serve` (ADR-0020 §4).
4. [ ] **Nom Dredd** figé via `docs/naming.md` ; statut ADR **proposé → accepté** (opérateur).
5. [ ] (plus tard) câbler la composition `elzinko → ezk-claude-auth` quand `composes:` (ADR-0012 / fiche 0044) atterrit.
