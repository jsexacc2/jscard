const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;
  try {
    const { html } = req.body;

    const executablePath = await chromium.executablePath();
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const element = await page.$('.card');
    if (!element) {
      throw new Error('Card element not found');
    }
    
    const imageBuffer = await element.screenshot({ type: 'png', omitBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(imageBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
