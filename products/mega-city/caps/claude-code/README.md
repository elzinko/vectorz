# Cap — claude-code

Matérialise un profil résolu dans la forme native de **Claude Code** :

- `<projet>/.claude/agents/*`        ← les agents (avec leurs `competences` résolues)
- `<projet>/.claude/skills/*`        ← les skills
- `<projet>/.iamthelaw/ENTRY.md`     ← les règles compilées (texte)
- `<projet>/.git/hooks/*`            ← les enforcements niveau 2
- une référence « lire ENTRY.md » dans `CLAUDE.md`

**Déterministe.** C'est la convergence de `link-project.sh` (skills/agents) et de
`iamthelaw setup claude` (règles + hooks) en une seule matérialisation par profil.
