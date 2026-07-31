import type { Options, SDKMessage } from '@anthropic-ai/claude-agent-sdk';

export type ClaudeAvailability = 'ok' | 'degraded' | 'unavailable';

export interface AuthCheckResult {
  readonly ok: boolean;
  readonly model: string | null;
  readonly error?: string;
  readonly availability: ClaudeAvailability;
}

/** Injectable query function matching the SDK `query()` shape — overridden in tests. */
export type AuthQueryFn = (params: {
  prompt: string;
  options?: Options;
}) => AsyncIterable<SDKMessage>;

const TRANSIENT_PATTERNS = [
  /\b429\b/,
  /rate.?limit/i,
  /\b5(?:00|02|03|04|29)\b/,
  /service.?unavailable/i,
  /overloaded/i,
  /temporarily unavailable/i,
  /timed?\s*out/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /socket hang up/i,
  /exited with code (?:130|137|139|134|143)\b/,
];

function isTransientError(errorOutput: string): boolean {
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(errorOutput));
}

function availabilityFor(ok: boolean, error?: string): ClaudeAvailability {
  if (ok) return 'ok';
  return error && isTransientError(error) ? 'degraded' : 'unavailable';
}

const MAX_ERROR_LEN = 200;

export function sanitizeError(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  const redacted = collapsed.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted]');
  return redacted.length > MAX_ERROR_LEN ? `${redacted.slice(0, MAX_ERROR_LEN)}…` : redacted;
}

export async function checkAuth(queryFn?: AuthQueryFn): Promise<AuthCheckResult> {
  let model: string | null = null;
  try {
    const query =
      queryFn ?? ((await import('@anthropic-ai/claude-agent-sdk')).query as unknown as AuthQueryFn);
    const iterable = query({
      prompt: 'respond ok',
      options: {
        maxTurns: 1,
        allowedTools: [],
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        settingSources: [],
        canUseTool: async (toolName: string) => ({
          behavior: 'deny' as const,
          message: `auth probe is tool-less (blocked ${toolName})`,
        }),
      },
    });
    for await (const message of iterable) {
      if (message.type === 'system' && message.subtype === 'init') {
        model = message.model;
      }
      if (message.type === 'result') {
        if (message.subtype === 'success') {
          return { ok: true, model, availability: 'ok' };
        }
        const error = `auth check ended: ${message.subtype}`;
        return {
          ok: false,
          model,
          error: sanitizeError(error),
          availability: availabilityFor(false, error),
        };
      }
    }
    const error = 'no result message from auth check';
    return {
      ok: false,
      model,
      error: sanitizeError(error),
      availability: availabilityFor(false, error),
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      model: null,
      error: sanitizeError(error),
      availability: availabilityFor(false, error),
    };
  }
}
