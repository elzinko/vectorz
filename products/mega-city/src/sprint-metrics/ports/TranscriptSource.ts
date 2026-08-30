/** Port (DIP) : lecture des `message.usage` (tokens) des transcripts Claude Code. */

export interface UsageEvent {
  ts: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface TranscriptSourceOptions {
  /** Override du dossier `~/.claude/projects` (tests). */
  claudeProjectsDir?: string;
  /** Fichier transcript explicite (tests / `--transcript`), contourne la résolution par slug. */
  transcript?: string;
}

export interface TranscriptSource {
  listUsageEvents(projectRoot: string, options?: TranscriptSourceOptions): UsageEvent[];
}
