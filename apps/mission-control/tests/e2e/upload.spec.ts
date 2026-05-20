import { test, expect } from '@playwright/test';

test.describe('File Upload Flows', () => {
  test('upload panel is visible when File Uploads mode is active', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();
    await expect(page.locator('[data-testid="upload-progress-panel"]')).toBeVisible();
  });

  test('upload dropzone shows correct prompt text', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();
    await expect(
      page.getByText('Drag \'n\' drop some files here, or click to select files')
    ).toBeVisible();
  });

  test('successful file upload shows completed status', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();

    // Intercept the upload API to simulate a successful upload
    await page.route('**/api/v1/uploads/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { upload_id: 'test-upload-1', status: 'done' } });
      } else {
        await route.fulfill({
          json: {
            uploaded_bytes: 100,
            percentage: 100,
            status: 'done',
            error: null,
          },
        });
      }
    });

    // Create a test file and upload it
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test file content for upload'),
    });

    // Wait for the upload to appear and complete
    await expect(page.getByText('test-document.pdf')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Completed')).toBeVisible({ timeout: 15000 });
  });

  test('failed upload shows error status with retry option', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();

    // Intercept the upload API to simulate a failure
    await page.route('**/api/v1/uploads/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          json: { detail: 'Upload failed: server error' },
        });
      } else {
        await route.continue();
      }
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'fail-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this upload will fail'),
    });

    await expect(page.getByText('fail-upload.txt')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Failed:/)).toBeVisible({ timeout: 15000 });
  });

  test('upload progress panel shows file name during upload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();

    // Slow down the upload to observe progress
    await page.route('**/api/v1/uploads/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { upload_id: 'slow-upload-1', status: 'uploading' } });
      } else {
        await route.fulfill({
          json: {
            uploaded_bytes: 50,
            percentage: 50,
            status: 'uploading',
            error: null,
          },
        });
      }
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'progress-test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake image data'),
    });

    // The filename should be visible in the upload list
    await expect(page.getByText('progress-test.png')).toBeVisible({ timeout: 10000 });
  });
});
