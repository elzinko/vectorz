#!/usr/bin/env node
/**
 * supervision-abandon — abandonne un run orphelin identifié par son run_id.
 *
 *   pnpm --dir products/mega-city supervision:abandon <projectRoot> <expected_run_id>
 *
 * ADR-035 D5 : garde anti-clic-périmé — la commande refuse d'écrire si le run
 * ouvert a changé depuis la demande (un nouveau run légitime ne sera jamais clos).
 *
 * Produit run.finished { status: "abandoned", abandoned_by: "seat" } dans events.jsonl
 * via `SupervisionRuntime.abandonRun` — le seul écrivain du journal reste le kit émetteur.
 *
 * Code de sortie : 0 = succès, 1 = refus ou erreur.
 */
import { resolveProjectPath } from '../src/supervision/link-config.js';
import { SupervisionRuntime } from '../src/supervision/runtime.js';

async function main(): Promise<void> {
  const [rawProjectRoot, expectedRunId] = process.argv.slice(2);

  if (!rawProjectRoot || !expectedRunId) {
    console.error(
      'Usage: supervision:abandon <projectRoot> <expected_run_id>\n' +
        '  projectRoot     : chemin vers la racine du projet surveillé\n' +
        '  expected_run_id : run_id du run que vous voulez abandonner',
    );
    process.exitCode = 1;
    return;
  }

  const projectRoot = resolveProjectPath(rawProjectRoot, process.env.INIT_CWD, process.cwd());
  const runtime = new SupervisionRuntime(projectRoot);

  try {
    const result = runtime.abandonRun(expectedRunId);
    console.log(`✓ run.finished {status:abandoned, abandoned_by:seat} écrit — run_id=${result.run_id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ ${message}`);
  process.exitCode = 1;
});
