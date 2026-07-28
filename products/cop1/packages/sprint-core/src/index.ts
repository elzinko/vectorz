// @cop1/sprint-core — Barrel public

// Workflow
export { WorkflowEngine } from './features/workflow/application/WorkflowEngine.js';
export type { WorkflowStep } from './features/workflow/domain/WorkflowStep.js';
export type { WorkflowContext } from './features/workflow/domain/WorkflowContext.js';
export type { StepResult } from './features/workflow/domain/StepResult.js';
export { WorkflowEvent } from './features/workflow/domain/WorkflowEvent.js';
export type { WorkflowEventValue } from './features/workflow/domain/WorkflowEvent.js';

// Agent stubs
export { DevAgentStep } from './features/workflow/infrastructure/steps/DevAgentStep.js';
export { ReviewerAgentStep } from './features/workflow/infrastructure/steps/ReviewerAgentStep.js';
export { QAAgentStep } from './features/workflow/infrastructure/steps/QAAgentStep.js';
/** @deprecated Use PMAgentWorkflowStep instead */
export { PMAgentStep } from './features/workflow/infrastructure/steps/PMAgentStep.js';

// Story Status Tracker
export { StoryStatusTracker } from './features/story-tracker/application/StoryStatusTracker.js';
export { StoryStatus } from './features/story-tracker/domain/StoryStatus.js';
export type { StoryStatusValue } from './features/story-tracker/domain/StoryStatus.js';
export { InvalidTransitionError } from './features/story-tracker/domain/errors/InvalidTransitionError.js';
export { YamlStatusStore } from './features/story-tracker/infrastructure/YamlStatusStore.js';
// EA12-S4 (A6 pivot): legacy sprint-status readers removed in epoch 2 (E4).
export { InMemoryStatusReader } from './features/story-tracker/infrastructure/InMemoryStatusReader.js';

// Snapshot
export { SnapshotService } from './features/story-snapshot/application/SnapshotService.js';

// Enrichment
export { EnrichmentService } from './features/story-enrichment/application/EnrichmentService.js';

// Checkpoint
export { CheckpointService } from './features/checkpoint/application/CheckpointService.js';
export type { CheckpointState } from './features/checkpoint/domain/CheckpointState.js';
export { CheckpointPhase } from './features/checkpoint/domain/CheckpointState.js';

// Sprint Session
export { SprintSessionService } from './features/sprint-session/application/SprintSessionService.js';
export { parseDuration } from './features/sprint-session/domain/SprintSession.js';
export type { SprintSessionData } from './features/sprint-session/domain/SprintSession.js';

// QA Agent
export { QAAgent } from './features/qa-agent/application/QAAgent.js';

// DevAgent
export { DevAgent } from './features/dev-agent/application/DevAgent.js';
export type { CodeGeneratorPort } from './features/dev-agent/domain/ports/CodeGeneratorPort.js';
export { WorktreeManager } from './features/dev-agent/infrastructure/WorktreeManager.js';
export {
  buildDevPrompt,
  extractMarkdownSection,
  parseLLMResponse,
} from './features/dev-agent/domain/DevPromptTemplate.js';
export type { FileOperation } from './features/dev-agent/domain/DevPromptTemplate.js';

// StoryFileLock
export { StoryFileLockService } from './features/story-lock/application/StoryFileLockService.js';
export { LockConflictError } from './features/story-lock/domain/StoryFileLock.js';
export type { LockInfo } from './features/story-lock/domain/StoryFileLock.js';

// Blocage
export { BlockageService } from './features/blocage/application/BlockageService.js';
export { EscaladeService } from './features/blocage/application/EscaladeService.js';
export { BlocageType, BlocageStatus, BlocageEvent } from './features/blocage/domain/Blocage.js';
export type {
  BlocageData,
  BlocageTypeValue,
  BlocageStatusValue,
} from './features/blocage/domain/Blocage.js';

// ReviewerAgent
export { ReviewerAgent } from './features/reviewer-agent/application/ReviewerAgent.js';
export { MaxRejectionsError } from './features/reviewer-agent/domain/ReviewResult.js';
export type { ReviewResult } from './features/reviewer-agent/domain/ReviewResult.js';
export type { ReviewerPort } from './features/reviewer-agent/domain/ports/ReviewerPort.js';

// Merge
export { MergeService } from './features/merge/application/MergeService.js';
export type { MergeProposal } from './features/merge/domain/MergeProposal.js';

// Time Estimator
export { TimeEstimator } from './features/time-estimator/application/TimeEstimator.js';

// Sprint Dashboard
export { SprintDashboardService } from './features/sprint-dashboard/application/SprintDashboardService.js';
export type {
  StoryCard,
  SprintMetrics,
} from './features/sprint-dashboard/domain/SprintDashboardTypes.js';

// Burndown — removed EA12-S7 (A7 pivot — aspirational feature, zero consumer).

// DoR Validator
export { DORValidator } from './features/dor-validator/application/DORValidator.js';
export type {
  DORValidationResult,
  DimensionResult,
} from './features/dor-validator/domain/DORResult.js';

// INVEST Validator
export { INVESTValidator } from './features/invest-validator/application/INVESTValidator.js';

// PM Agent
export { PMAgent } from './features/pm-agent/application/PMAgent.js';
export { PMAgentWorkflowStep } from './features/pm-agent/application/PMAgentWorkflowStep.js';
export type { BacklogPort, BacklogStory } from './features/pm-agent/domain/ports/BacklogPort.js';

// WSJF
export { WSJFService } from './features/wsjf/application/WSJFService.js';

// Backlog Monitor
export { BacklogMonitor } from './features/backlog-monitor/application/BacklogMonitor.js';

// Sprint End Report
export { SprintEndReportService } from './features/sprint-end-report/application/SprintEndReportService.js';

// iamthelaw
export { IamTheLawLoader } from './features/iamthelaw/application/IamTheLawLoader.js';
export type { HistoryEntry } from './features/iamthelaw/application/IamTheLawLoader.js';
export { SidecarSyncService } from './features/iamthelaw/application/SidecarSyncService.js';
export { SidecarSyncListener } from './features/iamthelaw/application/SidecarSyncListener.js';
export { FileSidecarAdapter } from './features/iamthelaw/infrastructure/FileSidecarAdapter.js';
export type { Rule, RuleSet } from './features/iamthelaw/domain/RuleSet.js';
export {
  assembleRuleEnforcement,
  flattenRules,
  formatAdvisory,
} from './features/iamthelaw/domain/RuleEnforcement.js';
export type { RuleEnforcement } from './features/iamthelaw/domain/RuleEnforcement.js';
export type { RuleLoaderPort } from './features/iamthelaw/domain/ports/RuleLoaderPort.js';
export type { SidecarSyncPort } from './features/iamthelaw/domain/ports/SidecarSyncPort.js';

// DoD Validator
export { DoDService } from './features/dod-validator/application/DoDService.js';
export type {
  DoDEvaluation,
  DoDFailure,
} from './features/dod-validator/application/DoDService.js';
export type {
  DoDCheck,
  DoDCheckRegistry,
  DoDCheckResult,
  DoDContext,
} from './features/dod-validator/domain/DoDCheck.js';
export { DoDLimiter } from './features/dod-validator/application/DoDLimiter.js';

// Iteration Limiter
export {
  IterationLimiter,
  MaxIterationsError as MaxIterationsReachedError,
} from './features/iteration-limiter/application/IterationLimiter.js';

// Conflict Planner
export { SprintPlannerService } from './features/conflict-planner/application/SprintPlannerService.js';

// PM Decision
export { PMDecisionService } from './features/pm-decision/application/PMDecisionService.js';

// Rule Proposal
export { RuleProposalService } from './features/rule-proposal/application/RuleProposalService.js';
export type {
  RuleProposalRecord,
  RuleProposalSubmission,
  RuleProposalStatus,
} from './features/rule-proposal/domain/RuleProposalTypes.js';
export { VALID_RULE_PROPOSAL_STATUSES } from './features/rule-proposal/domain/RuleProposalTypes.js';

// Quality Binding
export { QualityBindingService } from './features/quality-binding/application/QualityBindingService.js';

// Auto-Rule Suggestions
export { AutoRuleSuggestionService } from './features/auto-rule-suggestion/application/AutoRuleSuggestionService.js';

// sprint-journal feature removed by EA11-S8 (SCP 2026-04-11 §4 addendum — dead code)

// KPIs Dashboard — removed EA12-S7 (A7 pivot — zero functional consumer, barrel-only).
// Velocity Projector — removed EA12-S7 (A7 pivot — aspirational, V1.2 backlog if reintroduced).

// Agent Self-Assessment
export { AgentSelfAssessmentService } from './features/agent-self-assessment/application/AgentSelfAssessmentService.js';

// Improvement Persistence
export { ImprovementPersistenceService } from './features/improvement-persistence/application/ImprovementPersistenceService.js';

// Improvement Review
export { ImprovementReviewService } from './features/improvement-review/application/ImprovementReviewService.js';

// Rule Auto-Apply
export { RuleAutoApplyService } from './features/rule-auto-apply/application/RuleAutoApplyService.js';

export { WorktreeService } from './features/dev-agent/application/WorktreeService.js';
export type { WorktreePort } from './features/dev-agent/domain/ports/WorktreePort.js';
export { StepByStepController } from './features/workflow/application/StepByStepController.js';
export type { ApprovalResolver } from './features/workflow/application/StepByStepController.js';
export type {
  StepByStepMode,
  StepByStepPort,
} from './features/workflow/domain/ports/StepByStepPort.js';
// Budget — domaine seul (le service et le store dormants ont été supprimés, fiche 0036 / ADR-017)
export type { BudgetStatus } from './features/budget/domain/BudgetStatus.js';
export type { TokenConsumption } from './features/budget/domain/TokenConsumption.js';
export type {
  BudgetStorePort,
  BudgetData,
} from './features/budget/domain/ports/BudgetStorePort.js';
