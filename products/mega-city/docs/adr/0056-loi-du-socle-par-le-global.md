# ADR 0056 — La loi du socle voyage par le global : `~/.claude/rules/iamthelaw.md`

**Statut :** Proposé (à confirmer par le PO au merge)
**Date :** 2026-10-01
**Deciders :** PO (consigne du run V0.1 → V0.4 : « faire que la loi atteigne réellement l'agent »)
**Fiche :** [`20260903134909124`](../../../../features/20260903134909124_loi-non-compilee-chez-l-agent.md)
**Amende :** la doctrine « le global ne porte que l'équipe » (ADR-0006, fiche 0017).

## En clair

Une règle du catalogue n'était vraie que si un texte d'agent la répétait à la main. On décide que
`bind-global` compile aussi le socle de loi du profil dans `~/.claude/rules/iamthelaw.md`. Claude
Code charge ce dossier dans chaque session, sous-agents compris, sans rien à lui indiquer. La loi
propre à un projet reste liée par projet. Un test garde les règles « un agent la contrôle ».

## Contexte

- Le cap global écrivait `skills/` et `agents/` seulement. Sur le poste, `~/.claude/rules/`
  n'existait pas : aucune règle n'était compilée (mesuré le 2026-10-01).
- Mesure du 2026-10-01 : 27 règles `agent-check`, 7 citées par le prompt de l'agent nommé, 20 non.
- Claude Code charge les fichiers `~/.claude/rules/*.md` dans toutes les sessions, avant les
  règles du projet, sans pointeur. Il retire l'en-tête YAML avant de les lire et n'y interprète
  que `paths` : une autre clé est ignorée sans erreur. Les commentaires HTML sont retirés aussi.
- Poids du socle `base` : 6 règles, 16 Ko, environ 4 k jetons par session ; il grossit à chaque règle ajoutée à `base` : 9 Ko avec 4 règles, 16 Ko avec 6.

## Options

| Option | Effet | Coût | Risque |
|---|---|---|---|
| A. Statu quo | la loi vit dans les textes copiés à la main | nul | 20 règles sur 27 non citées, dérive |
| B. Le global compile le socle dans `rules/iamthelaw.md` | toutes les sessions et tous les sous-agents voient le socle | environ 4 k jetons par session | un fichier généré à tenir à jour |
| C. Bloc managé dans `~/.claude/CLAUDE.md` | idem, mais dans le fichier personnel du PO | idem | on édite un fichier qui n'est pas le nôtre |
| D. Lier chaque projet (`lawgiver bind`) | la loi complète arrive par projet | un geste par projet | oubli : un projet non lié n'a pas de loi |

## Décision

**B pour le socle, D pour le reste, un cliquet pour `agent-check`.**

- `bind-global` écrit `rules/iamthelaw.md` : les règles du profil, au format de `ENTRY.md`. Le
  fichier est le même en mode copie et en mode lien : une loi compilée n'est pas un fichier du
  catalogue, donc jamais un lien.
- Le fichier est possédé par lawgiver. Son en-tête porte `generated-by: lawgiver bind-global`.
  Un fichier du même nom sans ce marqueur, ou un lien, n'est jamais écrasé : le bind refuse,
  avant d'écrire quoi que ce soit.
- Le PO choisit ce que le global porte par les bundles du profil (aujourd'hui `base`). Élargir
  se paie en jetons par session : c'est sa décision, pas celle de l'outil.
- Un test (cliquet) échoue sur toute règle `agent-check` que le corps du prompt de l'agent nommé
  ne cite pas, sauf dette datée dans `law-debt.yml`. La liste ne peut que rétrécir.
- `lawgiver doctor <profil>` dit ce qui est déclaré et pas installé, y compris la loi.

## Conséquences

- Une règle du socle ajoutée au catalogue arrive chez tous les agents au prochain `bind-global`.
- Le fichier de loi est une copie compilée, même en mode lien : après un changement de règle, il
  faut rejouer `bind-global`. Le doctor le voit (« loi périmée »).
- Un projet lié par `bind` cumule la loi globale et la sienne : les règles du socle y figurent
  deux fois. Toléré pour ce lot ; dédoublonner viendra ensuite.
- Le profil `global` se dit exhaustif : un test garde que tout `ezk-*` du catalogue y figure
  (`ezk-bug` et `ezk-chef` n'y étaient pas).

## Réversibilité

Retirer le fichier de loi du plan du cap global suffit ; `rules/iamthelaw.md` se supprime à la
main (un fichier marqué est le nôtre). Rien d'autre ne dépend de lui.
