# bin/ — les scripts de la méthode, et la commande `ezk` qui les range

## En clair

`ezk` est la commande de terminal de la méthode. Elle ne calcule rien : elle lit un manifeste
([`../ezk-manifest.yml`](../ezk-manifest.yml)) et lance le script qui convient, avec tes arguments.

```bash
pnpm ezk help                 # toutes les commandes de terminal ET de chat, une ligne chacune
pnpm ezk help law             # le détail d'un domaine : quel script il lance
pnpm ezk views regen          # toutes les vues générées hors git, d'un coup (ADR-0055)
pnpm ezk law status global    # ce qui est déployé dans ~/.claude (lien, copie, absent)
pnpm ezk dashboard            # le tableau de bord de la méthode (ex « ezk:map »)
pnpm ezk --dry-run <commande> # montre les scripts qui seraient lancés, sans rien faire
```

Sur un poste, `pnpm link --global` depuis `products/mega-city` expose `ezk` partout (`bin/ezk.mjs`,
qui n'a pas besoin de `tsx` installé). Une commande qui travaille sur les fichiers du dépôt de la
méthode part toujours de la racine de ce dépôt, même lancée depuis un sous-dossier, et refuse de
tourner depuis un autre dépôt en disant comment faire (`--root <dépôt>` avant la commande). Les
autres (`law`, `dashboard`, `help`) partent du dossier où tu es. Les anciens scripts pnpm
(`lawgiver`, `graph:compile`, `ezk:map`…) marchent toujours.

## Lire les fiches d'un autre projet (muti, samplerz)

Cinq commandes ne font que **lire** des fiches : `ezk dashboard`, `ezk board show`,
`ezk backlog check`, `ezk backlog plan-head` et `ezk backlog plan-lot`. Elles lisent par défaut les fiches de la méthode.
(`ezk rules`, plus bas, vise un projet lui aussi.) Pour lire les fiches d'un autre projet, désigne-le :

```bash
pnpm ezk --root ../muti dashboard         # l'option, avant la commande
EZK_ROOT=../muti pnpm ezk board show      # ou la variable
pnpm ezk board show                       # sans rien : les fiches de la méthode, comme avant
```

L'option prime sur la variable, la variable sur le défaut. Un chemin relatif se lit depuis le dossier
où tu as tapé la commande. Un dossier qui n'existe pas est refusé. Quand le projet n'est pas celui de
la méthode, la commande l'écrit sur stderr (« Projet visé : … ») : une variable oubliée dans le shell ne
fait jamais lire un autre projet en silence. Mets `--root` **avant** la commande ; placé après, il va au
script, ce qui marche aussi quand tu es dans un dépôt de la méthode. Les **pages** du tableau de bord
viennent toujours de la méthode : seules les **données** (fiches, plan, récits, pouces) viennent du
projet désigné, et le pouce haut ou bas s'écrit dans `features/reviews/verdicts/` de ce projet. Une commande
qui écrit dans la méthode (`views regen`) refuse un autre projet. Une commande n'accepte un projet que
si le manifeste la marque `project: true` ; un test vérifie que son script sait alors le lire.

## Les règles propres à un projet (`ezk rules`)

Les règles de la méthode sont globales. Un projet peut avoir les siennes, qui ne valent que chez lui :
il les déclare dans son dossier `.vectorz/` (modèle : [`.vectorz/rules.example.yml`](../../../.vectorz/rules.example.yml)).

```bash
pnpm ezk rules check --root ../samplerz   # le contrat est-il cohérent ? (code 1 sinon)
pnpm ezk rules show  --root ../samplerz   # le jeu effectif : projet, commit, empreinte, garantie par règle
pnpm ezk rules apply --root ../samplerz   # l'écrit dans .claude/rules/vectorz-project.md, que Claude Code charge
```

Sans `--root` ni `EZK_ROOT`, le projet est celui du dossier où tu es (sa racine git). Chaque règle dit ce
qui la tient : un **gate déclaré**, que le projet exécute (vectorz n'en lance aucun et ne vérifie pas qu'il
existe), une **revue a posteriori déclarée**, ou rien — un **conseil**, injecté dans le prompt mais jamais
présenté comme garanti. Un `MUST` local sans
gate ni revue est refusé ; le local peut durcir une règle globale, jamais la desserrer. Décision :
[ADR-0050](../docs/adr/0050-couche-regles-projet-local.md).

## Ajouter une commande

Une entrée dans `ezk-manifest.yml` : domaine, verbe, script, une ligne de description. Un test
(`src/__tests__/ezk-manifest.test.ts`) échoue si un script de `bin/` exposé en script pnpm n'est ni au
manifeste ni déclaré `internal`. Décision : [ADR-0046](../docs/adr/0046-cli-ezk-point-d-entree-mince-manifeste.md).

## Le moteur déterministe (`lawgiver`)

Zéro IA dans le chemin d'écriture.

- `bind <profile> <projet> [host]` : `expand(profile)` (résout `extends`, déduplique) puis matérialise
  par le `cap` de l'hôte. C'est le « charger d'un coup ». Données pures → fichiers, testable.
- `bind-global <profile> [--link] [--target <dossier>]` : même chose dans `~/.claude` (skills,
  agents, slash-commands et loi du profil). Un profil déclare ses commandes avec `commands:`
  (`commands/<id>.md`, posées dans `~/.claude/commands/`). En copie, un agent ou une commande porte la
  clé d'en-tête `generated-by: lawgiver bind-global` : c'est ce qui prouve qu'ils sont à lawgiver, et
  permet de rejouer la commande sans jamais écraser un fichier à toi.
- `status <profile> [--target <dossier>]` : ce qui est déployé, en lecture seule.
- `doctor <profile> [--target <dossier>]` : ce qui est déclaré mais pas installé (élément manquant,
  lien mort, copie périmée, loi absente ou périmée), en lecture seule, code 1 s'il y a un écart.
- `capture <cible> <kind>` (`kind` = rule | skill | agent | interaction) : les bords (LLM) rédigent et
  jugent ; le cœur (script) range dans la liste cible, ajoute une ligne au `journal/` et fait le commit.

Le LLM ne **range** jamais : il produit du contenu et un avis, le moteur écrit et commit.

### Ce que `bind` et `bind-global` écrivent, et n'écrivent pas

| | `bind <profil> <projet>` | `bind-global <profil>` |
|---|---|---|
| Écrit | `<projet>/.claude/agents` et `.claude/skills`, la loi dans `.iamthelaw/ENTRY.md`, un bloc dans `CLAUDE.md`, les hooks git | `~/.claude/skills`, `~/.claude/agents`, la loi du profil dans `~/.claude/rules/iamthelaw.md` |
| N'écrit pas | rien dans `~/.claude` | `~/.claude/CLAUDE.md`, les hooks, rien dans un projet |
| La loi | les règles de tous les bundles du profil | les règles du profil, copie compilée même avec `--link` : rejouer la commande après un changement de règle |
| Refuse d'écraser | un hook git qui existe et diffère (sans `--force`) | un skill, un agent ou un fichier de loi qui n'est pas à lawgiver |

Décision et coût en jetons de la loi globale : [ADR-0056](../docs/adr/0056-loi-du-socle-par-le-global.md).

---

**Langage libre.** bash+python (comme `link-project.sh`) ou TypeScript pour les types
du `domain.ts`. Le PRINCIPE est « script fiable et testé », **pas** « TS obligatoire ».
