const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  const allData = { pricing: [], recharge: [], help: [], models: [], network: [] };

  // Capture ALL network responses for pricing/recharge/help
  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (url.includes('recharge') || url.includes('pricing') || url.includes('price') || 
          url.includes('credit') || url.includes('pack') || url.includes('plan') ||
          url.includes('billing') || url.includes('help')) {
        const body = await response.text();
        if (body.length > 50 && body.length < 200000) {
          allData.network.push({ url, body: body.substring(0, 15000) });
        }
      }
      // Also capture models API for any model detail
      if (url.includes('api') && url.includes('model')) {
        const body = await response.text();
        if (body.includes('cost') || body.includes('price') || body.includes('points')) {
          allData.network.push({ url, body: body.substring(0, 20000) });
        }
      }
    } catch (e) {}
  });

  try {
    // 1. Pricing page
    console.log('1. Navigating to #/v2/pricing...');
    await page.goto('https://www.xskill.ai/#/v2/pricing', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);
    const pricingText = await page.evaluate(() => document.body.innerText);
    allData.pricing = { text: pricingText };
    await page.screenshot({ path: 'nex-v2-pricing.png', fullPage: true });

    // 2. Recharge page
    console.log('2. Navigating to #/recharge...');
    await page.goto('https://www.xskill.ai/#/recharge', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);
    const rechargeText = await page.evaluate(() => document.body.innerText);
    allData.recharge = { text: rechargeText };
    await page.screenshot({ path: 'nex-recharge.png', fullPage: true });

    // 3. Help page
    console.log('3. Navigating to #/v2/help...');
    await page.goto('https://www.xskill.ai/#/v2/help', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    const helpText = await page.evaluate(() => document.body.innerText);
    allData.help = { text: helpText };
    await page.screenshot({ path: 'nex-help.png', fullPage: true });

    // 4. Check footer links - get hrefs from homepage
    console.log('4. Checking footer on homepage...');
    await page.goto('https://www.xskill.ai/', { waitUntil: 'networkidle', timeout: 15000 });
    const footerLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('footer a, .footer a, [class*="footer"] a');
      return Array.from(links).map(a => ({ href: a.href, text: a.innerText?.trim() }));
    });
    allData.footerLinks = footerLinks;

    // 5. Model detail pages
    const modelUrls = [
      'https://www.xskill.ai/#/v2/models/fal-ai%2Fsora-2%2Ftext-to-video',
      'https://www.xskill.ai/#/v2/models/fal-ai%2Fbytedance%2Fseedance%2Fv1.5%2Fpro%2Ftext-to-video',
      'https://www.xskill.ai/#/v2/models/fal-ai%2Fminimax%2Fhailuo-2.3%2Fpro%2Ftext-to-video',
      'https://www.xskill.ai/#/v2/models/kapon%2Fgemini-3-pro-image-preview',
      'https://www.xskill.ai/#/v2/models/fal-ai%2Fflux-2%2Fflash',
      'https://www.xskill.ai/#/v2/models/fal-ai%2Fnano-banana-pro',
    ];

    for (let i = 0; i < modelUrls.length; i++) {
      const url = modelUrls[i];
      const modelName = url.split('/').pop().replace(/%2F/g, '/');
      console.log(`5.${i + 1} Model: ${modelName}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText);
      await page.screenshot({ path: `nex-model-${i + 1}.png`, fullPage: true });
      allData.models.push({ url: modelName, text });
    }

    // Save all data
    fs.writeFileSync('nex-scrape-output.json', JSON.stringify({
      pricing: allData.pricing,
      recharge: allData.recharge,
      help: allData.help,
      footerLinks: allData.footerLinks,
      models: allData.models.map(m => ({ url: m.url, text: m.text })),
      networkUrls: allData.network.map(n => n.url),
    }, null, 2));

    // Save full network responses that might have pricing
    const networkWithPricing = allData.network.filter(n => 
      /(\d+)\s*(USD|usd|\$|credit|point|积分)/i.test(n.body) || 
      n.body.includes('"price"') || n.body.includes('"cost"')
    );
    fs.writeFileSync('nex-network-pricing.json', JSON.stringify(networkWithPricing, null, 2));

    console.log('Done. Screenshots: nex-v2-pricing.png, nex-recharge.png, nex-help.png, nex-model-1..6.png');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
