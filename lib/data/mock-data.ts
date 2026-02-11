// ============================================================================
// Mock Data Generators
// Realistic test data for all 7 pipeline stages
// ============================================================================

export const mockUserStories: UserStory[] = [
    {
        id: 'us-001',
        title: 'User Authentication Flow',
        description: 'Implement secure login with OAuth2 and JWT tokens',
        completeness: 95,
        status: 'ready',
        dependencies: 0,
        testCases: 8,
        testScripts: 12,
    },
    {
        id: 'us-002',
        title: 'Payment Processing Integration',
        description: 'Integrate Stripe for handling transactions',
        completeness: 60,
        status: 'in-progress',
        dependencies: 1,
        testCases: 15,
        testScripts: 22,
    },
    {
        id: 'us-003',
        title: 'Real-time Notifications',
        description: 'WebSocket-based notification system',
        completeness: 30,
        status: 'blocked',
        dependencies: 2,
        testCases: 12,
        testScripts: 0,
    },
    {
        id: 'us-004',
        title: 'Analytics Dashboard',
        description: 'Real-time data visualization and reporting',
        completeness: 0,
        status: 'locked',
        dependencies: 3,
        testCases: 0,
        testScripts: 0,
    },
    {
        id: 'us-005',
        title: 'Inventory Management',
        description: 'Real-time tracking of stock levels across multiple locations',
        completeness: 85,
        status: 'in-progress',
        dependencies: 1,
        testCases: 20,
        testScripts: 15,
    }
]

import type {
    TestabilityInsight,
    RuleAuditResult,
    AmbiguityClassification,
    TestScenarios,
    DOMMappingResult,
    PlaywrightScripts,
    ExecutionResults,
    ClarificationItem,
    TestCase,
    DOMElement,
    PlaywrightTest,
    TestExecutionResult,
    UserStory,
} from '@/lib/types/pipeline'

// ============================================================================
// Stage 1: Testability Analysis Mock Data
// ============================================================================

export const mockTestabilityInsight: TestabilityInsight = {
    explicitly_stated_behaviors: [
        'User can log in with email and password',
        'System validates credentials against database',
        'Successful login redirects to dashboard',
        'Failed login displays error message',
        'Session token is generated on successful authentication',
    ],
    testability_checklist: [
        {
            dimension: 'Input Validation',
            status: 'Pass',
            reason: 'Email and password fields are clearly defined with validation rules',
        },
        {
            dimension: 'Expected Outcomes',
            status: 'Pass',
            reason: 'Success and failure scenarios are explicitly stated',
        },
        {
            dimension: 'Error Handling',
            status: 'Unclear',
            reason: 'Specific error messages for different failure types not defined',
        },
        {
            dimension: 'Performance Requirements',
            status: 'Fail',
            reason: 'No response time or timeout specifications provided',
        },
        {
            dimension: 'Security Requirements',
            status: 'Pass',
            reason: 'Password hashing and session management mentioned',
        },
    ],
    assumptions_required: [
        'Email format follows standard RFC 5322 specification',
        'Password must meet minimum complexity requirements',
        'Session timeout is 30 minutes of inactivity',
    ],
    clarification_questions: [
        'What specific error messages should be shown for invalid email vs invalid password?',
        'Should the system implement rate limiting for failed login attempts?',
        'What happens if the user is already logged in on another device?',
    ],
    testability_status: 'Likely Test-Ready',
    status_reason: '4 out of 5 testability dimensions are clear. Minor clarifications needed for error handling.',
}

// ============================================================================
// Stage 2: Rule Grounding Mock Data
// ============================================================================

export const mockRuleAuditResult: RuleAuditResult = {
    explicit_rules: [
        'Email must be in valid format (contains @ and domain)',
        'Password must be at least 8 characters long',
        'Maximum 5 failed login attempts before account lockout',
        'Session expires after 30 minutes of inactivity',
        'Passwords must be hashed using bcrypt with salt',
    ],
    completeness_evaluation: [
        {
            category: 'Authentication Rules',
            status: 'Present',
            explanation: 'Email/password validation and session management rules are defined',
        },
        {
            category: 'Authorization Rules',
            status: 'Missing',
            explanation: 'No rules about user roles or permissions after login',
        },
        {
            category: 'Data Validation',
            status: 'Present',
            explanation: 'Input format validation rules are specified',
        },
        {
            category: 'Error Handling',
            status: 'Unclear',
            explanation: 'General error handling mentioned but specific rules missing',
        },
        {
            category: 'Business Logic',
            status: 'Present',
            explanation: 'Account lockout and session timeout rules defined',
        },
    ],
    rule_gaps: [
        'No specification for password reset flow',
        'Missing rules for "Remember Me" functionality',
        'Unclear handling of special characters in passwords',
    ],
    rule_conflicts: [
        'Session timeout conflicts with "Remember Me" feature if implemented',
    ],
    clarification_questions: [
        'Should the system support OAuth/SSO login methods?',
        'What user roles exist and what are their permissions?',
        'How should the system handle concurrent login sessions?',
    ],
    rule_status: 'Likely Rule-Complete',
    status_reason: 'Core authentication rules are present. Minor gaps in edge cases and authorization.',
}

// ============================================================================
// Stage 3: Ambiguity Classification Mock Data
// ============================================================================

export const mockAmbiguityClassification: AmbiguityClassification = {
    clarification_items: [
        {
            question: 'What specific error messages should be shown for invalid email vs invalid password?',
            ambiguity_type: 'Ambiguous outcome',
            testing_impact: 'Partially blocked',
            resolution_owner: 'Product',
            mandatory: true,
        },
        {
            question: 'Should the system implement rate limiting for failed login attempts?',
            ambiguity_type: 'Missing requirement',
            testing_impact: 'Blocked',
            resolution_owner: 'Business',
            mandatory: true,
        },
        {
            question: 'What happens if the user is already logged in on another device?',
            ambiguity_type: 'Unclear scope',
            testing_impact: 'Partially blocked',
            resolution_owner: 'Tech',
            mandatory: false,
        },
        {
            question: 'Should the system support OAuth/SSO login methods?',
            ambiguity_type: 'Undefined rule',
            testing_impact: 'Blocked',
            resolution_owner: 'Product',
            mandatory: false,
        },
        {
            question: 'How should the system handle concurrent login sessions?',
            ambiguity_type: 'Missing exception handling',
            testing_impact: 'Partially blocked',
            resolution_owner: 'Tech',
            mandatory: true,
        },
    ],
}

// ============================================================================
// Stage 4: Test Case Generation Mock Data
// ============================================================================

export const mockTestScenarios: TestScenarios = {
    test_cases: [
        {
            test_id: 'TC-001',
            name: 'Successful login with valid credentials',
            description: 'Verify that a user can successfully log in with valid email and password',
            test_type: 'Happy Path',
            preconditions: [
                'User account exists in the system',
                'User is not currently logged in',
                'Browser cookies are cleared',
            ],
            steps: [
                'Navigate to login page',
                'Enter valid email address',
                'Enter valid password',
                'Click "Sign In" button',
            ],
            expected_result: 'User is redirected to dashboard and session token is created',
            priority: 'High',
        },
        {
            test_id: 'TC-002',
            name: 'Login fails with invalid email format',
            description: 'Verify that login fails when email format is invalid',
            test_type: 'Validation',
            preconditions: ['User is on login page'],
            steps: [
                'Enter invalid email format (e.g., "notanemail")',
                'Enter valid password',
                'Click "Sign In" button',
            ],
            expected_result: 'Error message displayed: "Please enter a valid email address"',
            priority: 'High',
        },
        {
            test_id: 'TC-003',
            name: 'Login fails with incorrect password',
            description: 'Verify that login fails with wrong password',
            test_type: 'Negative',
            preconditions: ['Valid user account exists'],
            steps: [
                'Navigate to login page',
                'Enter valid email',
                'Enter incorrect password',
                'Click "Sign In" button',
            ],
            expected_result: 'Error message displayed: "Invalid email or password"',
            priority: 'High',
        },
        {
            test_id: 'TC-004',
            name: 'Account lockout after 5 failed attempts',
            description: 'Verify account is locked after maximum failed login attempts',
            test_type: 'Negative',
            preconditions: ['Valid user account exists', 'Account is not locked'],
            steps: [
                'Attempt login with incorrect password 5 times',
                'Verify account lockout message',
                'Attempt login with correct password',
            ],
            expected_result: 'Account is locked and error message displayed: "Account locked due to multiple failed attempts"',
            priority: 'Medium',
        },
        {
            test_id: 'TC-005',
            name: 'Session expires after 30 minutes of inactivity',
            description: 'Verify that user session expires after timeout period',
            test_type: 'Validation',
            preconditions: ['User is logged in'],
            steps: [
                'Log in successfully',
                'Wait for 30 minutes without any activity',
                'Attempt to access protected resource',
            ],
            expected_result: 'User is redirected to login page with message: "Session expired. Please log in again"',
            priority: 'Medium',
        },
    ],
    summary: 'Generated 5 test cases covering happy path, validation, and negative scenarios for user authentication',
}

// ============================================================================
// Stage 5: DOM Mapping Mock Data
// ============================================================================

export const mockDOMMappingResult: DOMMappingResult = {
    url: 'https://app.example.com/login',
    timestamp: new Date().toISOString(),
    elements: [
        {
            id: 'elem-001',
            tag: 'input',
            selector: 'input[name="email"]',
            text_content: '',
            attributes: {
                type: 'email',
                name: 'email',
                placeholder: 'Enter your email',
                required: 'true',
            },
            xpath: '//*[@id="email-input"]',
        },
        {
            id: 'elem-002',
            tag: 'input',
            selector: 'input[name="password"]',
            text_content: '',
            attributes: {
                type: 'password',
                name: 'password',
                placeholder: 'Enter your password',
                required: 'true',
            },
            xpath: '//*[@id="password-input"]',
        },
        {
            id: 'elem-003',
            tag: 'button',
            selector: 'button[type="submit"]',
            text_content: 'Sign In',
            attributes: {
                type: 'submit',
                class: 'btn btn-primary',
            },
            xpath: '//*[@id="login-form"]/button',
        },
        {
            id: 'elem-004',
            tag: 'div',
            selector: 'div.error-message',
            text_content: '',
            attributes: {
                class: 'error-message hidden',
                role: 'alert',
            },
            xpath: '//*[@id="error-container"]',
        },
        {
            id: 'elem-005',
            tag: 'a',
            selector: 'a.forgot-password',
            text_content: 'Forgot Password?',
            attributes: {
                href: '/forgot-password',
                class: 'forgot-password',
            },
            xpath: '//*[@id="forgot-password-link"]',
        },
    ],
}

// ============================================================================
// Stage 6: Playwright Script Generation Mock Data
// ============================================================================

export const mockPlaywrightScripts: PlaywrightScripts = {
    scripts: [
        {
            test_id: 'TC-001',
            test_name: 'Successful login with valid credentials',
            description: 'Verify that a user can successfully log in with valid email and password',
            imports: [
                "import { test, expect } from '@playwright/test'",
            ],
            code: `test('Successful login with valid credentials', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://app.example.com/login');
  
  // Enter valid email address
  await page.fill('input[name="email"]', 'user@example.com');
  
  // Enter valid password
  await page.fill('input[name="password"]', 'SecurePass123!');
  
  // Click "Sign In" button
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('https://app.example.com/dashboard');
  
  // Verify session token exists
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session_token');
  expect(sessionCookie).toBeDefined();
});`,
        },
        {
            test_id: 'TC-002',
            test_name: 'Login fails with invalid email format',
            description: 'Verify that login fails when email format is invalid',
            imports: [
                "import { test, expect } from '@playwright/test'",
            ],
            code: `test('Login fails with invalid email format', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://app.example.com/login');
  
  // Enter invalid email format
  await page.fill('input[name="email"]', 'notanemail');
  
  // Enter valid password
  await page.fill('input[name="password"]', 'SecurePass123!');
  
  // Click "Sign In" button
  await page.click('button[type="submit"]');
  
  // Verify error message is displayed
  const errorMessage = page.locator('div.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Please enter a valid email address');
});`,
        },
        {
            test_id: 'TC-003',
            test_name: 'Login fails with incorrect password',
            description: 'Verify that login fails with wrong password',
            imports: [
                "import { test, expect } from '@playwright/test'",
            ],
            code: `test('Login fails with incorrect password', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://app.example.com/login');
  
  // Enter valid email
  await page.fill('input[name="email"]', 'user@example.com');
  
  // Enter incorrect password
  await page.fill('input[name="password"]', 'WrongPassword123');
  
  // Click "Sign In" button
  await page.click('button[type="submit"]');
  
  // Verify error message
  const errorMessage = page.locator('div.error-message');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Invalid email or password');
  
  // Verify user is still on login page
  await expect(page).toHaveURL('https://app.example.com/login');
});`,
        },
    ],
    setup_instructions: [
        'Install Playwright: npm install -D @playwright/test',
        'Install browsers: npx playwright install',
        'Create playwright.config.ts with baseURL and test settings',
        'Run tests: npx playwright test',
        'Run in headed mode: npx playwright test --headed',
        'Debug tests: npx playwright test --debug',
    ],
    summary: 'Generated 3 Playwright test scripts covering login scenarios with valid credentials, invalid email, and incorrect password',
}

// ============================================================================
// Stage 7: Test Execution Mock Data
// ============================================================================

export const mockExecutionResults: ExecutionResults = {
    total_tests: 5,
    passed: 3,
    failed: 1,
    errors: 1,
    timeouts: 0,
    pass_rate: 60,
    test_results: [
        {
            test_id: 'TC-001',
            status: 'passed',
            output: 'Test completed successfully\n✓ Navigation successful\n✓ Form filled correctly\n✓ Login successful',
            error: '',
            duration_ms: 2341,
        },
        {
            test_id: 'TC-002',
            status: 'passed',
            output: 'Test completed successfully\n✓ Invalid email detected\n✓ Error message displayed',
            error: '',
            duration_ms: 1823,
        },
        {
            test_id: 'TC-003',
            status: 'failed',
            output: 'Test failed at step: Verify error message',
            error: 'Expected error message not found. Expected: "Invalid email or password", Found: "Login failed"',
            duration_ms: 2156,
        },
        {
            test_id: 'TC-004',
            status: 'passed',
            output: 'Test completed successfully\n✓ Account locked after 5 attempts\n✓ Correct error message shown',
            error: '',
            duration_ms: 5432,
        },
        {
            test_id: 'TC-005',
            status: 'error',
            output: 'Test execution error',
            error: 'TimeoutError: Waiting for 30 minutes exceeded test timeout of 30000ms',
            duration_ms: 30000,
        },
    ],
}

// ============================================================================
// Helper Functions
// ============================================================================

export function generateMockTestabilityInsight(userStory: string): TestabilityInsight {
    return {
        ...mockTestabilityInsight,
        explicitly_stated_behaviors: [
            `Behavior extracted from: "${userStory.substring(0, 50)}..."`,
            ...mockTestabilityInsight.explicitly_stated_behaviors.slice(1),
        ],
    }
}

export function generateMockTestCases(count: number): TestCase[] {
    return mockTestScenarios.test_cases.slice(0, count)
}

export function generateMockExecutionResults(testIds: string[]): ExecutionResults {
    const results = testIds.map((id, index) => ({
        test_id: id,
        status: (index % 3 === 0 ? 'passed' : index % 3 === 1 ? 'failed' : 'error') as any,
        output: `Test output for ${id}`,
        error: index % 3 === 0 ? '' : `Error in test ${id}`,
        duration_ms: Math.floor(Math.random() * 5000) + 1000,
    }))

    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const errors = results.filter(r => r.status === 'error').length

    return {
        total_tests: results.length,
        passed,
        failed,
        errors,
        timeouts: 0,
        pass_rate: Math.round((passed / results.length) * 100),
        test_results: results,
    }
}
