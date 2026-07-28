import { exitWithEpoch2MethodHint } from '../epoch2-method.js';

export interface TranscriptOptions {
  out?: string;
}

/** @deprecated Removed in epoch 2 (E4). BMAD session transcripts were pilot-only. */
export async function transcriptCommand(
  _sessionId: string,
  _options: TranscriptOptions = {},
): Promise<void> {
  exitWithEpoch2MethodHint('transcript');
}
