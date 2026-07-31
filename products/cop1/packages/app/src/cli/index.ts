#!/usr/bin/env node
import { Command, Option } from 'commander';
import { COP1_VERSION } from '../features/daemon/domain/DaemonState.js';
import { healthCommand } from './commands/health.js';
import { initBmadBridgeCommand } from './commands/init-bmad-bridge.js';
import { initCommand } from './commands/init.js';
import { orchestratorRunCommand } from './commands/orchestrator.js';
import { sprintRunCommand } from './commands/sprint-run.js';
import { sprintStatusCommand } from './commands/sprint-status.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';
import { transcriptCommand } from './commands/transcript.js';

const program = new Command();

program.name('cop1').description('Autonomous AI agents team').version(COP1_VERSION);

program
  .command('start')
  .description('Start the cop1 daemon')
  .option(
    '-p, --port <port>',
    'Daemon port (priority: --port > daemon.port from cop1.config.yaml > 4242)',
  )
  .action(startCommand);

program.command('stop').description('Stop the cop1 daemon').action(stopCommand);

program.command('status').description('Check if the daemon is running').action(statusCommand);

program
  .command('health')
  .description('Get daemon health info (JSON)')
  .option('-p, --port <port>', 'Daemon port')
  .action(healthCommand);

program
  .command('init')
  .description('Initialize a project for cop1')
  .argument('<project-path>', 'Path to the target project')
  .option('--project-key <key>', 'Override auto-detected project key')
  .option('--project-name <name>', 'Override auto-detected project name')
  .action(initCommand);

program
  .command('init-bmad-bridge')
  .description(
    'Configure BMAD agents on an external project (2058 / ADR-032 — not vectorz dogfood)',
  )
  .action(initBmadBridgeCommand);

const sprint = program
  .command('sprint')
  .description('Deprecated — use mega-city ezk-sprint (epoch 2)');

sprint
  .command('run')
  .description('Removed in epoch 2 — use ezk-sprint (mega-city)')
  .option('--dry-run', 'List stories without executing')
  .option('--simulate', 'Run in isolated git worktree (no auto-merge)')
  .option('--filter <pattern>', 'Filter stories by ID pattern (e.g., E8-*)')
  .action(sprintRunCommand);

sprint
  .command('status')
  .description('Removed in epoch 2 — story status is features/*.md front-matter')
  .action(sprintStatusCommand);

const orchestrator = program
  .command('orchestrator')
  .description('Removed in epoch 2 — use mega-city + Moniteur');

orchestrator
  .command('run')
  .description('Removed in epoch 2 — BMAD pilot orchestrator')
  .requiredOption('--epic <id>', 'Target epic id (e.g. EA11)')
  .option('--playbook <path>', 'Path to supervisor playbook (default: ./supervisor-playbook.md)')
  .option('--step-by-step', 'Pause between commands for manual approval')
  .option('--abort-on-escalation', 'Stop cleanly when supervisor escalates')
  .option('--project-root <path>', 'Override project root (default: cwd)')
  .addOption(
    new Option('--runner <default|stub>', 'Removed — epoch 1 pilot only')
      .choices(['default', 'stub'])
      .default('default')
      .hideHelp(),
  )
  .action((options: Parameters<typeof orchestratorRunCommand>[0]) =>
    orchestratorRunCommand(options),
  );

program
  .command('transcript <session-id>')
  .description('Removed in epoch 2 — BMAD session transcripts were pilot-only')
  .option('--out <path>', 'Write transcript to a file instead of stdout')
  .action((sessionId: string, options: { out?: string }) => transcriptCommand(sessionId, options));

program.parse();
