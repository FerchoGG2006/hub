import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[BROWSER ${type.toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER RUNTIME ERROR]: ${err.message}\nStack:\n${err.stack}`);
  });

  try {
    console.log("Navigating to http://localhost:3000/el-fogon-dorado...");
    await page.goto('http://localhost:3000/el-fogon-dorado', { waitUntil: 'networkidle' });
    
    console.log("Waiting 3 seconds for client initialization...");
    await page.waitForTimeout(3000);

    // Click 'Descubrir'
    console.log("Looking for 'Descubrir' button...");
    const descubrirBtn = page.locator('button:has-text("Descubrir"), div:has-text("Descubrir")');
    if (await descubrirBtn.count() > 0) {
      console.log("Clicking 'Descubrir'...");
      await descubrirBtn.first().click();
      await page.waitForTimeout(1000);
    }

    console.log("Checking for any .page-item elements...");
    const count = await page.locator('.page-item').count();
    console.log(`.page-item elements count: ${count}`);

    console.log("DOM HTML snapshot of #menu-main-container:");
    const containerHtml = await page.evaluate(() => {
      const el = document.getElementById('menu-main-container');
      return el ? el.outerHTML : 'NOT FOUND';
    });
    console.log(containerHtml);

  } catch (e) {
    console.error("Script failed:", e);
  } finally {
    await browser.close();
  }
})();
