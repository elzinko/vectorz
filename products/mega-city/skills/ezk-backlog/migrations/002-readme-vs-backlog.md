# 002 — README curé + BACKLOG généré (layout v1 → v2)

**From** `layout_version: 1` (ou marqueur absent)  
**To** `layout_version: 2`

> Les fichiers de migration sont numérotés par la **version cible** (`002` ⇒ produit
> `layout_version: 2`), alignés sur `migrations/VERSION`.

## Pourquoi

En v1, `features/README.md` était l'**index auto-généré** — illisible comme guide
humain, et écrasé à chaque `regen`. En v2 :

- `features/README.md` = **guide curé** (à quoi sert le dossier, comment travailler)
- `features/BACKLOG.md` = **index généré** (`regen` uniquement — ne pas éditer à la main)

## Étapes (mécaniques + LLM)

1. **Sauvegarder** l'ancien index s'il n'existe pas encore de `BACKLOG.md` :
   si `features/README.md` commence par `# Backlog` / contient « Index auto-généré »,
   le déplacer ou le laisser se faire écraser après l'étape 3.
2. **Écrire** le guide curé : copier le scaffold
   `<skill>/templates/features-README.md` vers `features/README.md`
   (adapter le titre projet si besoin ; garder le front-matter
   `layout_version: 2`).
3. **Régénérer** l'index :
   ```bash
   bash products/mega-city/bin/regen-backlog.sh . "Backlog features & bugs — <projet>"
   ```
4. **Vérifier** : `features/BACKLOG.md` existe et contient la table ;
   `features/README.md` n'est **plus** une table auto-générée.
5. **Commit** : `docs(features): migrate layout v2 (README curé + BACKLOG)` .

Helper optionnel (étapes 2–3) :

```bash
bash <skill>/scripts/apply-002-readme-vs-backlog.sh [racine] [titre-index]
```

### `regen-backlog.sh` hors monorepo vectorz

`apply-002` (et `init` quand des fiches existent) résolvent le script via
`<skill>/scripts/resolve-regen-backlog.sh`, dans cet ordre :

1. variable d'environnement `EZK_REGEN_BACKLOG` (chemin absolu)
2. `<racine>/products/mega-city/bin/regen-backlog.sh`
3. `<racine>/bin/regen-backlog.sh`
4. bin du produit mega-city relatif à la skill installée
5. remontée depuis la racine (worktrees / clones imbriqués)
6. `regen-backlog.sh` sur le `PATH`

Si rien n'est trouvé : **erreur claire** avec les consignes ci-dessus — pas de
half-migrate silencieux. Pour un repo externe minimal :

```bash
# Option A — pointer vers le monorepo
export EZK_REGEN_BACKLOG=/chemin/vers/vectorz/products/mega-city/bin/regen-backlog.sh
bash <skill>/scripts/apply-002-readme-vs-backlog.sh . "Backlog — mon-projet"

# Option B — copier le script dans le projet
mkdir -p bin
cp /chemin/vers/vectorz/products/mega-city/bin/regen-backlog.sh bin/
chmod +x bin/regen-backlog.sh
```

## Après migration

Toute commande skill qui détecte encore `layout_version < 2` doit **proposer**
cette migration ; une fois le marqueur à `2`, silence.

`init.sh` sur un projet encore en v1 (README = index auto-généré) **refuse** de
créer `BACKLOG.md` à côté : il affiche `STATUS=behind` et pointe vers ce helper
— pas de split-brain README+BACKLOG.
