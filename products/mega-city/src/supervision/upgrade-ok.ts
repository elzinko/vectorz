/**
 * `upgrade-ok.ts` — calcul mécanique de `upgrade_ok` au `gate.reached` (D11, §7).
 *
 * `upgrade_ok` mesure la QUIESCENCE du projet supervisé (jamais la compatibilité
 * de version, qui relève des métadonnées de release de la méthode) :
 * arbre git propre ET aucun **sous-run de l'orchestrateur** en vol.
 *
 * **Définition de la population (décision produit PO, 2026-07-24, fiche 0085)** —
 * modèle de référence : la mise à jour de Claude (« une session tourne ⇒ pas de
 * MAJ »). L'« activité en cours » est celle que le kit peut VOIR : les sous-runs
 * dans le dossier DÉDIÉ de l'orchestrateur (`.cop1/worktrees/`, source de vérité
 * unique ADR-019 cop1) — PAS tout worktree git du dépôt. Un opérateur qui
 * travaille en permanence en worktrees (7 chez le PO) n'éteint plus le signal :
 * ses worktrees de travail ne sont pas des sous-runs. Ne pas re-élargir cette
 * population « par prudence » : un booléen constamment faux est un signal de
 * sécurité qu'on apprend à ignorer — pire qu'un signal absent (fiche 0085).
 *
 * **Échelle unique, choisie (fiche 0084)** : le SOUS-ARBRE de la racine fournie.
 * Les deux moitiés (propreté git via pathspec `-- .`, sous-runs via
 * `<racine>/.cop1/worktrees/`) lisent le MÊME référentiel — aveugles au-dessus,
 * voyantes dessous (test d'échelle dans upgrade-ok.test.ts). La racine étant
 * normalisée vers l'arbre principal (ADR-0019), le prédicat mesure en pratique
 * le projet supervisé entier ; appelé avec une autre racine, il mesure ce
 * sous-arbre-là, uniformément — jamais un mélange par-dossier / par-dépôt.
 *
 * Le forçage « je mets à jour malgré l'activité » est une prérogative du siège
 * humain EN AVAL (flux d'adoption, fiche 0050) : le signal, lui, ne ment jamais.
 * Le LLM/appelant ne peut JAMAIS le forcer à `true` — la signature n'accepte
 * qu'un veto qui pousse vers `false`, jamais l'inverse.
 * `execFileSync` uniquement (jamais de shell interpolé), cwd = project_root.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Dossier(s) dédié(s) aux sous-runs de l'orchestrateur, relatifs à la racine
 * projet. `.cop1/worktrees/` est LA source de vérité du chemin des sous-runs
 * (ADR-019 cop1, `WorktreeManager`). Volontairement une constante, pas une
 * variable d'environnement : YAGNI tant qu'un second orchestrateur n'existe pas
 * (extension envisagée au contrat v0.2, fiche 0029).
 */
const SUBRUN_DIRS = ['.cop1/worktrees'] as const;

/**
 * `.supervision/` est le dossier de bookkeeping du kit émetteur lui-même (le
 * journal en cours d'écriture) : l'exclure du calcul de quiescence évite que
 * `run_start` (qui vient de créer `events.jsonl`) rende l'arbre mécaniquement
 * « sale » à chaque run, ce qui viderait `upgrade_ok` de son sens.
 */
/**
 * `execFileSync` peut échouer (project_root n'est pas un dépôt git — cas légitime
 * en Desktop, M2 revue NO-GO) : jamais fatal, dégradation silencieuse vers `false`
 * plutôt qu'une exception qui ferait planter `gate_reached`.
 */
function isTreeClean(projectRoot: string): boolean {
  try {
    const status = execFileSync('git', ['status', '--porcelain', '--', '.', ':!.supervision'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return status.trim().length === 0;
  } catch {
    return false;
  }
}

/**
 * Un sous-run est « en vol » dès qu'une entrée (worktree réel ou résidu) est
 * présente dans un dossier dédié — détection pur file-system, aucune commande
 * git : la PRÉSENCE dans le dossier réservé aux sous-runs est le signal, la
 * nature de l'entrée n'y change rien (un résidu mal nettoyé est aussi un
 * travail non soldé). Dossier absent ou vide = aucun sous-run. Les entrées
 * cachées (`.DS_Store`…) sont ignorées.
 *
 * Fail closed (revue Codex #47, même doctrine que M2 sur `isTreeClean`) : seul
 * « dossier absent » (ENOENT/ENOTDIR) vaut « aucun sous-run ». Tout autre échec
 * de lecture (droits, montage cassé…) rend l'état INOBSERVABLE : un signal de
 * sécurité qui n'a pas pu regarder répond `false`, jamais `true` — d'autant que
 * `.cop1/` étant typiquement gitignoré, `isTreeClean` ne rattraperait rien.
 */
function hasNoSubRunInFlight(projectRoot: string): boolean {
  for (const relativeDir of SUBRUN_DIRS) {
    const dir = path.join(projectRoot, relativeDir);
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') {
        continue; // dossier absent : aucun sous-run pour cet orchestrateur
      }
      return false; // état inobservable : fail closed
    }
    if (entries.some((entry) => !entry.startsWith('.'))) return false;
  }
  return true;
}

/**
 * Calcule `upgrade_ok`. `veto = true` force `false` inconditionnellement (le seul
 * levier offert à l'appelant) ; il n'existe aucun paramètre qui force `true`.
 */
export function computeUpgradeOk(projectRoot: string, veto = false): boolean {
  if (veto) return false;
  return isTreeClean(projectRoot) && hasNoSubRunInFlight(projectRoot);
}
