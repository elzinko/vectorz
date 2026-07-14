# bin/ — le moteur déterministe

Deux commandes, **zéro IA dans le chemin d'écriture** :

### `bind <profile> <projet> [host]`
`expand(profile)` (résout `extends` + déduplique) → matérialise via le `cap` de l'hôte.
C'est le « charger d'un coup ». Pure data → fichiers. Testable, reproductible.

### `capture <cible> <kind>`  (`kind` = rule | skill | agent | interaction)
- **bords (LLM)** : `author()` rédige le markdown · `judge()` donne un avis (cohérence/doublon)
- **cœur (script)** : append dans la liste cible + 1 ligne au `journal/` + `git commit`

Le LLM ne **range** jamais : il produit du contenu et un avis, le moteur écrit et commit.

---

**Langage libre.** bash+python (comme `link-project.sh`) ou TypeScript pour les types
du `domain.ts`. Le PRINCIPE est « script fiable et testé », **pas** « TS obligatoire ».
