/**
 * Tests de `mcp-server.ts` — uniquement la résolution de `project_root` (N1, D5
 * fail-fast). Le transport stdio complet est validé par la QA via un vrai process.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveProjectRootFromEnv } from '../mcp-server.js';

const ENV_KEY = 'SUPERVISION_PROJECT_ROOT';
let previousValue: string | undefined;
let tmpDir: string;

beforeEach(() => {
  previousValue = process.env[ENV_KEY];
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-mcp-server-'));
});

afterEach(() => {
  if (previousValue === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = previousValue;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('resolveProjectRootFromEnv — N1, fail-fast au démarrage', () => {
  it('accepte un chemin absolu vers un dossier existant', () => {
    process.env[ENV_KEY] = tmpDir;
    expect(resolveProjectRootFromEnv()).toBe(tmpDir);
  });

  it('retombe sur process.cwd() quand la variable est absente', () => {
    delete process.env[ENV_KEY];
    expect(resolveProjectRootFromEnv()).toBe(process.cwd());
  });

  it('refuse un chemin relatif avec un message clair', () => {
    process.env[ENV_KEY] = './relative/path';
    expect(() => resolveProjectRootFromEnv()).toThrow(/SUPERVISION_PROJECT_ROOT/);
    expect(() => resolveProjectRootFromEnv()).toThrow(/absolu/i);
  });

  it('refuse un dossier inexistant avec un message clair', () => {
    process.env[ENV_KEY] = path.join(tmpDir, 'does-not-exist');
    expect(() => resolveProjectRootFromEnv()).toThrow(/SUPERVISION_PROJECT_ROOT/);
  });

  it('refuse un chemin qui pointe vers un fichier (pas un dossier)', () => {
    const filePath = path.join(tmpDir, 'a-file.txt');
    fs.writeFileSync(filePath, 'x');
    process.env[ENV_KEY] = filePath;
    expect(() => resolveProjectRootFromEnv()).toThrow(/SUPERVISION_PROJECT_ROOT/);
  });
});
