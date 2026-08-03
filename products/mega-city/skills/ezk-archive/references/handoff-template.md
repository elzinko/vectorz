# Gabarit de la note de handoff — SOURCE UNIQUE

Ce gabarit est lu par **les deux chemins** de clôture — le chemin inline du skill
(verdict `CLEAN`) et le sous-agent (verdict `DIRTY`). Il ne doit exister **qu'ici** :
le dupliquer dans `SKILL.md` ou dans `agents/ezk-archive.md` les ferait diverger
silencieusement, ce que `test-template-unicity.sh` interdit.

Règle d'écriture : [`human-facing-lisibility`](../../../rules/documentation-guidelines/human-facing-lisibility.md)
— ouvrir par **« En clair »**, jargon gate (`REAL`, `ABSORBED`, `stash@{N}`…) en bas
seulement, jamais dans l'ouverture.

---

## Le corps à produire

```markdown
**En clair :**
- <≤ 1 phrase : ce qui a été livré cette session, avec id + n° PR si pertinent>
- <≤ 1 phrase : ce que **toi** (humain) dois faire maintenant — ou « rien, session propre »>
- <≤ 1 phrase : le bruit restant (branches / stashes) — ou « aucun pendings git »>

**Fait cette session :**
- **<id>** (PR #<n>) — <une ligne utile à la reprise>
- <décision structurante, et son *pourquoi*, si utile>

**À faire (toi) :**
1. `git switch main && git pull`   ← **toujours** (même session « propre »)
2. `/ezk-backlog list`   ← **toujours** (choisir la priorité courante)
3. <actions exceptionnelles s'il y en a — sinon omets cette ligne>

**Pending (à ne pas perdre) :**
- <pending NON-git reporté : billing, décision PO, todo hors repo…>
- <si besoin : branche / PR encore ouverte — une ligne, sans jargon gate>
- (rien)   ← si vraiment vide : écris cette ligne (obligatoire pour la rotation)

**Candidats prioritaires prochaine session :**
- <id> · <titre court> — <pourquoi maintenant>
- …

**Archive session :** `docs/sessions/<fichier>.md` (si snapshot pris)

État de clôture : ✅ archivable | ⚠️ pending (voir « À faire »)
```

---

## Les trois règles qui comptent

### 1. La section `**Pending` est obligatoire — c'est elle qui porte la rotation

`handoff.sh carry` ne remonte **que** cette section, depuis l'entrée la plus récente **qui
en possède une**. Écris-la toujours, même vide (`- (rien)`) : une entrée sans `**Pending`
force `carry` à remonter celle d'une entrée antérieure, dont certains points peuvent être
résolus depuis — tu devras alors les trier à la main plutôt que de les recopier.

> Le repli sur une entrée antérieure est un **filet**, pas le fonctionnement normal : il
> évite de tout perdre quand une entrée n'a pas de Pending (cas vécu — une note courte de
> correction), mais il ne remplace pas la discipline d'écrire la section à chaque fois.

### 2. Le pending se compose de DEUX sources, et une seule est à recopier

| Source | D'où elle vient | Faut-il la recopier ? |
|---|---|---|
| Pending **git** (PRs ouvertes, branches réelles, ADR non mergés) | les lignes `[P2]`/`[P4]` de `check.sh` | **Non** — recalculé à chaque run depuis la source de vérité live ; le recopier le périme. Mets l'essentiel en **« À faire (toi) »** en français. |
| Pending **non-git** (billing, décision PO attendue, nettoyage manuel, todo hors repo) | `handoff.sh carry` | **Oui** — personne d'autre ne s'en souvient |

Écris **l'union** des deux dans `**Pending`**. Les actions prioritaires pour l'humain
vont d'abord dans **« À faire (toi) »** (lisibles), le détail reportable dans Pending.

> **Baseline obligatoire** dans « À faire (toi) » : les deux commandes
> `git switch main && git pull` et `/ezk-backlog list` — même quand il n'y a
> **aucune** action exceptionnelle. Ne pas les remplacer par « rien à faire ».

### 3. Ce qui n'a pas sa place ici

- **Les post-mortems / comptes-rendus de session.** Une entrée est une passation, pas un
  journal : le récit détaillé va dans `docs/sessions/` (snapshot de `SPRINT.md`), pas ici.
- **Les tableaux P1–P8 / dumps du portier.** Le gate vit dans le prompt du juge ; le
  humain lit « En clair » + « À faire ».
- **Ce que le repo encode déjà** : structure du code, historique git, fixes passés.
- **Les dates relatives.** « hier », « la semaine dernière » → date absolue.

---

## Écriture

```bash
bash scripts/handoff.sh add "<YYYY-MM-DD> — <titre court> — clôture ezk-archive" <<'EOF'
<le corps ci-dessus>
EOF
```

Le script insère l'entrée en tête, garantit l'entrée `.gitignore` avant d'écrire, et fait
tourner l'anneau (`EZK_HANDOFF_KEEP`, défaut 3 — au-delà, les plus anciennes passent dans
`handoff.archive.md`). **Ne jamais éditer `.claude/handoff.md` à la main** : c'est ce que
la fiche 0088 a supprimé (20 Ko relus deux fois puis réécrits par un `Edit`).
