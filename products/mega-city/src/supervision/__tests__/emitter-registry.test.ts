/**
 * Tests d'intégration registre → émetteur (fiche 0082).
 * Vérifie la logique de contrôle d'appartenance au registre et la dérivation
 * de `expectedMethod` — sans lancer le processus MCP stdio complet.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findProjectByRoot, loadRegistry, locateRegistry } from '../registry.js';
import { SupervisionRuntime } from '../runtime.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-emitter-reg-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeRegistry(content: string): void {
  fs.writeFileSync(path.join(tmpDir, 'supervision.registry.yaml'), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Émetteur fail-fast — logique de contrôle d'appartenance
// ---------------------------------------------------------------------------

describe('Émetteur — contrôle registre (fiche 0082)', () => {
  it('sans registre → aucune vérification d\'appartenance (v1 inchangé)', () => {
    // Pas de supervision.registry.yaml : loadRegistry retourne null → pas de contrôle
    const registry = loadRegistry(tmpDir);
    expect(registry).toBeNull();
    // Le runtime fonctionne normalement sans expectedMethod
    const runtime = new SupervisionRuntime(tmpDir);
    expect(() =>
      runtime.runStart({ method_name: 'quelque-chose', method_version: '1.0.0' }),
    ).not.toThrow();
  });

  it('avec registre et racine dedans → pas de fail-fast (entrée trouvée)', () => {
    writeRegistry(`
projects:
  - id: vectorz
    path: .
    method: mega-city
`);
    const registry = loadRegistry(tmpDir)!;
    const entry = findProjectByRoot(registry, tmpDir, tmpDir);
    // La racine est dans le registre → pas d'erreur → on peut créer le runtime
    expect(entry).toBeDefined();
    expect(entry!.method).toBe('mega-city');
  });

  it('avec registre et racine HORS registre → fail-fast attendu (entrée absente)', () => {
    writeRegistry(`
projects:
  - id: autre-projet
    path: /autre/chemin
    method: mega-city
`);
    const registry = loadRegistry(tmpDir)!;
    const entry = findProjectByRoot(registry, tmpDir, tmpDir);
    // La racine courante n'est pas dans le registre → fail-fast en prod
    expect(entry).toBeUndefined();
    // Le bin supervision-mcp.ts ferait process.exit(1) dans ce cas
  });

  it('découvre le registre siège par walk-up depuis un sous-projet (Codex P1)', () => {
    writeRegistry(`
projects:
  - id: vectorz
    path: .
    method: mega-city
  - id: client
    path: apps/client
    method: mega-city
`);
    const clientRoot = path.join(tmpDir, 'apps', 'client');
    fs.mkdirSync(clientRoot, { recursive: true });

    const located = locateRegistry([clientRoot]);
    expect(located).not.toBeNull();
    expect(located!.dir).toBe(tmpDir);
    expect(findProjectByRoot(located!.registry, located!.dir, clientRoot)?.id).toBe('client');
  });

  it('avec registre valide → expectedMethod transmis au runtime (annotation mismatch)', () => {
    writeRegistry(`
projects:
  - id: vectorz
    path: .
    method: mega-city
`);
    const registry = loadRegistry(tmpDir)!;
    const entry = findProjectByRoot(registry, tmpDir, tmpDir)!;
    expect(entry.method).toBe('mega-city');

    // Le runtime reçoit expectedMethod depuis l'entrée du registre
    const runtime = new SupervisionRuntime(tmpDir, entry.method);

    // Méthode concordante → pas de _method_mismatch
    const { run_id: runId1 } = runtime.runStart({ method_name: 'mega-city', method_version: '1.0.0' });
    const events1Path = path.join(tmpDir, '.supervision', 'runs', runId1, 'events.jsonl');
    const event1 = JSON.parse(
      fs.readFileSync(events1Path, 'utf-8').split('\n').filter(Boolean)[0]!,
    ) as { payload: Record<string, unknown> };
    expect(event1.payload).not.toHaveProperty('_method_mismatch');

    // Terminer le run pour pouvoir en ouvrir un nouveau
    runtime.runFinished({ status: 'success' });

    // Nouveau runtime avec méthode divergente (même expectedMethod dans le registre)
    const runtime2 = new SupervisionRuntime(tmpDir, 'mega-city');
    const { run_id: runId2 } = runtime2.runStart({ method_name: 'bmad', method_version: '0.0.1' });
    const events2Path = path.join(tmpDir, '.supervision', 'runs', runId2, 'events.jsonl');
    const event2 = JSON.parse(
      fs.readFileSync(events2Path, 'utf-8').split('\n').filter(Boolean)[0]!,
    ) as { payload: Record<string, unknown> };
    expect(event2.payload._method_mismatch).toEqual({ declared: 'bmad', expected: 'mega-city' });
  });
});
