# Brancher le journal de supervision sur Claude Desktop

*Enregistrer, pour les relire au calme, toutes les décisions que prend un agent qui travaille seul.*

---

## En un mot

Quand tu laisses **une méthode autonome** travailler pour toi — comprends : un agent qui
enchaîne le travail tout seul, par exemple `/vz-product-builder` qui construit plusieurs
features à la suite, ou un sprint qui tourne 20 minutes sans toi — il prend des dizaines
de décisions en ton absence : quelle tâche attaquer, comment trancher un blocage, quand
s'arrêter.

Le **journal de supervision** est la *boîte noire* de ces agents, comme l'enregistreur de
vol d'un avion : pendant qu'ils tournent, il note chaque décision dans un fichier **sur ta
machine** — démarrage, étape franchie, reprise, alerte, fin. Le lendemain matin, tu relis
« qui a décidé quoi, et pourquoi » au lieu d'avoir été réveillé à chaque question.

Cette page explique comment le brancher sur **Claude Desktop** — l'application de bureau
de Claude (pas la version web) : c'est la seule qui peut faire tourner ce genre d'outil
local sur ta machine.

## Pour qui est cette page

Le branchement décrit ici est **manuel** et suppose que tu es à l'aise techniquement :

- tu as le dépôt **mega-city** cloné sur ta machine ;
- tu as **pnpm** installé (l'outil qui lance le serveur) ;
- éditer un petit fichier de configuration ne te fait pas peur.

**Si ce n'est pas ton cas**, ce n'est pas grave : une installation **en un clic** est en
préparation (voir [Bientôt : l'installation en un clic](#bientôt-linstallation-en-un-clic)).
Reviens à ce moment-là.

## En as-tu besoin ?

- **Oui**, si tu lances des méthodes autonomes et que tu veux une **trace auditable** de
  ce qui s'est décidé (l'« audit du matin »).
- **Pas encore**, si tu pilotes tout à la main en session interactive : tu vois déjà
  chaque décision passer, il n'y a rien à enregistrer.

## Un mot sur la nature de l'outil

Certains outils vivent dans le cloud et se branchent en collant une **URL** (par exemple
le connecteur d'un service comme Rentila : `https://…/mcp`). Le journal de supervision,
lui, est différent : il **tourne sur ta machine** et écrit dans un dossier local
(`.supervision/`). Aucun serveur distant ne pourrait le faire à ta place.

Concrètement, pour toi : **pas d'URL ni de mot de passe** à saisir. On l'ajoute en collant
un petit bloc de configuration en local — c'est ce qu'on appelle un **serveur MCP local**
(MCP = la prise standard par laquelle Claude Desktop se branche sur des outils externes).

## Avant de commencer

Réunis ces trois choses — ça t'évitera de bloquer en cours de route :

1. **pnpm est installé et joignable.** Vérifie dans un terminal :
   ```bash
   pnpm -v        # doit afficher un numéro de version
   which pnpm     # note ce chemin : il servira à l'étape 2
   ```
2. **Les dépendances du dépôt sont installées.** Une seule fois, à la racine du dépôt :
   ```bash
   pnpm install
   ```
3. **Tu connais tes deux chemins de dossiers** (ce sont **deux dossiers différents**) :
   - le dossier **mega-city** du dépôt ;
   - le **projet** dont tu veux enregistrer les décisions.

   > 💡 Sur macOS, pour copier le chemin exact d'un dossier : clic droit dessus dans le
   > Finder, maintiens **Option**, puis « Copier … en tant que nom de chemin ».

## Brancher en 3 étapes

*(Instructions macOS. Sous Windows, seule l'étape 1 change : le fichier de configuration
est sous `%APPDATA%\Claude\`.)*

### 1. Ouvrir la configuration de Claude Desktop

Dans Claude Desktop : **Réglages → Développeur → « Modifier la config »** (en anglais :
*Settings → Developer → Edit Config*). Ça ouvre (ou crée) ce fichier :

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

> Avant de le modifier, **duplique-le** pour garder une copie de secours si tu n'es pas
> serein.

### 2. Coller le bloc de configuration

Si le fichier est **vide**, colle tout le bloc ci-dessous. S'il **contient déjà** des
serveurs, ajoute seulement l'entrée `"supervision"` à l'intérieur de `"mcpServers"` (voir
l'exemple avant/après plus bas).

```json
{
  "mcpServers": {
    "supervision": {
      "command": "REMPLACE_PAR_LE_CHEMIN_DE_PNPM",
      "args": [
        "--dir", "/chemin/absolu/vers/mega-city",
        "exec", "tsx",
        "/chemin/absolu/vers/mega-city/bin/supervision-mcp.ts"
      ],
      "env": { "SUPERVISION_PROJECT_ROOT": "/chemin/absolu/du/projet/à/superviser" }
    }
  }
}
```

> **Pourquoi `--dir` et le chemin complet de pnpm ?** Claude Desktop lance les serveurs
> sans ton terminal habituel : il ne connaît ni où est `pnpm`, ni depuis quel dossier
> travailler. On le lui dit explicitement — c'est ce qui évite l'erreur silencieuse la
> plus courante (« les outils n'apparaissent pas »).

### 3. Remplacer les trois valeurs, puis redémarrer

| À remplacer | Par |
|---|---|
| `REMPLACE_PAR_LE_CHEMIN_DE_PNPM` | Le chemin donné par `which pnpm` à l'étape « Avant de commencer » (ex. `/Users/toi/.nvm/versions/node/v22.x/bin/pnpm`). |
| `/chemin/absolu/vers/mega-city` (×2) | Le dossier **mega-city** du dépôt (là où vit `bin/supervision-mcp.ts`). La même valeur aux deux endroits. |
| `/chemin/absolu/du/projet/à/superviser` | La **racine du projet** dont tu veux enregistrer les décisions (le journal `.supervision/` y sera écrit). |

Tous les chemins doivent être **absolus** (ils commencent par `/`, jamais par `~`).

Enregistre le fichier, puis **quitte et rouvre entièrement Claude Desktop**. Les cinq
outils du journal — `run_start`, `gate_reached`, `gate_resumed`, `escalate`,
`run_finished` — sont maintenant disponibles dans tes sessions.

#### Exemple avant / après (fichier déjà rempli)

Si ton fichier ressemble déjà à ceci :

```json
{
  "mcpServers": {
    "autre-serveur": { "command": "…", "args": ["…"] }
  }
}
```

… ajoute une **virgule** après l'accolade de `"autre-serveur"`, puis colle l'entrée
`"supervision"` juste après :

```json
{
  "mcpServers": {
    "autre-serveur": { "command": "…", "args": ["…"] },
    "supervision": {
      "command": "REMPLACE_PAR_LE_CHEMIN_DE_PNPM",
      "args": ["--dir", "/abs/mega-city", "exec", "tsx", "/abs/mega-city/bin/supervision-mcp.ts"],
      "env": { "SUPERVISION_PROJECT_ROOT": "/abs/projet" }
    }
  }
}
```

## Vérifier que c'est bien branché

Dans une **nouvelle conversation** Claude Desktop, tape `/supervision-demo` dans la zone
de message et envoie. C'est une mini-méthode de test (elle doit être installée comme skill
dans ton Claude Desktop) qui émet un journal complet en deux étapes.

Deux façons de confirmer que ça a marché :

- La démo t'annonce dans la conversation où elle a écrit le journal ; **ou**
- tu retrouves le fichier ici :
  ```
  <ton-projet>/.supervision/runs/<identifiant-du-run>/events.jsonl
  ```
  > Le dossier `.supervision` commence par un point : il est **caché** dans le Finder.
  > Pour le voir : dans le dossier du projet, presse **Cmd + Maj + .** (point).

Pour la vraie chose — laisser une méthode autonome travailler et enregistrer ses
décisions : `/vz-product-builder build --tokens cap`.

## Si ça coince

- **Les outils n'apparaissent pas après le redémarrage.** La cause quasi certaine est le
  lancement : vérifie que `command` est le **chemin complet** de `pnpm` (pas juste
  `pnpm`), que `--dir` pointe bien sur mega-city, et que tu as fait `pnpm install`. Une
  app lancée depuis l'interface ne « voit » pas ton pnpm ni ne sait où trouver l'outil si
  on ne le lui dit pas explicitement.
- **Chemins.** Tous absolus, aucun `~`, aucun chemin relatif. Le journal s'arrête
  immédiatement si le dossier `SUPERVISION_PROJECT_ROOT` n'existe pas — c'est voulu, ça
  évite d'écrire au mauvais endroit.
- **Une méthode se lance mais n'enregistre rien ?** Si un agent ne « voit » pas les cinq
  outils, il continue en mode dégradé et le signale : c'est le symptôme d'un branchement
  incomplet. Reprends les étapes 2 et 3.

## Bientôt : l'installation en un clic

Tu voulais un bouton qui installe tout depuis l'interface de Claude Desktop, sans toucher
au moindre fichier. Pour un serveur local, ça existe : un **bundle `.mcpb`**. On empaquette
le journal dans un fichier ; tu le **double-cliques**, Claude Desktop propose de
l'installer avec un **sélecteur de dossier** pour le projet à superviser, et c'est réglé —
plus aucun JSON, plus aucun chemin à copier. C'est l'étape prévue juste après (fiche
backlog **0078**).

## Aller plus loin

- [Démarrer avec les serveurs MCP locaux — Claude Desktop](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [Desktop Extensions : l'installation en un clic (.mcpb) — Anthropic](https://www.anthropic.com/engineering/desktop-extensions)
- [Connecter un serveur MCP local — Model Context Protocol](https://modelcontextprotocol.io/docs/develop/connect-local-servers)

*Pour intégrer le journal de supervision dans ta propre méthode (et pas seulement le
brancher), la référence technique est le [README du kit](../src/supervision/README.md).*
