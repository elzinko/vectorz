# Pack de review markdown-first (contrat `method-review@0.1`)

Implémentation du contrat de review posé par [ADR-038](../../../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md).
Fiche : `features/0183-pack-review-markdown-first.md`. Calqué sur `src/supervision/`
(kit émetteur : noyau pur + ports + adaptateurs minces + README + tests
colocalisés) — même patron de forme, appliqué au **reporting post-hoc** (« qu'a
livré la méthode ? ») plutôt qu'au monitoring live.

- `contract.ts` — types `ReviewPack` + front-matter, `CONTRACT_URI =
  'method-review@0.1'`, `validateReviewPack()` (champs requis + énum `status`).
- `render.ts` — `render(pack): string`, **fonction pure, zéro IO**. Sérialise le
  front-matter puis les **7 sections obligatoires** (Résumé, Rendus, Matrice de
  validation, À tester, Qualité, Provisioning / preview, Trouvailles) **par
  référence** — jamais par copie transformée. Une section dont la source est
  absente dégrade proprement en « N.A. ».
- `ports.ts` — `ReviewSource.collect()` (couture nommée, une seule
  implémentation en MVP — YAGNI, ADR-038 §5) et `ReviewEmitter.emit(pack)` (port
  qui gagne sa place immédiatement : ≥2 implémentations prouvent l'agnosticisme,
  AC4).
- `emitters/markdown-file.ts` — **toujours actif**. Écrit
  `features/reviews/<id>-slug/REVIEW.md` (+ `assets/`), chemin dérivé de
  `fiche`/`branch`, **idempotent** (ré-émettre le même pack ré-écrit le même
  fichier, ne duplique rien). Le fichier in-repo **est** le substrat durable
  (SoT).
- `emitters/github-comment.ts` — **opt-in**. Projette le même `ReviewPack` en
  corps de commentaire. Aucune I/O, aucun appel `gh` : l'acte `gh pr comment`
  reste à la frontière CLI (`bin/review-emit.ts`, flag `--github`).

## Aucun rendu n'est SoT (AC5)

`REVIEW.md` in-repo est la **seule** source de vérité — lisible en diff brut,
sans aucun outil ni compte externe. Le commentaire GitHub (et tout futur
émetteur GitLab / webapp 0184) est une **projection** : un rendu qui échoue
n'invalide jamais le pack (push-only, best-effort, ADR-032/036).

## Émettre un pack — CLI

```bash
pnpm --dir products/mega-city review:emit \
  --fiche 0183 --branch feat/0183-pack-review-markdown-first \
  --product mega-city --method-name ezk-sprint --method-version 0.1.0 \
  --status ready-for-review \
  --resume "Pack de review markdown-first implémenté." \
  --matrice "Voir docs/PR_VALIDATION.md — CI ✅ · Tests unitaires ✅" \
  --a-tester "pnpm --dir products/mega-city test" \
  --provisioning "pnpm --dir products/mega-city test" \
  [--qualite "..."] [--rendus "assets/before.png,assets/after.png"] \
  [--trouvailles "..."] [--pr <url>] [--run-id <id>] \
  [--reviews-root features/reviews] [--github]
```

Écrit toujours `features/reviews/<fiche>-<slug>/REVIEW.md` (+ `assets/`) via
`markdown-file`. `--github` projette en plus le corps de commentaire sur
stdout — poster ce texte avec `gh pr comment` reste un geste **hors du cœur**,
à la frontière CLI/opérateur.

## Programmatique

```ts
import { validateReviewPack, type ReviewPack } from './contract.js';
import { render } from './render.js';
import { createMarkdownFileEmitter } from './emitters/markdown-file.js';
import { createGithubCommentEmitter } from './emitters/github-comment.js';

const pack: ReviewPack = { /* ... */ };
validateReviewPack(pack);

createMarkdownFileEmitter({ reviewsRoot: 'features/reviews' }).emit(pack); // écrit REVIEW.md
const commentBody = createGithubCommentEmitter().emit(pack); // même pack, 2ᵉ rendu
```

## Distinct du kit `supervision/`

`events.jsonl` (append-only, machine, **live**) et `REVIEW.md` (manifeste
humain, éditable, **post-hoc**) ont des cycles de vie et des lecteurs
différents (SRP, ADR-038 §Contexte + passe adverse §d). Ce module ne dépend
d'aucun module de `supervision/`, et réciproquement.

## Voisins

- `docs/PR_VALIDATION.md` — matrice de validation référencée depuis le pack.
- `features/checks/` (0178, pas encore créé) — composé par référence dans « À
  tester » ; absence dégradée proprement.
- `.quality/` (0052/0058) — source **lue**, jamais copiée, pour la section
  « Qualité ».
- `features/0058-rapport-qualite-pr.md` — reclassé **adaptateur** du pack
  (émetteur GitHub riche, hors MVP), pas une SoT concurrente.
- `features/reviews/REVIEW.template.md` — gabarit de référence si tu écris un
  pack à la main plutôt que via `review:emit`.
