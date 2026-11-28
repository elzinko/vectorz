---
date: 2026-10-14
session: "fix/v014-bughunt-findings / solar-car-charging-feasibility-cd67a1"
type: friction
---

# forge integrate --dry-run committe le squash

Run v0.14 (2026-10-14) : `ezk forge integrate --branch X --dry-run` a fait AVANCER main du principal (squash-merge + commit), alors que --dry-run laisse croire à une simulation. Le --dry-run ne gate que la passe d'ÉLAGAGE de branches, pas l'étape de merge. Impact : main a changé pendant un « dry-run » (vérifié : `git rev-parse main` avant/après différait). Geste : ne pas compter sur --dry-run de forge integrate pour prévisualiser sans effet.
