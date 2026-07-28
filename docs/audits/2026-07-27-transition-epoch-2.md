# Audit — Transition époque 2 (Vectorz / mega-city)

**Date :** 2026-07-27  
**Périmètre :** monorepo `vectorz` (`products/cop1` + `products/mega-city`)  
**Verdict :** dette de transition **élevée (~8/10)**.  
**Doctrine époque 2** (moniteur, mega-city, ADR-029 BMAD out) vs **graphe de prod encore hybride époque 1**.

Programme vivant qui suit cet audit : [`docs/PROGRAMME-REFONTE.md`](../PROGRAMME-REFONTE.md).

---

## Synthèse

La méthode époque 2 est **écrite** (skills ezk-\*, Moniteur, ADRs 027–034) mais le dépôt
**porte encore** l'époque 1 (BMAD tracké, double backlog, README/onboarding périmés,
profil daily exhaustif). La lenteur perçue n'est **pas** le bundle JS : c'est le **coût
boucle LLM** (sprint 0→10, act+Docker, archive historique ~235k tokens).

Ce qui marche déjà : LLM rédige / script range ; portiers déterministes ; mesure
d'échecs ; supervision + Moniteur.

---

## Problèmes clés (avec chiffres / chemins)

### 1. BMAD zombie

| Élément | Mesure / chemin |
| --- | --- |
| `_bmad/` | ~236 Ko trackés (customisation projet, non régénérable par `bmad install`) |
| `_bmad-output/` | **~2.4 Mo** trackés ; lus au runtime (sprint-status, planning-artifacts, …) |
| ADR-029 | **Accepté** (2026-07-15) — émancipation séquencée E1→E4 |
| Exécution | fiches 0038 / 0039 **blocked** ; purge non faite |

**Risque :** supprimer `_bmad*` sans filet casse le mode pilote et plusieurs lecteurs
runtime. Isoler d'abord, prouver, puis purger (ADR-029 E4).

### 2. Double backlog

| Liste | Chemin | Volume (2026-07-27) |
| --- | --- | --- |
| Racine | `features/` (+ `done/`) | 63 ids uniques |
| Méthode | `features/` (liste unique, `product: mega-city`) | 101 ids (+2000) |
| **Collisions d'ids** | même numéro des deux côtés | **62** |

Fiche **0064** (`features/0064-liste-unique-features-champ-product.md`) — **P0**,
`status: todo` : une seule liste + champ `product:`.  
Note : un ancien `mc-0064` a été renuméroté en **2100** (`fe6fc16`) — la collision
structurelle reste.

### 3. Docs / identité périmées

| Surface | État |
| --- | --- |
| `README.md` racine | encore « cop1 / Morpheus + BMAD », statut V1-light **2026-04-14**, « No CI » |
| `package.json` `"name"` | `"cop1"` alors que l'umbrella est Vectorz (ADR-027) |
| `docs/GETTING_STARTED.md` | onboarding BMAD / packages plat |
| CI | **existe** : `.github/workflows/ci.yml` (lint · build · test) |

### 4. ADRs mal tamponnés

| ADR | Statut déclaré | Réalité |
| --- | --- | --- |
| ADR-028 | **Proposé** | moniteur / lecteur journal **shippé** en prod |
| ADR-022 | **WIP / Brouillon** | cité comme fondation d'autres ADR acceptés |
| ADR-029 | **Accepté** | exécution E3/E4 absente (BMAD encore tracké) |

### 5. Lenteur = coût boucle LLM (pas bundle JS)

| Boucle | Coût typique |
| --- | --- |
| `ezk-sprint` étapes 0→10 | sous-agents + `act`+Docker systématiques |
| `ezk-archive` (avant portier 2088) | ~235k tokens / clôture ; portier CLEAN réduit déjà |
| Profile `global` | **exhaustif** (18 skills) → surface d'appel large |

### 6. Features « livrées » sans preuve runtime

| Fiche | PR | État AC |
| --- | --- | --- |
| 2094 (ex-mc-0094, émetteur Claude Code) | #51 · #54 | `blocked` — preuve runtime ouverte |
| 2095 (ex-mc-0095, product-builder émet) | #55 | `blocked` — constatation restante |
| 2088 (ex-mc-0088, archive coût) | #56+#59 | `blocked` — discipline / preuve tokens |

### 7. Profil global trop large

`products/mega-city/profiles/global.yml` installe apk / device / preview / article /
pr-pilot pour le daily-driver — hors chemin quotidien solo.

---

## ROI — ordre de coupe

1. **Alléger `ezk-sprint`** — 3 chemins : trivial / standard / lourd  
2. **Fusionner backlogs** — fiche 0064  
3. **Archive** — défaut `check` ; mesurer ≤28k tokens sur CLEAN  
4. **Curater profil** — profil `daily` léger (garder `global` exhaustif)  
5. **Ship or kill 2094/2095** — preuve runtime ≤1h  
6. **Soldes BMAD** — isoler le pilote puis purger (ADR-029 E4)

---

## Ce qui marche (à préserver)

- Convention **LLM rédige / script range** (archive, backlog)  
- **Portiers** déterministes (`check.sh`, gates)  
- Mesure d'échecs / CI monorepo  
- Supervision + Moniteur (contrat émission)

---

## Non-buts de la première vague

- Pas de suppression destructive de `_bmad*` sans tests verts + filet pilote  
- Pas de mega-migration backlog 0064 dans le premier push (phase dédiée)  
- Pas de rewrite du moteur cop1 hors programme

---

## Références

- ADR-027 — umbrella Vectorz  
- ADR-028 — mode moniteur  
- ADR-029 — émancipation BMAD  
- Fiches : `0064`, `2088`, `2094`, `2095`, `2100`
