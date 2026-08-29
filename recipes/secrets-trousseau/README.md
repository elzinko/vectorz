# Recette — Ranger des secrets dans le trousseau macOS (l'agent les lit sur demande)

> **Générique.** Ranger des secrets (clés d'API, tokens) dans le **trousseau macOS**,
> pour que l'agent (Claude) les **lise au moment d'agir sans qu'ils passent jamais par le
> chat**, et que **toi seul** ouvres l'accès. Trois petits scripts : `set`, `get`, `list`.
>
> **Composée** : pour une authentification *vraiment* forte — Touch ID + consentement
> **signé et lié à l'action** — voir la recette avancée
> [`elicitation-authentification-forte`](../elicitation-authentification-forte.md).
> Celle-ci est la version **simple et pragmatique** (trousseau natif macOS).

## En clair

Un secret ne devrait jamais traîner en clair — ni dans un fichier, ni dans le chat, ni
dans l'historique du shell. Le **trousseau macOS** le garde chiffré. **Toi** tu le déposes
(saisie masquée dans un terminal) ; l'**agent** le relit dans une variable au moment d'agir,
sans jamais l'afficher. Chaque commande passe sous tes yeux : c'est ton « accès sur demande ».

## Convention de nommage

`<projet>-<provider>-<type>` — ex. `samplerz-ionos-api`, `livestreamz-vercel-token`.
Un nom = un secret. **L'agent suggère le nom, tu valides.**

## Les 3 commandes

| Commande | Rôle |
|---|---|
| `ezk-secret-set <service>` | te demande le secret (saisie **masquée**), le range chiffré |
| `ezk-secret-get <service>` | le lit — ⚠️ **à capturer dans une variable, jamais afficher** |
| `ezk-secret-list [motif]` | liste les **noms** rangés (jamais les valeurs) |

## Comment l'agent l'utilise (le flux « sur demande »)

1. **Dépôt** (une fois) — l'agent t'ouvre un terminal où tu saisis le secret (il ne touche
   jamais le chat) :
   ```bash
   osascript -e 'tell application "Terminal" to activate' \
             -e 'tell application "Terminal" to do script "ezk-secret-set samplerz-ionos-api"'
   ```
2. **Usage** — l'agent lit dans une **variable** et s'en sert, sans l'afficher :
   ```bash
   KEY=$(ezk-secret-get samplerz-ionos-api)
   curl -H "X-API-Key: $KEY" https://api.hosting.ionos.com/dns/v1/zones
   ```
   Tu vois et valides chaque commande (permissions) — rien ne se lit dans ton dos.

## Authentification à la lecture

Les scripts rangent le secret avec `-T ''` (aucune application pré-autorisée) : le **but**
est que **chaque lecture** déclenche la **validation du trousseau** (Touch ID ou mot de
passe de session).

⚠️ **À vérifier sur ta machine.** Lance `ezk-secret-get <service>` et regarde si un popup
apparaît. Selon la version de macOS, l'outil `security` peut être traité comme « de
confiance » et lire **sans** popup. Si tu veux une garantie forte (biométrie **liée à
l'action**, consentement signé), passe par le helper Touch ID de
[`elicitation-authentification-forte`](../elicitation-authentification-forte.md).

## Cas IONOS (préfixe public + secret)

IONOS te donne **deux** valeurs à la création : un **préfixe public** et un **secret**.
La clé d'API = **`préfixe.secret`** (collés par un point) — c'est ce qui va dans l'en-tête
`X-API-Key`. Range la **clé complète** :
```bash
ezk-secret-set samplerz-ionos-api
# puis colle : <préfixe>.<secret>
```

## Installation

```bash
mkdir -p ~/.local/bin
cp ezk-secret-set ezk-secret-get ezk-secret-list ~/.local/bin/
chmod +x ~/.local/bin/ezk-secret-*
# ~/.local/bin doit être dans ton PATH (ajoute-le à ~/.zshrc si besoin) —
# sinon l'agent ne pourra pas appeler les commandes.
```

## Pièges

- **Sortie en hexadécimal** à la lecture = un caractère parasite s'est collé avec le secret
  (copier-coller depuis une page web). Refais `ezk-secret-set` proprement.
- **Jamais** le secret en argument (`security … -w <valeur>`) : il resterait dans
  l'historique du shell. Les scripts lisent en `read -rs` masqué.
- **Jamais** afficher `ezk-secret-get` : toujours le capturer dans une variable.
- Le **préfixe IONOS** est public, mais on range la clé entière pour simplifier l'en-tête.

## Statut

Capturée le 2026-08-29 (session samplerz : besoin de ranger la clé API IONOS proprement).
Version simple du pattern ; la version forte reste
[`elicitation-authentification-forte`](../elicitation-authentification-forte.md).
