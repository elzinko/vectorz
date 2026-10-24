/** Port (DIP) : lecture des `message.usage` (tokens) des transcripts Claude Code. */

export interface UsageEvent {
  ts: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  /** Jetons de cache lus / créés — captés À PART de l'entrée neuve (fiche 20261017110956989). */
  cacheRead?: number;
  cacheCreation?: number;
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
