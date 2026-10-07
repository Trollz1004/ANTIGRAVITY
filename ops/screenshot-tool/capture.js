const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const dir = 'C:\\ANTIGRAVITY\\ops\\screenshots\\post-reboot';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const domains = [
    { name: 'youandinotai.com', url: 'https://youandinotai.com' }
  ];

  for (const d of domains) {
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(d.url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `${dir}\\${d.name}-desktop.png` });
      
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(d.url, { waitUntil: 'networkidle' });
      await mobilePage.screenshot({ path: `${dir}\\${d.name}-mobile.png` });
      
      console.log(`Captured ${d.name}`);
      await context.close();
      await mobileContext.close();
    } catch (err) {
      console.error(`Failed ${d.name}:`, err.message);
    }
  }

  await browser.close();
})();
