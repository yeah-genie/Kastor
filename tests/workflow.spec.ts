import { test, expect } from '@playwright/test';

test.describe('Kastor Block Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173'); // Update port to 5173 (default Vite)
    
    // Handle Chat-Only Initial State
    // Check if we are in chat-only mode (centered input)
    const chatInput = page.getByPlaceholder('Build me a sales dashboard...');
    if (await chatInput.isVisible()) {
        // Send a message to enter workspace
        await chatInput.fill('Start workspace');
        await chatInput.press('Enter');
        // Wait for transition
        await page.waitForTimeout(1000); 
    }
  });

  test('should add a block from the library', async ({ page }) => {
    // Check empty state or canvas
    await expect(page.getByText('Workflow Canvas')).toBeVisible();
    
    // Click LOAD block button in library
    // The button might have icon and text, let's use a more robust selector
    // Assuming the library panel is open
    await page.locator('button:has-text("LOAD")').first().click();
    
    // Verify block is added to workspace
    await expect(page.locator('span.font-semibold.text-slate-200').filter({ hasText: 'New LOAD Block' })).toBeVisible();
  });

  test('should toggle right panel and resize layout', async ({ page }) => {
    // Open AI Assistant via TopBar
    await page.getByRole('button', { name: /Ask AI Assistant/i }).click();
    
    // Check if AI panel header is visible
    await expect(page.getByText('Kastor AI')).toBeVisible();
    
    // Check input area
    await expect(page.getByPlaceholder('Ask AI...')).toBeVisible();
  });

  test('should interact with AI assistant', async ({ page }) => {
    // Ensure AI panel is open
    await page.getByRole('button', { name: /Ask AI Assistant/i }).click();
    
    const input = page.getByPlaceholder('Ask AI...');
    await input.fill('Load my sales data');
    await input.press('Enter');
    
    // Wait for response (mock AI has delay)
    await expect(page.getByText('To get started with your data, use a Load Block')).toBeVisible({ timeout: 10000 });
    
    // Click the action button provided by AI
    await page.getByRole('button', { name: 'Add Load Block' }).click();
    
    // Verify block added
    await expect(page.locator('span.font-semibold.text-slate-200').filter({ hasText: 'New LOAD Block' })).toBeVisible();
  });
});
