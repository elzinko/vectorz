# Dogfood — vérifier que ça marche (15–30 min)

**Point d’entrée unique** pour tester la chaîne méthode → journal → Moniteur
**avant merge** (PR #62), sans se perdre dans le programme de refonte.

Historique / phases de la refonte (pas ce guide) :
[`PROGRAMME-REFONTE.md`](./PROGRAMME-REFONTE.md).

---

## En 3 commandes (recommandé)

Depuis la racine du repo, branche `refactor/epoch-2-harden-method` :

```bash
pnpm install && pnpm build
bash scripts/dogfood-guided.sh
# Suivre les 👉 prompts (Entrée pour continuer après chaque action humaine)
```

Le script enchaîne le smoke automatique, tente le Moniteur + captures Playwright,
te demande les étapes Claude Code **une par une**, puis écrit un rapport OK/KO.

---

## Qui fait quoi ?

| Étape | Auto | Toi |
| --- | --- | --- |
| Install / build | ✅ (si tu lances les 3 commandes) | — |
| Smoke mécanique (link, probe, journal démo, validateur) | ✅ `dogfood-smoke.sh` | — |
| Démarrer daemon + UI Moniteur | ✅ si possible, sinon commandes exactes affichées | Lancer ce qui manque |
| Captures d’écran Moniteur | ✅ Playwright si l’URL répond | — |
| Ouvrir Claude Code + MCP + `/supervision-demo` | — | ✅ (le script attend Entrée) |
| Vérifier `events.jsonl` + 2ᵉ capture | ✅ | Confirmer visuellement la carte run |

---

## Checklist visuelle (après le guided run)

Regarde le rapport sous `docs/dogfood-reports/<horodatage>/` (gitignoré) ou le chemin
affiché en fin de script :

1. **Smoke** = OK dans le rapport.
2. **Capture `01-moniteur-avant.png`** (ou SKIP si Moniteur down — pas un faux vert).
3. Après `/supervision-demo` : un dossier `.supervision/runs/<id>/events.jsonl` existe.
4. **Capture `02-moniteur-apres.png`** : une carte de run apparaît dans le Moniteur
   (http://localhost:5173).
5. (Optionnel) `/ezk-archive` → portier `VERDICT: CLEAN` — lié à la fiche 2088.

Si une étape est KO, le rapport le dit. **Ne pas inventer un succès.**

---

## Smoke seul (~5 min, sans Claude ni UI)

```bash
pnpm install && pnpm build
bash scripts/dogfood-smoke.sh
```

Prouve la mécanique. **Ne prouve pas** qu’un skill Claude Code émet, ni l’UI live.

---

## Si le Moniteur n’est pas démarré

```bash
cp -n cop1.config.example.yaml cop1.config.yaml
# Éditer supervision.watch_roots: ["/chemin/absolu/vers/vectorz"]

node products/cop1/packages/app/dist/cli/index.js start
node products/cop1/packages/app/dist/cli/index.js status

pnpm --filter @cop1/web dev   # → http://localhost:5173
```

---

## Après un dogfood réussi

1. Cocher / débloquer les AC observationnels dans les fiches 2094 / 2095 / 2088 si
   vraiment vus.
2. Une ligne dans le Journal de [`PROGRAMME-REFONTE.md`](./PROGRAMME-REFONTE.md).
3. **Ne pas merger** depuis ce guide — décision opérateur + CI verte.

Suite produit (acteur LLM headless, nightly) : fiche
[2103](../features/2103-ezk-testbed-llm-dogfood-harness.md) — **v2**, pas requis pour
le dogfood humain d’aujourd’hui.
