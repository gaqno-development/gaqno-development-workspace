const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // 1. Go to recharge/pricing page (nav shows Pricing -> #/recharge)
    console.log('Navigating to recharge/pricing page...');
    await page.goto('https://www.xskill.ai/#/recharge', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'nex-recharge-screenshot.png', fullPage: true });
    const rechargeText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('nex-recharge-text.txt', rechargeText);
    console.log('Recharge page saved');
    
    // 2. Go to v2/pricing as well
    console.log('Navigating to v2/pricing...');
    await page.goto('https://www.xskill.ai/#/v2/pricing', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'nex-v2-pricing-screenshot.png', fullPage: true });
    const v2PricingText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('nex-v2-pricing-text.txt', v2PricingText);
    
    // 3. Go to models page and capture API response for model list
    const apiResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('model') || url.includes('skill') || url.includes('api')) {
        try {
          const body = await response.text();
          if (body.length > 100 && body.length < 500000 && (body.includes('"id"') || body.includes('"cost"'))) {
            apiResponses.push({ url, body: body.substring(0, 50000) });
          }
        } catch (e) {}
      }
    });
    
    console.log('Navigating to models page...');
    await page.goto('https://www.xskill.ai/#/v2/models', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    
    const modelsText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('nex-models-text.txt', modelsText);
    
    // Save API responses
    fs.writeFileSync('nex-api-responses.json', JSON.stringify(apiResponses.map(r => ({ url: r.url, bodyLength: r.body.length })), null, 2));
    if (apiResponses.some(r => r.body.includes('cost'))) {
      const withCost = apiResponses.find(r => r.body.includes('"cost"'));
      if (withCost) fs.writeFileSync('nex-models-api.json', withCost.body);
    }
    
    // 4. Visit model pages - get IDs from clickable cards
    const modelIds = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="model"], [class*="card"] a');
      const ids = new Set();
      cards.forEach(c => {
        const href = c.getAttribute('href') || c.closest('a')?.getAttribute('href');
        if (href && href.includes('/models/')) {
          const id = href.split('/models/')[1];
          if (id) ids.add(decodeURIComponent(id));
        }
      });
      document.querySelectorAll('a[href*="/models/"]').forEach(a => {
        const id = (a.getAttribute('href') || '').split('/models/')[1];
        if (id) ids.add(decodeURIComponent(id));
      });
      return Array.from(ids);
    });
    console.log('Model IDs from page:', modelIds.slice(0, 15));
    
    const allPricing = [];
    const toVisit = modelIds.length ? modelIds : ['jimeng-5.0', 'xai/grok-imagine-video/image-to-video', 'st-ai/sora2-pub/text-to-video', 'st-ai/sora2/text-to-video', 'kling/kling-o3/text-to-video-standard', 'minimax/hailuo-tts', 'byte-dance/seedream-5.0-lite/text-to-image', 'google/veo-3.1/text-to-video', 'minimax/hailuo-2.3/image-to-video-pro', 'byte-dance/seedance-1.5-pro/text-to-video', 'byte-dance/seedance-lite/text-to-video', 'openai/sora2-vip/text-to-video', 'openai/sora2-vip/image-to-video', 'openai/sora2/character-create'];
    
    for (const modelId of toVisit.slice(0, 25)) {
      const url = `https://www.xskill.ai/#/v2/models/${modelId.replace(/\//g, '%2F')}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);
        const data = await page.evaluate(() => {
          const text = document.body.innerText;
          const pricingMatch = text.match(/(\d+)\s*(points?|积分)\s*(\/|per)\s*(\w+)/i) || 
                             text.match(/(\d+)\s*(积分|points?)\s*[\/／]\s*(秒|张|次|Done|sec)/) ||
                             text.match(/Base Price[\s\S]*?(\d+)\s*(积分|points)/);
          const priceSection = text.match(/Pricing[\s\S]*?Price Examples[\s\S]*?(?=Parameters|$)/s);
          return { fullText: text.substring(0, 3000), pricingMatch: pricingMatch ? pricingMatch[0] : null, priceSection };
        });
        if (!data.fullText.includes('Unable to load')) {
          allPricing.push({ modelId, ...data });
        }
      } catch (e) {}
    }
    fs.writeFileSync('nex-all-pricing.json', JSON.stringify(allPricing, null, 2));
    console.log('Saved pricing for', allPricing.length, 'models');
    
    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
