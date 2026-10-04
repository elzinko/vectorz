/**
 * La page « config » du cockpit (ADR-0062, fiche 20261004192802964) — la colle I/O : les trois
 * sections, lues par les MÊMES fonctions que `ezk config show`, `ezk rules show` et `ezk dor show`.
 * La page ne peut donc pas montrer d'autres valeurs que le terminal.
 *
 * Chaque section se lit seule : un fichier illisible ne touche que la sienne, qui dit « illisible »
 * et le chemin du fichier. Rien n'est écrit.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type ConfigSection } from '../core/config-page.js';
import { githubStatusText } from '../core/project-config.js';
import { PROJECT_CONFIG_DIR, githubCapabilities } from '../loaders/project-config.js';
import { runDor } from './dor-command.js';
import { runRules } from './rules-command.js';

/** Le fichier d'un contrat `.vectorz/<nom>.yml|yaml` : celui qui existe, sinon le nom attendu. */
function contractFile(root: string, base: string): string {
  const dir = join(root, PROJECT_CONFIG_DIR);
  const yaml = join(dir, `${base}.yaml`);
  const yml = join(dir, `${base}.yml`);
  return existsSync(yml) || !existsSync(yaml) ? yml : yaml;
}

/** Lance une commande de lecture et capture ce qu'elle écrit, comme le terminal l'afficherait. */
function capture(run: (out: (t: string) => void, err: (t: string) => void) => number): {
  code: number;
  out: string;
  err: string;
} {
  let out = '';
  let err = '';
  const code = run(
    (t) => {
      out += t;
    },
    (t) => {
      err += t;
    },
  );
  return { code, out, err };
}

function githubSection(root: string): ConfigSection {
  const file = contractFile(root, 'config');
  try {
    return { title: 'GitHub', command: 'ezk config show', file, ok: true, text: githubStatusText(`${root}/.vectorz/config.yml`, githubCapabilities(root)) };
  } catch (error) {
    return { title: 'GitHub', command: 'ezk config show', file, ok: false, text: (error as Error).message };
  }
}

function rulesSection(root: string, megaCity: string): ConfigSection {
  const file = contractFile(root, 'rules');
  try {
    const r = capture((out, err) => runRules({ verb: 'show', flags: [], root, megaCity, out, err }));
    return r.code === 0
      ? { title: 'Règles du projet', command: 'ezk rules show', file, ok: true, text: r.out.trimEnd() }
      : { title: 'Règles du projet', command: 'ezk rules show', file, ok: false, text: (r.err || r.out).trimEnd() };
  } catch (error) {
    return { title: 'Règles du projet', command: 'ezk rules show', file, ok: false, text: (error as Error).message };
  }
}

function dorSection(root: string): ConfigSection {
  const file = contractFile(root, 'dor');
  try {
    const r = capture((out, err) => runDor({ verb: 'show', args: [], root, out, err }));
    return r.code === 0
      ? { title: 'Critères de « prête »', command: 'ezk dor show', file, ok: true, text: r.out.trimEnd() }
      : { title: 'Critères de « prête »', command: 'ezk dor show', file, ok: false, text: (r.err || r.out).trimEnd() };
  } catch (error) {
    return { title: 'Critères de « prête »', command: 'ezk dor show', file, ok: false, text: (error as Error).message };
  }
}

/** Les trois sections de la page, dans l'ordre : GitHub, règles, critères de « prête ». */
export function configSections(root: string, megaCity: string): ConfigSection[] {
  return [githubSection(root), rulesSection(root, megaCity), dorSection(root)];
}
