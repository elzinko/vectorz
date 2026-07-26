---
name: ezk-preview
argument-hint: "[help|vercel|public|private|comment]"
description: >-
  Produce a shareable demo/preview URL for a work-in-progress feature (a branch
  or worktree). Use when the user asks for a demo link, a test or preview URL, a
  way to show a feature to someone, mentions "lien de démo", "URL de test",
  "montre la feature", "accéder depuis mon téléphone", "démo privée", or when a
  PR is ready and needs a preview. Picks a Vercel preview deploy when the app is
  deployable and Vercel-linked; opens a Cloudflare tunnel (cloudflared) to the
  local dev server for public sharing; or uses tailscale serve for a PRIVATE
  demo (own phone, peers in the tailnet, apps holding credentials or lacking
  auth — never expose those publicly). Returns the URL (QR code for phones) and
  can post it as a PR comment. For testing on a physical device over adb, use
  ezk-device instead.
---

# ezk-preview

Tu produis une **URL de démo partageable** pour une feature en cours (branche ou
worktree), pour la valider dans un navigateur et la montrer **avant le merge**.
Mécanisme de tunnel par défaut : **Cloudflare** (`cloudflared`) pour du public,
**Tailscale serve** pour du privé (téléphone perso, pairs du tailnet).

## Usage (sous-commandes)

`/ezk-preview [sous-commande] [args]` — ou en langage naturel (« un lien de démo »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau d'usage |
| (**défaut**, langage naturel) | Choisit la stratégie via l'arbre de décision et renvoie l'URL (+ QR pour le téléphone) |
| `vercel` | Cas A — preview deploy Vercel (app déployable + liée), URL persistante |
| `public` / `tunnel` | Cas B — tunnel Cloudflare (`cloudflared`) vers le dev server local, URL **publique** |
| `private` / `serve` | Cas C — `tailscale serve` : démo **privée** (téléphone perso, pairs du tailnet, app avec credentials / sans auth) |
| `comment` | Poste l'URL en commentaire de PR (`gh pr comment`) |

> **Help** : invoquée sans sous-commande (ou avec `help`/`?`), affiche ce tableau. Une demande en langage naturel choisit la stratégie via l'arbre de décision ci-dessous. Sous-commande non reconnue → traite la demande en prose (la skill reste pilotable naturellement).

## Arbre de décision

| Cas | Méthode |
| --- | --- |
| App **déployable** + projet **lié à Vercel** (`.vercel/` présent) | preview deploy Vercel → URL persistante |
| Partage **public** (backend / full-stack / WIP / DB locale) | **tunnel Cloudflare** vers le dev server local |
| Démo **privée** : mon téléphone, pairs dans le tailnet, **app avec credentials ou sans auth** | **`tailscale serve`** → jamais de tunnel public |
| Test sur **téléphone** (adb) | hors scope → skill `ezk-device` |

## Cas A — preview Vercel (si déployable + lié)

```bash
vercel pull --yes        # récupère la config du projet lié
vercel deploy            # déploie une preview, imprime l'URL
```

Persistant, aucune machine à laisser tourner — idéal pour un front.

## Cas B — tunnel Cloudflare vers ta machine (défaut)

1. **Lance l'app** en local (ou demande à la lancer) — `/run` si disponible.
2. **Détecte le port** du dev server : scripts `package.json`, ports usuels
   (3000 / 5173 / 8080 / 4321 / 8000), ou `docker-compose.yml`.
3. **Ouvre le tunnel** — le helper [`scripts/start-demo.sh`](scripts/start-demo.sh)
   fait détection + lancement :
   ```bash
   ./scripts/start-demo.sh            # auto-détecte le port
   # ou directement :
   cloudflared tunnel --url http://localhost:<port>
   # → https://<aléatoire>.trycloudflare.com   (instantané, sans compte)
   ```
4. **Lien stable** (optionnel) : pour une URL fixe sur ton domaine, un *tunnel
   nommé* (`cloudflared tunnel login` → `create` → route DNS) plutôt que le
   quick-tunnel. À configurer une fois.

Pré-requis : `cloudflared` (`brew install cloudflared`).

## Cas C — démo privée via `tailscale serve` (téléphone, pairs, apps sensibles)

Quand la démo ne doit **pas** sortir du cercle privé — la voir sur **son
téléphone**, la montrer à des pairs dont les appareils sont dans le tailnet, ou
quand l'app détient des **credentials** / n'a **pas d'authentification** (un
tunnel public type cloudflared/ngrok est alors à proscrire).

Avantages vécus (validé sur samplerz, 2026-06) :
- **Contourne le pare-feu applicatif macOS sans sudo** : binder le serveur sur
  `0.0.0.0` ne suffit PAS (le firewall bloque les connexions entrantes vers
  python/node) ; avec `serve`, c'est **tailscaled** (déjà autorisé) qui écoute
  et proxifie en local — zéro réglage pare-feu.
- `tailnet only` : invisible depuis Internet.

```bash
# 1. Tailscale up — re-mentionner TOUS les flags non-défaut existants
#    (la convention maison est DNS tailscale OFF partout, cf ezk-device)
tailscale up --accept-dns=false --accept-routes

# 2. Proxy en TCP BRUT vers le dev server (port 80 → http://IP sans rien d'autre)
tailscale serve --bg --tcp=80 tcp://localhost:<port>

# 3. L'URL pour le téléphone = l'IP tailscale de la machine
tailscale ip -4        # ex. 100.112.207.85  →  http://100.112.207.85

# 4. QR code pour le téléphone (optionnel mais pratique)
uv run --with qrcode --with pillow python -c \
  "import qrcode; qrcode.make('http://<ip-tailscale>').save('/tmp/demo_qr.png')"

# 5. Couper après la démo
tailscale serve --tcp=80 off
```

**Pièges connus :**
- **Mode `--http=80` ≠ mode `--tcp=80`** : `--http` route par en-tête Host →
  marche par *nom* (`machine.tailnet.ts.net`) mais **404 par IP nue**. Avec le
  DNS tailscale OFF sur les appareils (convention maison), les noms `ts.net` ne
  résolvent pas (« name not resolved ») → utiliser **`--tcp` + IP**.
- `tailscale up` refuse de changer un réglage sans re-mentionner les flags
  non-défaut déjà actifs — copier la commande qu'il suggère.
- **Vérifier honnêtement** : `curl http://<ip-tailscale>/` (page complète + un
  asset + une route API), et ne pas confondre ses propres curls avec le trafic
  du téléphone dans les logs serveur — attendre la confirmation de l'humain ou
  une requête postérieure aux tests.
- Le serveur doit écouter en local (`127.0.0.1` suffit — serve proxifie en
  loopback) ; la première connexion peut passer par un relais DERP (~1-2 s)
  avant que la liaison directe s'établisse.

Pré-requis : Tailscale installé et connecté sur la machine **et** le téléphone
(même tailnet). La résolution du nom `ts.net` n'est PAS requise (on passe par IP).

## Poster le lien sur la PR (option)

```bash
gh pr comment --body "🔗 Démo : <url>"
```

## Intégration

- **[`ezk-pr-pilot`](../ezk-pr-pilot/)** — **seul appelant câblé.** Il invoque ce
  skill pour l'URL de démo d'une PR à valider (étape `run`, et table « URL de démo
  partageable → `ezk-preview` ») ; composition actée par
  l'[ADR-0009](../../docs/adr/0009-ezk-pr-pilot-orchestrateur-validation-prs.md).
- **[`ezk-sprint`](../ezk-sprint/)** — **candidat, pas câblé.** Son étape PR (§8)
  n'exige que le titre conventional-commit et le before/after média, sa table de
  délégation ne cite pas ce skill, et sa DoD ne mentionne aucune URL de démo. « 1 lien
  de démo par PR de sprint » reste une **proposition** — arbitrage PO, pas un fait.
- **iamthelaw** : candidat à une règle `preview-url-per-PR` (enforcement niveau 1
  via l'agent `ezk-qa`).

## Sécurité

Un tunnel Cloudflare/ngrok **expose ton `localhost` sur Internet**. Coupe-le
après la démo (Ctrl-C). **Règle dure** : une app qui détient des credentials
(fichier `.env`, proxy LLM, tokens…) ou qui n'a pas d'authentification ne passe
JAMAIS par un tunnel public — c'est le Cas C (`tailscale serve`, tailnet only)
qui s'applique. Couper aussi le serve après la démo (`tailscale serve --tcp=80 off`).
