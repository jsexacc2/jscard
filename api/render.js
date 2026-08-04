const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;
  try {
    const { html } = req.body;
    if (!html) {
      throw new Error('No HTML content provided to render.');
    }

    // Configure Sparticuz Chromium for Vercel serverless environment
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath();
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });
    
    // Load the HTML content sent from the frontend
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const element = await page.$('.card');
    if (!element) {
      throw new Error('Target element with class ".card" was not found in the rendered page.');
    }
    
    const imageBuffer = await element.screenshot({ type: 'png', omitBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(imageBuffer);

  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    console.error('Puppeteer Render Error:', error);
    // Send the EXACT error message back to your phone so we can diagnose it
    return res.status(500).json({ error: error.message || String(error) });
  }
};
