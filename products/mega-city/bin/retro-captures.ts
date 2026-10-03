#!/usr/bin/env node
/**
 * retro:captures — liste les décisions des rétros passées et vérifie le format de leur capture
 * (fiche 0080). Lecture seule.
 *
 *   pnpm --dir products/mega-city retro:captures                   # toutes les captures de docs/captures/
 *   pnpm --dir products/mega-city retro:captures --check <fichier>… # valide ces captures (avant la PR de rangement)
 *   pnpm --dir products/mega-city retro:captures --json             # les mêmes décisions, en JSON (vue rétros)
 *
 * Code 0 : tout est lisible. Code 1 : au moins une capture ne respecte pas le format (le fichier et le
 * champ fautif sont nommés). Code 2 : mauvais usage.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureNameProblem,
  isRetroCaptureName,
  parseRetroCapture,
  renderCaptures,
  type RetroCapture,
  type RetroProblem,
} from '../src/core/retro-capture.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const here = dirname(fileURLToPath(import.meta.url));
const methodRoot = resolve(here, '..', '..', '..');

function usage(): never {
  console.error(`usage: retro:captures [--root <projet>] [--check <fichier>…] [--json]

  (sans option)     liste les décisions de toutes les captures de docs/captures/
  --check <fichier> valide ces captures (n'importe quel projet) et dit combien de décisions chacune porte
  --json            rend les captures valides en JSON
  --root <projet>   le projet dont on lit les captures (aussi EZK_ROOT) ; --check se lit depuis lui`);
  process.exit(2);
}

interface Loaded {
  captures: RetroCapture[];
  problems: RetroProblem[];
}

function load(files: Array<{ label: string; path: string }>): Loaded {
  const captures: RetroCapture[] = [];
  const problems: RetroProblem[] = [];
  for (const { label, path } of files) {
    if (!existsSync(path)) {
      problems.push({ file: label, where: 'fichier', message: 'introuvable' });
      continue;
    }
    const parsed = parseRetroCapture(label, readFileSync(path, 'utf8'));
    problems.push(...parsed.problems);
    // Un mauvais nom est dit, et la capture n'est pas comptée : la liste ne la retrouverait pas.
    const badName = captureNameProblem(label);
    if (badName) problems.push(badName);
    else if (parsed.capture) captures.push(parsed.capture);
  }
  return { captures, problems };
}

function main(): void {
  // Le projet désigné (--root, EZK_ROOT) : ses captures, et ses chemins pour --check. Sinon, la méthode.
  const target = projectRootOrExit(methodRoot);
  const args = target.rest;
  if (args.includes('--help') || args.includes('-h')) usage();

  const json = args.includes('--json');
  const checkAt = args.indexOf('--check');
  const known = new Set(['--json', '--check']);
  const checked = checkAt === -1 ? [] : args.slice(checkAt + 1).filter((a) => !known.has(a));
  const stray = args.filter((a, i) => a.startsWith('--') && !known.has(a) && i !== checkAt);
  if (stray.length > 0 || (checkAt !== -1 && checked.length === 0)) usage();

  let files: Array<{ label: string; path: string }>;
  if (checkAt !== -1) {
    const base = target.source === 'default' ? (process.env.INIT_CWD ?? process.cwd()) : target.root;
    files = checked.map((f) => ({ label: f, path: resolve(base, f) }));
  } else {
    const dir = join(target.root, 'docs', 'captures');
    const names = existsSync(dir) ? readdirSync(dir).filter(isRetroCaptureName).sort() : [];
    files = names.map((n) => ({ label: `docs/captures/${n}`, path: join(dir, n) }));
  }

  const { captures, problems } = load(files);

  if (json) {
    console.log(JSON.stringify({ captures, problems }, null, 2));
  } else if (checkAt !== -1) {
    for (const c of captures) console.log(`OK ${c.file} (${c.actions.length} décision${c.actions.length > 1 ? 's' : ''})`);
  } else if (captures.length > 0) {
    console.log(renderCaptures(captures));
  } else if (problems.length === 0) {
    console.log('Aucune capture de rétro dans docs/captures/ (nom attendu : AAAA-MM-JJ-retro-<slug>.md).');
  }

  for (const p of problems) console.error(`${p.file} : ${p.where} — ${p.message}`);
  process.exit(problems.length > 0 ? 1 : 0);
}

main();
