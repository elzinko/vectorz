import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnchorProjectUseCase } from '../application/AnchorProjectUseCase.js';
import type { ProjectAnchorPort } from '../domain/ProjectAnchorPort.js';

describe('AnchorProjectUseCase (fiche 0063)', () => {
  let tmp: string;

  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  function makePort(overrides: Partial<ProjectAnchorPort> = {}): ProjectAnchorPort {
    return {
      bindMethod: vi.fn().mockResolvedValue({ ok: true }),
      linkEmitter: vi.fn().mockResolvedValue({ ok: true }),
      addToRegistry: vi.fn().mockResolvedValue({ ok: true }),
      ...overrides,
    };
  }

  it('400 si chemin relatif', async () => {
    const uc = new AnchorProjectUseCase({
      port: makePort(),
      bindConfigured: true,
      linkConfigured: true,
      registryAddConfigured: true,
    });
    const result = await uc.execute({ projectRoot: 'relatif', mode: 'supervised' });
    expect(result.status).toBe(400);
  });

  it('409 méthode seule si bind_command dormant', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'anchor-'));
    const uc = new AnchorProjectUseCase({
      port: makePort(),
      bindConfigured: false,
      linkConfigured: true,
      registryAddConfigured: true,
    });
    const result = await uc.execute({ projectRoot: tmp, mode: 'method-only' });
    expect(result.status).toBe(409);
    if (result.status === 409) expect(result.error).toMatch(/bind_command/);
  });

  it('200 supervised : link + registry-add + restart requis', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'anchor-'));
    const port = makePort();
    const uc = new AnchorProjectUseCase({
      port,
      bindConfigured: false,
      linkConfigured: true,
      registryAddConfigured: true,
    });
    const result = await uc.execute({
      projectRoot: tmp,
      mode: 'supervised',
      id: 'demo',
      method: 'mega-city',
    });
    expect(result).toMatchObject({
      status: 200,
      mode: 'supervised',
      id: 'demo',
      daemonRestartRequired: true,
    });
    expect(port.linkEmitter).toHaveBeenCalledWith(tmp);
    expect(port.addToRegistry).toHaveBeenCalledWith({
      id: 'demo',
      projectRoot: tmp,
      method: 'mega-city',
    });
    expect(port.bindMethod).not.toHaveBeenCalled();
  });

  it('200 method-only : bind seulement', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'anchor-'));
    const port = makePort();
    const uc = new AnchorProjectUseCase({
      port,
      bindConfigured: true,
      linkConfigured: false,
      registryAddConfigured: false,
    });
    const result = await uc.execute({ projectRoot: tmp, mode: 'method-only' });
    expect(result).toMatchObject({
      status: 200,
      mode: 'method-only',
      daemonRestartRequired: false,
    });
    expect(port.bindMethod).toHaveBeenCalledWith(tmp);
    expect(port.linkEmitter).not.toHaveBeenCalled();
  });
});
