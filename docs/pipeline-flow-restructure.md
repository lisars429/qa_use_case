# Pipeline Flow Restructuring Summary

## ✅ Changes Completed

### New Pipeline Flow Structure

**User Stories Module** (Stages 1-4):
- Stage 1: Testability Analysis
- Stage 2: Rule Grounding
- Stage 3: Ambiguity Classification
- **Stage 4: Test Case Generation** ← Moved from Test Cases

**Test Cases Module** (Stage 5):
- Shows list of test cases (existing + generated)
- **Stage 5: DOM Mapping** ← Accessible per test case
- Click any test case row to expand and show DOM mapping

**Test Scripts Module** (Stages 6-7):
- Stage 6: Playwright Script Generation
- Stage 7: Test Execution

---

## 📋 User Flow

### 1. User Stories → Test Case Generation

1. Navigate to **User Stories** module
2. Click on a user story to expand it
3. Click **"AI Pipeline Analysis"** button
4. Progress through Stages 1-3 (Testability, Rule Grounding, Ambiguity)
5. **Stage 4: Generate Test Cases**
   - View generated test cases
   - Select/export test cases
   - Test cases are automatically added to Test Cases module

### 2. Test Cases → DOM Mapping

1. Navigate to **Test Cases** module
2. See all test cases in the table (including generated ones)
3. **Click on any test case row** to expand
4. **Stage 5: DOM Mapping** appears
   - Enter target URL
   - Extract DOM elements
   - Search and filter elements
   - Copy selectors (CSS & XPath)
   - Select elements for automation

### 3. Visual Indicators

- **Expandable rows**: Hover shows cursor pointer
- **Active row**: Highlighted with secondary background
- **Expand/Collapse icon**: ChevronDown/ChevronUp in Actions column
- **Click anywhere on row**: Toggles expansion

---

## 🔧 Technical Changes

### Files Modified

1. **`components/modules/user-stories/pipeline/index.tsx`**
   - Updated from `PipelineStages1to3` to `PipelineStages1to4`
   - Added Stage 4 tab and integration
   - Alert notification when test cases are generated

2. **`components/modules/user-stories/pipeline/stage4-test-generation.tsx`**
   - Copied from test-cases/pipeline
   - Now part of User Stories module

3. **`components/modules/user-stories.tsx`**
   - Updated import to `PipelineStages1to4`
   - Updated component usage

4. **`components/modules/test-cases/pipeline/index.tsx`**
   - Simplified to `TestCasePipeline`
   - Only contains Stage 5 (DOM Mapping)
   - Accepts `testCaseId` and `testCaseTitle` props

5. **`components/modules/test-cases.tsx`**
   - Removed old "Launch Pipeline" section
   - Added `expandedTestCaseId` state
   - Made table rows clickable
   - Added expand/collapse icons
   - Shows `TestCasePipeline` when row is expanded

### Component Structure

```
components/modules/
├── user-stories/
│   ├── pipeline/
│   │   ├── index.tsx (Stages 1-4)
│   │   ├── stage1-testability.tsx
│   │   ├── stage2-rule-grounding.tsx
│   │   ├── stage3-ambiguity.tsx
│   │   └── stage4-test-generation.tsx ← NEW
│   └── index.tsx
└── test-cases/
    ├── pipeline/
    │   ├── index.tsx (Stage 5 only)
    │   └── stage5-dom-mapping.tsx
    └── index.tsx
```

---

## 🎯 Benefits

1. **Logical Flow**: Test case generation happens where user stories are defined
2. **Contextual DOM Mapping**: Each test case can have its own DOM mapping
3. **Better Organization**: Stages are grouped by their logical module
4. **Cleaner UI**: No separate "Launch Pipeline" button needed
5. **Expandable Rows**: Intuitive interaction pattern
6. **Scalability**: Easy to add regeneration options per test case

---

## 🚀 Next Steps

1. **Test the flow**:
   - User Stories → Generate test cases
   - Test Cases → Click row → Map DOM elements

2. **Add regeneration options** (if needed):
   - Add "Regenerate Test Case" button in expanded view
   - Add "Regenerate DOM Mapping" button in Stage 5

3. **Phase 4**: Implement Stages 6-7 in Test Scripts module
