/**
 * `ezk dor check|show|health` — la commande, sans le processus (fiche 20260815080414006, ADR-0016 amendé).
 *
 * `bin/ezk-dor.ts` ne fait que résoudre le projet visé et passer la main ici ; la logique vit dans ce
 * module pour être éprouvée en mémoire. Il rend un code de sortie et écrit par les deux fonctions qu'on
 * lui donne : jamais de `process.exit`, jamais de `console` directe.
 *
 * Frontière (ADR-0001) : la commande range le MÉCANIQUE (section présente, non vide, items mentionnés ;
 * fiches comptées). Elle ne juge jamais le fond d'une réponse : c'est le travail de `groom` et `ready`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type DorManifest, checkFiche, computeHealth, parseDorManifest } from '../core/dor-manifest.js';
import { loadDor } from '../loaders/dor.js';
import { loadFiches } from '../loaders/fiches.js';

export interface DorRun {
  verb: 'check' | 'show' | 'health';
  /** Les arguments du verbe (`check` : l'id de la fiche). */
  args: string[];
  /** Le projet visé, absolu. */
  root: string;
  out(text: string): void;
  err(text: string): void;
}

const NO_MANIFEST = 'Aucun manifeste DoR (.vectorz/dor.yml absent) : le socle 3+1 seul.';

/** Le manifeste du projet, ou la raison pour laquelle il est inutilisable (déjà formulée). */
function manifestOf(root: string): { manifest: DorManifest; file?: string } | { problem: string } {
  let loaded: ReturnType<typeof loadDor>;
  try {
    loaded = loadDor(root);
  } catch (error) {
    return { problem: error instanceof Error ? error.message : String(error) };
  }
  const parsed = parseDorManifest(loaded?.raw);
  if (!parsed.ok) {
    const where = loaded ? ` (${loaded.file})` : '';
    return { problem: `Manifeste DoR invalide${where} :\n${parsed.errors.map((e) => `  - ${e}`).join('\n')}` };
  }
  return loaded ? { manifest: parsed.manifest, file: loaded.file } : { manifest: parsed.manifest };
}

function show(run: DorRun, manifest: DorManifest, file?: string): number {
  if (!file) {
    run.out(`${NO_MANIFEST}\n`);
    return 0;
  }
  run.out(`Manifeste DoR : ${file}\n`);
  run.out(`Slots déclarés : ${manifest.slots.length}\n`);
  for (const slot of manifest.slots) {
    run.out(`  - ${slot.id} : section « ${slot.heading} »\n`);
    run.out(`      question  : ${slot.ask}\n`);
    if (slot.items.length > 0) run.out(`      à balayer : ${slot.items.join(', ')}\n`);
  }
  run.out(`Seuil de lot (health.min-ready) : ${manifest.minReady ?? 'non déclaré'}\n`);
  return 0;
}

function check(run: DorRun, manifest: DorManifest): number {
  const id = run.args[0];
  if (!id) {
    run.err('Usage : ezk dor check <id-de-fiche> [--root <projet>]\n');
    return 2;
  }
  const fiche = loadFiches(run.root).find((f) => f.id === id);
  if (!fiche) {
    run.err(`Fiche « ${id} » introuvable dans features/ de ${run.root}.\n`);
    return 2;
  }
  if (manifest.slots.length === 0) {
    run.out(`${NO_MANIFEST}\n`);
    return 0;
  }
  const reports = checkFiche(manifest, readFileSync(join(run.root, fiche.file), 'utf8'));
  run.out(`DoR du projet, fiche ${id} (${fiche.file})\n`);
  let refused = 0;
  for (const r of reports) {
    if (r.state === 'ok') {
      run.out(`  ${r.slot.id} : OK\n`);
      continue;
    }
    refused += 1;
    if (r.state === 'vide') {
      const why = r.reason === 'absente' ? 'la section est absente' : 'la section est vide';
      run.out(`  ${r.slot.id} : VIDE, ${why} (« ${r.slot.heading} »)\n`);
    } else {
      run.out(`  ${r.slot.id} : INCOMPLET, « ${r.slot.heading} » ne mentionne pas : ${r.missing.join(', ')}\n`);
    }
    run.out(`      à trancher : ${r.slot.ask}\n`);
  }
  if (refused > 0) {
    run.out(`Prête refusée : ${refused} slot(s) à groomer (/ezk-backlog groom ${id}).\n`);
    return 1;
  }
  run.out(`DoR du projet tenue (${reports.length} slot(s)).\n`);
  return 0;
}

function health(run: DorRun, manifest: DorManifest): number {
  const h = computeHealth(loadFiches(run.root), manifest.minReady);
  run.out('Santé du backlog (stock actif, hors épics)\n');
  run.out(`  tirables (ready)  : ${h.ready}\n`);
  run.out(`  pas prêtes (idea) : ${h.notReady}\n`);
  run.out(`  en cours          : ${h.inProgress}\n`);
  if (h.blockedReady > 0) run.out(`  ready bloquées    : ${h.blockedReady} (non tirables, non comptées)\n`);
  if (h.minReady === undefined) {
    run.out('Seuil de lot : non déclaré (informatif).\n');
    return 0;
  }
  if (h.enough) {
    run.out(`Seuil de lot : ${h.ready} tirable(s) pour un minimum de ${h.minReady} : suffisant.\n`);
    return 0;
  }
  run.out(
    `Seuil de lot : ${h.ready} tirable(s) pour un minimum de ${h.minReady} : INSUFFISANT. ` +
      'Groomez d\'abord (/ezk-backlog groom <id>) avant d\'ouvrir un sprint.\n',
  );
  return 1;
}

export function runDor(run: DorRun): number {
  const loaded = manifestOf(run.root);
  if ('problem' in loaded) {
    run.err(`${loaded.problem}\n`);
    return 1;
  }
  if (run.verb === 'show') return show(run, loaded.manifest, loaded.file);
  if (run.verb === 'check') return check(run, loaded.manifest);
  return health(run, loaded.manifest);
}
