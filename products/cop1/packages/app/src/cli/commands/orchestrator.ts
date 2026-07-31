import { exitWithEpoch2MethodHint } from '../epoch2-method.js';

export interface OrchestratorRunCliOptions {
  playbook?: string;
  epic: string;
  stepByStep?: boolean;
  abortOnEscalation?: boolean;
  projectRoot?: string;
  runner?: 'default' | 'stub';
}

/** @deprecated Removed in epoch 2 (E4). Use mega-city + Moniteur. */
export async function orchestratorRunCommand(_options: OrchestratorRunCliOptions): Promise<void> {
  exitWithEpoch2MethodHint('orchestrator run');
}
