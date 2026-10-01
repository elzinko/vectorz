/**
 * `ezk rules check|show|apply` — la commande, sans le processus (fiche 20260910152227744, ADR-0050).
 *
 * `bin/ezk-rules.ts` ne fait que résoudre le projet visé et passer la main ici ; la logique vit dans ce
 * module pour être éprouvée en mémoire, sans lancer de processus. Il rend un code de sortie et écrit
 * par les deux fonctions qu'on lui donne : jamais de `process.exit`, jamais de `console` directe.
 * Vectorz n'exécute AUCUN gate : exécuter un contrôle est l'affaire du projet.
 */
import { realpathSync } from 'node:fs';
import { expandProfile } from '../core/expand.js';
import {
  type EffectiveRule,
  type Problem,
  composeProjectRules,
  guaranteeLabel,
  renderProjectRules,
  rulesDigest,
} from '../core/project-rules.js';
import { loadCatalog } from '../loaders/catalog.js';
import { gitFacts, loadProjectRules } from '../loaders/project-rules.js';
import { ProjectRulesFileError, removeProjectRulesFile, writeProjectRulesFile } from './project-rules-file.js';

export interface RulesRun {
  verb: 'check' | 'show' | 'apply';
  /** Les options du verbe (`--json` pour `show`). */
  flags: string[];
  /** Le projet visé, absolu. */
  root: string;
  /** La racine du produit mega-city : d'où vient le catalogue global (règles, bundles). */
  megaCity: string;
  out(text: string): void;
  err(text: string): void;
}

interface Composition {
  hasContract: boolean;
  rules: EffectiveRule[];
  problems: Problem[];
}

function compose(root: string, megaCity: string): Composition {
  const loaded = loadProjectRules(root);
  const catalog = loadCatalog(megaCity);
  const selected = loaded.manifest
    ? expandProfile({ id: 'project-local', bundles: loaded.manifest.bundles, agents: [], skills: [] }, catalog).rules
    : [];
  const composed = composeProjectRules({
    manifest: loaded.manifest,
    manifestFile: loaded.manifestFile,
    catalog: catalog.rules,
    knownBundles: new Set(catalog.bundles.keys()),
    selected,
    local: loaded.local,
  });
  return {
    hasContract: loaded.manifest !== undefined,
    rules: composed.rules,
    problems: [...loaded.problems, ...composed.problems],
  };
}

function describeProblems(problems: Problem[]): string {
  return problems
    .map((p) => {
      const where = [p.file, p.ruleId && !p.file?.includes(p.ruleId) ? p.ruleId : undefined].filter(Boolean).join(' · ');
      return `  - ${where ? `${where} : ` : ''}${p.message}`;
    })
    .join('\n');
}

/** Exécute le verbe et rend le code de sortie : 0 ; 1 si le contrat est refusé ou si l'écriture est refusée. */
export function runRules(run: RulesRun): number {
  const { verb, root, out, err } = run;
  const result = compose(root, run.megaCity);
  const noContract = `${root} n'a pas de contrat de règles (.vectorz/rules.yml absent) : rien n'est composé.`;

  if (result.problems.length > 0) {
    err(
      `En clair : le contrat de règles de ${root} a ${result.problems.length} erreur(s). Rien n'est composé tant qu'il en reste.\n` +
        `${describeProblems(result.problems)}\n`,
    );
    return 1;
  }

  if (verb === 'check') {
    out(
      result.hasContract
        ? `En clair : ${result.rules.length} règle(s) composée(s) pour ${root}, aucune erreur.\n`
        : `En clair : ${noContract}\n`,
    );
    return 0;
  }

  if (verb === 'show') {
    const git = gitFacts(root);
    const isGitRoot = git.toplevel !== null && git.toplevel === realpathSync(root);
    const digest = rulesDigest(result.rules);
    if (run.flags.includes('--json')) {
      out(
        `${JSON.stringify(
          {
            root,
            rootKind: isGitRoot ? 'git' : 'dossier',
            sha: git.sha,
            digest,
            hasContract: result.hasContract,
            rules: result.rules.map((r) => ({ ...r, label: guaranteeLabel(r.guarantee) })),
          },
          null,
          2,
        )}\n`,
      );
    } else if (!result.hasContract) {
      out(`En clair : ${noContract}\n`);
    } else {
      out(
        [
          `Projet : ${root} (${isGitRoot ? 'racine git' : 'dossier'})`,
          `Commit : ${git.sha ?? 'aucun (pas un dépôt git, ou aucun commit)'}`,
          `Jeu effectif : ${result.rules.length} règle(s), empreinte ${digest}`,
          '',
          renderProjectRules(result.rules, { front: false }),
        ].join('\n'),
      );
    }
    return 0;
  }

  try {
    if (!result.hasContract) {
      // Le contrat a disparu : le jeu qu'on avait écrit ne doit pas continuer à charger des règles mortes.
      const outcome = removeProjectRulesFile(root);
      out(
        outcome === 'removed'
          ? `En clair : ${noContract} Le fichier généré a été retiré.\n`
          : `En clair : ${noContract} Rien à écrire.\n`,
      );
    } else {
      const outcome = writeProjectRulesFile(root, renderProjectRules(result.rules));
      const what = { created: 'créé', updated: 'mis à jour', unchanged: 'déjà à jour' }[outcome];
      out(`En clair : .claude/rules/vectorz-project.md ${what} dans ${root} (${result.rules.length} règle(s)).\n`);
    }
    return 0;
  } catch (error) {
    if (!(error instanceof ProjectRulesFileError)) throw error;
    err(`${error.message}\n`);
    return 1;
  }
}
