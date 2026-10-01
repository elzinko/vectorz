/**
 * Le dossier des verdicts — lire et écrire `features/reviews/verdicts/` (fiche 20260826072532622,
 * ADR-0057). Seul endroit où le tableau de bord ÉCRIT dans le dépôt : un fichier par fiche.
 *
 * Le format et le garde-fou vivent dans `core/verdicts.ts` (pur) ; ici, que du disque.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type ParsedVerdict,
  VERDICTS_DIR,
  type Verdict,
  type VerdictsData,
  parseVerdict,
  serializeVerdict,
  verdictFile,
} from '../core/verdicts.js';

/** Lit un fichier de verdict. Une lecture qui échoue (dossier nommé `x.json`, droits) est un fichier illisible. */
function readVerdictFile(file: string): ParsedVerdict {
  try {
    return parseVerdict(readFileSync(file, 'utf8'));
  } catch (err) {
    return { ok: false, reason: `lecture impossible : ${(err as Error).message}` };
  }
}

/**
 * Tous les verdicts posés. Un fichier illisible (JSON cassé, marqueurs de conflit, lecture
 * impossible) n'est pas ignoré en silence et ne fait pas tomber le board : son chemin part dans
 * `illisibles`, et le board le dit.
 */
export function loadVerdicts(repoRoot: string): VerdictsData {
  const data: VerdictsData = { verdicts: {}, illisibles: [] };
  const dir = join(repoRoot, VERDICTS_DIR);
  if (!existsSync(dir)) return data;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.json')) continue;
    const parsed = readVerdictFile(join(dir, name));
    if (parsed.ok) data.verdicts[name.slice(0, -'.json'.length)] = parsed.record;
    else data.illisibles.push(`${VERDICTS_DIR}/${name}`);
  }
  return data;
}

/**
 * Pose, remplace ou retire (`none`) le verdict d'une fiche. `verdictFile` jette si `id` n'est pas
 * un id de fiche : le nom du fichier ne vient jamais d'un chemin saisi. L'écriture passe par un
 * fichier temporaire puis un renommage : un lecteur ne voit jamais un fichier à moitié écrit.
 */
export function writeVerdict(
  repoRoot: string,
  id: string,
  verdict: Verdict | 'none',
  date: string,
): void {
  const file = join(repoRoot, verdictFile(id));
  if (verdict === 'none') {
    rmSync(file, { force: true });
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, serializeVerdict({ verdict, date }));
    renameSync(tmp, file);
  } finally {
    rmSync(tmp, { force: true });
  }
}
