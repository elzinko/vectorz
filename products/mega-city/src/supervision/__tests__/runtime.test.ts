/**
 * Tests de `runtime.ts` — `SupervisionRuntime`, la machine à états pure/testable du
 * kit émetteur v0.1 (fiche 0050), attaquée directement (sans transport MCP stdio),
 * conformément aux rubriques A à H de `kit-emetteur.feature`.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTRACT_URI, readJournalEvents } from '../journal.js';
import { SupervisionRuntime } from '../runtime.js';

let projectRoot: string;
let extraWorktree: string | undefined;

function initProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-runtime-'));
  execFileSync('git', ['init'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  fs.writeFileSync(path.join(root, 'README.md'), '# poc\n');
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: root });
  return root;
}

function readEvents(root: string, runId: string): Array<Record<string, unknown>> {
  const filePath = path.join(root, '.supervision', 'runs', runId, 'events.jsonl');
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l));
}

beforeEach(() => {
  projectRoot = initProject();
  extraWorktree = undefined;
});

afterEach(() => {
  if (extraWorktree) {
    try {
      execFileSync('git', ['worktree', 'remove', '--force', extraWorktree], { cwd: projectRoot });
    } catch {
      // déjà nettoyé par le test
    }
  }
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('Rubrique A — Run nominal complet', () => {
  it('run_start → gate_reached → gate_resumed → run_finished écrit le journal attendu', () => {
    const runtime = new SupervisionRuntime(projectRoot);

    const started = runtime.runStart({
      method_name: 'ezk-product-build',
      method_version: '0.1.0',
      seat: 'pilot',
    });
    const runDir = path.join(projectRoot, '.supervision', 'runs', started.run_id);
    expect(fs.existsSync(runDir)).toBe(true);

    let events = readEvents(projectRoot, started.run_id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'run.started',
      payload: { method: { name: 'ezk-product-build', version: '0.1.0' }, seat: 'pilot' },
    });

    const reached = runtime.gateReached({
      gate_id: 'gate-1',
      outcome: 'ok',
      report_markdown: '## Étape 1 OK',
    });
    expect(reached.message).toContain('STOP');
    expect(reached.gate_event_id).toBeTruthy();

    events = readEvents(projectRoot, started.run_id);
    const gateReachedEvent = events[1] as { payload: { report_ref: string; upgrade_ok: boolean } };
    expect(typeof gateReachedEvent.payload.report_ref).toBe('string');
    expect(gateReachedEvent.payload.report_ref.startsWith(path.join('.supervision', 'runs'))).toBe(
      true,
    );
    expect(typeof gateReachedEvent.payload.upgrade_ok).toBe('boolean');
    const reportAbsPath = path.join(projectRoot, gateReachedEvent.payload.report_ref);
    expect(fs.existsSync(reportAbsPath)).toBe(true);

    const resumed = runtime.gateResumed({ gate_event_id: reached.gate_event_id });
    events = readEvents(projectRoot, started.run_id);
    expect(events[2]).toMatchObject({
      type: 'gate.resumed',
      payload: { gate_event_id: reached.gate_event_id },
    });
    expect(resumed).toBeTruthy();

    runtime.runFinished({ status: 'success' });
    events = readEvents(projectRoot, started.run_id);
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.type)).toEqual([
      'run.started',
      'gate.reached',
      'gate.resumed',
      'run.finished',
    ]);
    expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4]);
    expect(events[3]).toMatchObject({ payload: { status: 'success' } });
  });
});

describe('Rubrique B — enveloppe (intégration runtime)', () => {
  it('le payload falsifié de l’appelant n’écrase jamais les champs d’enveloppe', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });

    const hostile = {
      gate_id: 'gate-1',
      outcome: 'ok' as const,
      seq: 9999,
      event_id: 'fake',
      run_id: 'autre-run',
      contract: 'contract://falsifie',
    };
    runtime.gateReached(hostile);

    const events = readEvents(projectRoot, started.run_id);
    const gateEvent = events[1] as {
      seq: number;
      event_id: string;
      run_id: string;
      contract: string;
    };
    expect(gateEvent.seq).toBe(2);
    expect(gateEvent.event_id).not.toBe('fake');
    expect(gateEvent.run_id).toBe(started.run_id);
    expect(gateEvent.contract).toBe(CONTRACT_URI);
  });
});

describe('Rubrique C — cycle de vie du run', () => {
  it('refuse un second run_start alors qu’un run est déjà ouvert', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    const before = readEvents(projectRoot, started.run_id);

    // Message exact figé (fiche 0169, verrou run-unique de 0168) : run_id du run bloquant inclus,
    // pour qu'un oracle CI puisse le distinguer d'un autre refus (gate déjà ouvert, run terminé...).
    expect(() => runtime.runStart({ method_name: 'm', method_version: '1.0.0' })).toThrow(
      new RegExp(`^run_start refusé : un run est déjà ouvert \\(run_id=${started.run_id}\\)`),
    );

    const runsDir = path.join(projectRoot, '.supervision', 'runs');
    expect(fs.readdirSync(runsDir)).toEqual([started.run_id]);
    expect(readEvents(projectRoot, started.run_id)).toEqual(before);
  });

  it('refuse toute émission hors run ouvert (sauf run_start) et ne crée aucun fichier', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    expect(() => runtime.gateReached({ gate_id: 'g', outcome: 'ok' })).toThrow();
    expect(() => runtime.gateResumed({ gate_event_id: 'whatever' })).toThrow();
    expect(() => runtime.escalate({ type: 'blocked', detail: 'x' })).toThrow();
    expect(() => runtime.heartbeat({ note: 'x' })).toThrow();
    expect(() => runtime.runFinished({ status: 'success' })).toThrow();
    expect(fs.existsSync(path.join(projectRoot, '.supervision'))).toBe(false);
  });

  it('refuse toute émission après run_finished, journal du run terminé inchangé', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.runFinished({ status: 'success' });
    const before = readEvents(projectRoot, started.run_id);

    expect(() => runtime.gateReached({ gate_id: 'g', outcome: 'ok' })).toThrow();
    expect(() => runtime.gateResumed({ gate_event_id: 'x' })).toThrow();
    expect(() => runtime.escalate({ type: 'blocked', detail: 'x' })).toThrow();
    expect(() => runtime.heartbeat()).toThrow();

    expect(readEvents(projectRoot, started.run_id)).toEqual(before);
  });

  it('heartbeat écrit un événement sur le run ouvert et réarme la vitalité côté journal', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    const beat = runtime.heartbeat({ note: 'étape archi' });
    expect(beat.run_id).toBe(started.run_id);
    expect(typeof beat.event_id).toBe('string');

    const events = readEvents(projectRoot, started.run_id);
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({ seq: 2, type: 'heartbeat', payload: { note: 'étape archi' } });

    const silent = runtime.heartbeat();
    expect(silent.run_id).toBe(started.run_id);
    const after = readEvents(projectRoot, started.run_id);
    expect(after).toHaveLength(3);
    expect(after[2]).toMatchObject({ seq: 3, type: 'heartbeat', payload: {} });

    const gate = runtime.gateReached({ gate_id: 'g1', outcome: 'ok' });
    expect(() => runtime.heartbeat({ note: 'pendant gate' })).toThrow(/gate est ouvert/);
    runtime.gateResumed({ gate_event_id: gate.gate_event_id });
    runtime.heartbeat({ note: 'après resume' });
  });

  it('un nouveau run_start après run_finished ouvre un nouveau run distinct', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const runA = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.runFinished({ status: 'success' });
    const runAEventsBefore = readEvents(projectRoot, runA.run_id);

    const runB = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    expect(runB.run_id).not.toBe(runA.run_id);
    const runBEvents = readEvents(projectRoot, runB.run_id);
    expect(runBEvents).toHaveLength(1);
    expect(runBEvents[0]).toMatchObject({ seq: 1, type: 'run.started' });

    expect(readEvents(projectRoot, runA.run_id)).toEqual(runAEventsBefore);
  });
});

describe('Rubrique D — un seul gate ouvert à la fois', () => {
  it('gate_resumed sans gate ouvert est une erreur, rien n’est écrit', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    const before = readEvents(projectRoot, started.run_id);

    expect(() => runtime.gateResumed({ gate_event_id: 'nope' })).toThrow();
    expect(readEvents(projectRoot, started.run_id)).toEqual(before);
  });

  it('double gate_reached sans gate_resumed intermédiaire est une erreur', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    const before = readEvents(projectRoot, started.run_id);

    expect(() => runtime.gateReached({ gate_id: 'gate-2', outcome: 'ok' })).toThrow();

    const after = readEvents(projectRoot, started.run_id);
    expect(after).toEqual(before);
    expect(after.filter((e) => e.type === 'gate.reached')).toHaveLength(1);
  });
});

describe('Rubrique E — upgrade_ok (intégration runtime)', () => {
  it('est vrai sur arbre propre sans worktree en vol, sans veto', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(true);
  });

  it('est faux sur arbre sale', () => {
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(false);
  });

  it('0085 — reste vrai malgré un worktree de TRAVAIL hors dossier dédié (population redéfinie)', () => {
    extraWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-runtime-wt-'));
    fs.rmdirSync(extraWorktree);
    execFileSync('git', ['worktree', 'add', extraWorktree, '-b', 'wt-branch'], { cwd: projectRoot });

    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(true);
  });

  it('0085 — est faux quand un sous-run est en vol dans le dossier dédié (.cop1/worktrees)', () => {
    fs.mkdirSync(path.join(projectRoot, '.cop1', 'worktrees', 'run-abc'), { recursive: true });

    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(false);
  });

  it('le veto de l’appelant force upgrade_ok à faux même sur arbre propre', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok', upgrade_ok_veto: true });
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(false);
  });

  it('l’appelant ne peut jamais forcer upgrade_ok à true sur arbre sale', () => {
    fs.writeFileSync(path.join(projectRoot, 'dirty.txt'), 'oops');
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    // Tentative d'injection de upgrade_ok: true dans le payload — ignorée par construction
    // (gateReached ne lit jamais ce champ depuis l'appelant).
    runtime.gateReached({
      gate_id: 'gate-1',
      outcome: 'ok',
      ...({ upgrade_ok: true } as Record<string, unknown>),
    } as Parameters<SupervisionRuntime['gateReached']>[0]);
    const events = readEvents(projectRoot, started.run_id);
    expect((events[1] as { payload: { upgrade_ok: boolean } }).payload.upgrade_ok).toBe(false);
  });
});

describe('Rubrique F — rapport et confinement de report_ref', () => {
  it('écrit le rapport markdown fourni sous le dossier du run avec le contenu exact', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok', report_markdown: '## Rapport' });

    const events = readEvents(projectRoot, started.run_id);
    const reportRef = (events[1] as { payload: { report_ref: string } }).payload.report_ref;
    expect(path.isAbsolute(reportRef)).toBe(false);
    const abs = path.join(projectRoot, reportRef);
    expect(fs.readFileSync(abs, 'utf8')).toBe('## Rapport');
    const runDirReal = fs.realpathSync(
      path.join(projectRoot, '.supervision', 'runs', started.run_id),
    );
    expect(fs.realpathSync(abs).startsWith(runDirReal + path.sep)).toBe(true);
  });

  it('gate_reached sans rapport ne référence aucun report_ref et ne crée aucun fichier', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    runtime.gateReached({ gate_id: 'gate-1', outcome: 'attention' });

    const events = readEvents(projectRoot, started.run_id);
    const payload = (events[1] as { payload: Record<string, unknown> }).payload;
    expect(payload.report_ref).toBeUndefined();

    const runDir = path.join(projectRoot, '.supervision', 'runs', started.run_id);
    const filesInRunDir = fs.readdirSync(runDir);
    expect(filesInRunDir).toEqual(['events.jsonl']);
  });
});

describe('Rubrique G — persistance et redémarrage', () => {
  it('un 2e objet SupervisionRuntime relit le seq depuis le disque (pas de mémoire en interne)', () => {
    const first = new SupervisionRuntime(projectRoot);
    const started = first.runStart({ method_name: 'm', method_version: '1.0.0' });
    const reached = first.gateReached({ gate_id: 'gate-1', outcome: 'ok' });
    first.gateResumed({ gate_event_id: reached.gate_event_id });
    const before = readEvents(projectRoot, started.run_id);
    expect(before.map((e) => e.seq)).toEqual([1, 2, 3]);

    // Nouvel objet — preuve que l'état vient du disque, pas d'un attribut en mémoire.
    const restarted = new SupervisionRuntime(projectRoot);
    const reached2 = restarted.gateReached({ gate_id: 'gate-2', outcome: 'ok' });

    const after = readEvents(projectRoot, started.run_id);
    expect(after).toHaveLength(4);
    expect(after[3]).toMatchObject({ seq: 4, type: 'gate.reached' });
    expect(after.slice(0, 3)).toEqual(before);
    expect(reached2.gate_event_id).toBeTruthy();
  });

  it('le redémarrage relit le run_id et le gate ouvert : gate_resumed cohérent, aucun doublon', () => {
    const first = new SupervisionRuntime(projectRoot);
    const started = first.runStart({ method_name: 'm', method_version: '1.0.0' });
    const reached = first.gateReached({ gate_id: 'gate-1', outcome: 'ok' });

    const restarted = new SupervisionRuntime(projectRoot);
    const resumed = restarted.gateResumed({ gate_event_id: reached.gate_event_id });
    expect(resumed).toBeTruthy();

    const events = readEvents(projectRoot, started.run_id);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.type)).toEqual(['run.started', 'gate.reached', 'gate.resumed']);
    expect((events[2] as { payload: { gate_event_id: string } }).payload.gate_event_id).toBe(
      reached.gate_event_id,
    );
  });
});

describe('Rubrique I — robustesse/hostilité (revue NO-GO)', () => {
  it('B1 — gate_id hostile (traversal + symlink) est rejeté AVANT toute écriture, la victime hors projet reste intacte', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    runtime.runStart({ method_name: 'm', method_version: '1.0.0' });

    // Une "victime" hors du project_root, visée via un symlink placé là où l'attaquant
    // espère faire atterrir le rapport en sortant du dossier du run par traversal.
    const victimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-victim-'));
    const victimFile = path.join(victimDir, 'victim.txt');
    fs.writeFileSync(victimFile, 'contenu original intact');
    const linkPath = path.join(victimDir, 'link');
    fs.symlinkSync(victimFile, linkPath);

    try {
      expect(() =>
        runtime.gateReached({
          gate_id: `../../../../../../..${linkPath}`,
          outcome: 'ok',
          report_markdown: 'contenu attaquant',
        }),
      ).toThrow(/gate_id/i);

      expect(fs.readFileSync(victimFile, 'utf8')).toBe('contenu original intact');
    } finally {
      fs.rmSync(victimDir, { recursive: true, force: true });
    }
  });

  it('N4 — gate_id contenant un "/" est une erreur de validation explicite, pas un ENOENT', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });

    expect(() => runtime.gateReached({ gate_id: 'sub/dir', outcome: 'ok' })).toThrow(/gate_id/i);
    expect(readEvents(projectRoot, started.run_id)).toHaveLength(1);
  });

  it('M1 — une dernière ligne de journal tronquée n’est jamais fatale : ignorée, le run reste utilisable', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    const reached = runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' });

    const eventsFile = path.join(projectRoot, '.supervision', 'runs', started.run_id, 'events.jsonl');
    // Simule un crash mid-write : ligne tronquée, JSON invalide, pas de \n final.
    fs.appendFileSync(eventsFile, '{"event_id":"trunc","seq":3,"type":"gate.resu');

    expect(() => runtime.gateResumed({ gate_event_id: reached.gate_event_id })).not.toThrow();

    // Lecture via le lecteur TOLÉRANT (celui que la prod utilise) : la ligne tronquée
    // a été TRONQUÉE du fichier par le prochain append (jamais refermée/ressuscitée,
    // M1-edge) — ce n'est pas ce que teste le helper naïf `readEvents`.
    const events = readJournalEvents(eventsFile);
    expect(events.map((e) => e.type)).toEqual(['run.started', 'gate.reached', 'gate.resumed']);
    expect(events[2]?.seq).toBe(3);
    expect(fs.readFileSync(eventsFile, 'utf8').includes('gate.resu"')).toBe(false);
  });

  it('M1-edge — une ligne complète mais sans \\n final n’est jamais ressuscitée (pas de seq dupliqué, pas de gate fantôme)', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });
    const eventsFile = path.join(projectRoot, '.supervision', 'runs', started.run_id, 'events.jsonl');

    // Simule un crash EXACTEMENT après l'écriture du JSON complet, avant le \n final :
    // readJournalEvents l'ignore (pas de \n), mais le fichier le contient encore tant
    // qu'aucun append n'a eu lieu. Refermer cette ligne par un simple \n (ancien
    // comportement) la ressusciterait avec un seq dupliqué et un gate fantôme.
    const ghostGateReached = {
      event_id: 'ghost-event',
      run_id: started.run_id,
      seq: 2,
      ts: new Date().toISOString(),
      contract: CONTRACT_URI,
      type: 'gate.reached',
      payload: { gate_id: 'ghost-gate', outcome: 'ok', upgrade_ok: true },
    };
    fs.appendFileSync(eventsFile, JSON.stringify(ghostGateReached)); // pas de \n final

    // Un gate_reached suivant doit être accepté (aucun gate fantôme ouvert détecté).
    const reached = runtime.gateReached({ gate_id: 'gate-real', outcome: 'ok' });
    expect(reached.gate_event_id).toBeTruthy();

    const events = readJournalEvents(eventsFile);
    expect(events.map((e) => e.seq)).toEqual([1, 2]);
    expect(events[1]).toMatchObject({ type: 'gate.reached', payload: { gate_id: 'gate-real' } });

    // La ligne fantôme a bien disparu du fichier — aucun doublon de seq physique.
    const raw = fs.readFileSync(eventsFile, 'utf8');
    expect(raw.includes('ghost-gate')).toBe(false);
    expect(raw.match(/"seq":2/g)?.length).toBe(1);
  });
});

describe('Rubrique H — escalade', () => {
  it('une escalade blocked est journalisée sans interrompre le run ni empêcher un gate_reached', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const started = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });

    const escalation = runtime.escalate({
      type: 'blocked',
      detail: 'attente d’une dépendance externe',
    });
    expect(escalation.escalation_id).toBeTruthy();

    // L'escalade ne bloque pas un gate_reached ultérieur.
    expect(() => runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' })).not.toThrow();

    const events = readEvents(projectRoot, started.run_id);
    expect(events.map((e) => e.type)).toEqual(['run.started', 'escalation', 'gate.reached']);
    expect(events[1]).toMatchObject({ payload: { type: 'blocked' } });
  });
});

// ---------------------------------------------------------------------------
// Rubrique I — Registre de supervision (fiche 0082)
// ---------------------------------------------------------------------------

describe('Rubrique I — Registre (fiche 0082)', () => {
  it('runStart sans expectedMethod ne pose pas _method_mismatch dans le payload', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'mega-city', method_version: '1.0.0' });

    const events = readEvents(projectRoot, run_id);
    expect(events[0]).toMatchObject({ type: 'run.started' });
    expect((events[0] as Record<string, unknown>).payload).not.toHaveProperty('_method_mismatch');
  });

  it('runStart avec expectedMethod concordant ne pose pas _method_mismatch', () => {
    const runtime = new SupervisionRuntime(projectRoot, 'mega-city');
    const { run_id } = runtime.runStart({ method_name: 'mega-city', method_version: '1.0.0' });

    const events = readEvents(projectRoot, run_id);
    expect((events[0] as Record<string, unknown>).payload).not.toHaveProperty('_method_mismatch');
  });

  it('runStart avec expectedMethod divergent pose _method_mismatch dans le payload (annotation, pas refus)', () => {
    const runtime = new SupervisionRuntime(projectRoot, 'mega-city');
    // La méthode déclarée est différente de la méthode attendue — doit passer sans erreur
    const { run_id } = runtime.runStart({ method_name: 'bmad', method_version: '1.0.0' });

    const events = readEvents(projectRoot, run_id);
    const payload = (events[0] as Record<string, unknown>).payload as Record<string, unknown>;
    expect(payload._method_mismatch).toEqual({ declared: 'bmad', expected: 'mega-city' });
  });

  it('runStart avec mismatch : le run démarre quand même, gate_reached fonctionne ensuite', () => {
    const runtime = new SupervisionRuntime(projectRoot, 'mega-city');
    const { run_id } = runtime.runStart({ method_name: 'autre-methode', method_version: '0.0.1' });

    expect(run_id).toBeTruthy();
    // On peut continuer le run normalement (annotation d'audit, jamais un refus)
    expect(() => runtime.gateReached({ gate_id: 'gate-1', outcome: 'ok' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Rubrique J — Run orphelin : abandon, provenance, erreur actionnable (fiche 0168)
// Référence normative : ADR-035-abandon-siege-run-orphelin.md
// ---------------------------------------------------------------------------

describe('Rubrique J — Run orphelin (fiche 0168)', () => {
  // J1 — AC3 : run_finished abandoned sans abandoned_by → payload porte 'method' par défaut
  it('J1 — runFinished abandoned sans abandoned_by → abandoned_by:method dans le payload', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    runtime.runFinished({ status: 'abandoned' });

    const events = readEvents(projectRoot, run_id);
    const finished = events.find((e) => e.type === 'run.finished') as Record<string, unknown> | undefined;
    expect(finished).toBeDefined();
    expect((finished!.payload as Record<string, unknown>).status).toBe('abandoned');
    expect((finished!.payload as Record<string, unknown>).abandoned_by).toBe('method');
  });

  // J2 — AC3 : run_finished abandoned avec abandoned_by:seat → payload porte 'seat'
  it('J2 — runFinished abandoned avec abandoned_by:seat → abandoned_by:seat dans le payload', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    runtime.runFinished({ status: 'abandoned', abandoned_by: 'seat' });

    const events = readEvents(projectRoot, run_id);
    const finished = events.find((e) => e.type === 'run.finished') as Record<string, unknown> | undefined;
    expect(finished).toBeDefined();
    expect((finished!.payload as Record<string, unknown>).abandoned_by).toBe('seat');
  });

  // J3 — AC3 : run_finished success → pas de abandoned_by dans le payload
  it('J3 — runFinished success → pas de champ abandoned_by dans le payload', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    runtime.runFinished({ status: 'success' });

    const events = readEvents(projectRoot, run_id);
    const finished = events.find((e) => e.type === 'run.finished') as Record<string, unknown> | undefined;
    expect(finished).toBeDefined();
    expect((finished!.payload as Record<string, unknown>)).not.toHaveProperty('abandoned_by');
  });

  // J4 — AC4 : run_start refusé porte la méthode, l'âge et la marche à suivre
  it('J4 — runStart refusé porte méthode bloquante, âge du run, et marche à suivre', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });

    let errorMsg = '';
    try {
      runtime.runStart({ method_name: 'autre', method_version: '0.0.1' });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }

    expect(errorMsg).toContain('ezk-sprint');
    expect(errorMsg).toMatch(/min|h|s/); // âge du run
    expect(errorMsg).toMatch(/Moniteur|run_finished|abandonner/i); // marche à suivre
  });

  // J5 — AC4 : journal semi-hostile → dégrade en "date inconnue", ne crashe pas
  it('J5 — runStart sur run semi-hostile (ts illisible) → refuse sans crash, indique date inconnue', () => {
    // Écriture manuelle d'un run avec ts non-ISO
    const runsDir = path.join(projectRoot, '.supervision', 'runs');
    const runId = '2020-01-01T00-00-00-000Z-aaaabbbb';
    const runDir = path.join(runsDir, runId);
    fs.mkdirSync(runDir, { recursive: true });
    const badEvent = JSON.stringify({
      event_id: 'e1',
      run_id: runId,
      seq: 1,
      ts: 'NOT_A_DATE',
      contract: 'cop1/supervisability@0.1',
      type: 'run.started',
      payload: { method: { name: 'ezk-sprint', version: '1.0.0' }, seat: 'pilot' },
    });
    fs.writeFileSync(path.join(runDir, 'events.jsonl'), badEvent + '\n', 'utf8');

    const runtime = new SupervisionRuntime(projectRoot);
    let errorMsg = '';
    let threw = false;
    try {
      runtime.runStart({ method_name: 'autre', method_version: '0.0.1' });
    } catch (e) {
      threw = true;
      errorMsg = e instanceof Error ? e.message : String(e);
    }

    expect(threw).toBe(true);
    expect(errorMsg).toContain('ezk-sprint'); // méthode toujours présente
    expect(errorMsg).toMatch(/inconnue|inconnu/i); // âge/date dégradés
    expect(errorMsg).toMatch(/Moniteur|run_finished|abandonner/i); // marche à suivre toujours présente
  });

  // J6 — D5 : abandonRun refuse si le run ouvert ≠ run attendu
  it('J6 — abandonRun refuse si le run ouvert ne correspond pas au run attendu', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id: runA } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    runtime.runFinished({ status: 'success' });

    const { run_id: runB } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    expect(runB).not.toBe(runA);

    // On tente d'abandonner runA alors que runB est ouvert
    expect(() => runtime.abandonRun(runA)).toThrow();
    // Le journal de runB ne doit pas avoir de run.finished
    const events = readEvents(projectRoot, runB);
    expect(events.map((e) => e.type)).not.toContain('run.finished');
  });

  // J7 — D5 : abandonRun écrit run.finished abandoned seat quand le run correspond
  it('J7 — abandonRun écrit run.finished abandoned_by:seat quand le run attendu correspond', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });

    runtime.abandonRun(run_id);

    const events = readEvents(projectRoot, run_id);
    const finished = events.find((e) => e.type === 'run.finished') as Record<string, unknown> | undefined;
    expect(finished).toBeDefined();
    expect((finished!.payload as Record<string, unknown>).status).toBe('abandoned');
    expect((finished!.payload as Record<string, unknown>).abandoned_by).toBe('seat');
    // seq strictement croissant
    expect(events.map((e) => e.seq)).toEqual([1, 2]);
  });

  // Codex — check+append sous le même write lock : heartbeat après abandon refuse
  it('J7c — heartbeat refuse après abandon (pas d’append post run.finished)', () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'ezk-sprint', method_version: '1.0.0' });
    runtime.abandonRun(run_id);
    expect(() => runtime.heartbeat({ note: 'trop tard' })).toThrow(/plus ouvert|aucun run ouvert/i);
    const events = readEvents(projectRoot, run_id);
    expect(events.filter((e) => e.type === 'heartbeat')).toHaveLength(0);
    expect(events.filter((e) => e.type === 'run.finished')).toHaveLength(1);
  });

  // J8 — AC5 : aucun run n'est clos automatiquement (pas de TTL)
  it("J8 — un run ouvert reste ouvert sans action externe (pas d'auto-abandon)", () => {
    const runtime = new SupervisionRuntime(projectRoot);
    const { run_id } = runtime.runStart({ method_name: 'm', method_version: '1.0.0' });

    // Attendre un peu et vérifier que le run est toujours ouvert
    const events = readEvents(projectRoot, run_id);
    expect(events.map((e) => e.type)).not.toContain('run.finished');
    // run_start refusé = le run est bien toujours ouvert
    expect(() => runtime.runStart({ method_name: 'm', method_version: '1.0.0' })).toThrow();
  });
});
