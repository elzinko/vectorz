---
date: 2026-10-14
session: "main / vectorz"
type: friction
---

# Garder-calculé laisse des surfaces d'affichage à zéro

ADR-0077 a tranché « garder in-progress calculé » (non-écrivable) plutôt que « retirer du schéma », pour éviter un rayon d'impact large (in-progress sert aussi de libellé de jalon dans avancement-data). Conséquence relevée par 2 relecteurs de la chasse aux bugs : des surfaces qui COMPTENT le statut écrit (ezk dor health « en cours : 0 », portfolio « Rien en cours », plan-delta) lisent désormais toujours 0/vide. Elles ne sont PAS du code mort au sens de la règle (atteignables + testées par des fixtures), mais elles peuvent induire en erreur face au nouveau modèle « en cours = branches ». Tension réelle entre no-dead-code et le choix garder-calculé. Laissé tel quel + documenté dans le verdict de release. Piste : quand on rend un statut « calculé non écrit », décider explicitement du sort de CHAQUE surface qui le lit (afficher le calculé, ou retirer la surface), pas seulement de la vue principale.
