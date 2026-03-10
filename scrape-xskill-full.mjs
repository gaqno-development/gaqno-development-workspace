#!/usr/bin/env node
/**
 * Full scrape: scroll models page + pricing page for complete NEX AI pricing
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://www.xskill.ai';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Scroll models page to load all content
  console.log('Loading models page and scrolling...');
  await page.goto(`${BASE}/#/v2/models`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Scroll to bottom to trigger lazy load
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const fullText = await page.evaluate(() => document.body.innerText);
  writeFileSync('/tmp/xskill-models-full.txt', fullText);
  console.log('Models page text saved, length:', fullText.length);

  // Extract structured pricing from text using regex
  const lines = fullText.split('\n');
  const pricing = [];
  let currentModel = null;
  let currentCategory = null;

  const categories = ['Image Generation', 'Video Generation', 'Audio Generation', 'Utils'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (categories.includes(line.trim())) {
      currentCategory = line.trim();
    }
    // Match credit patterns: "20 积分/次", "100 积分/次", "160 积分/秒", "按秒计费"
    const creditPerCall = line.match(/(\d+)\s*积分\/次/);
    const creditPerSec = line.match(/(\d+)\s*积分\/秒/);
    const fixedCredits = line.match(/固定\s*(\d+)\s*积分/);
    const rangeCredits = line.match(/(\d+)\s*[-–]\s*(\d+)\s*积分/);

    if (creditPerCall || creditPerSec || fixedCredits || rangeCredits) {
      const prevLines = lines.slice(Math.max(0, i - 3), i).join(' ');
      const modelName = prevLines.split('\n').pop()?.trim() || lines[i - 1]?.trim() || 'Unknown';
      pricing.push({
        model: modelName,
        category: currentCategory,
        creditsPerCall: creditPerCall ? +creditPerCall[1] : null,
        creditsPerSecond: creditPerSec ? +creditPerSec[1] : null,
        fixedCredits: fixedCredits ? +fixedCredits[1] : null,
        creditRange: rangeCredits ? [+rangeCredits[1], +rangeCredits[2]] : null,
        rawLine: line.trim()
      });
    }
  }

  // Also get pricing page for USD
  await page.goto(`${BASE}/#/v2/pricing`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const pricingPageText = await page.evaluate(() => document.body.innerText);
  writeFileSync('/tmp/xskill-pricing-page.txt', pricingPageText);

  const output = {
    modelsPricing: pricing,
    pricingPageSnippet: pricingPageText.slice(0, 3000),
    extractedAt: new Date().toISOString()
  };
  writeFileSync('/tmp/xskill-pricing-structured.json', JSON.stringify(output, null, 2));
  console.log('\nStructured pricing:', JSON.stringify(pricing, null, 2));

  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
