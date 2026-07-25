/**
 * Tests de `upgrade-ok.ts` — calcul mécanique de `upgrade_ok` (rubrique E du Gherkin).
 * Aucun forçage possible à `true` : seul un veto explicite peut forcer `false`.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeUpgradeOk } from '../upgrade-ok.js';

describe('computeUpgradeOk — rubrique E', () => {
  let projectRoot: string;
  let worktreeDir: string | undefined;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-upgrade-ok-'));
    execFileSync('git', ['init'], { cwd: projectRoot });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: projectRoot });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: projectRoot });
    fs.writeFileSync(path.join(projectRoot, 'README.md'), '# poc\n');
    execFileSync('git', ['add', '.'], { cwd: projectRoot });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: projectRoot });
    worktreeDir = undefined;
  });

  afterEach(() => {
    if (worktreeDir) {
      execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: projectRoot });
    }
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('est vrai quand l’arbre est propre et sans sous-run en vol', () => {
    expect(computeUpgradeOk(projectRoot)).toBe(true);
  });

  it('est faux quand l’arbre git contient des modifications non commitées', () => {
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    expect(computeUpgradeOk(projectRoot)).toBe(false);
  });

  it('0085 — reste VRAI quand des worktrees de travail existent hors du dossier dédié (le cas « 7 worktrees du PO »)', () => {
    // Le cas qui échouait avant la fiche 0085 : un humain travaille en worktrees
    // (sessions, chantiers parallèles) — ce ne sont PAS des sous-runs de
    // l'orchestrateur, ils ne doivent pas éteindre le signal en permanence.
    worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-upgrade-ok-wt-'));
    fs.rmdirSync(worktreeDir); // git worktree add veut créer le dossier lui-même
    execFileSync('git', ['worktree', 'add', worktreeDir, '-b', 'wt-branch'], { cwd: projectRoot });
    expect(computeUpgradeOk(projectRoot)).toBe(true);
  });

  it('0085 — est faux quand un sous-run est en vol dans le dossier dédié (.cop1/worktrees)', () => {
    // Peu importe que l'entrée soit un vrai worktree git ou un résidu : sa seule
    // présence dans le dossier DÉDIÉ aux sous-runs signifie « travail en vol »
    // (détection pur-fs, aucune commande git).
    fs.mkdirSync(path.join(projectRoot, '.cop1', 'worktrees', 'run-123'), { recursive: true });
    expect(computeUpgradeOk(projectRoot)).toBe(false);
  });

  it('0085 — reste vrai quand le dossier dédié existe mais est vide (sous-runs nettoyés)', () => {
    fs.mkdirSync(path.join(projectRoot, '.cop1', 'worktrees'), { recursive: true });
    expect(computeUpgradeOk(projectRoot)).toBe(true);
  });

  it.skipIf(process.getuid?.() === 0)(
    'fail closed — dossier dédié présent mais illisible (droits) ⇒ faux, jamais vrai (revue Codex #47)',
    () => {
      // Un signal de sécurité qui n'a pas pu regarder ne répond pas « OK » : seul
      // « dossier absent » vaut « aucun sous-run » ; un readdir en échec (EACCES…)
      // rend l'état inobservable ⇒ false. (Skippé sous root : chmod 000 n'y bloque rien.)
      const dir = path.join(projectRoot, '.cop1', 'worktrees');
      fs.mkdirSync(dir, { recursive: true });
      fs.chmodSync(dir, 0o000);
      try {
        expect(computeUpgradeOk(projectRoot)).toBe(false);
      } finally {
        fs.chmodSync(dir, 0o755);
      }
    },
  );

  it('0084 — les deux moitiés mesurent la MÊME échelle : le sous-arbre de la racine fournie', () => {
    // Le bug d'origine : propreté « par dossier » MAIS worktrees « par dépôt » —
    // un prédicat sans sémantique. Preuve de cohérence post-0085/0019 : appelé
    // avec racine = un sous-dossier, le calcul est aveugle à TOUT ce qui vit
    // au-dessus (saleté comme sous-runs), et voit tout ce qui vit dessous.
    const subRoot = path.join(projectRoot, 'app');
    fs.mkdirSync(subRoot, { recursive: true });
    fs.writeFileSync(path.join(subRoot, 'inside.txt'), 'committed');
    execFileSync('git', ['add', '.'], { cwd: projectRoot });
    execFileSync('git', ['commit', '-m', 'sous-dossier'], { cwd: projectRoot });

    // Saleté + sous-run AU-DESSUS de la racine fournie (au niveau dépôt) :
    fs.writeFileSync(path.join(projectRoot, 'dirty-outside.txt'), 'oops');
    fs.mkdirSync(path.join(projectRoot, '.cop1', 'worktrees', 'run-xyz'), { recursive: true });

    // À état git ÉGAL : le verdict dépend uniquement du sous-arbre désigné.
    expect(computeUpgradeOk(subRoot)).toBe(true); // aveugle au-dessus — les 2 moitiés
    expect(computeUpgradeOk(projectRoot)).toBe(false); // voit les deux — les 2 moitiés

    // Et un sous-run SOUS la racine fournie est bien vu à cette échelle :
    fs.mkdirSync(path.join(subRoot, '.cop1', 'worktrees', 'run-local'), { recursive: true });
    expect(computeUpgradeOk(subRoot)).toBe(false);
  });

  it('0085 — un fichier à la place du dossier dédié (ENOTDIR) vaut « aucun sous-run », pas un crash', () => {
    fs.mkdirSync(path.join(projectRoot, '.cop1'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.cop1', 'worktrees'), 'pas un dossier');
    // ENOTDIR au readdir du chemin exact ou d'un composant : layout non-orchestrateur,
    // donc aucun sous-run — et surtout jamais d'exception.
    expect(() => computeUpgradeOk(projectRoot)).not.toThrow();
  });

  it('le veto de l’appelant force à faux même sur arbre propre', () => {
    expect(computeUpgradeOk(projectRoot, true)).toBe(false);
  });

  it('n’expose aucun moyen de forcer à true (pas de paramètre "force true")', () => {
    // La signature n'accepte qu'un veto (toujours vers false) : impossible par construction
    // de fournir un paramètre qui pousserait vers true sur un arbre sale.
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    expect(computeUpgradeOk(projectRoot, false)).toBe(false);
  });

  it('M2 — se dégrade silencieusement à false (jamais d’exception) hors dépôt git', () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-non-git-'));
    try {
      expect(() => computeUpgradeOk(nonGitDir)).not.toThrow();
      expect(computeUpgradeOk(nonGitDir)).toBe(false);
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });
});
