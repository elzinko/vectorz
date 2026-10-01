/**
 * deploy-doctor — ce que le profil déclare, comparé à ce qui est vraiment installé
 * (fiche 20260903134909124 ; absorbe 20260823121712909 « lawgiver doctor »).
 *
 * PUR (ADR-0003) : il compare le PLAN que `bind-global` écrirait aux faits que le bord I/O a
 * relevés (src/io/deploy-probe.ts). Aucun jugement, aucune écriture. Il reconnaît les DEUX modes
 * de déploiement : un lien vivant, ou une copie dont le contenu égale celui du plan. Il signale :
 *   - un élément du profil absent (le cas « /ezk-pr introuvable ») ;
 *   - un lien mort ;
 *   - une copie périmée (un fichier manque ou diffère du plan) ;
 *   - la loi (`rules/iamthelaw.md`) absente, périmée, ou occupée par un fichier qui n'est pas à lawgiver.
 * Restent hors de ce lot (fiche) : orphelins gérés, éléments du catalogue dans aucun profil, --fix.
 */
import { GLOBAL_LAW_PATH, isManagedLaw } from '../domain/law-file.js';
import type { FileWrite, WritePlan } from '../domain/plan.js';
import { type DeployEntry, type PathFact, expectedItems, inspect } from './deploy-state.js';

export interface DoctorProbe {
  /** Ce qu'il y a à ce chemin (relatif à la racine de déploiement). */
  fact(rel: string): PathFact;
  /** Le texte d'un fichier, ou undefined s'il est absent ou illisible. */
  readText(rel: string): string | undefined;
}

export type ProblemKind =
  | 'manquant'
  | 'lien-mort'
  | 'copie-perimee'
  | 'loi-absente'
  | 'loi-perimee'
  | 'loi-non-geree';

export interface Problem {
  kind: ProblemKind;
  path: string;
  /** La cible d'un lien mort, ou les fichiers d'une copie périmée. */
  detail?: string;
}

export interface Diagnosis {
  /** Skills et agents que le profil promet. */
  checked: number;
  /** Le profil porte-t-il des règles (donc un fichier de loi à vérifier) ? */
  hasLaw: boolean;
  problems: Problem[];
}

const MAX_FILES_LISTED = 3;

/** Les fichiers du plan qui composent un élément : le dossier d'un skill, ou le fichier d'un agent. */
function filesOf(plan: WritePlan, entry: DeployEntry): FileWrite[] {
  return plan.files.filter((f) =>
    entry.kind === 'skill' ? f.path.startsWith(`${entry.path}/`) : f.path === entry.path,
  );
}

function checkLaw(expected: string, probe: DoctorProbe): Problem | undefined {
  const fact = probe.fact(GLOBAL_LAW_PATH);
  if (fact.kind === 'absent') return { kind: 'loi-absente', path: GLOBAL_LAW_PATH };
  // Un lien ou un dossier à cette place : bind-global refuserait d'y écrire.
  const onDisk = fact.kind === 'file' ? probe.readText(GLOBAL_LAW_PATH) : undefined;
  if (onDisk === expected) return undefined;
  if (onDisk !== undefined && isManagedLaw(onDisk)) return { kind: 'loi-perimee', path: GLOBAL_LAW_PATH };
  return { kind: 'loi-non-geree', path: GLOBAL_LAW_PATH };
}

export function diagnose(plan: WritePlan, probe: DoctorProbe): Diagnosis {
  const entries = inspect(expectedItems(plan), (rel) => probe.fact(rel));
  const problems: Problem[] = [];
  for (const entry of entries) {
    if (entry.state === 'absent') {
      problems.push({ kind: 'manquant', path: entry.path });
    } else if (entry.state === 'lien-mort') {
      problems.push({ kind: 'lien-mort', path: entry.path, ...(entry.target ? { detail: entry.target } : {}) });
    } else if (entry.state === 'copie') {
      const stale = filesOf(plan, entry)
        .filter((f) => probe.readText(f.path) !== f.content)
        .map((f) => f.path);
      if (stale.length > 0) {
        problems.push({ kind: 'copie-perimee', path: entry.path, detail: stale.slice(0, MAX_FILES_LISTED).join(', ') });
      }
    }
  }
  const law = plan.files.find((f) => f.path === GLOBAL_LAW_PATH);
  if (law) {
    const problem = checkLaw(law.content, probe);
    if (problem) problems.push(problem);
  }
  return { checked: entries.length, hasLaw: law !== undefined, problems };
}

/** 0 si tout est en place, 1 s'il reste une divergence : l'écart ne reste jamais silencieux en gate. */
export function exitCodeOf(diagnosis: Diagnosis): 0 | 1 {
  return diagnosis.problems.length > 0 ? 1 : 0;
}

const WORD: Record<ProblemKind, string> = {
  manquant: 'manquant',
  'lien-mort': 'lien mort',
  'copie-perimee': 'copie périmée',
  'loi-absente': 'loi absente',
  'loi-perimee': 'loi périmée',
  'loi-non-geree': 'loi non gérée',
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/** Une ligne par divergence, le compte, et la commande qui répare. */
export function renderDiagnosis(
  profileId: string,
  targetLabel: string,
  diagnosis: Diagnosis,
  options: { target?: string } = {},
): string {
  const lines = [`Diagnostic du déploiement — profil '${profileId}' dans ${targetLabel}`];
  const scope = `${plural(diagnosis.checked, 'élément', 'éléments')}${diagnosis.hasLaw ? ' et la loi' : ''}`;
  if (diagnosis.problems.length === 0) {
    lines.push(`✔ Tout est en place : ${scope}.`);
    return `${lines.join('\n')}\n`;
  }
  const width = Math.max(...Object.values(WORD).map((w) => w.length));
  for (const p of diagnosis.problems) {
    const where = !p.detail ? '' : p.kind === 'lien-mort' ? ` → ${p.detail}` : ` (${p.detail})`;
    lines.push(`  ✖ ${WORD[p.kind].padEnd(width)}  ${p.path}${where}`);
  }
  const target = options.target ? ` --target ${options.target}` : '';
  lines.push(
    `${plural(diagnosis.problems.length, 'divergence', 'divergences')} sur ${scope}.`,
    `Pour réparer : pnpm ezk law bind-global ${profileId} --link${target}`,
  );
  return `${lines.join('\n')}\n`;
}
