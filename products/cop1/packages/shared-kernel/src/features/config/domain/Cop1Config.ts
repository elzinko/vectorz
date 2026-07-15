export interface BudgetConfig {
  sprint_max_tokens: number;
  alert_thresholds: number[];
  auto_pause: boolean;
}

export interface Cop1Config {
  project: {
    name: string;
    path: string;
  };
  daemon: {
    port: number;
  };
  sprint: {
    default_duration_hours: number;
  };
  resources: {
    ram_budget_night_gb: number;
    ram_budget_day_gb: number;
    suspension_threshold_percent: number;
    polling_interval_ms: number;
  };
  llm_routing: Record<string, string>;
  llm_fallback: Record<string, string>;
  /**
   * fiche 0023 (ADR-015) — model-tiering policy (Claude SDK aliases), overridable
   * from cop1.config.yaml. Absent → code default (DEFAULT_MODEL_TIER_CONFIG).
   */
  model_tiering?: {
    rules: { match: string; tier: 'opus' | 'sonnet' | 'haiku' }[];
    fallback: 'opus' | 'sonnet' | 'haiku';
  };
  git: {
    auto_merge: boolean;
  };
  workflow: {
    /**
     * @deprecated Since 2026-04-14 (EA11-S2). Setting `useBMAD=false` selects the legacy
     * stub pipeline (`DevAgentStep` / `ReviewerAgentStep` / `QAAgentStep` / `PMAgentStep`)
     * kept as a safety-net fallback. The BMAD path (`useBMAD=true`, default) is the
     * supported route. This flag is scheduled for removal once EA10 Supervisor
     * Orchestrator (EA10-S9 integration test) is proven in production.
     */
    useBMAD: boolean;
  };
  blocage_rules: Record<string, string>;
  schedule: {
    auto_start: string[];
  };
  budget: BudgetConfig;
  /**
   * fiche 0031 (ADR-028) — lecteur de journal .supervision/runs/, mode
   * moniteur. Optionnel (même convention que `model_tiering`) : les literaux
   * `Cop1Config` construits à la main ailleurs dans le repo n'ont pas à le
   * fournir. Absent ⇒ code default (watch_roots=[], presumed_dead_after_min=5).
   */
  supervision?: {
    watch_roots: string[];
    presumed_dead_after_min: number;
  };
}
