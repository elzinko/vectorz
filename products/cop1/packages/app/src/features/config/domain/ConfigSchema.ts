import { z } from 'zod';

export const ConfigSchema = z
  .object({
    project: z
      .object({
        name: z.string().min(1),
        path: z.string().min(1),
      })
      .default({ name: 'cop1-project', path: '.' }),
    daemon: z
      .object({
        port: z.number().int().min(1024).max(65535).default(4242),
      })
      .default({ port: 4242 }),
    sprint: z
      .object({
        default_duration_hours: z.number().positive().default(8),
      })
      .default({ default_duration_hours: 8 }),
    resources: z
      .object({
        ram_budget_night_gb: z.number().min(4).default(48),
        ram_budget_day_gb: z.number().min(4).default(20),
        suspension_threshold_percent: z.number().min(50).max(95).default(75),
        polling_interval_ms: z.number().min(500).default(1000),
      })
      .default({
        ram_budget_night_gb: 48,
        ram_budget_day_gb: 20,
        suspension_threshold_percent: 75,
        polling_interval_ms: 1000,
      }),
    llm_routing: z.record(z.string(), z.string()).default({}),
    llm_fallback: z.record(z.string(), z.string()).default({}),
    // fiche 0023 (ADR-015) — model-tiering policy overridable from config, distinct
    // from `llm_routing` (Ollama local). Aliases only (opus/sonnet/haiku); a pinned
    // model id is rejected by the enum. Absent → DEFAULT_MODEL_TIER_CONFIG applies.
    model_tiering: z
      .object({
        rules: z
          .array(
            z.object({
              match: z.string().min(1),
              tier: z.enum(['opus', 'sonnet', 'haiku']),
            }),
          )
          .default([]),
        fallback: z.enum(['opus', 'sonnet', 'haiku']),
      })
      .optional(),
    git: z
      .object({
        auto_merge: z.boolean().default(false),
      })
      .default({ auto_merge: false }),
    workflow: z
      .object({
        /**
         * BMAD pilot path (époque 1). Epoch-2 dogfood = mega-city + moniteur
         * (ADR-028) — ignores this flag. Default `false` : ce repo n'avance plus
         * via BMAD. `true` explicite = pilote legacy / cobaye externe (exige
         * `_bmad*` installé dans le projet cible — inventory 2026-07-28).
         * `false` mappe aussi au pipeline stub EA11-S2 (deprecated).
         */
        useBMAD: z
          .boolean()
          .default(false)
          .describe(
            'BMAD pilot (deprecated). Default false — dogfood = mega-city. Set true only for an external BMAD target.',
          ),
      })
      .default({ useBMAD: false }),
    blocage_rules: z.record(z.string(), z.string()).default({}),
    schedule: z
      .object({
        auto_start: z.array(z.string()).default([]),
      })
      .default({ auto_start: [] }),
    budget: z
      .object({
        sprint_max_tokens: z.number().int().positive(),
        /** fiche 0022 — plafond $ session pour estimer le coût affiché (optionnel). */
        max_usd_per_session: z.number().positive().optional(),
        alert_thresholds: z
          .array(z.number().min(0).max(100))
          .refine((arr) => arr.every((v, i) => i === 0 || v > (arr[i - 1] ?? -1)), {
            message: 'alert_thresholds must be sorted in ascending order with no duplicates',
          }),
        auto_pause: z.boolean(),
      })
      .default({
        sprint_max_tokens: 1_000_000,
        alert_thresholds: [50, 80, 95],
        auto_pause: true,
      }),
    // fiche 0031 (ADR-028) — lecteur de journal .supervision/runs/ en mode
    // moniteur. Dormant par défaut (watch_roots vide) : aucun fs.watch surprise
    // sur le cwd tant que le projet n'a pas explicitement opté in.
    supervision: z
      .object({
        watch_roots: z.array(z.string()).default([]),
        presumed_dead_after_min: z.number().positive().default(5),
        /** ADR-035 D3 : commande CLI d'abandon (défaut [] = capacité dormante). */
        abandon_command: z.array(z.string()).default([]),
        /** fiche 0063 : spawn supervision:link (défaut [] = dormant). */
        link_command: z.array(z.string()).default([]),
        /** fiche 0063 : spawn supervision:registry-add (défaut [] = dormant). */
        registry_add_command: z.array(z.string()).default([]),
        /** fiche 0063 : spawn lawgiver bind (mode méthode seule ; défaut [] = dormant). */
        bind_command: z.array(z.string()).default([]),
      })
      .default({
        watch_roots: [],
        presumed_dead_after_min: 5,
        abandon_command: [],
        link_command: [],
        registry_add_command: [],
        bind_command: [],
      }),
  })
  .refine(
    (data) => {
      const keys = Object.keys(data.llm_routing);
      if (keys.length > 0 && !data.llm_routing.default) {
        return false;
      }
      return true;
    },
    {
      message: 'llm_routing.default is required when llm_routing is configured',
      path: ['llm_routing', 'default'],
    },
  );
