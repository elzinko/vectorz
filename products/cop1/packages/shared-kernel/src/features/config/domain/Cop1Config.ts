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
     * BMAD **pilot** path (époque 1). Epoch-2 dogfood = mega-city + **moniteur**
     * (ADR-028) — does not use this flag. Default `false`. When `true`,
     * orchestrator requires `_bmad*` in the *target* project (external method /
     * future emitter experiment — fiche 2058), not for advancing this repo.
     *
     * Historical note (EA11-S2): `false` also selected a legacy stub pipeline
     * (Dev/Reviewer/QA/PM steps) — still wired, still deprecated.
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
