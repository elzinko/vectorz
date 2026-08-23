# Gabarit — choix sur ALERT (ezk-sprint:check)

Source unique pour la restitution quand le portier rend `VERDICT: ALERT`.
Ne pas dupliquer dans `SKILL.md`.

Règle : [`human-facing-lisibility`](../../../rules/documentation-guidelines/human-facing-lisibility.md)
— ouvrir par **« En clair »**.

---

## Corps à produire

```markdown
**En clair :**
- <≤ 1 phrase : pourquoi on ne peut pas démarrer un sprint « à l'aveugle »>
- <≤ 1 phrase : ce qui est en vol (worktree / fiche / working tree sale)>
- <≤ 1 phrase : ce que **toi** (humain) dois choisir maintenant>

**Signaux du portier :**
- <coller le bloc gate verbatim, ou résumer P1/P2/P3 en langage clair>

**Choix (obligatoire — ne pas enchaîner sans réponse) :**

| Choix | Quand | Action |
|---|---|---|
| **Rejoindre** | Le sprint signalé est le tien ou tu veux le reprendre | Basculer sur le worktree/branche/fiche indiquée ; ne pas tirer une nouvelle fiche |
| **Interrompre journalisé** | L'autre session est abandonnée ou tu assumes l'override | `/ezk-archive run` sur l'autre session, ou note PO dans handoff/`SPRINT.md` ; puis relancer `/ezk-sprint check` |

**Contexte lu (best-effort) :**
- Handoff pending : <N lignes ou « absent »>
- Tête PLAN : <extrait plan:head ou « — »>

**Pending :**
- (rien) ← si vide après choix ; sinon ce qui bloque encore
```
