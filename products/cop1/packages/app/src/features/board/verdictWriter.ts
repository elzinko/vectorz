/**
 * verdictWriter — pose le pouce de revue d'une fiche PAR LA MÉTHODE (fiche 20261102151630248).
 *
 * Mission control n'écrit jamais `features/reviews/verdicts/<id>.json` lui-même : il lance
 * `ezk --root <projet> review verdict <id> <pouce>` (ADR-086 : seules les commandes `ezk` écrivent
 * dans un projet). Le dossier du projet vient du registre, par son nom : jamais un chemin reçu. La
 * commande se lance sans shell, avec une liste d'arguments. La garde du daemon (requestGuard) a déjà
 * refusé les requêtes d'un autre site ou d'un autre type que JSON ; ici, on contrôle le fond.
 */
import type { BoardProjectInput } from './boardProvider.js';
import type { EzkExecRunner } from './ezkExec.js';

export interface VerdictWriterDeps {
  /** Les projets du registre (`name` = id du projet, `root` = sa racine). */
  projects: () => BoardProjectInput[];
  run: EzkExecRunner;
  /** Appelé après une écriture réussie : le daemon relit le plan de ce projet tout de suite. */
  onWritten: (root: string) => void;
}

export type VerdictResponse = { status: 200 | 400 | 404 | 502; body: unknown };

const FICHE_ID = /^\d{4,20}$/;
const VALUES = ['up', 'down', 'none'] as const;

/**
 * La raison donnée par la méthode : la première ligne de sa sortie d'erreur qui n'est pas un avis du
 * routeur `ezk` (« ezk : dépôt visé : … », « ezk : … s'est terminé avec le code 1 »). Ces avis sont
 * voulus côté terminal, mais ils cachaient la raison d'un refus (fiche 20261103191932067).
 */
function methodMessage(stderr: string): string {
  return (
    stderr
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line !== '' && !line.startsWith('ezk : ')) ?? ''
  );
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
  const message = methodMessage(result.stderr);
  if (result.code === 0) {
    deps.onWritten(project.root);
    return { status: 200, body: { ok: true, id, pouce } };
  }
  if (result.code === 1) return refuse(400, message || 'refusé par la méthode');
  return refuse(502, `ezk a échoué (code ${result.code})${message ? ` : ${message}` : ''}`);
}
