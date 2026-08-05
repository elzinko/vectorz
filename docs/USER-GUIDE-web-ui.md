# Web UI — Guide utilisateur

La web UI de cop1 (`products/cop1/packages/web`, package `@cop1/web`) est servie en local
et parle au **daemon** cop1. Depuis la fiche 0059, l'application est le **Moniteur** :
supervision en lecture seule des méthodes autonomes (journal `.supervision/`).

Deux **paradigmes** coexistent dans l'histoire du produit — l'interface actuelle ne montre
que le second :

| Paradigme | Rôle de cop1 | Onglets concernés |
|---|---|---|
| **Pilote** (époque 1, hérité) | cop1 **lance** et contrôle des runs via le daemon | Connexion, Run |
| **Observateur** (chemin vivant) | cop1 **surveille** des runs émis par une méthode externe (Claude Desktop, Claude Code…) | Projets, Activité |

## Démarrer la stack en local

Depuis un clone frais de `vectorz` :

```bash
cd /chemin/absolu/vers/vectorz
pnpm install && pnpm build

# 1) le daemon (API sur :4242 par défaut) — depuis le dossier cop1 (ex. racine vectorz)
node products/cop1/packages/app/dist/cli/index.js start

# 2) le serveur web (autre terminal)
cd products/cop1/packages/web
pnpm dev
```

Ouvre **http://localhost:5173**.

> Le daemon lit `cop1.config.yaml` dans le **cwd** où il est démarré. Pour la démo
> supervision, configure `supervision.watch_roots` — voir
> [`docs/demo-desktop-checklist.md`](demo-desktop-checklist.md).

## Les quatre onglets (vivant / hérité)

L'UI a connu deux générations. Quatre onglets ont existé ; seuls **Projets** et **Activité**
sont visibles aujourd'hui dans le Moniteur.

### Connexion (Story A) — **hérité**

Panneau auth avec feu tricolore 🟢/🟡/🔴 (« Tester la connexion »). Livré en époque 1
(fiche 0003) ; **retiré de l'UI Moniteur** — la vérification Claude se fait désormais côté
terminal (`claude setup-token` ou `ANTHROPIC_API_KEY`). Conservé ici pour ne pas confondre
les guides anciens.

### Run (Story B) — **hérité**

Lanceur de run + mission-control live : cop1 **pilote** l'orchestrateur dans le daemon
(fiche 0001, PR #24). **Retiré de l'UI Moniteur** au profit du mode observateur pur
(fiche 0059). Ce paradigme reste dans le daemon/CLI ; ce n'est plus le chemin documenté
pour la démo supervision.

### Projets — **vivant** (fiche 0062)

Liste des projets supervisés (registre + runs observés). Cliquer un projet filtre l'onglet
Activité sur ce projet. Porte d'entrée pour ajouter un projet (fiche 0063).

### Activité — **vivant** (fiche 0059 / Moniteur)

Cartes de runs en direct (SSE), gates, états, tokens, historique récent. **C'est le chemin
vivant du produit** pour superviser une méthode qui émet via le kit MCP
(`products/mega-city/src/supervision/`).

Pour une démo de bout en bout (Desktop → journal → Moniteur → validateur vert), suivre
[`docs/demo-desktop-checklist.md`](demo-desktop-checklist.md).

## Auth Claude (hérité Connexion)

Si tu dois faire parler cop1 à Claude (runs pilotés, CLI), configure l'auth dans le terminal
qui lance le daemon :

```bash
claude setup-token            # abonnement Claude Max (OAuth)
#   ── ou ──
export ANTHROPIC_API_KEY="sk-ant-…"
```

La clé reste **côté daemon**, jamais exposée au navigateur.
