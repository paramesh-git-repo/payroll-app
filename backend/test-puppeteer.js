// test-puppeteer.js
const puppeteer = require('puppeteer');

console.log('🚀 Testing Puppeteer...');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    await page.screenshot({ path: 'test-screenshot.png' });

    console.log('✅ Puppeteer launched successfully!');
    console.log('📸 Screenshot saved as test-screenshot.png');

    await browser.close();
  } catch (err) {
    console.error('❌ Puppeteer launch failed:', err);
  }
})();

