/**
 * version-tag — le bord I/O de `ezk backlog version tag` (fiche 20261114131613689, ADR-0088 §2).
 *
 * En clair : un seul geste pour couper une version. Le calcul vit dans le cœur pur
 * (`core/coupe*.ts`, le même que `board show`) ; ici on lit git et les fiches, on joue la gate, puis on
 * écrit. Doctrine « refus = rien d'écrit » : tout se vérifie AVANT la première écriture.
 *
 * Écrit seulement sans `--dry-run`, sur GO de la gate (ou soupape journalisée) : `version:` sur les fiches
 * coupées, `features/versions/<v>.md`, les vues, UN commit, puis l'étiquette LOCALE. Jamais de push.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setFrontMatter } from '../backlog/ship-fiche.js';
import { composerCoupe, derniereEtiquette, shaDeLivraison } from '../core/coupe.js';
import { proposerNumero } from '../core/coupe-numero.js';
import { renderCoupe, renderVersionFile } from '../core/coupe-render.js';
import { gateRefusal } from '../core/release-gate.js';
import { addedSince, fenetreDesSha, tagsAtteignables } from './git-coupe.js';
import { localTags } from './git-tags.js';
import { loadFiches } from '../loaders/fiches.js';
import { VERSIONS_DIR } from '../loaders/milestones.js';
import { readReleaseVerdict, releaseConfig } from '../loaders/release-passes.js';

export interface TagOptions {
  root: string;
  /** Le numéro que le PO impose, ou `undefined` pour laisser la méthode le proposer. */
  impose: string | undefined;
  major: boolean;
  dryRun: boolean;
  /** La soupape PO : raison journalisée qui outrepasse la gate. */
  releaseOk: string | undefined;
  now?: Date;
}

export interface TagResult {
  code: 0 | 1 | 2;
  lines: string[];
}

/** Les branches où la coupe peut se poser. */
const BRANCHES_PRINCIPALES: readonly string[] = ['main', 'master'];

const MEGA_CITY_BIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'bin');

function git(root: string, args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return undefined;
  }
}

const refus = (...lines: string[]): TagResult => ({ code: 1, lines });

/** Quelle soupape ou quel verdict autorise la coupe ; sinon la raison du refus. */
function jouerGate(root: string, version: string, head: string, releaseOk: string | undefined): { label: string } | { refus: string } {
  if (!releaseConfig(root).gate) return { label: 'off' };
  if (releaseOk) return { label: `soupape PO : ${releaseOk}` };
  const raison = gateRefusal(readReleaseVerdict(root, version), head, version);
  return raison === undefined ? { label: 'GO' } : { refus: raison };
}

export function tagVersion(options: TagOptions): TagResult {
  const { root, impose, major, dryRun, releaseOk, now = new Date() } = options;
  const head = git(root, ['rev-parse', 'HEAD']);
  if (head === undefined) return refus('En clair : pas de dépôt git (ou aucun commit) ici : impossible de couper une version.');

  const fiches = loadFiches(root);
  const derniere = derniereEtiquette(tagsAtteignables(root));
  const shas = new Map(fiches.flatMap((f) => (shaDeLivraison(f.pr) === null ? [] : [[f.id, f.pr] as const])));
  const coupe = composerCoupe({
    chemins: addedSince(root, derniere),
    fiches,
    derniereEtiquette: derniere,
    fenetre: fenetreDesSha(root, derniere, shas),
  });
  const numero = proposerNumero({ coupe, derniere, tags: localTags(root), major, impose });
  const rendu = renderCoupe(coupe, numero);

  if (!numero.ok) return refus(...rendu);
  if (dryRun) return { code: 0, lines: [...rendu, '', `Rien n'est écrit (--dry-run). Pour couper : backlog version tag ${numero.numero}.`] };

  // Tout se vérifie avant la première écriture.
  const branche = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branche === undefined || !BRANCHES_PRINCIPALES.includes(branche)) {
    return refus(`En clair : la coupe se joue sur la branche principale (${BRANCHES_PRINCIPALES.join(' ou ')}), pas sur « ${branche ?? 'HEAD détachée'} ». Rien n'a été écrit.`);
  }
  const sale = git(root, ['status', '--porcelain', '--', 'features']);
  const indexe = git(root, ['diff', '--cached', '--name-only']);
  if (sale || indexe) {
    return refus(
      "En clair : des changements non commités (features/ ou index) fausseraient la coupe. Rien n'a été écrit.",
      "Committe (ou annule) d'abord :",
      ...(sale ?? indexe ?? '').split('\n').slice(0, 5).map((l) => `  ${l}`),
    );
  }
  const gate = jouerGate(root, numero.numero, head, releaseOk);
  if ('refus' in gate) {
    return refus(`En clair : ${numero.numero} n'est pas coupée : ${gate.refus}.`, 'Soupape PO : version tag … --release-ok "<raison>" (journalisée). Rien n\'a été écrit.');
  }

  return ecrire({ root, head, numero: numero.numero, origine: numero.origine, gate: gate.label, coupe, date: now.toISOString().slice(0, 10), releaseOk });
}

interface Ecriture {
  root: string;
  head: string;
  numero: string;
  origine: 'propose' | 'impose';
  gate: string;
  coupe: ReturnType<typeof composerCoupe>;
  date: string;
  releaseOk: string | undefined;
}

function ecrire(e: Ecriture): TagResult {
  const { root, numero, coupe } = e;
  const fichiers = coupe.fiches.map((f) => f.file);
  for (const file of fichiers) {
    const chemin = join(root, file);
    writeFileSync(chemin, setFrontMatter(readFileSync(chemin, 'utf8'), { version: numero }));
  }
  const fichierVersion = join(VERSIONS_DIR, `${numero}.md`);
  mkdirSync(join(root, VERSIONS_DIR), { recursive: true });
  writeFileSync(join(root, fichierVersion), renderVersionFile({ version: numero, date: e.date, commit: e.head, gate: e.gate, origine: e.origine, coupe }));
  let committe = false;
  try {
    execFileSync('bash', [join(MEGA_CITY_BIN, 'regen-backlog.sh'), root], { stdio: 'pipe' });
    const vues = git(root, ['status', '--porcelain', '--', 'features/BACKLOG.md']) ? ['features/BACKLOG.md'] : [];
    execFileSync('git', ['add', '--', ...fichiers, fichierVersion, ...vues], { cwd: root, stdio: 'pipe' });
    execFileSync('git', ['commit', '--quiet', '-m', `chore(release): ${numero}`], { cwd: root, stdio: 'pipe' });
    committe = true;
    execFileSync('git', ['tag', '-a', numero, '-m', `Version ${numero}`], { cwd: root, stdio: 'pipe' });
  } catch (error) {
    const raison = error instanceof Error ? error.message : String(error);
    const reprise = committe
      ? `Le commit « chore(release): ${numero} » est fait, l'étiquette manque : pose-la (git tag -a ${numero}) ou annule le commit (git reset --soft HEAD~1).`
      : `Rien n'est commité : « git restore --staged --worktree features » annule les fiches, puis supprime ${fichierVersion}.`;
    return { code: 2, lines: [`✗ coupe interrompue : ${raison}`, reprise] };
  }
  const nouveau = git(root, ['rev-parse', 'HEAD']) ?? '';
  return {
    code: 0,
    lines: [
      ...(e.releaseOk ? [`Soupape PO — gate de release outrepassée pour ${numero} : ${e.releaseOk}`, ''] : []),
      `En clair : ${numero} est coupée. ${coupe.fiches.length} fiche(s) portent maintenant version: ${numero}, le fichier ${fichierVersion} est écrit, committé (${nouveau.slice(0, 9)}), et l'étiquette ${numero} est posée en LOCAL sur ce commit.`,
      `Le push reste au PO : git push origin ${numero}`,
      `Pour la retirer : git tag -d ${numero}`,
    ],
  };
}
