import type { TokensSummary } from './types.js';

export interface UsageEvent {
  ts: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}

function sumTokens(
  events: readonly UsageEvent[],
): { inputTokens: number; outputTokens: number; totalTokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const e of events) {
    inputTokens += e.inputTokens;
    outputTokens += e.outputTokens;
  }
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
}

/**
 * Tokens au grain sprint, best-effort : fenêtrage des `message.usage` entre les
 * frontières du sprint (bornes incluses). Si la fenêtre est VIDE (décalage
 * d'horloge, session à cheval sur deux sprints, etc.), repli HONNÊTE au grain
 * session : somme de TOUS les événements fournis (le run entier), étiqueté
 * `grain: 'session'` avec une note expliquant le repli — jamais un total sprint
 * silencieusement faux.
 */
export function attributeTokens(
  events: readonly UsageEvent[],
  window: { startTs: string; endTs: string },
): TokensSummary {
  const inWindow = events.filter((e) => e.ts >= window.startTs && e.ts <= window.endTs);
  if (inWindow.length > 0) {
    return { grain: 'sprint', ...sumTokens(inWindow) };
  }
  return {
    grain: 'session',
    ...sumTokens(events),
    note: 'fenêtrage sprint vide (aucun message.usage dans la fenêtre) — repli au grain session (total du run).',
  };
}
