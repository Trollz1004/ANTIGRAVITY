import { test, expect } from '@playwright/test';

test.describe('Task Management (CRUD-like: Create)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we are on the mission panel where TaskBriefInput is visible
    await page.locator('[data-testid="sidebar"]').getByText('Mission Control', { exact: true }).click();
    await expect(page.getByTestId('task-input')).toBeVisible();
  });

  test('should successfully dispatch a new task brief', async ({ page }) => {
    // Mock API response for successful task dispatch
    await page.route('**/api/v1/tasks/dispatch', async (route) => {
      await route.fulfill({ status: 200, json: { taskId: 'test-task-123', status: 'dispatched' } });
    });

    const taskInput = page.getByTestId('task-input');
    const sendButton = page.getByTestId('task-send-btn');

    await taskInput.fill('This is a new test task brief for an agent.');
    await sendButton.click();

    // Expect success toast
    await expect(page.getByText('Task dispatched successfully')).toBeVisible();
    // Input should be cleared
    await expect(taskInput).toHaveValue('');
  });

  test('should display validation error for empty task brief', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    const sendButton = page.getByTestId('task-send-btn');

    // Trigger validation by blurring after empty input
    await taskInput.focus();
    await taskInput.blur();
    await sendButton.click(); // Attempt to send empty brief

    await expect(page.getByText('Task brief cannot be empty')).toBeVisible();
    await expect(taskInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('should display validation error for task brief with invalid characters', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    const sendButton = page.getByTestId('task-send-btn');

    await taskInput.fill('<script>alert(1)</script>'); // Invalid characters
    await taskInput.blur();
    await sendButton.click();

    await expect(page.getByText('Task brief contains invalid characters')).toBeVisible();
    await expect(taskInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('should display error toast on failed task dispatch', async ({ page }) => {
    // Mock API response for failed task dispatch
    await page.route('**/api/v1/tasks/dispatch', async (route) => {
      await route.fulfill({ status: 500, json: { detail: 'Internal Server Error' } });
    });

    const taskInput = page.getByTestId('task-input');
    const sendButton = page.getByTestId('task-send-btn');

    await taskInput.fill('This task will fail.');
    await sendButton.click();

    // Expect error toast
    await expect(page.getByText('Failed to dispatch task')).toBeVisible();
    // Input should still contain the brief
    await expect(taskInput).toHaveValue('This task will fail.');
  });

  test('send button should be disabled for empty input', async ({ page }) => {
    const taskInput = page.getByTestId('task-input');
    const sendButton = page.getByTestId('task-send-btn');

    await expect(sendButton).toBeDisabled();

    await taskInput.fill('Some text');
    await expect(sendButton).not.toBeDisabled();

    await taskInput.clear();
    await expect(sendButton).toBeDisabled();
  });
});
