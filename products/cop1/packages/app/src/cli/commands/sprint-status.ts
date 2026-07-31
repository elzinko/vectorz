import { exitWithEpoch2MethodHint } from '../epoch2-method.js';

/** @deprecated Removed in epoch 2 (E4). Story status lives in features/*.md front-matter. */
export async function sprintStatusCommand(): Promise<void> {
  exitWithEpoch2MethodHint('sprint status');
}
