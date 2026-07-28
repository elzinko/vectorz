import { exitWithEpoch2MethodHint } from '../epoch2-method.js';

/** @deprecated Removed in epoch 2 (E4). Use ezk-sprint (mega-city). */
export async function sprintRunCommand(_options: {
  dryRun?: boolean;
  filter?: string;
  simulate?: boolean;
}): Promise<void> {
  exitWithEpoch2MethodHint('sprint run');
}
