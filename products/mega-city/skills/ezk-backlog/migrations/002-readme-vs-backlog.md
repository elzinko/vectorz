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
   # (hors monorepo vectorz : adapter le chemin du script / titre)
   ```
4. **Vérifier** : `features/BACKLOG.md` existe et contient la table ;
   `features/README.md` n'est **plus** une table auto-générée.
5. **Commit** : `docs(features): migrate layout v2 (README curé + BACKLOG)` .

Helper optionnel (étapes 2–3) :

```bash
bash <skill>/scripts/apply-002-readme-vs-backlog.sh [racine] [titre-index]
```

## Après migration

Toute commande skill qui détecte encore `layout_version < 2` doit **proposer**
cette migration ; une fois le marqueur à `2`, silence.
