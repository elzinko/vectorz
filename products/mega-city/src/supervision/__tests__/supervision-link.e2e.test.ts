/**
 * Test E2E de la coquille `bin/supervision-link.ts` sur le cas que le cœur pur
 * ne peut pas couvrir : l'état de l'INDEX GIT du projet cible.
 *
 * Finding Codex P1 (PR #54) : un `.gitignore` ne s'applique jamais à un fichier
 * déjà suivi. Ajouter `/.mcp.json` ne détracke rien — le branchement écrirait
 * des chemins absolus de machine dans un fichier versionné tout en annonçant
 * qu'il est ignoré.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const megaCityDir = path.resolve(__dirname, '../../..');
const linkEntry = path.join(megaCityDir, 'bin', 'supervision-link.ts');
const tsxBin = path.join(megaCityDir, 'node_modules', '.bin', 'tsx');

let projectRoot: string;

function git(...args: string[]): void {
  execFileSync('git', ['-C', projectRoot, ...args], { stdio: 'ignore' });
}

function runLink(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(tsxBin, [linkEntry, projectRoot], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout, stderr: e.stderr };
  }
}

beforeEach(() => {
  projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-link-e2e-')));
  git('init');
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('supervision-link — E2E coquille (index git réel)', () => {
  it('REFUSE de brancher quand .mcp.json est déjà suivi par git, et dit comment le détracker', () => {
    // Cas réel : une équipe versionne son .mcp.json pour partager un serveur MCP.
    fs.writeFileSync(
      path.join(projectRoot, '.mcp.json'),
      JSON.stringify({ mcpServers: { autre: { command: 'node', args: ['serveur.js'] } } }, null, 2),
    );
    git('add', '.mcp.json');
    const avant = fs.readFileSync(path.join(projectRoot, '.mcp.json'), 'utf8');

    const result = runLink();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/SUIVI par git/);
    expect(result.stderr).toMatch(/rm --cached/);
    // Rien n'a été écrit : le refus arrive AVANT la fusion.
    expect(fs.readFileSync(path.join(projectRoot, '.mcp.json'), 'utf8')).toBe(avant);
    expect(fs.existsSync(path.join(projectRoot, '.gitignore'))).toBe(false);
  }, 20000);

  it('branche normalement quand .mcp.json n’est pas suivi, et pose les deux règles d’ignore', () => {
    const result = runLink();

    expect(result.status).toBe(0);
    const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.supervision/');
    expect(gitignore).toContain('/.mcp.json');

    // La preuve qui compte : git lui-même considère le fichier comme ignoré.
    const suivis = execFileSync('git', ['-C', projectRoot, 'status', '--short'], { encoding: 'utf8' });
    expect(suivis).not.toContain('.mcp.json');
  }, 20000);
});
