---
id: "20261016203544694"
title: "ezk-sprint close ne doit jamais se bloquer en worktree (helper de compte rendu borné)"
type: bug
priority: P1
product: mega-city
milestone: preparation
version:
labels: [outillage, sprint, worktree, spike]
status: ready
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-16
---

# 20261016203544694 — ezk-sprint close ne doit jamais se bloquer en worktree

**En clair.** `ezk-sprint close` s'est **bloqué plus de deux minutes** en worktree, à chaque essai,
sur son helper de compte rendu `commit-doc-via-worktree.sh`. Il n'a jamais rendu la main, donc le
sprint ne s'est pas scellé tout seul : il a fallu tuer le process et sceller à la main, sur tout le
run v0.17. Le skill dit pourtant que le compte rendu est « best-effort » (un échec laisse le sprint
scellé) — mais un **blocage n'est pas un échec**. On veut que ce helper **échoue vite** au lieu de
pendre : le sprint se scelle alors, compte rendu ou pas.

**Si tu arrives frais.** `ezk-sprint close` scelle un sprint, puis écrit et committe un court compte
rendu (`docs/sprints/<date>-sprint-<slug>.md`). Ce commit passe par un helper partagé,
`commit-doc-via-worktree.sh`, qui crée un **worktree jetable** depuis `main` pour committer sans
toucher à la branche de travail. C'est ce helper qui pend quand `close` tourne lui-même dans un
worktree.

## Contexte / Problème

Vécu pendant tout le run v0.17 (board unifié cop1, 2026-10-16), en worktree
`.claude/worktrees/ezk-reviewer-agent-skill-f5e5b1`. À chaque `ezk-sprint close`, le processus
dépassait 120 s sans rendre la main, puis était tué. Conséquence : la cérémonie `close` formelle a
été **abandonnée pour l'itération entière** ; les fiches passées en `features/done/` et les commits
sont restés le seul registre de l'incrément. Pas de perte de données, mais un garde-fou de méthode
(le sceau + le compte rendu committé) hors service sur tout un run.

La cause exacte n'est pas établie : worktree jetable créé depuis `main` quand on est **déjà** dans
un worktree, verrou git partagé entre worktrees (`index.lock`, `HEAD`), ou attente réseau dans le
helper. D'où une fiche **spike-first** : on diagnostique avant de coder le correctif.

Lien de voisinage : [le helper introuvable en install copie](done/20261013131625101_helper-commit-doc-worktree-install-copie.md)
touche le **même** `commit-doc-via-worktree.sh`, mais un autre symptôme (introuvable, pas bloqué).
Correctifs distincts ; à ne pas fondre.

## Proposition

POC = rendre `close` increvable, sans encore comprendre toute la cause :

- **Borner le helper** : un timeout (quelques secondes) autour du commit du compte rendu. Dépassé,
  le helper **échoue** (code non nul) au lieu de pendre — `close` reçoit l'échec best-effort déjà
  prévu et **scelle quand même** le sprint.
- **Diagnostiquer** en parallèle pourquoi le worktree jetable pend quand `close` tourne dans un
  worktree (verrou partagé ? création de worktree imbriquée ?), pour un correctif de fond si le
  timeout ne suffit pas.

## Critères d'acceptation

- [ ] En worktree, `ezk-sprint close` rend **toujours** un verdict (`SEALED`, au besoin sans compte
      rendu) sans dépasser un court délai — jamais de blocage qui force à tuer le process.
- [ ] Quand le helper de compte rendu est borné et échoue, le sprint reste **scellé** (le sceau ne
      dépend pas du compte rendu — comportement best-effort déjà documenté).
- [ ] La cause du blocage en worktree est nommée dans les notes de la fiche (diagnostic du spike).

**Mesure de suivi** — sur les **3 prochaines clôtures en worktree**, 0 blocage > 30 s ; `close`
rend un verdict à tous les coups.

## Comment vérifier

```bash
# Depuis un worktree, ouvrir puis fermer un sprint d'une fiche et chronométrer close.
cd <un worktree de vectorz>
bash products/mega-city/skills/ezk-sprint/scripts/sprint.sh start --lot <id>
# ... (la story) ...
time bash products/mega-city/skills/ezk-sprint/scripts/sprint.sh close
# Attendu : verdict CLOSE: SEALED en quelques secondes, jamais un process à tuer.
```

## Notes / décisions

- Provenance : rétro légère de l'itération v0.17
  ([capture](../docs/captures/2026-10-16-retro-v017-board-unifie-light.md)), proposition « spike :
  close ne doit jamais se bloquer en worktree », retenue par le PO le 2026-10-16.
- Même fichier que [la fiche helper introuvable](done/20261013131625101_helper-commit-doc-worktree-install-copie.md),
  symptôme différent (blocage vs introuvable). Le groom pourra décider de les traiter ensemble ou
  séparément.
- `type: bug` faute de type `spike` dans le schéma ; le label `spike` porte la nature (diagnostic
  d'abord). C'est un vrai défaut : `close` ne doit jamais pendre.

- Groomée « prête » le 2026-10-23 : DoR tenue (spike borné, critères + comment vérifier).
