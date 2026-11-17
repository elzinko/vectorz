---
date: 2026-10-24
session: "main / vectorz"
type: friction
---

# tests serveur/sous-processus flakent sous charge parallèle

La gate rougit par intermittence sur des tests qui lancent un serveur ou de vrais sous-processus : project-root-bins (fetch failed / socket closed sous charge), collect-absorbed (timeout, corrigé le 2026-10-24). Ils passent seuls, flakent en suite parallèle.

Piste : limiter la concurrence vitest pour ces fichiers (pool/isolate/maxWorkers), ou rendre les fetch résilients (retry sur socket fermé). Classe entière, pas un test isolé — décision test-infra à trancher (impact sur le temps de gate).
