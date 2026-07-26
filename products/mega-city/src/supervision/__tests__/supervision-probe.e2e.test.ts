/**
 * Test E2E de la coquille `bin/supervision-probe.ts` : exerce le VRAI script en
 * sous-process sur un `.mcp.json` généré dans un dossier temporaire, exactement
 * comme un PO le ferait dans un terminal (fiche 0094).
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const megaCityDir = path.resolve(__dirname, '../../..');
const probeEntry = path.join(megaCityDir, 'bin', 'supervision-probe.ts');
const serverEntry = path.join(megaCityDir, 'bin', 'supervision-mcp.ts');
const tsxBin = path.join(megaCityDir, 'node_modules', '.bin', 'tsx');

let projectRoot: string;

/**
 * NB — la forme de commande écrite ici est `tsx <serveur>`, PAS la forme réelle
 * `pnpm --dir … exec tsx …` que génère `supervision:link` (elle, épinglée par
 * `link-config.test.ts`). C'est un choix de VITESSE : passer par `pnpm exec` à
 * chaque cas ajouterait plusieurs secondes. Conséquence assumée : la résolution
 * de `pnpm`/`--dir` n'est prouvée que par le run manuel du probe sur un vrai
 * projet — c'est justement ce que la commande sert à faire.
 */
function writeMcpJson(
  root: string,
  overrides?: Partial<{ command: string; args: string[]; declaredRoot: string }>,
): void {
  const mcpJson = {
    mcpServers: {
      supervision: {
        command: overrides?.command ?? tsxBin,
        args: overrides?.args ?? [serverEntry],
        env: { SUPERVISION_PROJECT_ROOT: overrides?.declaredRoot ?? root },
      },
    },
  };
  fs.writeFileSync(path.join(root, '.mcp.json'), JSON.stringify(mcpJson, null, 2));
}

function runProbe(root: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(tsxBin, [probeEntry, root], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout, stderr: e.stderr };
  }
}

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-probe-e2e-'));
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('supervision-probe — E2E coquille (process réel)', () => {
  it('sort en vert (exit 0) sur un .mcp.json généré valide, sans écrire sous .supervision/', () => {
    writeMcpJson(projectRoot);

    const result = runProbe(projectRoot);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(projectRoot);
    expect(result.stdout).toContain('run_start');
    expect(result.stdout).toContain('gate_reached');
    expect(result.stdout).toContain('gate_resumed');
    expect(result.stdout).toContain('escalate');
    expect(result.stdout).toContain('run_finished');

    // invariant read-only : rien n'a été écrit sous .supervision/
    expect(fs.existsSync(path.join(projectRoot, '.supervision'))).toBe(false);
  }, 20000);

  it('sort en rouge (exit non-zero) et indique supervision:link quand .mcp.json est absent', () => {
    const result = runProbe(projectRoot);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/supervision:link/);
  }, 20000);

  it("sort en rouge quand .mcp.json n'a pas d'entrée supervision", () => {
    fs.writeFileSync(path.join(projectRoot, '.mcp.json'), JSON.stringify({ mcpServers: {} }));

    const result = runProbe(projectRoot);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/supervision:link/);
  }, 20000);

  it('sort en ROUGE quand la racine déclarée désigne un autre projet — sans même démarrer le serveur', () => {
    // Le piège INIT_CWD (Codex, PR #51) : .mcp.json posé dans A, racine sur B.
    // Le serveur démarrerait très bien ; tous les runs de A journaliseraient
    // dans B/.supervision/. « Ça démarre » ne suffit donc pas comme verdict.
    const autreProjet = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-probe-autre-'));
    try {
      writeMcpJson(projectRoot, { declaredRoot: autreProjet });

      const result = runProbe(projectRoot);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/racine déclarée/);
      // realpath explicite : sur macOS, /var/… est un lien vers /private/var/…,
      // et un `toContain(autreProjet)` passerait par accident de sous-chaîne.
      expect(result.stderr).toContain(fs.realpathSync(autreProjet));
    } finally {
      fs.rmSync(autreProjet, { recursive: true, force: true });
    }
  }, 20000);

  it('sort en rouge quand aucune racine n’est déclarée (invariant anti-falsification, fiche 0050)', () => {
    fs.writeFileSync(
      path.join(projectRoot, '.mcp.json'),
      JSON.stringify({ mcpServers: { supervision: { command: tsxBin, args: [serverEntry] } } }),
    );

    const result = runProbe(projectRoot);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/SUPERVISION_PROJECT_ROOT/);
  }, 20000);
});
