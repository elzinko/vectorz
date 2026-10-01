#!/usr/bin/env tsx
/**
 * ezk — le point d'entrée unique de la méthode (fiche 20260903134906920, ADR-0046 option B).
 *
 *   ezk help [domaine|skill]                   les deux index : terminal et chat
 *   ezk [--root <dépôt>] [--dry-run] <domaine> [<verbe>] [args…]
 *
 * Bord I/O mince : lit le manifeste (products/mega-city/ezk-manifest.yml), laisse le cœur pur
 * (src/core/ezk-cli.ts) choisir le script, puis le lance avec les arguments tels quels : depuis
 * la racine du dépôt pour une commande qui travaille sur ses fichiers (« fixed »), depuis le
 * dossier de l'utilisateur sinon (« none »). Aucune logique métier ici : les scripts gardent la leur.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { constants } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Manifest,
  type Step,
  findCheckoutRoot,
  parseManifest,
  renderDomainHelp,
  renderHelp,
  route,
  splitRouterFlags,
} from '../src/core/ezk-cli.js';
import { listSkills, skillDetail } from './ezk-help.js';

const MEGA_CITY = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(MEGA_CITY, 'skills');

/** Chemin réel quand il existe (macOS : /var → /private/var), sinon chemin résolu tel quel. */
function real(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

const OWN_ROOT = real(resolve(MEGA_CITY, '..', '..'));

function say(text: string): void {
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
}

function warn(text: string): void {
  process.stderr.write(text.endsWith('\n') ? text : `${text}\n`);
}

function showHelp(manifest: Manifest, topic?: string): number {
  if (topic === undefined) {
    say(renderHelp(manifest, listSkills(SKILLS_DIR)));
    return 0;
  }
  const domain = renderDomainHelp(manifest, topic);
  if (domain) {
    say(domain);
    return 0;
  }
  const skill = skillDetail(SKILLS_DIR, topic);
  if (skill) {
    say(`${skill.name}\n  usage : ${skill.argHint || '(aucun argument-hint)'}\n\n  ${skill.description}`);
    return 0;
  }
  warn(`ezk help : « ${topic} » n'est ni un domaine ni un skill. Essaie « ezk help ».`);
  return 2;
}

/** Le programme qui lance un script : bash pour .sh, sinon le tsx des dépendances de mega-city. */
function launcherFor(step: Step): { cmd: string; args: string[] } {
  const script = join(MEGA_CITY, step.script);
  if (extname(script) === '.sh') return { cmd: 'bash', args: [script, ...step.args] };
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  return { cmd: process.execPath, args: [tsx, script, ...step.args] };
}

function runStep(step: Step, cwd: string): Promise<number> {
  const { cmd, args } = launcherFor(step);
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit' });
    // Un serveur long (le tableau de bord) doit s'arrêter avec nous : on relaie les signaux.
    const relayed = (['SIGINT', 'SIGTERM', 'SIGHUP'] as const).map((signal) => {
      const relay = (): void => {
        child.kill(signal);
      };
      process.on(signal, relay);
      return [signal, relay] as const;
    });
    child.on('error', (error) => {
      warn(`ezk : impossible de lancer ${step.script} (${error.message}).`);
      done(1);
    });
    child.on('exit', (code, signal) => {
      for (const [name, relay] of relayed) process.off(name, relay);
      done(code ?? (signal ? 128 + (constants.signals[signal] ?? 0) : 1));
    });
  });
}

async function main(argv: string[]): Promise<number> {
  const flags = splitRouterFlags(argv);
  if (flags.error) {
    warn(flags.error);
    return 2;
  }
  const manifest = parseManifest(readFileSync(join(MEGA_CITY, 'ezk-manifest.yml'), 'utf8'));
  // pnpm change de dossier avant de lancer le script ; INIT_CWD garde celui de l'utilisateur.
  const userCwd = process.env.INIT_CWD ?? process.cwd();
  const checkout = findCheckoutRoot(userCwd, existsSync);
  const resolution = route(manifest, flags.rest, {
    ownRoot: OWN_ROOT,
    ...(checkout ? { checkoutRoot: real(checkout) } : {}),
    ...(flags.rootFlag ? { rootFlag: real(resolve(userCwd, flags.rootFlag)) } : {}),
  });

  if (resolution.kind === 'help') return showHelp(manifest, resolution.topic);
  if (resolution.kind === 'error') {
    warn(resolution.message);
    return resolution.exitCode;
  }
  for (const notice of resolution.notices) warn(`ezk : ${notice}`);
  const { step, entry } = resolution;
  // Une commande « fixe » travaille sur le dépôt de la méthode : son script part de la racine de
  // ce dépôt, d'où que l'utilisateur la lance (sous-dossier, ou --root depuis ailleurs). Une
  // commande « none » part du dossier de l'utilisateur : ses chemins relatifs sont les siens.
  const cwd = entry.root === 'fixed' ? OWN_ROOT : userCwd;
  if (flags.dryRun) {
    const runner = extname(step.script) === '.sh' ? 'bash' : 'tsx';
    const shown = step.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a));
    say(`ezk (à blanc) : dossier de travail = ${cwd}`);
    say(`ezk (à blanc) : ${[runner, step.script, ...shown].join(' ')}`);
    return 0;
  }
  const code = await runStep(step, cwd);
  // Un code non nul n'est pas toujours une panne : `law doctor` rend 1 pour dire « il y a un écart ».
  if (code !== 0) warn(`ezk : « ${step.script} » s'est terminé avec le code ${code}.`);
  return code;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    warn(`ezk : ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  },
);
