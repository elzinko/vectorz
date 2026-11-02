/**
 * verdictWriter — pose le pouce de revue d'une fiche PAR LA MÉTHODE (fiche 20261102151630248).
 *
 * Mission control n'écrit jamais `features/reviews/verdicts/<id>.json` lui-même : il lance
 * `ezk --root <projet> review verdict <id> <pouce>` (ADR-086 : seules les commandes `ezk` écrivent
 * dans un projet). Le dossier du projet vient du registre, par son nom : jamais un chemin reçu. La
 * commande se lance sans shell, avec une liste d'arguments. La garde du daemon (requestGuard) a déjà
 * refusé les requêtes d'un autre site ou d'un autre type que JSON ; ici, on contrôle le fond.
 */
import { execFile } from 'node:child_process';
import type { BoardProjectInput } from './boardProvider.js';

/** Lance `ezk` avec ces arguments et rend son code de sortie et ses deux sorties, sans jamais lever. */
export type VerdictRunner = (
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

export interface VerdictWriterDeps {
  /** Les projets du registre (`name` = id du projet, `root` = sa racine). */
  projects: () => BoardProjectInput[];
  run: VerdictRunner;
  /** Appelé après une écriture réussie : le daemon relit le plan de ce projet tout de suite. */
  onWritten: (root: string) => void;
}

export type VerdictResponse = { status: 200 | 400 | 404 | 502; body: unknown };

const FICHE_ID = /^\d{4,20}$/;
const VALUES = ['up', 'down', 'none'] as const;
const EXEC_TIMEOUT_MS = 30_000;

/** Le lanceur réel : `execFile` sans shell, la commande de la méthode lue dans la config. */
export function execVerdictRunner(command: readonly string[]): VerdictRunner {
  const [program, ...baseArgs] = command;
  return (args) =>
    new Promise((resolve) => {
      if (program === undefined) {
        resolve({ code: 127, stdout: '', stderr: 'commande ezk vide' });
        return;
      }
      execFile(
        program,
        [...baseArgs, ...args],
        { encoding: 'utf8', timeout: EXEC_TIMEOUT_MS },
        (error, stdout, stderr) => {
          const code = error ? (typeof error.code === 'number' ? error.code : 127) : 0;
          resolve({ code, stdout, stderr: stderr || (error?.message ?? '') });
        },
      );
    });
}

const refuse = (status: 400 | 404 | 502, error: string): VerdictResponse => ({
  status,
  body: { ok: false, error },
});

/** Contrôle le corps `{ projet, id, pouce }`, lance la commande de la méthode, rend sa réponse. */
export async function writeVerdictThroughEzk(
  body: unknown,
  deps: VerdictWriterDeps,
): Promise<VerdictResponse> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return refuse(400, 'corps invalide : un objet { projet, id, pouce } est attendu');
  }
  const { projet, id, pouce } = body as Record<string, unknown>;
  if (typeof projet !== 'string' || projet === '') return refuse(400, 'projet manquant');
  if (typeof id !== 'string' || !FICHE_ID.test(id)) {
    return refuse(400, 'id invalide : un id de fiche (chiffres seulement) est attendu');
  }
  if (typeof pouce !== 'string' || !(VALUES as readonly string[]).includes(pouce)) {
    return refuse(400, 'pouce invalide : up, down ou none');
  }
  const project = deps.projects().find((p) => p.name === projet);
  if (!project) return refuse(404, `projet inconnu : ${projet}`);

  const result = await deps.run(['--root', project.root, 'review', 'verdict', id, pouce]);
  const message =
    result.stderr
      .split('\n')
      .find((line) => line.trim() !== '')
      ?.trim() ?? '';
  if (result.code === 0) {
    deps.onWritten(project.root);
    return { status: 200, body: { ok: true, id, pouce } };
  }
  if (result.code === 1) return refuse(400, message || 'refusé par la méthode');
  return refuse(502, `ezk a échoué (code ${result.code})${message ? ` : ${message}` : ''}`);
}
