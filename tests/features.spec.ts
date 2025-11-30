import { test, expect } from '@playwright/test';

test.describe('Kastor v2 New Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Handle Chat-Only Initial State
    const chatInput = page.getByPlaceholder('Build me a sales dashboard...');
    if (await chatInput.isVisible()) {
        await chatInput.fill('Start workspace');
        await chatInput.press('Enter');
        // Wait for Workspace to load by checking for TopBar logo or Library
        await expect(page.getByText('Kastor')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should add a Schedule Block', async ({ page }) => {
    // Open Library
    // Assuming Library is open by default or we toggle it
    // Let's try to click the "SCHEDULE" button in the library
    // The library button text is "SCHEDULE"
    await page.locator('button:has-text("SCHEDULE")').click();
    
    // Verify Block Card appears
    await expect(page.locator('text=New SCHEDULE Block')).toBeVisible();
    
    // Verify Config UI inside block
    await expect(page.locator('text=Frequency')).toBeVisible();
    await expect(page.locator('text=Time')).toBeVisible();
  });

  test('should open Memory (Global Rules) modal', async ({ page }) => {
    // Click Memory button in TopBar
    await page.getByRole('button', { name: 'Memory' }).click();
    
    // Check Modal Header
    await expect(page.getByText('Global Rules (Memory)')).toBeVisible();
    
    // Add a rule
    const input = page.getByPlaceholder('e.g., Always summarize data');
    await input.fill('Test Rule 123');
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).click();
    
    // Verify rule added
    await expect(page.getByDisplayValue('Test Rule 123')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Save & Close' }).click();
    await expect(page.getByText('Global Rules (Memory)')).not.toBeVisible();
  });

  test('should execute Run Flow and show History', async ({ page }) => {
    // Add a block first so we can run something
    await page.locator('button:has-text("LOAD")').first().click();
    
    // Click Run Flow
    await page.getByRole('button', { name: 'Run Flow' }).click();
    
    // Wait for execution (mock delay)
    await page.waitForTimeout(2000);
    
    // Open History Tab
    await page.getByRole('button', { name: 'History' }).click();
    
    // Check History Panel
    await expect(page.getByText('Run History')).toBeVisible();
    
    // Check for success entry
    await expect(page.getByText('My Workflow')).toBeVisible();
    await expect(page.getByText('Workflow completed successfully')).toBeVisible();
  });
});

