# Gabarit de la note de handoff — SOURCE UNIQUE

Ce gabarit est lu par **les deux chemins** de clôture — le chemin inline du skill
(verdict `CLEAN`) et le sous-agent (verdict `DIRTY`). Il ne doit exister **qu'ici** :
le dupliquer dans `SKILL.md` ou dans `agents/ezk-archive.md` les ferait diverger
silencieusement, ce que `test-template-unicity.sh` interdit.

---

## Le corps à produire

```markdown
**Fait cette session :**
- **<id>** (PR #<n>) — <ce qui a été livré, en une ou deux lignes utiles à la reprise>
- <décision structurante prise, et son *pourquoi*>

**Reprendre :**
1. `git switch main && git pull`   (ou sync local si pas de remote)
2. `/ezk-backlog list`   → la prochaine fiche prioritaire

**Pending (à ne pas perdre) :**
- PR #<n> « <titre> » — <action : reviewer / merger / fermer>
- branche `<nom>` (contenu non prouvé dans main) — <action>
- ADR `<chemin>` — <commité sur branche X, pending merge / à committer>
- <pending NON-git reporté : billing, décision PO en attente, nettoyage manuel…>

**Candidats prioritaires prochaine session :**
- P0 · <id> · <titre>
- <idée notée cette session, ajoutée au backlog>

État de clôture : ✅ archivable | ⚠️ pending (voir ci-dessus)
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
| Pending **git** (PRs ouvertes, branches réelles, ADR non mergés) | les lignes `[P2]`/`[P4]` de `check.sh` | **Non** — recalculé à chaque run depuis la source de vérité live ; le recopier le périme |
| Pending **non-git** (billing, décision PO attendue, nettoyage manuel, todo hors repo) | `handoff.sh carry` | **Oui** — personne d'autre ne s'en souvient |

Écris **l'union** des deux. C'est ce qui permet à l'anneau FIFO de faire tourner le
fichier sans jamais perdre un report.

### 3. Ce qui n'a pas sa place ici

- **Les post-mortems.** Une entrée est une passation, pas un compte-rendu : ce qui a été
  appris va en mémoire projet ou dans un ADR, pas ici (les entrées de 120 lignes de
  juillet 2026 venaient de là).
- **Ce que le repo encode déjà** : structure du code, historique git, fixes passés.
- **Les dates relatives.** « hier », « la semaine dernière » ne veulent plus rien dire à
  la relecture — écris la date absolue.

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
