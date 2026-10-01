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

Avec `pnpm ezk`, les chemins relatifs partent de la racine du dépôt. Sur un poste, `pnpm link --global`
depuis `products/mega-city` expose `ezk` partout (`bin/ezk.mjs`, qui n'a pas besoin de `tsx` installé).
Une commande qui travaille sur les fichiers du dépôt de la méthode refuse de tourner depuis un autre
dépôt et dit comment faire (`--root <dépôt>` avant la commande). Les anciens scripts pnpm
(`lawgiver`, `graph:compile`, `ezk:map`…) marchent toujours.

## Ajouter une commande

Une entrée dans `ezk-manifest.yml` : domaine, verbe, script, une ligne de description. Un test
(`src/__tests__/ezk-manifest.test.ts`) échoue si un script de `bin/` exposé en script pnpm n'est ni au
manifeste ni déclaré `internal`. Décision : [ADR-0046](../docs/adr/0046-cli-ezk-point-d-entree-mince-manifeste.md).

## Le moteur déterministe (`lawgiver`)

Zéro IA dans le chemin d'écriture.

- `bind <profile> <projet> [host]` : `expand(profile)` (résout `extends`, déduplique) puis matérialise
  par le `cap` de l'hôte. C'est le « charger d'un coup ». Données pures → fichiers, testable.
- `bind-global <profile> [--link]` : même chose dans `~/.claude` (skills et agents).
- `status <profile> [--target <dossier>]` : ce qui est déployé, en lecture seule.
- `capture <cible> <kind>` (`kind` = rule | skill | agent | interaction) : les bords (LLM) rédigent et
  jugent ; le cœur (script) range dans la liste cible, ajoute une ligne au `journal/` et fait le commit.

Le LLM ne **range** jamais : il produit du contenu et un avis, le moteur écrit et commit.

---

**Langage libre.** bash+python (comme `link-project.sh`) ou TypeScript pour les types
du `domain.ts`. Le PRINCIPE est « script fiable et testé », **pas** « TS obligatoire ».
