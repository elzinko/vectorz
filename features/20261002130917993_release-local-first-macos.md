---
id: "20261002130917993"
title: "Release local-first — macOS signé/notarisé en local, la CI seulement pour Windows (économie de minutes)"
type: feature
priority: P2
product: vectorz
labels: [ci, release, dx, cost]
status: idea
pr:
evidence: none
created: 2026-10-02
---

# 20261002130917993 — Release local-first : macOS en local, la CI seulement pour Windows

**En clair.** Les minutes GitHub Actions coûtent surtout à cause du runner **macOS (×10)**. On sait
désormais builder, signer et notariser macOS **en local** (fiche `notarize_embedded_python_runtime`).
Donc on fait la release macOS **en local** (zéro ×10), et on ne laisse à la CI que Windows (×2) et
Linux (×1). Pour les sprints autonomes de nuit, c'est l'économie qui compte.

**Si tu arrives frais.** GitHub facture les minutes CI avec des multiplicateurs : Linux ×1, Windows
×2, **macOS ×10**. `act` est un lanceur local de GitHub Actions — mais **conteneurs Linux seulement**.

## Contexte / Problème

- Une release complète (`desktop-release.yml`) lance les **trois** OS. Le macOS (×10) domine la
  facture. Les sprints autonomes de nuit enchaînent les runs → coût qui grimpe.
- Or macOS est maintenant **signable + notarisable en local** (prouvé : notarytool `Accepted`,
  `spctl: Notarized Developer ID`). Le runner macOS cloud n'est donc plus obligatoire.
- Deux fausses pistes à écarter clairement :
  - **`act` ne lance ni macOS ni Windows** (aucune image Docker pour ces OS). Il couvre le leg
    **Linux** et les tests unit, en local, gratuitement.
  - **Windows cross-compilé depuis un Mac** : possible en théorie (cargo-xwin/mingw + `makensis` +
    réécrire le bundle pour récupérer les binaires *Windows* — python, ffmpeg, rubberband, yt-dlp —
    au lieu des binaires macOS), mais **fragile** et surtout **non testable** sur Mac (on ne peut pas
    lancer le `.exe`). Expédier un Windows jamais exécuté = risque produit. Écarté.

## Proposition

Un modèle de release **hybride, local-first** :

1. **macOS → 100 % local.** Un script enchaîne : build → `desktop-codesign-bundle.sh` (existe) →
   `notarytool submit` via profil trousseau (mot de passe d'app jamais exposé) → `stapler staple` →
   upload R2 (`scripts/upload-desktop-to-r2.mjs`, existe) → sync manifeste. **Zéro minute ×10.**
2. **Creds R2 en local** → depuis le trousseau via `ezk-secret` (dépend du système de secrets,
   fiches `ezk-secret sync`/`apply` ; la destination `local` écrit le `.env`).
3. **Windows → CI** (×2, testable là-bas) ou une VM Windows si un jour tu veux zéro GitHub.
4. **Linux → `act` en local** (gratuit) ou CI (×1) ; actuellement déféré de toute façon.
5. **Tests → local** (pytest) + `act` pour le leg CI.

Net : une release ne consomme plus que du Windows (×2) + éventuellement Linux (×1). Le ×10 macOS
disparaît.

## Critères d'acceptation

- [ ] Un script produit en local un `.dmg` macOS **signé + notarisé + staplé** (`spctl: accepted,
      Notarized Developer ID`).
- [ ] Le même script **upload sur R2** et **met à jour le manifeste**, sans runner macOS GitHub.
- [ ] Les identifiants R2 viennent du **trousseau** (`ezk-secret`), jamais en clair.
- [ ] Une release macOS consomme **0 minute** de runner macOS GitHub (vérifié au compteur billing).
- [ ] La doc dit clairement : Windows/Linux via CI (ou `act` pour Linux), **pas** de Windows depuis
      un Mac.

## Comment vérifier

```bash
# release macOS locale de bout en bout (sans CI)
bash scripts/release-macos-local.sh <version>        # à créer : build→sign→notarize→staple→R2→manifest
spctl -a -vvv <dmg monté>                            # accepted, source=Notarized Developer ID
# contrôle du coût : le compteur macOS n'a pas bougé
gh api /repos/elzinko/samplerz/actions/billing/usage # (ou le tableau billing)
```

## Glossaire

- `multiplicateur de minutes` — facteur de facturation GitHub par OS : Linux ×1, Windows ×2, macOS ×10.
- `act` — lanceur local de GitHub Actions, en conteneurs **Linux** uniquement.
- `staple` — coller le ticket de notarisation Apple au `.dmg`, pour une validation **hors-ligne**.

## Notes / décisions

- **Dépend de** : `notarize_embedded_python_runtime` (signature macOS, livrée en local) et du système
  de secrets `ezk-secret` (sync/apply) pour les creds R2 en local.
- **Levier principal** : le coût est dans le macOS (×10), pas le Windows (×2). Déplacer **macOS** en
  local est l'économie n°1 — pas forcer Windows en local (effort élevé, non testable).
- Première implémentation : samplerz (le pipeline de signature y est prouvé).
- Déclencheur : demande PO 2026-10-02 — « faire le max en local pendant les sprints de nuit pour
  économiser les minutes GitHub ».
