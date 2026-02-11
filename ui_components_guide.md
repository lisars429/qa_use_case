# Next.js UI Components Guide for QA Pipeline

## 📋 Overview

This document outlines all the UI components needed to build a Next.js frontend for the **Multi-Stage QA Pipeline** backend. The backend is a FastAPI service that provides a 7-stage sequential workflow for analyzing user stories and generating automated tests.

---

## 🏗️ Architecture Overview

### Backend API Base URL
```
http://localhost:8000
```

### Pipeline Stages
1. **Stage 1**: Testability Analysis
2. **Stage 2**: Rule Grounding & Completeness
3. **Stage 3**: Ambiguity Classification
4. **Stage 4**: Test Case Generation
5. **Stage 5**: DOM Mapping
6. **Stage 6**: Playwright Script Generation
7. **Stage 7**: Test Execution

---

## 🎯 Core Components Needed

### 1. Layout Components

#### `PipelineLayout`
**Purpose**: Main layout wrapper for the entire application

**Features**:
- Responsive sidebar with pipeline status
- Header with service info
- Main content area
- Footer with API health status

**Props**:
```typescript
interface PipelineLayoutProps {
  children: React.ReactNode;
  currentStage: number;
  onReset: () => void;
}
```

---

#### `WorkflowVisualization`
**Purpose**: Visual progress indicator showing all 7 stages

**Features**:
- Horizontal stage cards with icons
- Color-coded status (completed, current, pending)
- Animated pulse effect on current stage
- Arrows between stages
- Responsive scrolling for mobile

**Props**:
```typescript
interface WorkflowVisualizationProps {
  currentStage: number;
  stages: Array<{
    id: number;
    name: string;
    emoji: string;
    status: 'completed' | 'current' | 'pending';
  }>;
}
```

**Styling States**:
- **Completed**: Green background (#d4edda), green border (#28a745)
- **Current**: Yellow background (#fff3cd), yellow border (#ffc107), pulse animation
- **Pending**: Gray background (#e9ecef), gray border (#6c757d), opacity 0.6

---

### 2. Stage 1 Components

#### `UserStoryInput`
**Purpose**: Form for entering user story details

**API Endpoint**: `POST /api/v1/analyze`

**Request Model**:
```typescript
interface UserStoryInput {
  user_story: string;           // Required
  detailed_description?: string; // Optional
  acceptance_criteria?: string;  // Optional
}
```

**Response Model**:
```typescript
interface TestabilityInsight {
  explicitly_stated_behaviors: string[];
  testability_checklist: Array<{
    dimension: string;
    status: 'Pass' | 'Fail' | 'Unclear';
    reason: string;
  }>;
  assumptions_required: string[];
  clarification_questions: string[];
  testability_status: 'Likely Test-Ready' | 'Blocked – Needs Clarification';
  status_reason: string;
  raw_llm_response?: string;
}
```

**UI Elements**:
- Text area for user story (required, placeholder: "As a [role], I want to [action], so that [benefit]")
- Text area for detailed description (optional)
- Text area for acceptance criteria (optional, placeholder: "Given [context], When [action], Then [outcome]")
- Submit button: "🚀 Analyze Stage 1"
- Loading spinner during API call

---

#### `TestabilityResults`
**Purpose**: Display Stage 1 analysis results

**Features**:
- Status badge with icon (✅ for Test-Ready, ⚠️ for Blocked)
- Tabbed interface with 4 sections:
  1. **Behaviors**: Numbered list of explicitly stated behaviors
  2. **Checklist**: Expandable cards for each testability dimension
  3. **Assumptions**: List of required assumptions
  4. **Questions**: Numbered clarification questions

**UI Elements**:
- Status header with color coding
- Tabs component for organizing sections
- Expandable accordion for checklist items
- Download button for JSON export

---

### 3. Stage 2 Components

#### `RuleGroundingAnalysis`
**Purpose**: Display and interact with rule grounding results

**API Endpoint**: `POST /api/v1/rule-grounding`

**Request Model**:
```typescript
interface RuleGroundingInput {
  user_story: string;
  detailed_description?: string;
  acceptance_criteria?: string;
  stage_1_behaviors?: string[]; // From Stage 1 result
}
```

**Response Model**:
```typescript
interface RuleAuditResult {
  explicit_rules: string[];
  completeness_evaluation: Array<{
    category: string;
    status: 'Present' | 'Missing' | 'Unclear';
    explanation: string;
  }>;
  rule_gaps: string[];
  rule_conflicts: string[];
  clarification_questions: string[];
  rule_status: 'Likely Rule-Complete' | 'Blocked – Rule Gaps Identified';
  status_reason: string;
  raw_llm_response?: string;
}
```

**Features**:
- Run Stage 2 button (disabled after completion)
- Status indicator (✅ Rule-Complete or 🚫 Blocked)
- 4 tabbed sections:
  1. **Explicit Rules**: Numbered list
  2. **Completeness**: Table with category, status, explanation
  3. **Gaps & Conflicts**: Lists of identified issues
  4. **Clarifications**: Questions with answer inputs

---

#### `RequirementRefinement`
**Purpose**: Answer clarification questions and refine requirements

**API Endpoint**: `POST /api/v1/refine-requirements`

**Request Model**:
```typescript
interface RequirementRefinementInput {
  user_story: string;
  detailed_description?: string;
  acceptance_criteria?: string;
  clarifications: Array<{
    question: string;
    answer: string;
  }>;
}
```

**Response Model**:
```typescript
interface RequirementRefinementResult {
  updated_user_story: string;
  updated_acceptance_criteria: string;
  updated_detailed_description: string;
  change_summary: string;
  raw_llm_response?: string;
}
```

**UI Elements**:
- Question display with numbering
- Text area for each answer
- "✨ Refine & Re-run Stage 2" button
- Success/error messages
- Iteration counter

---

### 4. Stage 3 Components

#### `AmbiguityClassification`
**Purpose**: Categorize and resolve ambiguities

**API Endpoint**: `POST /api/v1/ambiguity-classification`

**Request Model**:
```typescript
interface AmbiguityClassificationInput {
  user_story: string;
  detailed_description?: string;
  acceptance_criteria?: string;
  clarification_questions: string[]; // From Stage 2
}
```

**Response Model**:
```typescript
interface ClarificationItem {
  question: string;
  ambiguity_type: 
    | 'Missing requirement'
    | 'Undefined rule'
    | 'Unclear scope'
    | 'Undefined actor/role'
    | 'Ambiguous outcome'
    | 'Missing exception handling';
  testing_impact: 'Blocked' | 'Partially blocked';
  resolution_owner: 'Product' | 'Business' | 'Compliance' | 'Tech';
  mandatory: boolean;
  resolution_answer?: string;
}

interface AmbiguityClassification {
  clarification_items: ClarificationItem[];
  raw_llm_response?: string;
}
```

**Features**:
- Summary metrics cards (Total Items, Mandatory, Blocked, Unique Owners)
- Data table with all clarification items
- Grouped view by owner with expandable sections
- Answer input for each item
- "🔄 Update Context & Proceed" button

---

### 5. Stage 4 Components

#### `TestCaseGenerator`
**Purpose**: Generate and display test cases

**API Endpoint**: `POST /api/v1/generate-test-cases`

**Request Model**:
```typescript
interface TestCaseGenerationInput {
  user_story: string;
  explicit_rules: string[]; // From Stage 2
  resolved_clarifications?: string; // Summary from Stage 3
  enriched_context?: string;
}
```

**Response Model**:
```typescript
interface TestCase {
  test_id: string;
  name: string;
  description: string;
  test_type: 'Happy Path' | 'Validation' | 'Negative';
  preconditions: string[];
  steps: string[];
  expected_result: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface TestScenarios {
  test_cases: TestCase[];
  summary: string;
  raw_llm_response?: string;
}
```

**Features**:
- Test case cards with expandable details
- Badges for test type and priority
- Checkbox selection for regeneration
- "Confirm Test Cases" button
- Summary statistics

---

### 6. Stage 5 Components

#### `DOMMapper`
**Purpose**: Extract and map DOM elements

**Features**:
- URL input for target application
- "Extract DOM Elements" button
- Selectable element list with checkboxes
- Element details (tag, selector, text content)
- "Use Selected Elements" button

**UI Elements**:
- URL input field
- Loading state during extraction
- Filterable/searchable element list
- Visual preview of selected elements

---

### 7. Stage 6 Components

#### `PlaywrightScriptGenerator`
**Purpose**: Generate Playwright test scripts

**API Endpoint**: `POST /api/v1/generate-playwright`

**Request Model**:
```typescript
interface PlaywrightGenerationInput {
  user_story: string;
  test_cases: TestCase[]; // From Stage 4
  explicit_rules: string[]; // From Stage 2
  base_url?: string; // Default: "http://localhost:3000"
}
```

**Response Model**:
```typescript
interface PlaywrightTest {
  test_id: string;
  test_name: string;
  code: string; // Complete Playwright Python code
  imports: string[];
  description: string;
}

interface PlaywrightScripts {
  scripts: PlaywrightTest[];
  setup_instructions?: string;
  raw_llm_response?: string;
}
```

**Features**:
- Code viewer with syntax highlighting
- Copy to clipboard button
- Download individual scripts
- Download all scripts as ZIP
- Setup instructions display

---

### 8. Stage 7 Components

#### `TestExecutor`
**Purpose**: Execute tests and display results

**API Endpoint**: `POST /api/v1/execute-tests`  
**WebSocket**: `ws://localhost:8000/ws/execute-tests`

**Request Model**:
```typescript
interface ExecuteTestsInput {
  scripts: PlaywrightTest[]; // From Stage 6
  base_url?: string; // Default: "http://localhost:3000"
}
```

**Response Model**:
```typescript
interface TestExecutionResult {
  test_id: string;
  status: 'passed' | 'failed' | 'error' | 'timeout' | 'pending';
  output: string;
  error: string;
  duration_ms: number;
}

interface ExecutionResults {
  total_tests: number;
  passed: number;
  failed: number;
  errors: number;
  timeouts: number;
  pass_rate: number;
  test_results: TestExecutionResult[];
}
```

**Features**:
- Real-time execution progress (WebSocket)
- Summary metrics (pass rate, total tests)
- Individual test result cards
- Color-coded status badges
- Expandable error details
- Re-run failed tests button

---

## 🎨 Shared UI Components

### `StatusBadge`
**Purpose**: Reusable status indicator

**Props**:
```typescript
interface StatusBadgeProps {
  status: 'completed' | 'current' | 'pending' | 'pass' | 'fail' | 'blocked';
  label: string;
}
```

---

### `MetricCard`
**Purpose**: Display key metrics

**Props**:
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'green' | 'yellow' | 'red' | 'blue';
}
```

---

### `ExpandableCard`
**Purpose**: Collapsible content container

**Props**:
```typescript
interface ExpandableCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}
```

---

### `CodeViewer`
**Purpose**: Syntax-highlighted code display

**Props**:
```typescript
interface CodeViewerProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  onCopy?: () => void;
}
```

---

## 🔄 State Management

### Global State Structure
```typescript
interface PipelineState {
  currentStage: number;
  enrichedContext: string;
  iterationCount: number;
  
  // Stage results
  stage1Result: TestabilityInsight | null;
  stage2Result: RuleAuditResult | null;
  stage3Result: AmbiguityClassification | null;
  stage4Result: TestScenarios | null;
  stage5Result: any | null; // DOM elements
  stage6Result: PlaywrightScripts | null;
  stage7Result: ExecutionResults | null;
  
  // User inputs
  userStory: string;
  detailedDescription: string;
  acceptanceCriteria: string;
  
  // Flags
  testCasesConfirmed: boolean;
  autoGeneratePlaywright: boolean;
  regenerationMode: boolean;
  selectedDOMElements: any[];
}
```

---

## 📡 API Integration Utilities

### `apiClient.ts`
```typescript
const API_BASE = 'http://localhost:8000';

export const api = {
  // Health check
  health: () => fetch(`${API_BASE}/health`).then(r => r.json()),
  
  // Stage 1
  analyzeTestability: (data: UserStoryInput) => 
    fetch(`${API_BASE}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Stage 2
  analyzeRuleGrounding: (data: RuleGroundingInput) =>
    fetch(`${API_BASE}/api/v1/rule-grounding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Stage 3
  classifyAmbiguities: (data: AmbiguityClassificationInput) =>
    fetch(`${API_BASE}/api/v1/ambiguity-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Stage 4
  generateTestCases: (data: TestCaseGenerationInput) =>
    fetch(`${API_BASE}/api/v1/generate-test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Stage 6
  generatePlaywright: (data: PlaywrightGenerationInput) =>
    fetch(`${API_BASE}/api/v1/generate-playwright`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Stage 7
  executeTests: (data: ExecuteTestsInput) =>
    fetch(`${API_BASE}/api/v1/execute-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Refinement
  refineRequirements: (data: RequirementRefinementInput) =>
    fetch(`${API_BASE}/api/v1/refine-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  // Playwright status
  playwrightStatus: () =>
    fetch(`${API_BASE}/api/v1/playwright-status`).then(r => r.json())
};
```

---

### WebSocket Integration
```typescript
export const createTestExecutionWebSocket = (
  scripts: PlaywrightTest[],
  baseUrl: string,
  onMessage: (data: any) => void,
  onComplete: (result: ExecutionResults) => void,
  onError: (error: string) => void
) => {
  const ws = new WebSocket('ws://localhost:8000/ws/execute-tests');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ scripts, base_url: baseUrl }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'status') {
      onMessage(data);
    } else if (data.type === 'complete') {
      onComplete(data.result);
      ws.close();
    } else if (data.type === 'error') {
      onError(data.message);
      ws.close();
    }
  };
  
  ws.onerror = (error) => {
    onError('WebSocket connection failed');
  };
  
  return ws;
};
```

---

## 🎨 Design System

### Color Palette
```css
/* Status Colors */
--color-success: #28a745;
--color-warning: #ffc107;
--color-error: #dc3545;
--color-info: #17a2b8;
--color-pending: #6c757d;

/* Background Colors */
--bg-success: #d4edda;
--bg-warning: #fff3cd;
--bg-error: #f8d7da;
--bg-info: #d1ecf1;
--bg-pending: #e9ecef;

/* Border Colors */
--border-success: #28a745;
--border-warning: #ffc107;
--border-error: #dc3545;
--border-info: #17a2b8;
--border-pending: #6c757d;
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
```

### Spacing
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 3rem;
```

### Border Radius
```css
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
```

---

## 🔧 Recommended Libraries

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    // State Management
    "zustand": "^4.4.0",
    
    // UI Components
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    
    // Code Highlighting
    "react-syntax-highlighter": "^15.5.0",
    "@types/react-syntax-highlighter": "^15.5.11",
    
    // Icons
    "lucide-react": "^0.294.0",
    
    // Styling
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    
    // Forms
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    
    // Data Display
    "recharts": "^2.10.0"
  }
}
```

---

## 📂 Recommended File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── pipeline/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── PipelineLayout.tsx
│   │   └── WorkflowVisualization.tsx
│   ├── stage1/
│   │   ├── UserStoryInput.tsx
│   │   └── TestabilityResults.tsx
│   ├── stage2/
│   │   ├── RuleGroundingAnalysis.tsx
│   │   └── RequirementRefinement.tsx
│   ├── stage3/
│   │   └── AmbiguityClassification.tsx
│   ├── stage4/
│   │   └── TestCaseGenerator.tsx
│   ├── stage5/
│   │   └── DOMMapper.tsx
│   ├── stage6/
│   │   └── PlaywrightScriptGenerator.tsx
│   ├── stage7/
│   │   └── TestExecutor.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── MetricCard.tsx
│       ├── ExpandableCard.tsx
│       └── CodeViewer.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   └── websocket.ts
│   ├── store/
│   │   └── pipelineStore.ts
│   └── types/
│       └── pipeline.ts
└── styles/
    └── globals.css
```

---

## 🚀 Getting Started

### 1. Create Next.js App
```bash
npx create-next-app@latest qa-pipeline-ui --typescript --tailwind --app
cd qa-pipeline-ui
```

### 2. Install Dependencies
```bash
npm install zustand @radix-ui/react-accordion @radix-ui/react-tabs lucide-react react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

### 3. Configure API Base URL
Create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Start Development
```bash
npm run dev
```

---

## 📝 Implementation Checklist

- [ ] Set up Next.js project with TypeScript
- [ ] Install required dependencies
- [ ] Create type definitions for all API models
- [ ] Implement API client utilities
- [ ] Create global state store (Zustand)
- [ ] Build layout components
- [ ] Implement Stage 1 components
- [ ] Implement Stage 2 components
- [ ] Implement Stage 3 components
- [ ] Implement Stage 4 components
- [ ] Implement Stage 5 components
- [ ] Implement Stage 6 components
- [ ] Implement Stage 7 components
- [ ] Add WebSocket support for real-time execution
- [ ] Implement error handling and loading states
- [ ] Add responsive design
- [ ] Test all API integrations
- [ ] Add accessibility features
- [ ] Optimize performance

---

## 🔗 Additional Resources

- **Backend API Documentation**: http://localhost:8000/docs (FastAPI auto-generated)
- **Backend Plan**: See `docs/PLAN.md` in backend repository
- **Streamlit Reference**: See `src/app_pipeline.py` for UI flow reference

---

**Last Updated**: 2026-02-03  
**Version**: 1.0.0
