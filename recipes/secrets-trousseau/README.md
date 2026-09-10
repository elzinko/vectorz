# Recette — Ranger des secrets dans le trousseau macOS (l'agent les lit sur demande)

> **Générique.** Ranger des secrets (clés d'API, tokens) dans le **trousseau macOS**,
> pour que l'agent (Claude) les **lise au moment d'agir sans qu'ils passent jamais par le
> chat**, et que **toi seul** ouvres l'accès. Une **commande unique** : `ezk-secret <verbe>`
> (`set`, `get`, `check`, `list`, `remove`, `open`).
>
> **Composée** : pour une authentification *vraiment* forte — Touch ID + consentement
> **signé et lié à l'action** — voir la recette avancée
> [`elicitation-authentification-forte`](../elicitation-authentification-forte.md).
> Celle-ci est la version **simple et pragmatique** (trousseau natif macOS).
>
> **Éprouvée** le 2026-08-29 : dépôt de la clé API IONOS, lecture par l'agent, `POST` de
> 2 CNAME sur l'API IONOS DNS (HTTP 201).

## En clair

Un secret ne devrait jamais traîner en clair — ni dans un fichier, ni dans le chat, ni
dans l'historique du shell. Le **trousseau macOS** le garde chiffré. **Toi** tu le déposes
(saisie masquée dans un terminal) ; l'**agent** le relit dans une variable au moment d'agir,
sans jamais l'afficher. Chaque commande passe sous tes yeux : c'est ton « accès sur demande ».

Tout passe par **une seule commande**, `ezk-secret <verbe>`, aux conventions POSIX : le nom
du secret est un argument, les options sont des drapeaux, et `--help` marche partout.

## Convention de nommage

`<projet>-<provider>-<type>` — ex. `samplerz-ionos-api`, `livestreamz-vercel-token`.
Un nom = un secret. **L'agent suggère le nom, tu valides.** Le trousseau n'a pas de vrais
tags : la **convention de nommage** + `ezk-secret list <motif>` tiennent lieu de regroupement.

## Les commandes

| Commande | Rôle |
|---|---|
| `ezk-secret set <nom>` | range un secret (saisie **masquée**) — **upsert** (crée ou remplace) |
| `ezk-secret set <nom> --clip` | range depuis le **presse-papier** — pour les clés **LONGUES** (JWT Lemon Squeezy…) que la saisie masquée tronque |
| `ezk-secret set <nom> --trust <app>` | pré-autorise `<app>` à lire (⚠ affaiblit « valider chaque accès » — opt-in explicite) |
| `ezk-secret get <nom>` | le lit — ⚠ **à capturer dans une variable, jamais afficher** |
| `ezk-secret check <nom>` | **vérifie sans révéler** : longueur + aperçu masqué (2 premiers … 2 derniers, si ≥ 12) + empreinte SHA-256 |
| `ezk-secret list [motif]` | liste les **noms** rangés (jamais les valeurs) |
| `ezk-secret remove <nom>` | supprime un secret |
| `ezk-secret open` | ouvre le **Trousseau d'accès** |

Aide : `ezk-secret help`, `ezk-secret --help`, ou `ezk-secret <verbe> --help`.

> **Anciens noms (dépréciés).** Les scripts `ezk-secret-set`, `-get`, `-list`, `-check`,
> `-set-ionos` existent encore comme **fines redirections** vers `ezk-secret <verbe>` (ils
> affichent un avertissement à l'usage). Ils seront **retirés** une fois les appelants migrés.

### Clés longues (JWT) — le piège du collage

La saisie masquée (`read` sur une ligne de terminal) **tronque** au-delà d'une
longueur (mode canonique, ~1024 caractères) et peut capturer un caractère
invisible du collage → **clé corrompue** (souvent : ressort en **hexadécimal** à
la lecture). Pour une clé longue (Lemon Squeezy, JWT), utilise `--clip` :

```bash
# la clé est déjà copiée dans le presse-papier
ezk-secret set lemonsqueezy-api --clip
ezk-secret check lemonsqueezy-api   # longueur cohérente = OK
```

⚠️ Compromis `--clip` : la valeur transite une fraction de seconde comme argument
de `security` (visible à `ps` sur TA machine). Acceptable en local ; garde la
saisie masquée pour les secrets courts.

## Comment l'agent l'utilise (le flux « sur demande »)

1. **Dépôt** (une fois) — tu saisis le secret dans un terminal, il ne touche jamais le chat.
   L'agent peut t'ouvrir ce terminal (voir plus bas), ou tu lances la commande toi-même.
2. **Usage** — l'agent lit dans une **variable** et s'en sert, sans l'afficher :
   ```bash
   KEY=$(ezk-secret get samplerz-ionos-api)
   curl -H "X-API-Key: $KEY" https://api.hosting.ionos.com/dns/v1/zones
   ```
   Tu vois et valides chaque commande (permissions) — rien ne se lit dans ton dos.

## Trousseau d'accès ≠ app « Mots de passe »

⚠️ Les secrets ezk sont des **« generic passwords »** du **trousseau login**. Ils
apparaissent dans l'app **« Trousseau d'accès »** (*Keychain Access*) — que
`ezk-secret open` ouvre — **mais PAS** dans la nouvelle app **« Mots de passe »**
(Réglages → Mots de passe), qui ne gère que les **logins iCloud et les passkeys**.
Cherche donc tes secrets ezk dans le **Trousseau d'accès**, pas dans « Mots de passe ».

## Authentification à la lecture

⚠️ **Constat révisé (2026-08-30) : la lecture d'un secret rangé `-T ''` DÉCLENCHE
un popup macOS.** Test reproductible : entrée créée avec `-T ''`, puis
`security find-generic-password -w` → **dialogue d'autorisation** (« security veut
utiliser des informations confidentielles… »). Ce dialogue **bloque** une lecture
**automatisée** (une session headless attend indéfiniment).

Comportement exact, par **entrée** (chaque item a sa propre ACL) :
- **1ʳᵉ lecture** → popup. Tu choisis :
  - **Autoriser** (une fois) → lecture OK cette fois, re-popup la prochaine.
  - **Toujours autoriser** → ajoute `security` à l'ACL de CETTE entrée → lectures
    **silencieuses** ensuite (c'est probablement pourquoi la clé IONOS ne
    promptait plus le 2026-08-29 : « Toujours autoriser » avait été cliqué).

Conséquence pour l'agent : **la 1ʳᵉ lecture doit être déclenchée par TOI** (tu
lances `ezk-secret check <nom>` ou `ezk-secret get`, tu cliques dans le
dialogue). Après « Toujours autoriser », l'agent peut lire sans blocage.

Compromis à choisir :
- **Sécurité max** : « Autoriser » à chaque fois (validation par lecture) — mais
  l'agent ne peut pas lire en autonomie (il faut ton clic à chaque appel). C'est le
  **défaut** (`ezk-secret set` range en `-T ''`).
- **Fluide** : « Toujours autoriser » une fois par clé — l'agent lit ensuite seul.
  (`ezk-secret set <nom> --trust <app>` fait la même pré-autorisation à la création,
  en opt-in — à réserver aux cas où tu acceptes la lecture silencieuse.)
- **Vraie auth forte** (Touch ID, consentement signé par action) : la recette
  [`elicitation-authentification-forte`](../elicitation-authentification-forte.md).

## Cas IONOS (préfixe public + secret)

IONOS donne **deux** valeurs à la création : un **préfixe public** et un **secret**. La clé
d'API = **`préfixe.secret`** (un point entre les deux) → en-tête `X-API-Key`.

Le préfixe est un **identifiant public** (non sensible) ; seul le morceau après le point
l'est. Mais l'API veut la valeur **complète** dans l'en-tête. On la range donc **entière**,
en une fois, via le presse-papier — **plus besoin d'un script `set-ionos` dédié** :

```bash
# copie la valeur COMPLÈTE « préfixe.secret » (le point inclus), puis :
ezk-secret set samplerz-ionos-api --clip
ezk-secret check samplerz-ionos-api   # la longueur inclut préfixe + point + secret
KEY=$(ezk-secret get samplerz-ionos-api)
curl -H "X-API-Key: $KEY" https://api.hosting.ionos.com/dns/v1/zones/<zoneId>/records
```

⚠️ Le point oublié (une seule valeur collée, ou point perdu) donne un
`400 "Invalid API key format"` (vécu) : recolle la valeur **entière** et refais `set --clip`.

## L'agent t'ouvre le terminal de saisie (optionnel)

```bash
osascript -e 'tell application "Terminal" to activate' \
          -e 'tell application "Terminal" to do script "ezk-secret set samplerz-ionos-api --clip"'
```
⚠️ **Piège vécu** : la 1ʳᵉ fois, macOS demande d'**autoriser l'automatisation de Terminal**.
Sans validation dans les ~2 min, l'AppleEvent expire (`erreur -1712`). Accorde-la dans
**Réglages → Confidentialité et sécurité → Automatisation**, ou lance la commande toi-même.

## Installation

```bash
mkdir -p ~/.local/bin
# la commande unifiée + les redirections rétro-compat (dépréciées, à retirer plus tard)
cp ezk-secret ezk-secret-set ezk-secret-get ezk-secret-list ezk-secret-check ezk-secret-set-ionos ~/.local/bin/
chmod +x ~/.local/bin/ezk-secret*
# ~/.local/bin doit être dans ton PATH (sinon l'agent ne peut pas appeler la commande).
```

Gate locale (avant toute modif) : `shellcheck ezk-secret ezk-secret-*` puis
`bash test-ezk-secret.sh` (routage + aide + invariants de sécurité, sans toucher au trousseau).

## Pièges

- **`400 "Invalid API key format"`** = clé IONOS **sans le point** (une seule valeur, ou point
  oublié au collage). Recolle la valeur **complète** et refais `ezk-secret set <nom> --clip`.
- **Sortie en hexadécimal** à la lecture = caractère parasite collé avec le secret → re-range
  proprement avec `--clip` (colle depuis le presse-papier, sans troncature).
- **AppleEvent `-1712`** = autorisation d'automatisation Terminal manquante (voir plus haut).
- **Jamais** le secret en argument en clair ; **jamais** afficher `ezk-secret get` (capture-le).
- Le **trousseau natif ne protège pas la lecture** par défaut au sens fort (voir §Authentification).
- Secret introuvable dans l'app « Mots de passe » ? Normal — regarde le **Trousseau d'accès**
  (`ezk-secret open`).

## Statut

Capturée **et éprouvée** le 2026-08-29 (session samplerz). **CLI unifiée `ezk-secret <verbe>`
le 2026-09-06** (fiche `20260906121839943`) — anciens scripts conservés en redirections
dépréciées. Version simple ; la version forte reste
[`elicitation-authentification-forte`](../elicitation-authentification-forte.md).
