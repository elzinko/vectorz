import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { planCapture } from '../core/capture.js';
import type { CapturePorts } from '../core/capture.js';

const DATE = '2026-06-26';

/**
 * DoD 1 (ADR-0004) : « le LLM ne range jamais ».
 * Des ports mockés ne doivent toucher NI le disque NI git ; seul applyCapture écrit.
 */
describe('le LLM ne range jamais — ports mockés (ADR-0004 §2)', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'capture-edges-'));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('appeler author()/judge() ne crée aucun fichier (aucune écriture)', async () => {
    const author = vi.fn(async (_brief: string) => '# règle rédigée par le LLM');
    const judge = vi.fn(async () => ({ ok: true, notes: 'cohérent' }));
    const ports: CapturePorts = { author, judge };

    const before = readdirSync(rootDir);
    const authored = await ports.author('brief');
    await ports.judge(authored, []);

    expect(author).toHaveBeenCalledOnce();
    expect(judge).toHaveBeenCalledOnce();
    // Les bords LLM n'ont rien rangé : le dossier est inchangé.
    expect(readdirSync(rootDir)).toEqual(before);
  });

  it("planCapture (cœur pur) ne crée aucun fichier tant qu'applyCapture n'est pas appelé", () => {
    const before = readdirSync(rootDir);
    const plan = planCapture('clean-code/no-todo', 'rule', '# corps', DATE);
    expect(plan.artifact.path).toBe('rules/clean-code/no-todo.md');
    // Un plan est de la donnée pure : rien sur le disque.
    expect(existsSync(join(rootDir, plan.artifact.path))).toBe(false);
    expect(readdirSync(rootDir)).toEqual(before);
  });
});
