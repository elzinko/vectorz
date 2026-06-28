import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { applyPlan } from '../io/apply.js';
import type { WritePlan } from '../domain/plan.js';

// Coquille I/O : lecture d'état projet + fusion non-destructive (fiche 0010).
// Tests en temp dir UNIQUEMENT — jamais le vrai système.
describe('applyPlan — fusion non-destructive (fiche 0010)', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'lawgiver-merge-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const managedBlockPlan = (body: string): WritePlan => ({
    files: [{ path: 'CLAUDE.md', content: body, intent: 'managed-block' }],
    hooks: [],
  });

  const claudeMd = () => readFileSync(join(projectDir, 'CLAUDE.md'), 'utf8');

  describe('intent managed-block', () => {
    it('CRÉE le fichier avec un bloc délimité quand il est absent', () => {
      applyPlan(managedBlockPlan('lis ENTRY.md'), projectDir);
      const out = claudeMd();
      expect(out).toContain('<!-- iamthelaw:start -->');
      expect(out).toContain('lis ENTRY.md');
      expect(out).toContain('<!-- iamthelaw:end -->');
    });

    it('PRÉSERVE 100% du contenu humain existant hors bloc (append du bloc)', () => {
      const human = '# Mon projet\n\nNotes perso de l’humain.\nUne 2e ligne.\n';
      writeFileSync(join(projectDir, 'CLAUDE.md'), human);

      applyPlan(managedBlockPlan('loi du cap'), projectDir);

      const out = claudeMd();
      expect(out).toContain(human.trim());
      expect(out).toContain('<!-- iamthelaw:start -->');
      expect(out).toContain('loi du cap');
    });

    it('est IDEMPOTENT : deux binds ne dupliquent pas le bloc', () => {
      const human = '# Mon projet\n\nContenu humain.\n';
      writeFileSync(join(projectDir, 'CLAUDE.md'), human);

      applyPlan(managedBlockPlan('loi v1'), projectDir);
      applyPlan(managedBlockPlan('loi v1'), projectDir);

      const out = claudeMd();
      const starts = out.match(/<!-- iamthelaw:start -->/g) ?? [];
      expect(starts.length).toBe(1);
      expect(out).toContain('Contenu humain.');
    });

    it('RÉ-REND le bloc quand son contenu change, sans toucher au reste', () => {
      const human = '# Mon projet\n\nContenu humain.\n';
      writeFileSync(join(projectDir, 'CLAUDE.md'), human);

      applyPlan(managedBlockPlan('loi v1'), projectDir);
      applyPlan(managedBlockPlan('loi v2 mise à jour'), projectDir);

      const out = claudeMd();
      expect(out).toContain('loi v2 mise à jour');
      expect(out).not.toContain('loi v1');
      expect(out).toContain('Contenu humain.');
      const starts = out.match(/<!-- iamthelaw:start -->/g) ?? [];
      expect(starts.length).toBe(1);
    });
  });

  describe('intent skip-if-exists (hooks)', () => {
    const hookPlan = (script: string): WritePlan => ({
      files: [],
      hooks: [{ stage: 'commit-msg', script, intent: 'skip-if-exists' }],
    });

    const writeUserHook = (content: string) => {
      mkdirSync(join(projectDir, '.git', 'hooks'), { recursive: true });
      writeFileSync(join(projectDir, '.git', 'hooks', 'commit-msg'), content);
    };

    const userHook = () => readFileSync(join(projectDir, '.git/hooks/commit-msg'), 'utf8');

    it('NE écrase PAS un hook commit-msg perso qui diffère : backup + refus', () => {
      writeUserHook('#!/bin/sh\n# hook perso précieux\nexit 0\n');

      expect(() => applyPlan(hookPlan('#!/bin/sh\n# hook du cap\n'), projectDir)).toThrow(
        /--force|backup|écras|existe/i,
      );

      // Le hook perso est intact (jamais écrasé silencieusement).
      expect(userHook()).toContain('hook perso précieux');
    });

    it('pose le hook normalement quand il n’existe pas encore', () => {
      applyPlan(hookPlan('#!/bin/sh\n# hook du cap\n'), projectDir);
      expect(existsSync(join(projectDir, '.git/hooks/commit-msg'))).toBe(true);
      expect(userHook()).toContain('hook du cap');
    });

    it('est idempotent quand le hook posé est identique (pas de refus)', () => {
      const script = '#!/bin/sh\n# hook du cap\n';
      applyPlan(hookPlan(script), projectDir);
      expect(() => applyPlan(hookPlan(script), projectDir)).not.toThrow();
      expect(userHook()).toContain('hook du cap');
    });

    it('avec force=true : écrase le hook perso et le sauvegarde en .bak', () => {
      writeUserHook('#!/bin/sh\n# hook perso précieux\nexit 0\n');

      applyPlan(hookPlan('#!/bin/sh\n# hook du cap\n'), projectDir, { force: true });

      expect(userHook()).toContain('hook du cap');
      const backup = join(projectDir, '.git/hooks/commit-msg.bak');
      expect(existsSync(backup)).toBe(true);
      expect(readFileSync(backup, 'utf8')).toContain('hook perso précieux');
    });
  });
});
