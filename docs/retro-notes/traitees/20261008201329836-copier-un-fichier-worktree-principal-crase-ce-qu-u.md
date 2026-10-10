---
date: 2026-10-08
session: "main / vectorz"
type: friction
---

# Copier un fichier worktree→principal écrase ce qu'un script vient d'y écrire

Symptôme (2026-10-08) : la fille A d'un split (20261008072305169) a perdu son split_from. Cause : apply split l'avait posé côté principal ; en re-copiant la fiche du worktree vers le principal à l'étape ready, j'ai recouvert la version enrichie. Attrapé par check-fiches --strict (provenance non réciproque), corrigé 14a45eb2. Geste : pour les écritures backlog depuis un worktree, préférer opérer directement côté principal (git -C <principal>) plutôt que cp worktree→principal, qui traite le worktree comme source unique. Lié au va-et-vient worktree↔principal imposé par le hook qui bloque les éditions du checkout de base.
