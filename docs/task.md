# Multi-Stage QA Pipeline Integration

## Overview
Integrate the 7-stage QA pipeline from `ui_components_guide.md` into the existing Next.js application:
- **Stages 1-3** → User Stories Module
- **Stages 4-5** → Test Cases Module  
- **Stages 6-7** → Test Scripts Module

---

## Phase 1: Foundation & Type Definitions
- [x] Create comprehensive TypeScript type definitions for all 7 stages
- [x] Create mock data generators for all 7 stages (realistic test data)
- [x] Create shared UI components (StatusBadge, MetricCard, ExpandableCard, CodeViewer)
- [x] Set up basic state management (can use local state initially)

## Phase 2: User Stories Module Enhancement (Stages 1-3)
- [x] Add Stage 1: Testability Analysis component
  - [x] UserStoryInput form component
  - [x] TestabilityResults display component
  - [x] API integration for `/api/v1/analyze`
- [x] Add Stage 2: Rule Grounding component
  - [x] RuleGroundingAnalysis component
  - [x] RequirementRefinement component
  - [x] API integration for `/api/v1/rule-grounding` and `/api/v1/refine-requirements`
- [x] Add Stage 3: Ambiguity Classification component
  - [x] AmbiguityClassification component with data table
  - [x] Clarification items management
  - [x] API integration for `/api/v1/ambiguity-classification`
- [x] Integrate stages into existing user-stories.tsx
- [x] Add stage progress tracking per user story

## Phase 3: Test Cases Module Enhancement (Stage 5) ✅
- [x] Move Stage 4 to User Stories Module (Test Case Generation)
- [x] Add Stage 5: DOM Mapping component in Test Cases Module
  - [x] DOMMapper component
  - [x] Element extraction and selection UI
  - [x] Search and filter by tag type
  - [x] Copy selectors (CSS & XPath)
- [x] Make test case rows expandable/clickable
- [x] Show DOM Mapping stage when test case is clicked
- [x] Reorganize components into modular structure (components/modules/test-cases/pipeline/)

## Phase 4: Test Scripts Module Enhancement (Stages 6-7) ✅
- [x] Add Stage 6: Playwright Script Generation component
  - [x] PlaywrightScriptGenerator component
  - [x] Code viewer with syntax highlighting
  - [x] Download and export functionality
  - [x] API integration for `/api/v1/generate-playwright`
- [x] Add Stage 7: Test Execution component
  - [x] TestExecutor component
  - [x] Real-time execution progress display
  - [x] Execution results display with statistics
  - [x] Rerun failed tests functionality
  - [x] API integration for `/api/v1/execute-tests`
- [x] Create pipeline container for Stages 6-7
- [x] Integrate into test-scripts.tsx with launch button
- [x] Reorganize components into modular structure (components/modules/test-scripts/pipeline/)

## Phase 5: Integration & Polish (In Progress)
- [x] Add workflow visualization showing all 7 stages
  - [x] Modern horizontal stepper with gradient progress line
  - [x] Animated pulse effects for current stage
  - [x] Dynamic stage tracking in all pipelines
- [x] Implement cross-module navigation and traceability
  - [x] PipelineDataContext for cross-module data sharing
  - [x] User story metadata tracking with test cases
  - [x] Test case to user story linking in Test Cases module
  - [x] User story/test case hierarchy in Test Scripts module
- [x] Test Scripts module redesign
  - [x] Hierarchical view (User Story → Test Case → Script)
  - [x] Animated details panel with slide-in transitions
  - [x] Stagger-animated metrics cards
  - [x] Search functionality across hierarchy
  - [x] Code viewer with syntax highlighting
  - [x] Execution results display
- [/] Add error handling and loading states
  - [x] Error display in execution results
  - [x] Empty states for all modules
  - [ ] Error boundaries for component failures
  - [ ] Retry mechanisms for failed API calls
- [x] Implement data persistence and state management
  - [x] PipelineDataContext with React Context API
  - [x] Generated test cases persistence
  - [x] Generated scripts persistence
  - [x] User story metadata persistence
  - [ ] LocalStorage persistence (optional)
- [x] Add responsive design improvements
  - [x] Split-panel layouts
  - [x] Scrollable containers
  - [x] Mobile-friendly workflow visualization
- [ ] Test all API integrations end-to-end
  - [ ] Complete pipeline flow testing
  - [ ] Data flow verification across all 7 stages

## Phase 6: Backend Integration (Future)
- [ ] Set up environment variables (.env.local)
- [ ] Toggle USE_MOCK_DATA to false in API client
- [ ] Replace mock data with real API calls for all stages
- [ ] Add WebSocket support for Stage 7 real-time execution
- [ ] Add error handling and retry logic
- [ ] Test end-to-end with real backend
- [ ] Add loading states and error messages

## Recent Enhancements (Latest Session)
- [x] Fixed Playwright script generation runtime errors
  - [x] Corrected `result.tests` to `result.scripts`
  - [x] Fixed `setup_instructions` type (string → array)
  - [x] Added missing `summary` property
- [x] Redesigned pipeline progress visualization
  - [x] Modern horizontal stepper with gradients
  - [x] Animated pulse effects
  - [x] Compact, elegant design
- [x] Added dynamic stage tracking
  - [x] Test Scripts pipeline shows Stages 6-7 progress
  - [x] Test Cases pipeline shows Stage 5 progress
  - [x] Progress updates as stages complete
- [x] Test Scripts module complete redesign
  - [x] Hierarchical user story/test case view
  - [x] Animated details panel
  - [x] Metrics with stagger animation
