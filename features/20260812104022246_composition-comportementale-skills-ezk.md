---
id: "20260812104022246"
title: "Composer des consignes réutilisables dans les skills"
type: feature
priority: P2
product: mega-city
version: V0.4
labels: [fabrique]
epic:
status: idea
pr:
created: 2026-08-12
---

# Composer du COMPORTEMENT dans un skill ezk (pas seulement des dépendances)

## En clair

Un skill sait déjà dire « j'applique cette règle » (`applies:`) et « je suis fait de ce skill »
(`composes:`). Il ne sait pas dire « je confie ceci à ce skill, **s'il est là** ».
Cette fiche ajoute ce troisième geste : `delegates:`, une composition **optionnelle** qui ne
déclenche jamais d'avertissement. Elle l'utilise sur le cas réel d'`ezk-archive`, qui délègue à
`ezk-backlog` sans l'avoir déclaré. Le reste de l'idée d'origine reste en « Suite ».

## Contexte / Problème

Besoin PO (2026-08-12) : des **consignes réutilisables** qu'un skill déclare et qui s'imposent à lui
(un format de réponse, un appel obligatoire à une commande). Trois voisins existent ; aucun ne
couvrait l'appel **optionnel** :

- `applies:` (fiche 357, ADR-0040) : le skill déclare, par id, la règle de `rules/` qu'il suit.
- `composes:` (ADR-0025) : dépendance **requise**, avertissement au bind si elle manque.
- `composes-external:` : référence hors catalogue, jamais avertie.

Cas réel qui attend : `ezk-archive` délègue `ship`/`add`/`regen` à `ezk-backlog` (§ Intégration)
mais ne le déclare pas. Le déclarer en `composes:` ferait avertir chaque profil sans `ezk-backlog`.

## Frontière tranchée (c'était la question « à groomer avec /engineering:architecture »)

- **Format imposé, tics à éviter** : une **règle** de `rules/`, déclarée par `applies:`. Ça existe.
  Exemple en service : `human-facing-lisibility` sur `ezk-archive` (#273). Rien à inventer.
- **Appel forcé** : une arête déclarée dans le frontmatter **plus** la phrase du corps qui dit
  QUAND appeler. `composes:` si l'appel est requis, `delegates:` s'il est optionnel avec repli.
- **Pas de 4e mécanisme** (mixin, aspect). L'idée d'origine précède `applies:` ; elle est couverte.
- **`ezk-ezk`** (le générateur) pose ces déclarations ; il n'a pas besoin d'un mécanisme neuf.
- Le jeu de **verbes du graphe reste fermé** (ADR-0040 D1) : `delegates:` porte le verbe `compose`,
  comme `composes:` ; la différence se lit dans le trait (pointillé) et dans l'absence d'alerte.

## Critères d'acceptation (reste réel après tri du 2026-09-30)

- [ ] `delegates:` est lu par le loader (même garde `assertSafeId` que `composes:`) et entre dans
      le graphe compilé : lien `delegates`, skill → skill, verbe `compose`.
- [ ] Skill avec `delegates: [X]`, X absent du profil bindé → **aucun** avertissement au bind
      (ni direct, ni via la fermeture transitive).
- [ ] Skill avec `composes: [Y]`, Y absent → avertissement **inchangé** (ADR-0025).
- [ ] Le graphe Mermaid de `skills/README.md` dessine `delegates:` en **pointillé**, `composes:`
      en trait plein ; le bloc se régénère par `pnpm composes:graph` et le test d'à-jour est vert.
- [ ] `ezk-archive` déclare `delegates: [ezk-backlog]` ; son corps cite `ezk-backlog` **et** écrit
      le repli si absent (la délégation est réelle, pas deux lignes de frontmatter).
- [ ] ADR-0025 amendé (quelques lignes) : le tier optionnel et la frontière ci-dessus.

Absorbé de 0190 : ses critères 1 à 3 sont repris tels quels. Son critère 4 (migrer `ezk-sprint`
vers `ezk-codex` / `ezk-preview`) est **sans objet** : `ezk-sprint` ne cite plus ces deux skills.
Le cas réel est `ezk-archive` → `ezk-backlog`. Le garde automatique « intégration fantôme » (retour
Codex #125 : tout `composes:`/`delegates:` doit être cité dans le corps) est **porté par la fiche
0066**, qui en a la charge ; constat de départ : 0 fantôme sur 25 skills.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/composition.test.ts src/__tests__/composes-graph.test.ts src/__tests__/graph-vocabulary.test.ts src/__tests__/catalog.test.ts
pnpm --dir products/mega-city composes:graph   # puis `git diff --stat skills/README.md` : vide
```

Sabotage à rejouer : mettre `delegates: [fantome]` sur un skill → la validation du graphe échoue ;
retirer `ezk-backlog` d'un profil qui porte `ezk-archive` → aucun ⚠️ au bind.

## Suite (hors POC)

- `ezk-ezk` pose `delegates:` à la fabrication d'un skill (aujourd'hui il ne pose que `composes:`).
- `delegates-external:` pour une délégation hors catalogue (aucun cas aujourd'hui).
- La carte `ezk:map` affiche, par skill, les consignes tissées et les délégations (idée PO
  2026-08-25 ; recoupe l'onglet sessions de la fiche 20260825141012293).
- Directive « `ezk-archive` ne restitue QUE la session courante » (2e cas PO, 2026-08-25) : à poser
  comme **règle** appliquée par `applies:`, dans une fiche à part (voisine : 20260824111001836).
- Cas moteur ③ « groom force l'appel archi + brainstorm » : fiche 20260812104022243 fusionnée dans
  20260825161522791 (tri 2026-09-30).

## Notes / décisions

- Origine : session 2026-08-12. Sœur de `0149` (composition structurelle, livrée).
- Absorbe [`0190`](done/0190-composes-delegates-tier-optionnel.md) (tri du 2026-09-30).
- Nom `delegates:` proposé par l'architecte lors du panel du 2026-08-10 ; on le garde.
