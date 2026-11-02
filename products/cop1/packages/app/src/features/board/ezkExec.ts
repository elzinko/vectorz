/**
 * ezkExec — lance une commande de la méthode (`ezk …`) sans shell, et rend son code de sortie et ses
 * deux sorties, sans jamais lever. Partagé par les gestes qui passent par `ezk` à la demande : le
 * pouce de revue (fiche 20261102151630248) et les documents de la méthode (fiche 20261102123552184).
 */
import { execFile } from 'node:child_process';

/** Lance `ezk` avec ces arguments et rend son code de sortie et ses deux sorties, sans jamais lever. */
export type EzkExecRunner = (
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

const EXEC_TIMEOUT_MS = 30_000;
/** Un document de la méthode pèse quelques centaines de Ko : large marge sous ce plafond. */
const EXEC_MAX_BUFFER = 16 * 1024 * 1024;

/** Le lanceur réel : `execFile` sans shell, la commande de la méthode lue dans la config. */
export function execEzkRunner(command: readonly string[]): EzkExecRunner {
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
        { encoding: 'utf8', timeout: EXEC_TIMEOUT_MS, maxBuffer: EXEC_MAX_BUFFER },
        (error, stdout, stderr) => {
          const code = error ? (typeof error.code === 'number' ? error.code : 127) : 0;
          resolve({ code, stdout, stderr: stderr || (error?.message ?? '') });
        },
      );
    });
}
