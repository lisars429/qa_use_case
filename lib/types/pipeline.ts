// ============================================================================
// Pipeline Type Definitions
// Complete TypeScript types for all 7 stages of the QA pipeline
// ============================================================================

// ============================================================================
// Stage 1: Testability Analysis
// ============================================================================

export interface UserStoryInput {
  user_story: string
  detailed_description?: string
  acceptance_criteria?: string
}

export interface TestabilityChecklistItem {
  dimension: string
  status: 'Pass' | 'Fail' | 'Unclear'
  reason: string
}

export interface TestabilityInsight {
  explicitly_stated_behaviors: string[]
  testability_checklist: TestabilityChecklistItem[]
  assumptions_required: string[]
  clarification_questions: string[]
  testability_status: 'Likely Test-Ready' | 'Blocked – Needs Clarification'
  status_reason: string
  raw_llm_response?: string
}

// ============================================================================
// Stage 2: Rule Grounding & Completeness
// ============================================================================

export interface RuleGroundingInput {
  user_story: string
  detailed_description?: string
  acceptance_criteria?: string
  stage_1_behaviors?: string[]
}

export interface CompletenessEvaluation {
  category: string
  status: 'Present' | 'Missing' | 'Unclear'
  explanation: string
}

export interface RuleAuditResult {
  explicit_rules: string[]
  completeness_evaluation: CompletenessEvaluation[]
  rule_gaps: string[]
  rule_conflicts: string[]
  clarification_questions: string[]
  rule_status: 'Likely Rule-Complete' | 'Blocked – Rule Gaps Identified'
  status_reason: string
  raw_llm_response?: string
}

export interface RequirementRefinementInput {
  user_story: string
  detailed_description?: string
  acceptance_criteria?: string
  clarifications: Array<{
    question: string
    answer: string
  }>
}

export interface RequirementRefinementResult {
  updated_user_story: string
  updated_acceptance_criteria: string
  updated_detailed_description: string
  change_summary: string
  raw_llm_response?: string
}

// ============================================================================
// Stage 3: Ambiguity Classification
// ============================================================================

export interface AmbiguityClassificationInput {
  user_story: string
  detailed_description?: string
  acceptance_criteria?: string
  clarification_questions: string[]
}

export type AmbiguityType =
  | 'Missing requirement'
  | 'Undefined rule'
  | 'Unclear scope'
  | 'Undefined actor/role'
  | 'Ambiguous outcome'
  | 'Missing exception handling'

export type TestingImpact = 'Blocked' | 'Partially blocked'

export type ResolutionOwner = 'Product' | 'Business' | 'Compliance' | 'Tech'

export interface ClarificationItem {
  question: string
  ambiguity_type: AmbiguityType
  testing_impact: TestingImpact
  resolution_owner: ResolutionOwner
  mandatory: boolean
  resolution_answer?: string
}

export interface AmbiguityClassification {
  clarification_items: ClarificationItem[]
  raw_llm_response?: string
}

// ============================================================================
// Stage 4: Test Case Generation
// ============================================================================

export interface TestCaseGenerationInput {
  user_story: string
  explicit_rules: string[]
  explicit_behaviors?: string[]
  resolved_clarifications?: string
  enriched_context?: string
}

export type TestType = 'Happy Path' | 'Validation' | 'Negative'
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface TestCase {
  test_id: string
  name: string
  description: string
  test_type: TestType
  preconditions: string[]
  steps: string[]
  expected_result: string
  priority: Priority
  status?: 'draft' | 'active' | 'deprecated'
  automationLevel?: number
}

export interface TestScenarios {
  test_cases: TestCase[]
  summary: string
  raw_llm_response?: string
}

// ============================================================================
// Stage 5: DOM Mapping
// ============================================================================

export interface DOMMappingInput {
  url: string
  test_case_ids?: string[]
}

export interface DOMElement {
  id: string
  tag: string
  selector: string
  text_content: string
  attributes: Record<string, string>
  xpath?: string
}

export interface DOMMappingResult {
  url: string
  elements: DOMElement[]
  timestamp: string
}

// ============================================================================
// Stage 6: Playwright Script Generation
// ============================================================================

export interface PlaywrightGenerationInput {
  user_story: string
  test_cases: TestCase[]
  dom_elements: any[]
  explicit_rules: string[]
  base_url?: string
}

export interface PlaywrightTest {
  test_id: string
  test_name: string
  code: string
  imports: string[]
  description: string
}

export interface PlaywrightScripts {
  scripts: PlaywrightTest[]
  setup_instructions: string[]
  summary?: string
  raw_llm_response?: string
}

// ============================================================================
// Stage 7: Test Execution
// ============================================================================

export interface ExecuteTestsInput {
  scripts: PlaywrightTest[]
  base_url?: string
}

export type TestStatus = 'passed' | 'failed' | 'error' | 'timeout' | 'pending' | 'skipped'

export interface TestExecutionResult {
  test_id: string
  status: TestStatus
  output: string
  error: string
  duration_ms: number
}

export interface ExecutionResults {
  total_tests: number
  passed: number
  failed: number
  errors: number
  timeouts: number
  pass_rate: number
  test_results: TestExecutionResult[]
}

export interface UserStory {
  id: string
  title: string
  description: string
  completeness: number
  status: 'locked' | 'in-progress' | 'ready' | 'blocked'
  dependencies: number
  testCases: number
  testScripts: number
}

// ============================================================================
// Global Pipeline State
// ============================================================================

export interface PipelineState {
  currentStage: number
  enrichedContext: string
  iterationCount: number

  // Stage results
  stage1Result: TestabilityInsight | null
  stage2Result: RuleAuditResult | null
  stage3Result: AmbiguityClassification | null
  stage4Result: TestScenarios | null
  stage5Result: DOMMappingResult | null
  stage6Result: PlaywrightScripts | null
  stage7Result: ExecutionResults | null

  // User inputs
  userStory: string
  detailedDescription: string
  acceptanceCriteria: string

  // Flags
  testCasesConfirmed: boolean
  autoGeneratePlaywright: boolean
  regenerationMode: boolean
  selectedDOMElements: DOMElement[]
}

// ============================================================================
// Shared Types
// ============================================================================

export type StageStatus = 'completed' | 'current' | 'pending' | 'blocked'

export interface StageInfo {
  id: number
  name: string
  emoji: string
  status: StageStatus
  description: string
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  version: string
  timestamp: string
}
