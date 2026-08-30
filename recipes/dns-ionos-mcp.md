---
id: "20260830104013460"
title: Gérer les DNS IONOS via leur serveur MCP
makes: Un accès agent (lecture/écriture) aux enregistrements DNS d'un domaine IONOS, via un token scope Domains only
source: # aucune implémentation prouvée pointée — configuration MCP + procédure IONOS, pas de code (voir Statut)
composes: []
status: draft # pas de `source:` honnête — recette de configuration, signalé (voir Statut)
home: central
created: 2026-08-29
updated: 2026-08-30
---

# Recette (brique) — Gérer les DNS IONOS via leur MCP

> **Brique réutilisable.** Piloter les enregistrements DNS d'un domaine **IONOS**
> (A, CNAME, TXT…) directement depuis ton agent (Claude), au lieu de cliquer dans le
> dashboard. Tu crées un **token** limité à tes domaines, tu le gardes secret, et tu
> branches le **serveur MCP** d'IONOS.
>
> Se **compose** dans toute recette qui touche le DNS : par ex.
> [`brancher-domaine-vercel`](./brancher-domaine-vercel.md) (créer les A/CNAME que
> Vercel demande, sans naviguer dans l'UI IONOS).

## Quand l'utiliser

Tu as un ou plusieurs domaines chez IONOS. Tu veux **lire ou modifier leurs DNS**
depuis l'agent — lister les enregistrements, ajouter un CNAME, vérifier une
propagation — plutôt qu'à la main dans le dashboard.

## Le principe — une clé pour tes domaines, rien d'autre

IONOS expose un **serveur MCP** (une porte que ton agent sait pousser). Pour l'ouvrir,
il faut une **clé** : un token que tu crées, qui donne accès **à tes domaines
uniquement** (pas à tes serveurs). Ton agent présente cette clé → il peut lire/écrire
tes DNS.

```
Toi ─(crée un token scope Domains)→ IONOS
Agent ─(présente le token)→ MCP IONOS ─→ lit/écrit tes enregistrements DNS
```

## Les étapes

### 1. Créer le token

Va sur **https://developer.hosting.ionos.fr/mcp/tokens/new**.

- **Nom parlant**, un par projet : ex. `SAMPLERZ_IONOS_TOKEN`. Un token par projet =
  tu peux le révoquer seul, sans casser les autres.
- **Portées : coche uniquement « Domains »** — les 6 lignes `domain/read`,
  `domain/write`, `dns/read`, `dns/write`, `ssl/read`, `ssl/write`.
  **Décoche « Servers » et « Webhosting ».** Principe du moindre privilège : même volé,
  ce token ne peut pas toucher tes serveurs ni ton hébergement.
- Accepter les CGU → **Continuer** → **copie le token** affiché.
  ⚠️ Il n'est montré **qu'une seule fois**.

### 2. Le ranger comme un secret

- **Jamais** committé. Dans un `.env` **local** (déjà gitignored) ou un gestionnaire
  de secrets. Une ligne :
  ```
  SAMPLERZ_IONOS_TOKEN=xxxxxxxx…
  ```
- **Ne le préfixe jamais `VITE_`** : ce préfixe exposerait la clé dans le navigateur.
  Ce token est un secret d'outillage, pas une variable de l'app.

### 3. Brancher le MCP IONOS sur l'agent

Le serveur MCP est **`https://mcp.ionos.com/mcp`** (transport HTTP). Doc officielle :
https://developer.hosting.ionos.fr/mcp/getting-started

**Claude Code** :

```bash
claude mcp add --transport http ionos https://mcp.ionos.com/mcp \
  --header "Authorization: Bearer <PERSONAL_ACCESS_TOKEN>"
```

**Claude Desktop** (via `mcp-remote`) — dans le fichier de config MCP :

```json
{
  "mcpServers": {
    "ionos": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "https://mcp.ionos.com/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": { "AUTH_HEADER": "Bearer <PERSONAL_ACCESS_TOKEN>" }
    }
  }
}
```

Remplace `<PERSONAL_ACCESS_TOKEN>` par le token de l'étape 1
(ex. la valeur de `SAMPLERZ_IONOS_TOKEN`). Puis **relance Claude** pour qu'il charge
le serveur `ionos`.

### 4. Vérifier

Dans une session interactive, demande à l'agent : **« liste les enregistrements DNS de
`samplerz.fr` »**. Tu dois voir tes A/CNAME/MX/TXT. Si oui, le MCP est branché.

## Les garde-fous (sécurité)

- **Portée minimale** : Domains only. Jamais Servers ni Webhosting sur un token DNS.
- **Un token par projet** : révocable seul depuis la page des tokens IONOS.
- **Secret strict** : hors de Git, hors du code front (pas de `VITE_`).
- **Révoquer en cas de doute** : page des tokens IONOS → supprimer → en recréer un.

## Pièges

- **Token affiché une seule fois** : pas copié = perdu → en recréer un.
- **Préfixe `VITE_` interdit** : il publierait la clé dans le bundle navigateur.
- **Portées trop larges** = risque inutile : garde **Domains only**.
- **Session non-interactive** (cron, CI, agent headless) : un MCP branché par OAuth
  interactif peut être absent. Pour ces contextes, prévois le token en variable
  d'environnement du runner.

## Statut de cette recette

Normalisée le 2026-08-30 (front-matter ajouté, étape 5 de la fiche
[`20260824185422122`](../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md)).
**`status: draft`** : recette de **configuration** (créer un token, brancher un serveur MCP
tiers) — aucune implémentation de code à pointer, `source:` laissé vide plutôt qu'inventé.
Signalé au PO.
