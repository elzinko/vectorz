#!/usr/bin/env tsx
/**
 * `ezk carto status|record` — le carnet de tests (fiche 20261102182259416).
 *
 *   ezk carto status [<app>] [--todo] [--json] [--zone <nœud>] [--root <projet>]
 *   ezk carto record <nœud> --axis <visuel|fonctionnel> --verdict <valide|echec> --proof <fichier>
 *                    [--app <app>] [--sha <sha>] [--root <projet>]
 *
 * `status` lit l'arbre déclaré et le journal, puis calcule l'état de chaque contrôle : jamais testé,
 * valide, en échec, expiré. `--todo` ne garde que ce qui reste à tester. `--zone` restreint à une
 * branche de l'arbre (le nœud et sa descendance). `--json` rend le même contenu, avec `schema_version`. `record` ajoute une ligne au journal et copie la preuve.
 *
 * Bord I/O mince : le calcul est dans `src/core/carto.ts`, les fichiers et git dans
 * `src/io/carto-store.ts`. Horloge : `EZK_CARTO_NOW` (date ISO) remplace « maintenant », pour les
 * tests seulement. Codes : 0 ok · 1 refus (config, arbre, nœud, preuve) · 2 usage.
 */
import { resolve } from 'node:path';
import {
  AXES,
  type Axis,
  type CartoEntry,
  VERDICTS,
  type Verdict,
  computeStatus,
  isTodo,
  renderStatus,
  restrictToZone,
} from '../src/core/carto.js';
import {
  CartoError,
  appendEntry,
  commitsSinceIn,
  gitTopLevel,
  loadTree,
  readEntries,
  storeDir,
  storeProof,
  testedSha,
} from '../src/io/carto-store.js';
import { projectRootOrExit } from '../src/io/project-root.js';

const USAGE = [
  'usage : ezk carto status [<app>] [--todo] [--json] [--zone <nœud>] [--root <projet>]',
  '        ezk carto record <nœud> --axis <visuel|fonctionnel> --verdict <valide|echec> --proof <fichier>',
  '                         [--app <app>] [--sha <sha>] [--root <projet>]',
].join('\n');

/** Là où l'utilisateur a tapé la commande : un chemin de preuve relatif se lit depuis ici. */
const base = process.env.INIT_CWD ?? process.cwd();
const { root, rest } = projectRootOrExit(gitTopLevel(base));

class UsageError extends Error {}

interface Args {
  positional: string[];
  options: Record<string, string>;
  flags: Set<string>;
}

function parseArgs(args: readonly string[], withValue: string[], booleans: string[]): Args {
  const parsed: Args = { positional: [], options: {}, flags: new Set() };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      parsed.positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (booleans.includes(name)) parsed.flags.add(name);
    else if (withValue.includes(name)) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) throw new UsageError(`--${name} attend une valeur`);
      parsed.options[name] = value;
      i += 1;
    } else throw new UsageError(`option inconnue : ${arg}`);
  }
  return parsed;
}

function status(args: readonly string[]): number {
  const { positional, flags, options } = parseArgs(args, ['zone'], ['todo', 'json']);
  if (positional.length > 1) throw new UsageError('une seule app à la fois');
  const loaded = loadTree(root, positional[0]);
  const { zone } = options;
  if (zone !== undefined && !loaded.tree.nodes.some((n) => n.id === zone)) {
    const known = loaded.tree.nodes.map((n) => n.id);
    throw new CartoError(`branche inconnue « ${zone} » dans ${loaded.file} (connus : ${known.join(', ')})`);
  }
  const { entries } = readEntries(storeDir(root, loaded.app));
  const now = process.env.EZK_CARTO_NOW ? new Date(process.env.EZK_CARTO_NOW) : new Date();
  if (Number.isNaN(now.getTime())) throw new CartoError(`EZK_CARTO_NOW : date ISO illisible « ${process.env.EZK_CARTO_NOW} »`);
  const full = computeStatus(loaded.tree, entries, {
    now,
    validityDays: loaded.validityDays,
    commitsSince: commitsSinceIn(root),
  });
  const computed = zone === undefined ? full : restrictToZone(full, zone);
  const todo = flags.has('todo');
  if (flags.has('json')) {
    const checks = todo ? computed.checks.filter(isTodo) : computed.checks;
    console.log(JSON.stringify({ ...computed, tree_file: loaded.file, todo, checks }, null, 1));
  } else console.log(renderStatus(computed, { todo }));
  return 0;
}

function record(args: readonly string[]): number {
  const { positional, options } = parseArgs(args, ['axis', 'verdict', 'proof', 'app', 'sha'], []);
  if (positional.length !== 1) throw new UsageError('record attend un seul nœud, par exemple export/bpm-invalide');
  const [node] = positional;
  const { axis, verdict, proof } = options;
  if (!(AXES as readonly string[]).includes(axis ?? '')) throw new UsageError(`--axis : ${AXES.join(' ou ')}`);
  if (!(VERDICTS as readonly string[]).includes(verdict ?? '')) throw new UsageError(`--verdict : ${VERDICTS.join(' ou ')}`);
  if (proof === undefined) throw new UsageError('--proof : le fichier qui prouve le test est obligatoire');

  const loaded = loadTree(root, options.app);
  const target = loaded.tree.nodes.find((n) => n.id === node);
  if (!target) {
    const known = loaded.tree.nodes.map((n) => n.id);
    throw new CartoError(`nœud inconnu « ${node} » dans ${loaded.file} (connus : ${known.join(', ')})`);
  }
  if (!target.axes.includes(axis as Axis)) {
    throw new CartoError(`le nœud « ${node} » ne déclare pas l'axe ${axis} (axes : ${target.axes.join(', ')})`);
  }
  const sha = testedSha(root, options.sha);
  const dir = storeDir(root, loaded.app);
  const entry: CartoEntry = {
    node,
    axis: axis as Axis,
    verdict: verdict as Verdict,
    at: new Date().toISOString(),
    sha,
    proof: storeProof(dir, resolve(base, proof)),
  };
  appendEntry(dir, entry);
  console.log(
    `En clair : noté — ${node} · ${axis} · ${verdict === 'valide' ? 'valide' : 'en échec'} · SHA ${sha.slice(0, 8)} · preuve ${entry.proof}.`,
  );
  return 0;
}

function main(args: readonly string[]): number {
  const [verb, ...others] = args;
  try {
    if (verb === 'status') return status(others);
    if (verb === 'record') return record(others);
    throw new UsageError(verb === undefined ? 'sous-commande manquante' : `sous-commande inconnue : ${verb}`);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n${USAGE}`);
      return 2;
    }
    if (error instanceof CartoError) {
      console.error(`En clair : ${error.message}`);
      return 1;
    }
    throw error;
  }
}

// Pas de `process.exit` après une sortie : il couperait un JSON long envoyé dans un tuyau.
process.exitCode = main(rest);
