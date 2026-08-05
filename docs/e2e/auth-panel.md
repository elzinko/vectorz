# E2E manuel reproductible — Panneau auth (🟢 + modèle)

> **Historique (2026-06-25)** — l'onglet **Connexion** a été retiré de l'UI Moniteur
> (fiche 0059). Ce protocole reste valable pour tester l'endpoint `/api/auth/check` du
> daemon. Chemins mis à jour pour le monorepo `vectorz` (2026-08-05, fiche 0060).

Fiche backlog **0003** (partie auth). Validé le 2026-06-25 via Playwright contre le vrai
daemon (appel Claude réel) : 🟢 *Connecté* + modèle `claude-sonnet-4-6`.

> La partie **dark-mode cobaye** est suivie séparément dans la fiche **0017** (banc de
> test jetable — fiche 0041, jamais reconstruit post-pivot).

## Pré-requis
- Build à jour : depuis la racine `vectorz`, `pnpm install && pnpm build`.
- Token Claude dans le `.env` du repo (`/chemin/absolu/vers/vectorz/.env`,
  une seule ligne `CLAUDE_CODE_OAUTH_TOKEN=…`).

## Étapes

1. **Charger le token + démarrer le daemon** (port par défaut 4242) :
   ```sh
   export $(grep '^CLAUDE_CODE_OAUTH_TOKEN=' /chemin/absolu/vers/vectorz/.env | xargs)
   node products/cop1/packages/app/dist/cli/index.js start
   ```
   Sanity : `curl -s localhost:4242/api/auth/check` doit renvoyer
   `{"ok":true,"model":"…","availability":"ok"}` (c'est l'appel Claude réel, 1 tour, sans outil).

2. **Démarrer le web UI** : `cd products/cop1/packages/web && pnpm dev` (→ http://localhost:5173 ;
   le proxy Vite cible 4242 par défaut depuis la fiche 0008).

3. **Ouvrir le navigateur** sur http://localhost:5173.

4. *(Historique)* Cliquer l'onglet **Connexion** — sélecteur Playwright :
   `getByRole('button', { name: 'Connexion' })`. Cet onglet n'existe plus dans le
   Moniteur ; l'auth se configure côté terminal (voir `docs/USER-GUIDE-web-ui.md`).

5. Cliquer **« Tester la connexion »** (si l'onglet est encore présent dans une branche
   ancienne) ou appeler directement `GET /api/auth/check`.

6. Attendre le retour 🟢 **Connecté — modèle : `<nom>`** (ou vérifier le JSON de l'API).

## Résultat attendu

- Feu 🟢 + nom de modèle affiché (UI historique) ou `{"ok":true,"model":"…"}` (API).
- Aucune clé/token visible dans le DOM ou les requêtes réseau du navigateur.

## Nettoyage

```sh
node products/cop1/packages/app/dist/cli/index.js stop
```
