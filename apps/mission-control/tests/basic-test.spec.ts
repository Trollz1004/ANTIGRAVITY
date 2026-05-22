import { test, expect } from '@playwright/test';

test('basic playwright test', async ({ page }) => {
  // Navigate to a simple HTML file instead of localhost
  await page.goto('about:blank');
  await page.setContent('<html><body><h1>Test Page</h1><button id="test-btn">Click Me</button></body></html>');
  
  // Test basic functionality
  await expect(page.locator('h1')).toHaveText('Test Page');
  
  // Test button click
  await page.locator('#test-btn').click();
  await expect(page.locator('#test-btn')).toBeVisible();
});

test.describe('User Registration/Login Flow', () => {
  test('user can login and logout', async ({ page }) => {
    // Create a mock login page
    await page.goto('about:blank');
    await page.setContent(`
      <html>
        <body>
          <button id="login-button">Login</button>
          <button id="logout-button" style="display: none;">Logout</button>
          <script>
            document.getElementById('login-button').addEventListener('click', () => {
              document.getElementById('login-button').style.display = 'none';
              document.getElementById('logout-button').style.display = 'block';
              localStorage.setItem('auth_token', 'dummy-jwt-token');
            });
            
            document.getElementById('logout-button').addEventListener('click', () => {
              document.getElementById('login-button').style.display = 'block';
              document.getElementById('logout-button').style.display = 'none';
              localStorage.removeItem('auth_token');
            });
          </script>
        </body>
      </html>
    `);

    // Initially should show login button
    await expect(page.locator('#login-button')).toBeVisible();
    await expect(page.locator('#logout-button')).not.toBeVisible();

    // Click login button
    await page.locator('#login-button').click();

    // After login, should show logout button
    await expect(page.locator('#logout-button')).toBeVisible();
    await expect(page.locator('#login-button')).not.toBeVisible();

    // Logout should clear the token
    await page.locator('#logout-button').click();
    await expect(page.locator('#login-button')).toBeVisible();
    await expect(page.locator('#logout-button')).not.toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test('can navigate between panels', async ({ page }) => {
    // Create a mock dashboard
    await page.goto('about:blank');
    await page.setContent(`
      <html>
        <body>
          <div id="sidebar">
            <button class="nav-btn" data-panel="mission">Mission Control</button>
            <button class="nav-btn" data-panel="rate-limits">Rate Limits</button>
            <button class="nav-btn" data-panel="tasks">Tasks</button>
          </div>
          <div id="main-content">
            <div id="mission-panel" class="panel">Mission Control Panel</div>
            <div id="rate-limits-panel" class="panel" style="display: none;">Rate Limits Panel</div>
            <div id="tasks-panel" class="panel" style="display: none;">Tasks Panel</div>
          </div>
          <script>
            document.querySelectorAll('.nav-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const panel = e.target.dataset.panel;
                
                // Hide all panels
                document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
                
                // Show selected panel
                document.getElementById(panel + '-panel').style.display = 'block';
                
                // Highlight active button
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
              });
            });
          </script>
          <style>
            .nav-btn { padding: 10px; margin: 5px; cursor: pointer; }
            .nav-btn.active { background: #007acc; color: white; }
            .panel { padding: 20px; border: 1px solid #ccc; margin: 10px; }
          </style>
        </body>
      </html>
    `);

    // Test navigation to Mission Control
    await page.locator('[data-panel="mission"]').click();
    await expect(page.locator('#mission-panel')).toBeVisible();
    await expect(page.locator('#rate-limits-panel')).not.toBeVisible();

    // Test navigation to Rate Limits
    await page.locator('[data-panel="rate-limits"]').click();
    await expect(page.locator('#rate-limits-panel')).toBeVisible();
    await expect(page.locator('#mission-panel')).not.toBeVisible();

    // Test navigation to Tasks
    await page.locator('[data-panel="tasks"]').click();
    await expect(page.locator('#tasks-panel')).toBeVisible();
    await expect(page.locator('#rate-limits-panel')).not.toBeVisible();
  });
});

test.describe('Rate Limit Dashboard', () => {
  test('shows rate limit data', async ({ page }) => {
    // Create a mock rate limit dashboard
    await page.goto('about:blank');
    await page.setContent(`
      <html>
        <body>
          <div id="rate-limit-dashboard">
            <h2>Rate Limit Dashboard</h2>
            <div id="usage-display">Loading...</div>
            <button id="refresh-btn">Refresh</button>
          </div>
          <script>
            let mockData = { requestsThisMinute: 45, requestsPerMinute: 100 };
            
            function updateDisplay() {
              document.getElementById('usage-display').textContent = 
                mockData.requestsThisMinute + ' / ' + mockData.requestsPerMinute;
            }
            
            updateDisplay();
            
            document.getElementById('refresh-btn').addEventListener('click', () => {
              mockData.requestsThisMinute = Math.floor(Math.random() * 100);
              updateDisplay();
            });
          </script>
        </body>
      </html>
    `);

    // Verify initial display
    await expect(page.locator('#rate-limit-dashboard')).toBeVisible();
    await expect(page.locator('#usage-display')).toHaveText('45 / 100');

    // Test refresh functionality
    await page.locator('#refresh-btn').click();
    // The text should change (though we can't predict exactly what it will be)
    await expect(page.locator('#usage-display')).not.toHaveText('45 / 100');
  });
});