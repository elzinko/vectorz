# docs/sessions/ — les récits de session

## En clair

Ce dossier garde la **mémoire d'une session de travail** une fois celle-ci close.
Un fichier = un récit : ce qui a été fait, décidé, et les galères résolues en chemin.
Les récits ne se rédigent pas à la main. `/ezk-archive` en fige un instantané du
`SPRINT.md` à la clôture, et c'est la seule porte d'entrée normale.

Ce README documente le **format tel qu'il existe** pour deux lecteurs :
`/ezk-archive`, qui écrit ces fichiers, et toi, qui viens y relire une vieille session.

## Le nom du fichier

```
docs/sessions/AAAA-MM-JJ-<slug>.md
```

- La date est celle de la session.
- Le `<slug>` résume le sujet. Souvent `sprint-<id>-<desc>` quand la session a livré une
  fiche, parfois juste un thème (`ezk-map-carte-loi-board-design`).
- Collision de nom → suffixe `-2`, `-3`… On **n'écrase jamais** un récit existant.

## La structure d'un récit

Le format est **léger, pas un gabarit rigide**. Chaque récit prend les sections qui
servent son histoire. Trois éléments reviennent presque toujours ; le reste est libre.

### 1. L'entête `fiches:` (première ligne)

```
fiches: 20260829123707100
```

Tout en haut, **avant le titre**, une ligne `fiches: <id>[,<id>]`. Elle liste le ou les
ids de fiche backlog travaillés dans la session.

Une session **sans fiche** (non-feature, clôturée en `--shipped none`) n'a **pas** cet
entête : on ne l'ajoute que s'il y a un id réel, jamais inventé.

C'est ce qui rend le récit **rapprochable de sa feature**. On retrouve tout par l'id :

```bash
grep -rl 20260829123707100 docs/sessions/   # quel récit parle de cette fiche
git log --grep=20260829123707100            # quels commits (via feat/<id>-<slug>, ADR-0018)
```

Cet entête est un ajout récent (feature « labo de cuisine », fiche `20260829123707100`).
Les récits d'avant ne l'ont pas — c'est normal, il n'est pas rétroactif.

### 2. Le titre et les métadonnées

Une ligne de titre, puis deux ou trois lignes de contexte :

```
# Sprint — ezk-ci conso : script déterministe + endpoint billing migré

Périmètre: 1 feature (POC), fiche 20260828150801613   Statut: en cours
Branche: feat/20260828150801613-ezk-ci-conso   Base: origin/main
```

`Périmètre` et `Statut` sont quasi systématiques. `Branche`, `Base`, `Fiche`, `Modes`
apparaissent selon le besoin.

### 3. Les sections de corps (`##`, au choix)

On pioche parmi celles-ci, dans l'ordre qui raconte le mieux la session :

| Section | À quoi elle sert |
|---|---|
| `## Ouverture (portier)` | Verdict du portier d'intake, overrides PO journalisés |
| `## Backlog` | Les features de la session, une ligne = une PR (`- [x]` / `- [ ]`) |
| `## Livré` | Ce qui a réellement atterri (commits, PR, issues fermées) |
| `## Décisions d'archi` | Les arbitrages de conception tranchés |
| `## Definition of Done` | Les scénarios BDD qui valent acceptation |
| `## Revue adverse` | Verdict `ezk-reviewer` / Codex, findings traités |
| `## Gates` | État des tests / CI |
| `## Galères & gestes (labo)` | Les galères résolues, pour les rejouer (voir plus bas) |
| `## Notes / décisions` | ADR courts, fausses routes évitées |
| `## Suite` | Ce qui reste à faire à la prochaine session |

Aucune n'est obligatoire. Un récit d'intake sans build tient en trois sections ;
un gros sprint en compte huit.

## La section « Galères & gestes (labo) »

C'est le **second ajout récent** (même feature « labo de cuisine »). Elle capture la
matière que les commits perdent : le **geste d'interface** (un réglage Vercel, un
enregistrement DNS chez IONOS…) et le **pourquoi**, pas seulement le code.

Trois règles la gouvernent :

- **Seulement du corrigé + validé.** Jamais une fausse piste, jamais un travail en cours.
  La clôture est le moment où « corrigé + validé » est vrai par construction.
- **Une entrée courte par galère**, en trois temps : le **symptôme** (ce qui a coincé),
  le **geste / le fix**, le **pourquoi**.
- **Seulement si utile pour rejouer.** Rien à retenir → on n'écrit rien. C'est du
  jugement, pas une case à cocher (même garde-fou qu'`ezk-retro`).

Exemple, tiré de [`2026-08-29-samplerz-cablage-domaine.md`](2026-08-29-samplerz-cablage-domaine.md) :

```markdown
## Galères & gestes (labo)

- **Root Directory Vercel oublié (monorepo)**
  Symptôme : build en échec, `vite: command not found` (exit 127)…
  Geste : Settings → **Root Directory** → renseigner le sous-dossier…
  Pourquoi : dans un monorepo, Vercel construit depuis la racine du repo par défaut…
```

`ezk-sprint` remplit cette section **au fil de l'eau** dans le `SPRINT.md` du sprint.
`ezk-archive` la **reprend telle quelle** dans le récit à la clôture. En aval,
`ezk-chef extract` la **lit déjà** pour nourrir les préliminaires d'un brouillon de
recette : il repère les récits par leur entête `fiches:` (PR #196).

## Comment un récit est créé

Tu ne crées pas ces fichiers à la main. Le flux normal est :

1. Pendant le sprint, `ezk-sprint` tient un `SPRINT.md` éphémère à la racine
   (voir [`skills/ezk-sprint/SKILL.md`](../../products/mega-city/skills/ezk-sprint/SKILL.md)).
2. À la clôture, `/ezk-archive run` en fige un instantané ici, ajoute l'entête `fiches:`
   quand la session a travaillé des fiches (sinon pas d'entête),
   et propose le commit `docs(sessions): archive session AAAA-MM-JJ <slug>`
   (voir [`skills/ezk-archive/SKILL.md`](../../products/mega-city/skills/ezk-archive/SKILL.md)).

## Ce qu'il te reste à faire

Rien de récurrent. Pour **retrouver** une session, pars de l'id de fiche
(`grep -rl <id> docs/sessions/`) ou du thème dans le nom de fichier. Pour **en produire**
une, laisse `/ezk-archive` faire son travail — n'écris pas le récit toi-même.
