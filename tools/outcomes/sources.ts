/**
 * Fiche 0044 — port `RepoSource` + adaptateurs.
 *
 * PROVISOIRE tant qu'ADR-030 n'est pas ratifié : toutes les définitions
 * opérationnelles ci-dessous (« PR d'agent », classification de commit) sont
 * des seuils/heuristiques PO provisoires, pas des invariants gelés.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface CommitClassification {
  // `unknown` (et non `human`) : l'ABSENCE de trailer ne prouve pas un auteur
  // humain — dans ce repo tout est produit par agents et l'identité git est
  // unique (0176). Seul le trailer confirme `agent` ; le reste est indéterminé.
  authorType: 'agent' | 'unknown';
  isMergeCommit: boolean;
  isRebase: boolean;
  isFormatting: boolean;
}

export interface PrCommit extends CommitClassification {
  sha: string;
  message: string;
  timestamp: string;
}

export interface MergedPr {
  number: number;
  branch: string;
  mergedAt: string;
  files: string[];
  ficheId?: string;
  commits: PrCommit[];
}

export interface DoneFiche {
  id: string;
  path: string;
  created: string;
  mergedAt?: string;
}

export interface SupervisionRun {
  id: string;
  conforms: boolean;
}

/** Port : source de données pour le mesureur (lecture seule). */
export interface RepoSource {
  countMergedAgentPrs(): number;
  listMergedAgentPrs(limit: number): MergedPr[];
  listDoneFiches(): DoneFiche[];
  listSupervisionRuns(): SupervisionRun[];
}

/**
 * PROVISOIRE (seuil PO) — « PR d'agent » = branche matchant ce motif.
 * Dans ce repo tout est produit par agents ; la convention de nommage de
 * branche (`claude/…`, `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`)
 * sert de proxy faute de mieux. À ajuster/justifier par ADR-030.
 */
export const AGENT_BRANCH_PATTERN = /^(claude|feat|fix|docs|chore|refactor)\//;

/**
 * PROVISOIRE — id de fiche extrait du nom de branche `<type>/<id>-<slug>`
 * (convention `feat/<id>-<slug>`, ADR-0018). id = 4 chiffres (legacy) ou 17
 * (horodaté, fiche 0180). `undefined` si la branche ne porte pas d'id.
 * Fonction PURE.
 */
export function ficheIdFromBranch(branch: string): string | undefined {
  const tail = branch.includes('/') ? branch.slice(branch.indexOf('/') + 1) : branch;
  return /^(\d{17}|\d{4})(?:[-_]|$)/.exec(tail)?.[1];
}

/**
 * PROVISOIRE — plafond de scan pour COMPTER les PRs (gh n'a pas de count natif ;
 * on liste puis on mesure la longueur). Au-delà, le compte est tronqué — nommé
 * pour rendre la limite explicite plutôt que magique.
 */
export const COUNT_SCAN_LIMIT = 1000;

/**
 * PROVISOIRE — classification d'un message de commit, fonction PURE.
 * `authorType` s'appuie sur le trailer `Co-authored-by: Claude …` (convention
 * effective de ce repo, cf. instructions de commit) faute de signal git
 * fiable : tous les commits locaux partagent la même identité git (0176).
 */
export function classifyCommitMessage(message: string): CommitClassification {
  const firstLine = message.split('\n')[0] ?? '';
  const isMergeCommit = /^Merge (pull request|branch)/i.test(firstLine);
  const isRebase = /\brebase\b/i.test(message) || /^(fixup|squash)!/i.test(firstLine);
  // Détection RESTREINTE aux commits DE formatage (préfixe conventionnel ou action
  // explicite) — pas au simple mot « format » : « fix: preserve the legacy output
  // format » est une retouche substantielle, pas un commit de formatage (Codex #P2).
  const isFormatting =
    /^(style|format)(\(.+\))?:/i.test(firstLine) ||
    /^chore\(format\)/i.test(firstLine) ||
    /\b(run|apply|auto)[ -]?format(ting)?\b/i.test(firstLine) ||
    /\b(biome|prettier)\b/i.test(firstLine);
  const authorType: 'agent' | 'unknown' = /co-authored-by:\s*claude/i.test(message)
    ? 'agent'
    : 'unknown';
  return { authorType, isMergeCommit, isRebase, isFormatting };
}

/** Stub en mémoire, ZÉRO I/O — c'est celui qu'utilisent les tests. */
export class StubSource implements RepoSource {
  constructor(
    private readonly prs: MergedPr[] = [],
    private readonly fiches: DoneFiche[] = [],
    private readonly runs: SupervisionRun[] = [],
  ) {}

  countMergedAgentPrs(): number {
    return this.prs.length;
  }

  listMergedAgentPrs(limit: number): MergedPr[] {
    return this.prs.slice(0, limit);
  }

  listDoneFiches(): DoneFiche[] {
    return this.fiches;
  }

  listSupervisionRuns(): SupervisionRun[] {
    return this.runs;
  }
}

/**
 * Adaptateur réel : appelle `gh` et `git` via `execFileSync` (jamais un
 * shell string concaténé — anti-injection). Non couvert par les tests
 * unitaires (dépendance réseau/process) ; utilisé pour la preuve terrain.
 */
export class GhGitSource implements RepoSource {
  constructor(private readonly repoRoot: string) {}

  private gh(args: string[]): string {
    return execFileSync('gh', args, { cwd: this.repoRoot, encoding: 'utf8' });
  }

  private fetchMergedPrs(limit: number): MergedPr[] {
    // Sur-scanne puis FILTRE puis tronque : `gh --limit N` compte les PRs
    // AVANT le filtre agent ; l'appliquer d'abord renverrait < N PRs d'agents
    // dès qu'une PR non-agent s'intercale. On veut « N dernières PRs d'agents ».
    const raw = this.gh([
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      String(COUNT_SCAN_LIMIT),
      '--json',
      'number,headRefName,mergedAt',
    ]);
    const list = JSON.parse(raw) as { number: number; headRefName: string; mergedAt: string }[];
    const agentPrs = list.filter((pr) => AGENT_BRANCH_PATTERN.test(pr.headRefName)).slice(0, limit);

    return agentPrs.map((pr) => {
      const detailRaw = this.gh(['pr', 'view', String(pr.number), '--json', 'files,commits']);
      const detail = JSON.parse(detailRaw) as {
        files: { path: string }[];
        commits: { oid: string; messageHeadline: string; messageBody?: string }[];
      };
      const commits: PrCommit[] = detail.commits.map((c) => {
        const message = c.messageBody
          ? `${c.messageHeadline}\n${c.messageBody}`
          : c.messageHeadline;
        return { sha: c.oid, message, timestamp: pr.mergedAt, ...classifyCommitMessage(message) };
      });
      return {
        number: pr.number,
        branch: pr.headRefName,
        mergedAt: pr.mergedAt,
        ficheId: ficheIdFromBranch(pr.headRefName),
        files: detail.files.map((f) => f.path),
        commits,
      };
    });
  }

  countMergedAgentPrs(): number {
    // Léger : un seul `gh pr list` (headRefName seul), SANS `gh pr view` par PR.
    const raw = this.gh([
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      String(COUNT_SCAN_LIMIT),
      '--json',
      'headRefName',
    ]);
    const list = JSON.parse(raw) as { headRefName: string }[];
    return list.filter((pr) => AGENT_BRANCH_PATTERN.test(pr.headRefName)).length;
  }

  listMergedAgentPrs(limit: number): MergedPr[] {
    return this.fetchMergedPrs(limit);
  }

  private git(args: string[]): string {
    return execFileSync('git', args, { cwd: this.repoRoot, encoding: 'utf8' }).trim();
  }

  /**
   * Date de merge (PROVISOIRE) = date du commit qui a AJOUTÉ la fiche à `done/`
   * (le `ship` = `git mv`), proxy du squash-merge. On prend l'ajout (`--diff-filter=A`),
   * PAS le dernier commit touchant le fichier : une édition post-ship (refactor de
   * layout, correction de doc) gonflerait le temps de cycle. La fiche 0044 spécifie
   * « created → squash-merge (git) » : on reste côté git, sans appel réseau.
   */
  private ficheMergedAt(relPath: string): string | undefined {
    const added = this.git(['log', '--diff-filter=A', '--format=%cI', '--', relPath])
      .split('\n')
      .filter(Boolean);
    // `git log` liste du plus récent au plus ancien ; l'ajout à `done/` est le
    // plus ancien de la liste (un seul en pratique). Repli sur le dernier commit
    // si aucun ajout n'est trouvé (historique tronqué / shallow clone).
    const shipDate = added.at(-1) ?? this.git(['log', '-1', '--format=%cI', '--', relPath]);
    return shipDate || undefined;
  }

  listDoneFiches(): DoneFiche[] {
    const doneDir = join(this.repoRoot, 'features', 'done');
    if (!existsSync(doneDir)) return [];
    return readdirSync(doneDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const relPath = join('features', 'done', f);
        const content = readFileSync(join(doneDir, f), 'utf8');
        const id = /^id:\s*"?(\S+?)"?\s*$/m.exec(content)?.[1] ?? f;
        const created = /^created:\s*(\S+)/m.exec(content)?.[1] ?? '';
        return { id, path: relPath, created, mergedAt: this.ficheMergedAt(relPath) };
      });
  }

  /**
   * PROVISOIRE — présence détectée en LECTURE SEULE ; la CONFORMITÉ au schéma
   * du journal n'est PAS encore évaluée (`conforms: true` = placeholder assumé).
   * La validation réelle relève d'une surface gelée du contrat (fiche gated ADR-030).
   */
  listSupervisionRuns(): SupervisionRun[] {
    const runsDir = join(this.repoRoot, '.supervision', 'runs');
    if (!existsSync(runsDir)) return [];
    return readdirSync(runsDir).map((id) => ({ id, conforms: true }));
  }
}
